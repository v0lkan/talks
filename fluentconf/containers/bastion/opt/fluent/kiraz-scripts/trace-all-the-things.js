'use strict';

/*
 * This program is distributed under the terms of the MIT license:
 * <https://github.com/v0lkan/talks/blob/master/LICENSE.md>
 * Send your comments and suggestions to <me@volkan.io>.
 */

var clear = require( 'clear' );

var requestCount = 0;
var maxDelta = 0;
var cache = {};
var delays = [];

exports.local = function( traces ) {
    traces.on( 'cpu:utilization', function( result )  {
        cache.cpuUsage = '          CPU usage: ' + result.usage + '%';
    } );

    traces.on( 'request:end', function() {
        requestCount++;
    } );

    setInterval( function() {
        cache.requestsPerSecond = 'Requests per second: ' + requestCount;
        requestCount = 0;
    }, 1000 );

    traces.on( 'eventloop:delay', function( result )  {
        delays.push( result.delta );

        if ( delays.length >= 10 ) {
            delays.shift();
        }

        maxDelta = Math.max.apply( Math, delays );

        cache.eventLoopDelay = '   Event loop delay: ' + maxDelta + 'ms.';
    } );

    setInterval( function() {
        clear();
        console.log();
        console.log();
        console.log( '\t\t' + ( cache.cpuUsage || '…' ) );
        console.log();
        console.log( '\t\t' + ( cache.eventLoopDelay || '…' ) );
        console.log();
        console.log( '\t\t' + ( cache.requestsPerSecond || '…' ) );
    }, 100 );

    console.log( 'Started listening to all the things…' );
};
