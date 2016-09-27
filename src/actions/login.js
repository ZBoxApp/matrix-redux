/**
* ACTIONS FOR LOGIN
**/

import {setUser} from './currentUser';
import matrixClient from '../utils/client';

export const START_LOGIN = 'START_LOGIN';
export const FAILED_LOGIN = 'FAILED_LOGIN';
export const SUCCESS_LOGIN = 'SUCCESS_LOGIN';

export const LOGOUT = 'LOGOUT';

const startLogin = () => {
	return {
		type: START_LOGIN,
		payload: {
			isLoading: true
		}
	};
};

const failedLogin = (err) => {
	return {
		type: FAILED_LOGIN,
		payload: {
			isLoading: false,
			error: err
		}
	};
};

const succesLogin = (userData) => {
	return {
		type: SUCCESS_LOGIN,
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

const loggout = () => {
	return {
		type: LOGOUT
	};
};

export const makeLogin = (user, password, options) => {
	return dispatch => {
		dispatch(startLogin());

		return new Promise((resolve, reject) => {
			matrixClient.login(user, password, options, (err, data) => {
				if (err) {
					dispatch(failedLogin(err));
					return reject(err);
				}
				data.baseUrl = options.baseUrl;
				dispatch(succesLogin(data));
				resolve(data);
			});
		});
	};
};
