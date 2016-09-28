/**
* ACTIONS FOR SYNC
**/

import {setError} from './error';
import matrixClient from '../utils/client';
import {actionCreator, createDefaultConstants, createDefaultActions} from '../utils/utils';
import {CONSTANTS} from '../utils/constants';

export const SyncActionConstants = createDefaultConstants('sync');
export const SyncActions = createDefaultActions('sync');
