import {SET_ERROR, REMOVE_ERROR} from '../actions/error';

const initialState = {
	error: {}
};

const Errors = function(state = initialState, action){
	let newState = null;
	switch(action.type){
		case SET_ERROR:
			newState = {...state.error, [action.payload.key]: action.payload.error}
			return state;
			break;

		case REMOVE_ERROR:
			newState = {...state};
			delete newState.error[action.payload.id];
			return newState;
			break;

		default:
			return state;
			break;
	};
};

export default Errors;