/**
 * ACTIONS FOR EVENTS
 **/

import MatrixClient from "../utils/client";
import {setError} from "./error";

export const EVENT_REQUEST = 'SYNC_REQUEST';
export const EVENT_FAILURE = 'SYNC_FAILURE';
export const EVENT_SUCCESS = 'SYNC_SUCCESS';


const requestEvent = (type, payload) => {
    return {type, payload}
};

export const sendTextMessage = (roomId, body, txnId, callback) => {
    return dispatch => {
        dispatch(requestEvent(EVENT_REQUEST, {isLoading: true, eventType: 'm.text'}));

        MatrixClient.sendTextMessage(roomId, body, txnId, (err, data) => {
            if (err) {
                dispatch(setError({key: 'event.sendTextMessage', error: err}));
                dispatch(requestEvent(EVENT_FAILURE, {isLoading: false}));
                return callback(err);
            }
            console.log(data);
            dispatch(requestEvent(EVENT_SUCCESS, data));
            callback(null, data);
        });
    };
};
