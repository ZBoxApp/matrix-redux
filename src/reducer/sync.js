'use strict';

import * as ActionTypes from '../actions/sync';

const initialState = {
    isRunning: false,
    initialSyncComplete: false
};

const sync = function (state = initialState, action) {
    let newState = null;
    switch (action.type) {
        case ActionTypes.SYNC_REQUEST:
        case ActionTypes.SYNC_FAILURE:
        case ActionTypes.SYNC_SUCCESS:
            const payload = action.payload;
            newState = {...state, ...payload };
            return newState;
            break;
        default:
            return state;
            break;
    }
};

export default sync;
