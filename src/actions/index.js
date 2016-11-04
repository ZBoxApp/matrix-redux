/**
 * ACTIONS
 **/

import _ from 'lodash';
import MatrixClient from "../utils/client";
import {makeTxnId} from "../utils/utils";

export const SYNC_REQUEST = 'SYNC_REQUEST';
export const SYNC_FAILURE = 'SYNC_FAILURE';
export const SYNC_SUCCESS = 'SYNC_SUCCESS';
export const SYNC_SYNCING = 'SYNC_SYNCING';
export const SYNC_INITIAL = 'SYNC_INITIAL';
export const SYNC_TOKEN = 'SYNC_TOKEN';

/**
 * This are the possible states of the Syncing process
 * as documented on http://matrix-org.github.io/matrix-js-sdk/0.6.1/client.js.html#line2853
 */
export const SYNC_INITIAL_SUCCESS = 'PREPARED';
export const SYNC_STATE_FAILURE = 'ERROR';
export const SYNC_STATE_RUNNING = 'SYNCING';
export const SYNC_STATE_STOPPED = 'STOPPED';

const syncAction = (type, payload) => {
  return { type, payload };
};
/**
 * @param {String} roomId
 * @param {String} body
 * @param {Function} callback.
 */
export const sendTextMessage = (roomId, body, callback) => {
  const txnId = makeTxnId();
  return dispatch => {
    MatrixClient.callApi("sendTextMessage", roomId, body, txnId, callback);
  };
};

/**
 * @param {String} roomId
 * @param {String} name
 * @param {Function} callback
 */
export const setRoomName = (roomId, name, callback) => {
  return dispatch => {
    MatrixClient.callApi("setRoomName", roomId, name, callback);
  };
};

/**
 * @param {string} roomId
 * @param {string} topic
 * @param {module:client.callback} callback Optional.
 * @return {module:client.Promise} Resolves: TODO
 * @return {module:http-api.MatrixError} Rejects: with an error response.
 */
export const setRoomTopic = (roomId, topic, callback) => {
  return dispatch => {
    MatrixClient.callApi("setRoomTopic", roomId, topic, callback);
  };
};

/**
 * @param {string} roomId
 * @param {string} body
 * @param {string} htmlBody
 * @param {Function} callback
 */
export const sendHtmlMessage = (roomId, body, htmlBody, callback) => {
  return dispatch => {
    MatrixClient.callApi("sendHtmlMessage", roomId, body, htmlBody, callback);
  };
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
  *
  * @param {String} opts.syncToken - The sync token to use
 */
export const clientStart = (opts) => {
    return dispatch => {
    	if (opts && opts.syncToken) {
    		MatrixClient.client.store.setSyncToken(opts.syncToken);
    		delete opts.syncToken;
    	}

    	matrixEventsListener(dispatch);
	    MatrixClient.startClient(opts);
	};
};

const matrixEventsListener = (dispatch) => {
	// Now we listen for Sync Events and Dispatch some Actions
	MatrixClient.client.on("sync", (syncState, prevState, data) => {
		const payload = {};
		let newEvents;
        switch (syncState) {
          case SYNC_STATE_FAILURE:
            // TODO
            break;

          case SYNC_STATE_RUNNING:
            payload.events = MatrixClient.newEvents();
            dispatch(syncAction(SYNC_SUCCESS, payload));
            break;

          case SYNC_INITIAL_SUCCESS:
            payload.events = MatrixClient.newEvents();
            dispatch(syncAction(SYNC_SUCCESS, payload));
            break;

          case SYNC_STATE_STOPPED:
            dispatch(syncAction(SYNC_SUCCESS, { isRunning: false}));
            break;
        }
    });
};

/**
 * High level helper method to stop the client from polling and allow a
 * clean shutdown.
 */
export const clientStop = () => {
  return dispatch => {
    MatrixClient.stopClient();
    dispatch(syncAction(SYNC_SUCCESS, { isRunning: false }));
  };
};


/**
 * Used for login the user wih a password
 * @param {String} userName - Matrix User Name
 * @param {String} userPassword - Matrix User Password
 * @param {Object} opts - Options to initialize Matrix Client
 * @param {Function} callback 
 */
export const login = (userName, userPassword, opts, callback) => {
    return dispatch => {
        MatrixClient.loginWithPassword(userName, userPassword, opts, (err, data) => {
            if (err)
            	return callback(err);

            data.baseUrl = opts.baseUrl;
            formatUserData(data);
            callback(null, data);
        });
    };
};

/**
 * Logout client. Do not Stop the Client
 * @param  {Function} callback 
 */
export const logout = (callback) => {
    return dispatch => {
        MatrixClient.logout((err, data) => {
            if (err)
            	return callback(err);

            callback(null, data);
        });
    };
};

/**
 * Initialize MatrixClient with the given session information
 * @param  {Object} opts
 * @return {[type]}      [description]
 */
export const restoreSession = (opts) => {
    return dispatch => {
        MatrixClient.restoreSession(opts);
        const data = formatUserData(opts._http.opts);
    };
};

const formatUserData = function(data) {
  data.isLogged = true;
  data.credentials = {userId: data.userId};
  data.matrixClientData = {
    baseUrl: data.baseUrl,
    deviceId: data.deviceId,
    credentials: data.credentials,
    _http: {
      opts: {
        userId: data.userId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        deviceId: data.deviceId,
        homeServer: data.homeServer
      }
    },
    store: { syncToken: null}
  };
  return data;
};

