"use strict";
import _ from "lodash";

import * as SyncActionTypes from '../actions/sync';
import { calculateState } from '../middleware'

const initialState = {
    isLoading: false,
    byIds: {}
};

const Events = function (state = initialState, action) {
    let newState;
    let tmpState;
    let itemId;
    switch (action.type) {
        case "STATE_EVENT":
            itemId = action.payload.ownerId;
            if(!itemId) console.log(action.payload)
            tmpState = calculateState("event", state.byIds[itemId], action.payload);
            newState = {...state};
            newState.byIds[itemId] = tmpState;
            return newState;
            break;
        case SyncActionTypes.SYNC_SYNCING:
            const resources = action.payload.data.events;
            const newIds = _.merge({}, state.byIds, resources);
            newState = {...state, ['byIds']: newIds};
            newState.isLoading = false;
            return newState;
            break;
        default:
            return state;
            break;
    }
};

export default Events;
