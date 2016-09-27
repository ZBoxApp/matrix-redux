/**
* ACTIONS FOR ROOMS
**/

import {setError} from './error';
import matrixClient from '../utils/client';

export const SUCCESS_REQUEST_USER = 'SUCCESS_REQUEST_USER';
export const START_REQUEST_USER = 'START_REQUEST_USER';
export const FAILED_REQUEST_USER = 'FAILED_REQUEST_USER';
export const UPDATE_USER = 'UPDATE_USER';

const successRequestUser = (profile) => {
	return {
		type: SUCCESS_REQUEST_USER,
		payload: {
			profile
		}
	};
};

const updateUser = (user) => {
	return {
		type: UPDATE_USER,
		payload: {
			user
		}
	};
};

const startRequestUser = () => {
	return {
		type: START_REQUEST_USER,
		payload: {
			isLoading: true
		}
	};
};

const failedRequestUser = () => {
	return {
		type: FAILED_REQUEST_USER,
		payload: {
			isLoading: false
		}
	};
};

export const requestUser = (userId, clientOptions) => {
	return dispatch => {
		dispatch(startRequestUser());

		return new Promise((resolve, reject) => {
			matrixClient.callApi('getProfileInfo', userId, (err, data) => {
				if (err) {
					dispatch(failedRequestUser(err));
					return reject(err);
				}
				dispatch(successRequestUser(data));
				resolve(data);
			});
		});
	};
};
