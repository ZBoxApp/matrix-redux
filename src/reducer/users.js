"use strict";
import _ from "lodash";
import * as ActionTypes from "../actions/user";
import * as SyncActionTypes from "../actions/sync";
import {REHYDRATE} from "redux-persist/constants";

const initialState = {
    isLoading: false,
    currentUser: {
        isLogged: false,
        accessToken: null,
        homeServer: null,
        id: null,
        matrixClientData: {}
    },
    byIds: {}
};

const users = function (state = initialState, action) {
    let newState = null;
    switch (action.type) {
        case ActionTypes.USER_REQUEST:
        case ActionTypes.USER_FAILURE:
            newState = {...state, ['isLoading']: action.payload.isLoading};
            return newState;
            break;

        case ActionTypes.USER_SUCCESS:
            action.payload.isLoading = false;
            newState = {...state, ['currentUser']: {...action.payload}};
            return newState;
            break;

        case SyncActionTypes.SYNC_TOKEN:
            const matrixClientData = {...state.matrixClientData, ['store']: {syncToken: action.payload.syncToken}};
            newState = {...state, matrixClientData};
            return newState;
            break;

        case SyncActionTypes.SYNC_INITIAL:
            const users = action.payload.data.users;
            newState = {...state, ['byIds']: users};
            newState.isLoading = false;
            return newState;
            break;

        case SyncActionTypes.SYNC_SYNCING:
            const resources = action.payload.data.users;
            const newIds = _.merge({}, state.byIds, resources);
            newState = {...state, ['byIds']: newIds};
            newState.isLoading = false;
            return newState;
            break;

        case REHYDRATE:
            const savedData = action.payload.users || state;
            return {...savedData,};
            break;

        default:
            return state;
            break;
    }
};

export default users;
