"use strict";
import _ from "lodash";
import * as SyncActionTypes from "../actions/sync";
import {REHYDRATE} from "redux-persist/constants";

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

        case SyncActionTypes.SYNC_SYNCING:
            const resources = action.payload.data.events;
            const newIds = _.merge({}, state.byIds, resources);
            newState = {...state, ['byIds']: newIds};
            newState.isLoading = false;
            return newState;
            break;

        case REHYDRATE:
            const savedData = action.payload.events || state;
            return {...savedData,};
            break;

        default:
            return state;
            break;
    }
};

export default Events;
