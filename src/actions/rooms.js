/**
* ACTIONS FOR ROOMS
**/

import {setError} from './error';

export const START_REQUEST_ROOM = 'START_REQUEST_ROOM';
export const FAILED_REQUEST_ROOM = 'FAILED_REQUEST_ROOM';
export const ROOM_CREATED = 'ROOM_CREATED';
export const SET_ROOM = 'SET_ROOM';
export const REMOVE_ROOM = 'REMOVE_ROOM';
export const UPDATE_ROOM = 'UPDATE_ROOM';

const startRequestRoom = () => {
	return {
		type: START_REQUEST_ROOM,
		payload: {
			isLoading: true
		}
	};
};

const failedRequestRoom = () => {
	return {
		type: FAILED_REQUEST_ROOM,
		payload: {
			isLoading: false
		}
	};
};

const updateRoom = (id, room) => {
	return {
		type: UPDATE_ROOM,
		payload: {
			id,
			room
		}
	};
};

const setRoom = (room) => {
	return {
		type: SET_ROOM,
		payload: {
			room
		}
	};
};

const roomCreated = () => {
	return {
		type: ROOM_CREATED,
		payload: {
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
		// dispatch(roomCreated());

		// if fail
		// dispatch(failedRequestRoom());
		// dispatch(setError(error));
	};
};