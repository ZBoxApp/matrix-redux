import {SET_ERROR, REMOVE_ERROR} from "../actions/error";
import {REHYDRATE} from "redux-persist/constants";

const initialState = {
    error: {}
};

/**
 * The error is of the type:
 * {key: 'ActionCreatorType.ActionCreatorName', error: 'The Error'}
 * ex: {key: 'login.loginWithPassword', error: 'Bad Password' }
 */
const Errors = function (state = initialState, action) {
    let newState = null;
    switch (action.type) {
        case SET_ERROR:
            newState = {...state.error, [action.payload.key]: action.payload.error}
            return newState;
            break;

        case REMOVE_ERROR:
            newState = {...state};
            delete newState.error[action.payload.id];
            return newState;
            break;

        case REHYDRATE:
            const savedData = action.payload.error || state;
            return {
                ...savedData,
            };
            break;

        default:
            return state;
            break;
    }
};

export default Errors;
