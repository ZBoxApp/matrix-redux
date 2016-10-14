/**
 * ACTIONS FOR CURRENTUSER
 **/

import MatrixClient from "../utils/client";
import {setError} from "./error";

export const USER_REQUEST = 'USER_REQUEST';
export const USER_FAILURE = 'USER_FAILURE';
export const USER_SUCCESS = 'USER_SUCCESS';

const requestUser = (type, payload) => {
  return { type, payload }
};

export const loadUserProfile = (userId) => {
    return dispatch => {
        dispatch(CurrentUserActions.startedRequestUser());

        return new Promise((resolve, reject) => {
            MatrixClient.callApi('getProfileInfo', userId, (err, data) => {
                if (err) {
                    dispatch(CurrentUserActions.failedRequestUser({error: err}));
                    return reject(err);
                }
                dispatch(CurrentUserActions.successRequestUser({profile: data}));
                resolve(data);
            });
        });
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
        dispatch(requestUser(USER_REQUEST, { isLoading: true }));

        MatrixClient.loginWithPassword(userName, userPassword, opts, (err, data) => {
            if (err) {
                dispatch(setError({key: 'login.loginWithPassword', error: err}));
                dispatch(requestUser(USER_FAILURE, { isLogged: false }));
                return callback(err);
            }
            data.baseUrl = opts.baseUrl;
            formatUserData(data);
            dispatch(requestUser(USER_SUCCESS, data));
            callback(null, data);
        });
    };
};

export const logout = (callback) => {
    return dispatch => {
        dispatch(requestUser(USER_REQUEST, { isLoading: true }));
        MatrixClient.logout((err, data) => {
            if (err) {
                dispatch(setError({key: 'login.loginWithPassword', error: err}));
                dispatch(requestUser(USER_FAILURE, { isLogged: true }));
                return callback(err);
            }
            const payload = {
                isLogged: false, accessToken: undefined, matrixClientData: undefined
            };
            dispatch(requestUser(USER_SUCCESS, payload));
            callback(null, data)
        });
    };
};

/**
 * Used for login the user wih a password
 * @param {String} userName - Matrix User Name
 * @param {String} userPassword - Matrix User Password
 * @param {Object} opts - Options to initialize Matrix Client
 * @returns {Promise}
 */
export const loginWithToken = (token, opts) => {
    return dispatch => {
        dispatch(requestUser(USER_REQUEST, { isLoading: true }));

        return new Promise((resolve, reject) => {
            MatrixClient.loginWithToken(token, opts, (err, data) => {
                if (err) {
                  dispatch(setError({key: 'login.loginWithToken', error: err}));
                  dispatch(requestUser(USER_FAILURE, { isLogged: false }));
                  return reject(err);
                }
                data.baseUrl = opts.baseUrl;
                formatUserData(data);
                dispatch(requestUser(USER_SUCCESS, data));
                resolve(data);
            });
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
        dispatch(requestUser(USER_SUCCESS, data));
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
  }
  return data;
}
