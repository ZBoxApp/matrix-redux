'use strict';

import {SyncActionConstants} from '../actions/sync';

const initialState = {
	isLoading: false
};

const sync = function(state = initialState, action){
	let newState = null;
	switch(action.type){
		case SyncActionConstants.STARTED_REQUEST_SYNC:
		case SyncActionConstants.FAILED_REQUEST_SYNC:
			newState = {...state, ['isLoading']: action.payload.isLoading};
			return newState;
			break;
		default:
			return state;
			break;
	};
};

export default sync;
