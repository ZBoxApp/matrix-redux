'use strict';

import * as ActionTypes from "../actions/sync";
import {REHYDRATE} from "redux-persist/constants";

const initialState = {
    isRunning: false,
    initialSyncComplete: false,
    syncToken: null
};

const sync = function (state = initialState, action) {
    let newState = null;
    switch (action.type) {
        case ActionTypes.SYNC_REQUEST:
        case ActionTypes.SYNC_FAILURE:
        case ActionTypes.SYNC_SUCCESS:
            const payload = {...action.payload};
            delete payload.data;
            newState = {...state, ...payload};
            return newState;
            break;

        case ActionTypes.SYNC_INITIAL:
            newState = {...state, ['initialSyncComplete']: true};
            return newState;
            break;

        case REHYDRATE:
            const savedData = action.payload.sync || state;
            return {...savedData,};
            break;

        default:
            return state;
            break;
    }
};

export default sync;
