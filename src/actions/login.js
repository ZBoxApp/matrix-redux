/**
* ACTIONS FOR LOGIN
**/

import {setError} from './error';
import MatrixClient from '../utils/client';
import {actionCreator, createDefaultConstants, createDefaultActions} from '../utils/utils';
import {CONSTANTS} from '../utils/constants';

export const LoginActionConstants = createDefaultConstants('login');
export const LoginActions = createDefaultActions('login');

/**
 * Extra Constants Definitions
 */

LoginActionConstants.LOGOUT = "LOGOUT";

/**
 * Extra Functions Definitions
 */

const succesLogin = (userData) => {
	return {
		type: LoginActionConstants.SUCCESS_REQUEST_LOGIN,
		payload: {
			isLoading: false,
			isLogged: true,
			accessToken: userData.access_token,
			homeServer: userData.home_server,
			refreshToken: userData.refresh_token,
			deviceId: userData.device_id,
			baseUrl: userData.baseUrl
		}
	};
};



/**
 * Used for login the user wih a password
 * @param {String} userName - Matrix User Name
 * @param {String} userPassword - Matrix User Password
 * @param {Object} opts - Options to initialize Matrix Client
 */
LoginActions.loginWithPassword = (userName, userPassword, opts) => {
	return dispatch => {

		dispatch(LoginActions.startedRequestLogin());

		return new Promise((resolve, reject) => {
			MatrixClient.loginWithPassword(userName, userPassword, opts, (err, data) => {
				if (err) {
					rejectDispatchers(dispatch, 'login.loginWithPassword', err);
					return reject(err);
				}
				resolveDispatchers(dispatch, opts, data);
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
 */
LoginActions.loginWithToken = (token, opts) => {
	return dispatch => {
		dispatch(LoginActions.startedRequestLogin());

		return new Promise((resolve, reject) => {
			MatrixClient.loginWithToken(token, opts, (err, data) => {
				if (err) {
					rejectDispatchers(dispatch, 'login.loginWithToken', err);
					return reject(err);
				}
				resolveDispatchers(dispatch, opts, data);
				resolve(data);
			});
		});
	};
};

LoginActions.restoreSession = (opts) => {
	return dispatch => {
		dispatch(LoginActions.startedRequestLogin());
		MatrixClient.restoreSession(opts);
		const data = opts._http.opts;
		data.baseUrl = opts.baseUrl;
		data.isLogged = true;
		data.credentials = {userId: data.userId};
		dispatch(LoginActions.successRequestLogin(data));
		dispatch(LoginActions.finishedRequestLogin());
	};
};

const rejectDispatchers = (dispatch, key, error) => {
	dispatch(LoginActions.failedRequestLogin());
	dispatch(LoginActions.finishedRequestLogin());
	dispatch(setError({ key: key, error: error }));
}

const resolveDispatchers = (dispatch, opts, data) => {
	data.baseUrl = opts.baseUrl;
	data.isLogged = true;
	data.credentials = {userId: data.userId};
	dispatch(LoginActions.successRequestLogin(data));
	dispatch(LoginActions.finishedRequestLogin());
}
