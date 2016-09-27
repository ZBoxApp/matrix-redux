import {START_LOGIN, FAILED_LOGIN, SUCCESS_LOGIN, LOGOUT} from '../actions/login';

const initialState = {
	isLoading: false,
	isLogged: false
};

const Login = function(state = initialState, action){
	let newState = null;
	switch(action.type){
		case START_LOGIN:
			newState = {...state, ['isLoading']: action.payload.isLoading};
			return newState;
			break;

		case FAILED_LOGIN:
			newState = {...state, ['isLoading']: action.payload.isLoading};
			return newState;
			break;

		case SUCCESS_LOGIN:
			newState = {...state, ['isLogged']: action.payload.isLogged};
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

export default Login;
