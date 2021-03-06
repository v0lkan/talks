'use strict';

/*
 * This program is distributed under the terms of the MIT license:
 * <https://github.com/v0lkan/talks/blob/master/LICENSE.md>
 * Send your comments and suggestions to <me@volkan.io>.
 */

import { listen, inform } from '../repl';
import { graphql } from 'graphql';
import { trace, start } from 'kiraz';
import bodyParser from 'body-parser';
import express from 'express';
import schema from '../schema';
import { isServerBusy, unsetBusy } from '../monitor';

let log = {
    error: (...args) => console.log.apply( console, args )
};

const MONITOR_ENDPOINT = '192.168.99.100';
const MONITOR_PORT = 4322;
const PORT = 8003;

start( {
    host: MONITOR_ENDPOINT,
    port: MONITOR_PORT
} );

let app = express();

app.use( bodyParser.text( { type: 'application/graphql' } ) );

let alreadyScheduledTimer = false;

let checkLoad = ( res ) => {
    if ( !isServerBusy() ) { return false; }

    log.error( 'api/v1/graph', 'The service is overloaded!' );

    res
        .status( 503 )
        .end( 'The server is busy. Try again later.' );

    if ( !alreadyScheduledTimer ) {
        setTimeout( () => {
            unsetBusy();
            alreadyScheduledTimer = false;
        }, 30000 ).unref();
    }
    alreadyScheduledTimer = true;

    return true;
};

app.post( '/api/v1/graph', ( req, res ) => {
    if ( checkLoad( res ) ) { return; }

    inform( 'POST /api/v1/graph' );

    graphql( schema, req.body )
        .then( ( result ) =>
            res.end( JSON.stringify( result, null, 4 ) )
        );
} );

app.get( '/benchmark/get-tags', ( req, res ) => {
    void req;

    inform( 'GET /benchmark/get-tags' );

    let token = { action: 'get-tags' };

    trace( 'request:start', token );

    let query = `
        {
            tags(
                url: "http://web:8080/` +
                `10-tricks-to-appear-smart-during-meetings-27b489a39d1a.html"
            )
        }
    `;

    graphql( schema, query )
        .then( ( result ) => {
            res.end( JSON.stringify( result, null, 4 ) );

            trace( 'request:end', token );
        } );
} );

app.get( '/benchmark/get-urls', ( req, res ) => {
    void req;

    inform( 'GET /benchmark/get-urls' );

    let token = { action: 'get-urls' };

    let query = `
        {
            urls(tag: "tech")
        }
    `;

    trace( 'request:start', token );

    graphql( schema, query )
        .then( ( result ) => {
            res.end( JSON.stringify( result, null, 4 ) );

            trace( 'request:end', token );
        } );
} );

listen( app, PORT );

global.fluent = global.fluent || {};
global.fluent.running = true;

console.log( `Demo API is ready at port '${PORT}'.` );
