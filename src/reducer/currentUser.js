import {
	START_REQUEST_USER,
	FAILED_REQUEST_USER,
	SUCCESS_REQUEST_USER,
	UPDATE_USER
} from '../actions/currentUser';

import {LOGOUT, SUCCESS_LOGIN} from '../actions/login';

const initialState = {
	isLoading: false,
	accessToken: null,
	homeServer: null,
	userId: null,
	refreshToken: null,
	deviceId: null
};

const currentUser = function(state = initialState, action){
	let newState = null;
	switch(action.type){
		case START_REQUEST_USER:
		case FAILED_REQUEST_USER:
			newState = {...state, ['isLoading']: action.payload.isLoading};
			return newState;
			break;
		case SUCCESS_LOGIN:
			newState = {...state, ...action.payload};
			return newState;
			break;
		case SUCCESS_REQUEST_USER:
			const profile = {
				displayName: action.payload.profile.displayname,
				avatarUrl: action.payload.profile.avatarurl
			}
			newState = {...state, profile};
			return newState;
			break;
		case UPDATE_USER:
			return state;
			break;
		case LOGOUT:
			return initialState;
			break;
		default:
			return state;
			break;
	};
};

export default currentUser;
