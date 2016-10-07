/**
* Copyright 2015-present, ZBox Spa.
* All rights reserved.
**/

'use strict';

import { normalize, Schema, arrayOf, unionOf, valuesOf } from 'normalizr';
import { camelizeKeys } from 'humps';
import _ from 'lodash';


/**
 * This are the room memberships returnerd by the server
 * @type {Array}
 */
const ROOM_MEMBERSHIP_STATES = ['leave', 'join', 'invite'];

/**
 * Convert the original JSON for room from 
 * { rooms: { "leave": {Rooms}, "invite": {Rooms}, "join": {Rooms} } } to
 * { rooms: { Rooms } }
 * also adding the `id` and `membershipState` attributes
 * @param  {Object} json - The orinal rooms json response from server
 * @return {Object}      The reformarted json
 */
export const fixRoomJson = json => {
	ROOM_MEMBERSHIP_STATES.forEach((state) => {
		Object.keys(json[state]).forEach((roomId) => {
			json[roomId] = addAttrsToRoom(json[state][roomId], state, roomId);
		});
		delete json[state];
	});
	return json;
};

/**
 * Adds the membershipState and roomId attributes to a room json
 * @param  {Object} room            - Room JSON
 * @param  {String} membershipState - The state
 * @param  {String} roomId          - The roomId
 * @return {Object}                 - The updated Room JSON
 */
const addAttrsToRoom = (room, membershipState, roomId) => {
	room.id = roomId;
	room.membershipState = membershipState;
	return room;
};

/**
 * Function to fix timeLine JSON
 * documented at: {@link https://github.com/paularmstrong/normalizr#normalizeobj-schema-options}
 */
const assignTimelineEntity = function(output, key, value, input) {
	if (key === 'events') {
		output.eventTypes = buildEventTypesObject(input.events);
	}
	return output;
};

/**
 * Make a eventTypes Object with contains an array for every kind of eventType, like
 * { 'm.room.message': [], 'm.room.member': []....}
 * @param  {Array} events - Array of events
 * @return {Object}        
 */
const buildEventTypesObject = events => {
	const eventTypes = {};
	events.forEach((event) => {
		const type = event.type;
		if (!eventTypes[type]) eventTypes[type] = [];
		eventTypes[type].push(event.eventId);
	});
	return eventTypes;
};

/**
 * The schemas
 */
const eventSchema = new Schema('events', { idAttribute: "eventId" });
const messageSchema = new Schema('messages');
const notificationSchema = new Schema('notifications');
const presenceSchema = new Schema('presences');
const roomSchema = new Schema('rooms');
const syncSchema = new Schema('sync', { idAttribute: 'nextBatch' });
const timelineSchema = new Schema('timelines', {
	idAttribute: 'prevBatch', 
	assignEntity: assignTimelineEntity 
});
const userSchema = new Schema('users');


syncSchema.define({
	rooms: arrayOf(roomSchema),
});

timelineSchema.define({
	events: arrayOf(eventSchema),
});

roomSchema.define({
	timeline: timelineSchema,
});

/**
 * Export the schemas
 */
export const Schemas = {
  EVENT: eventSchema,
  MESSAGE: messageSchema,
  NOTIFICATION: notificationSchema,
  PRESENCE: presenceSchema,
  ROOM: roomSchema,
  TIMELINE: timelineSchema,
  USER: userSchema,
  SYNC: syncSchema
};
