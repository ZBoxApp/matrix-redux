import {
	SET_PROFILE,
	UPDATE_PROFILE,
	START_REQUEST_PROFILE,
	FAILED_REQUEST_PROFILE
} from '../actions/profile';

import {LOGOUT} from '../actions/login';

const initialState = {
	profile: null
};

const Profile = function(state = initialState, action){
	let newState = null;
	switch(action.type){
		case START_REQUEST_PROFILE:
		case FAILED_REQUEST_PROFILE:
			newState = {...state, ['isLoading']: action.payload.isLoading};
			return newState;
			break;

		case UPDATE_PROFILE:
			return state;
			break;

		case SET_PROFILE:
			newState = {...state, ['profile']: action.payload.profile};
			return newState;
			break;

		case LOGOUT:
			return initialState;
			break;

		default:
			return state;
			break;
	};
};

export default Profile;