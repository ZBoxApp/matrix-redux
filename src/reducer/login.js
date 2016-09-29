import {LoginActionConstants} from '../actions/login';

const initialState = {
	isLoading: false,
	isLogged: false
};

const Login = function(state = initialState, action){
	let newState = null;
	switch(action.type){
		case LoginActionConstants.STARTED_REQUEST_LOGIN:
			newState = {...state, ['isLoading']: action.payload.isLoading};
			return newState;
			break;

		case LoginActionConstants.FAILED_REQUEST_LOGIN:
			newState = {...state, ['isLoading']: action.payload.isLoading};
			return newState;
			break;

		case LoginActionConstants.SUCCESS_REQUEST_LOGIN:
			newState = {...state, ['isLogged']: action.payload.isLogged};
			return newState;
			break;

		case LoginActionConstants.LOGOUT:
			return initialState;
			break;

		default:
			return state;
			break;
	};
};

export default Login;
