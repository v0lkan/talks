'use strict';

/*
 * This program is distributed under the terms of the MIT license:
 * <https://github.com/v0lkan/talks/blob/master/LICENSE.md>
 * Send your comments and suggestions to <me@volkan.io>.
 */

import Vantage from 'vantage';
import { startInstrumenting, stopInstrumenting } from '../monitor';

const VANTAGE_PORT = 8004;

let nullInformer = { log: () => {} };
let informer = nullInformer;

let inform = ( what ) => informer.log( what );

/**
 *
 */
let listen = () => {
    let vantage = new Vantage();

    vantage
        .command( 'ping' )
        .description( 'Checks vantage.' )
        .action( function( args, callback ) {
            this.log( 'pong.' );

            callback();
        } );

    vantage
        .command( 'start-instrumenting' )
        .description( 'Starts gathering metrics.' )
        .action( function( args, callback ) {
            startInstrumenting();

            this.log( 'Started instrumenting.' );

            callback();
        } );

    vantage
        .command( 'stop-instrumenting' )
        .description( 'Stops gathering metrics.' )
        .action( function( args, callback ) {
            stopInstrumenting();

            this.log( 'Stopped instrumenting.' );

            callback();
        } );

    vantage
        .command( 'shutdown-server' )
        .description( 'Shuts down the server.' )
        .action( function( /*args, callback*/ ) {
            this.log( 'Forcefully shutting down the server.' );

            process.exit( 0 );
        } );

    vantage
        .command( 'toggle-logging' )
        .description( 'Toggles request logging.' )
        .action( function( args, callback ) {
            informer = informer === nullInformer ? this : nullInformer;

            this.log( 'Toggled logging.' );

            callback();
        } );

    vantage.listen( VANTAGE_PORT );
};

export { inform, listen };
