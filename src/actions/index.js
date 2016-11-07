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

export const callApi = (methodName, ...args) => {
  return dispatch => {
    MatrixClient.callApi(methodName, ...args);
  };
};


export const clientStart = (opts) => {
    return dispatch => {
    	if (opts && opts.syncToken) {
    		MatrixClient.client.store.setSyncToken(opts.syncToken);
    		delete opts.syncToken;
    	}

    	matrixServerEventsListener(dispatch);
      matrixLocalEchoEvents(dispatch);
	    MatrixClient.startClient(opts);
	};
};

const matrixServerEventsListener = (dispatch) => {
	// Now we listen for Sync Events and Dispatch some Actions
	MatrixClient.client.on("sync", (syncState, prevState, data) => {
		const payload = {};
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

const matrixLocalEchoEvents = (dispatch) => {
  MatrixClient.client.on("Room.localEchoUpdated", (event) => {
    const eventData = event.event;
    if (!isValidEvent(eventData)) return;

    eventData.txnId = event._txnId;
    eventData.local = true;
    MatrixClient.client._reduxRawResponse = buildDummyMatrixJson(eventData);
    
    const payload = {"events": (MatrixClient.newEvents()) };
    dispatch(syncAction(SYNC_SUCCESS, payload));
  });
};

const isValidEvent = (event) => {
  const isValidId = (/^\$\d+\w+:.*/).test(event.event_id);
  const hasUnsignedObject = (typeof event.unsigned !== 'undefined');

  return (isValidId && hasUnsignedObject);
};

const buildDummyMatrixJson = (event) => {
  const json = {
    "next_batch": MatrixClient.client.store.syncToken,
    "account_data": { "events":[] },
    "to_device": { "events":[] },
    "presence": { "events":[] },
    "rooms":{ "leave": {}, "join": {}, "invite": {}}
  };
  json.rooms.join[event.room_id] = { "timeline": { "events": [event]} };
  return JSON.stringify(json);
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

