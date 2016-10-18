/**
 * ACTIONS FOR ROOMS
 **/

import MatrixClient from "../utils/client";
import {setError} from "./error";

export const ROOMS_REQUEST = 'ROOMS_REQUEST';
export const ROOMS_FAILURE = 'ROOMS_FAILURE';
export const ROOMS_SUCCESS = 'ROOMS_SUCCESS';
export const ROOMS_REMOVE = 'ROOMS_REMOVE';

const requestRooms = (type, payload) => {
    return {type, payload}
};

/**
 * @param {string} roomId
 * @param {module:client.callback} callback Optional.
 * @return {module:client.Promise} Resolves: TODO
 * @return {module:http-api.MatrixError} Rejects: with an error response.
 */
export const leaveRoom = (roomId) => {
    return dispatch => {
        dispatch(requestRooms(ROOMS_REQUEST, {isLoading: true}));

        return new Promise((resolve, reject) => {
            MatrixClient.client.leave(roomId, (err, data) => {
                if (err) {
                    dispatch(setError({key: 'rooms.leaveRoom', error: err}));
                    dispatch(requestRooms(ROOMS_FAILURE, {isLoading: false}));
                    return reject(err);
                }
                const payload = {'roomId': roomId, 'isLoading': false};
                dispatch(requestRooms(ROOMS_REMOVE, payload));
                resolve(data);
            });
        });
    };
};

/**
 * Get an Object of Public Rooms
 * @return {Object} rooms - Public Rooms
 * @return {String} rooms.next_batch - to Request more rooms
 * @return {Array} rooms.chunk - Array of Rooms
 */
export const getPublicRooms = () => {
    return dispatch => {
        dispatch(requestRooms(ROOMS_REQUEST, {isLoading: true}));

        return new Promise((resolve, reject) => {
            MatrixClient.callApi('publicRooms', (err, data) => {
                if (err) {
                    dispatch(setError({key: 'rooms.getPublicRooms', error: err}));
                    dispatch(requestRooms(ROOMS_FAILURE, {isLoading: false}));
                    return reject(err);
                }
                const payload = roomsToPayload(data);
                dispatch(requestRooms(ROOMS_SUCCESS, payload));
                resolve(data);
            });
        });
    };
};

/**
 * Create a new room.
 * @param {Object} options a list of options to pass to the /createRoom API.
 * @param {string} options.room_alias_name The alias localpart to assign to
 * this room.
 * @param {string} options.visibility Either 'public' or 'private'.
 * @param {string[]} options.invite A list of user IDs to invite to this room.
 * @param {string} options.name The name to give this room.
 * @param {string} options.topic The topic to give this room.
 * @param {module:client.callback} callback Optional.
 * @return {module:client.Promise} Resolves: <code>{room_id: {string},
* room_alias: {string(opt)}}</code>
 * @return {module:http-api.MatrixError} Rejects: with an error response.
 */
export const createRoom = (options) => {
    return dispatch => {
        dispatch(requestRooms(ROOMS_REQUEST, {isLoading: true}));

        return new Promise((resolve, reject) => {
            MatrixClient.client.createRoom(options, (err, data) => {
                if (err) {
                    dispatch(setError({key: 'rooms.createRoom', error: err}));
                    dispatch(requestRooms(ROOMS_FAILURE, {isLoading: false}));
                    return reject(err);
                }
                const newRoom = {
                    chunk: [{
                        canonical_alias: data.room_alias,
                        room_id: data.room_id,
                        aliases: [data.room_alias]
                    }]
                };
                const payload = roomsToPayload(newRoom);
                dispatch(requestRooms(ROOMS_SUCCESS, payload));
                resolve(data);
            });
        });
    };
};

/**
 * Process the response from the server to make the payload
 * @param  {Array} publicRooms - Response from server
 * @return {Object} payload
 * @return {String} payload.isLoading
 * @return {Object} payload.rooms
 * @return {Object} payload.rooms.room
 * @return {Array} payload.publicIds
 */
const roomsToPayload = (publicRooms) => {
    const publicIds = [];
    const items = {};
    const ids = [];
    const roomsArray = publicRooms.chunk || [];
    roomsArray.forEach((room) => {
        publicIds.push(room.room_id);
        ids.push(room.room_id);
        items[room.room_id] = room;
    });
    return {
        isLoading: false, items: items, ids: ids,
        publicIds: publicIds, next_batch: publicRooms.next_batch
    };
};
