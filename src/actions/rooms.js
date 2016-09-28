/**
* ACTIONS FOR ROOMS
**/

import {setError} from './error';
import MatrixClient from '../utils/client';

export const START_REQUEST_ROOM = 'START_REQUEST_ROOM';
export const FAILED_REQUEST_ROOM = 'FAILED_REQUEST_ROOM';
export const CREATE_ROOM_SUCCESS = 'CREATE_ROOM_SUCCESS';
export const REMOVE_ROOM_SUCCESS = 'REMOVE_ROOM_SUCCESS';

export const SET_ROOM = 'SET_ROOM';
export const SET_MULTIPLE_ROOM = 'SET_MULTIPLE_ROOM';
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

const requestRemoveRoomSucess = () => {
	return {
		type: REMOVE_ROOM_SUCCESS,
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
		payload: room
	};
};

const setRooms = (rooms) => {
	return {
		type: SET_MULTIPLE_ROOM,
		payload: {
			rooms
		}
	};
};

const roomCreated = () => {
	return {
		type: CREATE_ROOM_SUCCESS,
		payload: {
			isLoading: false
		}
	};
};

const removeRoom = (room_id) => {
	return {
		type: REMOVE_ROOM,
		payload: {
			room_id
		}
	};
};

export const leaveRoom = (room_id) => {
	return dispatch => {
		dispatch(startRequestRoom());

		return new Promise((resolve, reject) => {
			MatrixClient.callApi('leave', room_id, (err, removed) => {
				if(err) {
					dispatch(failedRequestRoom());
					dispatch(setError(err));

					return reject(err);
				}

				dispatch(requestRemoveRoomSucess());
				dispatch(removeRoom(room_id));
				resolve(removed);
			});
		});
	};
};

export const getPublicRooms = () => {
	return dispatch => {
		dispatch(startRequestRoom());

		return new Promise((resolve, reject) => {
			MatrixClient.callApi('publicRooms', (err, rooms) => {
				if (err) {
					dispatch(failedRequestRoom());
					dispatch(setError(err));
					return reject(err);
				}

				dispatch(setRooms(rooms));
				resolve(rooms);
			});
		});
	};
};

export const createRoom = (attributes) => {
	return dispatch => {
		dispatch(startRequestRoom());

		return new Promise((resolve, reject) => {
			MatrixClient.callApi('createRoom', attributes, (err, room) => {
				if (err) {
					dispatch(failedRequestRoom());
					dispatch(setError(err));
					return reject(err);
				}

				const {room_id} = room;

				const data = {
					id: room_id,
					room: attributes
				};

				dispatch(roomCreated());
				dispatch(setRoom(data));
				resolve(data);
			});
		});
	};
};