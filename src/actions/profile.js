/**
* ACTIONS FOR ROOMS
**/

import {setError} from './error';

export const SET_PROFILE = 'SET_MESSAGE';
export const START_REQUEST_PROFILE = 'START_REQUEST_PROFILE';
export const FAILED_REQUEST_PROFILE = 'FAILED_REQUEST_PROFILE';

const setProfile = (data) => {
	return {
		type: SET_PROFILE,
		payload: data
	};
};

const startRequestProfile = () => {
	return {
		type: START_REQUEST_PROFILE,
		payload: {
			isLoading: true
		}
	};
};

const failedRequestProfile = () => {
	return {
		type: FAILED_REQUEST_PROFILE,
		payload: {
			isLoading: false
		}
	};
};

const requestProfile = () => {
	return dispatch => {
		dispatch(startRequestProfile());

		// make request here to create room

		// if ok
		// dispatch(setProfile());

		// if fail
		// dispatch(failedRequestProfile());
		// dispatch(setError(error));
	};
};