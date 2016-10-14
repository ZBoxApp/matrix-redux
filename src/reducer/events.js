"use strict";

import * as SyncActionTypes from '../actions/sync';

const initialState = {
    isLoading: false,
    byIds: {}
};

const Events = function (state = initialState, action) {
    let newState = null;
    switch (action.type) {
        case SyncActionTypes.SYNC_INITIAL:
            const events = action.payload.data.events;
            newState = {...state, ['byIds']: events};
            newState.isLoading = false;
            return newState;
            break;
        default:
            return state;
            break;
    }
};

export default Events;
