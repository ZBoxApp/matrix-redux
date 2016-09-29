/**
* ACTIONS FOR SYNC
**/

import {setError} from './error';
import MatrixClient from '../utils/client';
import {actionCreator, createDefaultConstants, createDefaultActions} from '../utils/utils';
import {CONSTANTS} from '../utils/constants';

export const SyncActionConstants = createDefaultConstants('sync');
export const SyncActions = createDefaultActions('sync');

export const startSync = (opts) => {
	return dispatch => {
		// dispatch(CurrentUserActions.startedRequestUser());
		return new Promise((resolve, reject) => {
      resolve(MatrixClient.callApi("startClient", opts));
    });
	};
};

export const getSyncState = () => {
  return dispatch => {
		// dispatch(CurrentUserActions.startedRequestUser());
    return MatrixClient.getSyncState();
	};
}
