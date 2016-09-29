import {LoginActionConstants} from "../actions/login";

const initialState = {
    isLoading: false,
    isLogged: false,
    matrixClientData: {}
};

const Login = function (state = initialState, action) {
    let newState = null;
    switch (action.type) {
        case LoginActionConstants.STARTED_REQUEST_LOGIN:
            newState = {...state, ['isLoading']: action.payload.isLoading};
            return newState;
            break;

        case LoginActionConstants.FAILED_REQUEST_LOGIN:
            newState = {...state, ['isLoading']: action.payload.isLoading};
            return newState;
            break;

        case LoginActionConstants.SUCCESS_REQUEST_LOGIN:
            const matrixClientData = {
                '_http': {
                    'opts': {
                        userId: action.payload.userId,
                        refreshToken: action.payload.refreshToken,
                        accessToken: action.payload.accessToken,
                        deviceId: action.payload.deviceId,
                        homeServer: action.payload.homeServer
                    }
                },
                'credentials': {'userId': action.payload.userId},
                'deviceId': action.payload.deviceId,
                'baseUrl': action.payload.baseUrl
            };
            newState = {
                ...state,
                matrixClientData: matrixClientData,
                isLogged: action.payload.isLogged,
                isLoading: false
            };
            return newState;
            break;

        case LoginActionConstants.LOGOUT:
            return initialState;
            break;

        default:
            return state;
            break;
    }
};

export default Login;
