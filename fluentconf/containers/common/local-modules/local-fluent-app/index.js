'use strict';

/*
 * This program is distributed under the terms of the MIT license:
 * <https://github.com/v0lkan/talks/blob/master/LICENSE.md>
 * Send your comments and suggestions to <me@volkan.io>.
 */

import express from 'express';
import { initializeApp, startListening } from './app';
import { setup as setupRoutes } from './routes';
import { init as initCluster } from 'local-fluent-cluster';
import { init as initMessageBus } from 'local-fluent-bus';

let init = () => {
    initCluster(
        ( workerId ) => {
            initMessageBus( workerId );
        },
        ( /*workerId*/ ) => {
            let app = express();
            initializeApp( app );
            setupRoutes( app );
            startListening( app );
        }
    );
};

export { init };