/**
* ACTIONS FOR ROOMS
**/

import {setError} from './error';

export const SET_MESSAGE = 'SET_MESSAGE';
export const REMOVE_MESSAGE = 'REMOVE_MESSAGE';

export const START_SENDING_MESSAGE = 'START_SENDING_MESSAGE';
export const REMOVE_ROOM = 'REMOVE_ROOM';
export const UPDATE_ROOM = 'UPDATE_ROOM';

const setMessage = (data) => {
	return {
		type: SET_MESSAGE,
		payload: data
	};
};

const removeMessage = (id) => {
	return {
		type: REMOVE_MESSAGE,
		payload: {
			id
		}
	};
};

const startSendingMessage = () => {
	return {
		type: START_SENDING_MESSAGE,
		payload: {
			isLoading: true
		}
	};
};

const setRoom = (room) => {
	return {
		type: SET_ROOM,
		payload: {
			room,
			isLoading: false
		}
	};
};

const removeRoom = (id) => {
	return {
		type: REMOVE_ROOM,
		payload: {
			id
		}
	};
};

const createRoom = (data) => {
	return dispatch => {
		dispatch(startRequestRoom());

		// make request here to create room

		// if ok
		// dispatch(setRoom());

		// if fail
		// dispatch(failedRequestRoom());
		// dispatch(setError(error));
	};
};