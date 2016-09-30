/**
 * ACTIONS FOR SYNC
 **/

import MatrixClient from "../utils/client";
import {setError} from "./error";

export const SYNC_REQUEST = 'SYNC_REQUEST';
export const SYNC_FAILURE = 'SYNC_FAILURE';
export const SYNC_SUCCESS = 'SYNC_SUCCESS';
export const SYNC_TOKEN = 'SYNC_TOKEN';

/**
 * This are the possible states of the Syncing process
 * as documented on http://matrix-org.github.io/matrix-js-sdk/0.6.1/client.js.html#line2853
 */
export const SYNC_STATE_SUCCESS = 'PREPARED';
export const SYNC_STATE_FAILURE = 'ERROR';
export const SYNC_STATE_RUNNING = 'SYNCING';
export const SYNC_STATE_STOPPED = 'STOPPED';

const requestSync = (type, payload) => {
  return { type, payload }
};

/**
  * @param {Object=} opts Options to apply when syncing.
  * @param {Number=} opts.initialSyncLimit The event <code>limit=</code> to apply
  * to initial sync. Default: 8.
  * @param {Boolean=} opts.includeArchivedRooms True to put <code>archived=true</code>
  * on the <code>/initialSync</code> request. Default: false.
  * @param {Boolean=} opts.resolveInvitesToProfiles True to do /profile requests
  * on every invite event if the displayname/avatar_url is not known for this user ID.
  * Default: false.
  *
  * @param {String=} opts.pendingEventOrdering Controls where pending messages
  * appear in a room's timeline. If "<b>chronological</b>", messages will appear
  * in the timeline when the call to <code>sendEvent</code> was made. If
  * "<b>detached</b>", pending messages will appear in a separate list,
  * accessbile via {@link module:models/room#getPendingEvents}. Default:
  * "chronological".
  *
  * @param {Number=} opts.pollTimeout The number of milliseconds to wait on /events.
  * Default: 30000 (30 seconds).
 */
export const start = (opts) => {
    return dispatch => {
        return new Promise((resolve, reject) => {
            MatrixClient.callApi("startClient", opts);
            let payload;
            MatrixClient.client.on("sync", (syncState, prevState, data) => {
              resolve(data);
              const matrixStore = MatrixClient.client.store;
              if (matrixStore && matrixStore.syncToken) {
                dispatch(requestSync(SYNC_TOKEN, {
                  syncToken: matrixStore.syncToken, state: syncState
                }));
              }
              switch (syncState) {
                case SYNC_STATE_FAILURE:
                  dispatch(setError({key: 'sync.start', error: syncState}));
                  dispatch(requestSync(SYNC_FAILURE, { isRunning: false }));
                  return reject(syncState);
                  break;

                case SYNC_STATE_RUNNING:
                  payload = {
                    isRunning: true, initialSyncComplete: true,
                    syncToken: MatrixClient.client.store.syncToken,
                    filters: MatrixClient.client.store.filters,
                  }
                  dispatch(requestSync(SYNC_SUCCESS, { isRunning: true }));
                  break;

                case SYNC_STATE_SUCCESS:
                  payload = {
                    isRunning: true, initialSyncComplete: true,
                    syncToken: MatrixClient.client.store.syncToken,
                    filters: MatrixClient.client.store.filters,
                  }
                  dispatch(requestSync(SYNC_SUCCESS, payload));
                  break;

                case SYNC_STATE_STOPPED:
                  dispatch(requestSync(SYNC_SUCCESS, { isRunning: false}));
                  break;
              }
            });
        });
    };
};

/**
 * High level helper method to stop the client from polling and allow a
 * clean shutdown.
 */
export const stop = () => {
  return dispatch => {
    MatrixClient.stopClient().then(() => {
      dispatch(requestSync(SYNC_SUCCESS, { isRunning: false}));
    });
  };
};

/**
 * Return the current state of the sync
 *
 */
export const getSyncState = () => {
    return dispatch => {
        const syncState = MatrixClient.getSyncState();
        let isRunnning;
        switch (syncState) {
          case SYNC_STATE_RUNNING:
            isRunning = true;
            break;

          case SYNC_STATE_SUCCESS:
            isRunning = true;
            break;

          case SYNC_STATE_STOPPED:
            isRunning = false;
            break;

          default:
            isRunning = false;
            break;
        };
        dispatch(requestSync(SYNC_SUCCESS, { isRunning: isRunning}));
    };
}
