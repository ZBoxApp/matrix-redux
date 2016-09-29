/**
 * ACTIONS FOR CURRENTUSER
 **/

import MatrixClient from "../utils/client";
import {createDefaultConstants, createDefaultActions} from "../utils/utils";

export const CurrentUserActionConstants = createDefaultConstants('user');
export const CurrentUserActions = createDefaultActions('user');

export const requestUserProfile = (userId) => {
    return dispatch => {
        dispatch(CurrentUserActions.startedRequestUser());

        return new Promise((resolve, reject) => {
            MatrixClient.callApi('getProfileInfo', userId, (err, data) => {
                if (err) {
                    dispatch(CurrentUserActions.failedRequestUser({error: err}));
                    return reject(err);
                }
                dispatch(CurrentUserActions.successRequestUser({profile: data}));
                resolve(data);
            });
        });
    };
};
