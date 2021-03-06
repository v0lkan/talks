'use strict';

/*
 * This program is distributed under the terms of the MIT license:
 * <https://github.com/v0lkan/talks/blob/master/LICENSE.md>
 * Send your comments and suggestions to <me@volkan.io>.
 */

import log from 'local-fluent-logger';
import { en_technical as stopWords } from 'stpwrds';
import { prepareTaggedWords, singularize } from 'local-fluent-transform';
import {
    put as putToRemoteCache,
    get as getFromRemoteCache
} from 'local-fluent-cache';

let localCache = { tags: {}, urls: {} };

// Expose state to the REPL.
process.fluent = process.fluent || {};
process.fluent.cache = localCache;

let unique = ( collection ) => collection.reduce( ( acc, cur ) => {
    if ( acc.indexOf( cur ) === -1 ) { acc.push( cur ); }

    return acc;
}, [] );

let postProcessWord = ( words, word ) => {
    let singular = singularize( word );

    if ( singular.toLowerCase() !== word && words[ singular ] ) {
        words[ word ] += words[ singular ];
        words[ singular ] = 0;
    }
};

let postProcessWords = ( url ) => {
    let words = localCache.urls[ url ].words;

    Object.keys( words )
        .forEach( ( word ) => postProcessWord( words, word ) );
};

let add = ( url, buffer ) => {
    if ( buffer.length === 0 ) { return; }

    let urlCache = localCache.urls[ url ];
    let words = urlCache.words;

    let word = buffer.join( ' ' ).toLowerCase();

    words[ word ] = words[ word ] || 0;
    words[ word ]++;
};

let addWord = ( url, buffer, taggedWord ) => {
    let word = taggedWord[ 0 ]
        .trim()
        .replace( /(’|’s|’es)$/g, '' );
    let tag = taggedWord[ 1 ];

    let isAdjective = tag.indexOf('JJ') === 0;
    let isNoun = tag.indexOf('NN') === 0;

    let skip = /[A-Z]/.test( word[ 0 ] ) || stopWords.indexOf( word.toLowerCase() ) > -1;

    if ( skip ) { return; }

    if ( !isAdjective && !isNoun ) {
        buffer.length = 0;

        return;
    }

    if ( isAdjective ) {
        buffer.push( word );

        return;
    }

    if ( buffer.length > 0 ) {
        buffer.push( word );
        add( url, buffer );
        buffer.length = 0;
    }

    add( url, [ word ] );
};

let setWordCounts = ( url, body ) => {
    let buffer = [];

    let { tags, taggedWords } = prepareTaggedWords( body );

    taggedWords.forEach( ( taggedWord ) => {
        addWord( url, buffer, taggedWord );
    } );

    return tags;
};

let computeCounts = ( url ) => {
    let urlCache = localCache.urls[ url ];

    Object.keys( urlCache.words ).forEach( ( key ) => {
        urlCache.counts.push( { word: key, count: urlCache.words[ key ] } );
    } );

    urlCache.counts.sort( ( a, b ) => {
        if ( a.count === b.count ) { return 0; }

        return a.count < b.count ? 1: -1;
    } );
};

let computeTags = ( seed, url ) => {
    let urlCache = localCache.urls[ url ];

    let singleWordTags = [];
    let multiWordTags = [];

    urlCache.counts.forEach( ( { word, count } ) => {
        let singleWord = word.indexOf ( ' ' ) === -1;
        let eligibleSigleWord = singleWord && singleWordTags.length < 3;
        let eligibleMultiWord = !singleWord && (
            count > 1 || word.split ( ' ' ).length > 2
        );

        if ( eligibleSigleWord ) {
            singleWordTags.push ( word );
        }

        if ( eligibleMultiWord ) {
            multiWordTags.push ( word );
        }
    } );

    urlCache.tags = unique(
        seed
            .concat( singleWordTags )
            .concat( multiWordTags )
            .map( ( tag ) => tag.toLowerCase() )
    ).sort();

    urlCache.tags.forEach( ( tag ) => {
        localCache.tags[ tag ] = localCache.tags[ tag ] || [];

        let cacheTag = localCache.tags[ tag ];

        if ( cacheTag.indexOf( url ) === -1 ) {
            cacheTag.push( url );
            cacheTag.sort();
        }
    } );
};

let pluckTags = ( url ) => localCache.urls[ url ].tags;

let resetLocalCache = ( url ) => localCache.urls[ url ] = {
    words: {}, counts: [], tags: []
};

/**
 *
 */
let getUrls = ( tag ) => {
    log.info( 'data:getUrls', tag );

    return getFromRemoteCache( `getUrls-${tag}` )
        .then( ( urls ) => urls || [] );
};


/**
 *
 */
let getTags = ( url, body ) => {
    log.info( 'data:getTags', url );

    return getFromRemoteCache( `getTags-${url}` ).then( ( data ) => {
        if ( data ) { return data; }

        // ---------------------------------------------------------------------
        //
        // This section is “computationally expensive”; however, you can live
        // with it because the owner module is not directly accessed by the API
        // clients; in contrast, they call it in a non-blocking manner through
        // a TCP connection. So this module kind of acts as a “worker”.
        //
        // If you want to make it even more performant, you can…
        //
        // 1) Either convert it to a native Node.JS extension.
        // 2) Or write it in a different language (such as C) and shell out to
        // call it using `child_process.fork`.
        // 3) Or, you can even write it in JavaScript (Node.JS); extracting out
        // this code piece into its own module and doing a `child_process.exec`,
        // if you are willing to sacrifice some performance in lieu of ease of
        // maintenance; however you should assume at least 30ms startup delay
        // and spawn ~10mb of memory for each new child process. That is to say,
        // you cannot create many thousands of them.
        //
        resetLocalCache( url );
        let tags = setWordCounts( url, body );
        postProcessWords( url );
        computeCounts( url );
        computeTags( tags, url );
        let result = pluckTags( url ) || [];
        //
        // ---------------------------------------------------------------------

        putToRemoteCache( `getTags-${url}`, result );

        // XXX: this is as dirty as it looks, and should probably done
        // in a cron job not to slow things down.
        setImmediate( () =>
            result.forEach( ( tag ) =>
                getFromRemoteCache( `getUrls-${tag}` )
                    .then( ( urls ) => {
                        let tagUrls = urls || [];

                        if ( tagUrls.indexOf( url ) === -1 ) {
                            tagUrls.push( url );

                            putToRemoteCache( `getUrls-${tag}`, tagUrls, true );
                        }
                    } )
            )
        );

        // We don’t need to wait for the above cache operation(s) to complete.
        // We can return the result immediately and let it process in the
        // background.
        return result;
    } );
};

export {
    getTags,
    getUrls
};
