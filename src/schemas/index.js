/**
* Copyright 2015-present, ZBox Spa.
* All rights reserved.
**/

'use strict';

import { normalize, Schema, arrayOf, unionOf, valuesOf } from 'normalizr';
import { camelizeKeys } from 'humps';
import { CONSTANTS } from '../utils/constants';
import uuid from 'uuid';
import _ from 'lodash';


/**
 * This are the room memberships returnerd by the server
 * @type {Array}
 */
const ROOM_MEMBERSHIP_STATES = ['leave', 'join', 'invite'];
const EVENTS = CONSTANTS.events;

const assignRoomEntity = (output, key, value, input) => {
    if(key === 'state' && input.state.events.length > 0) {
    	output.name = setRoomName(input.state, input.id);
    	output.memberships = setRoomMembers(input.state);
    }
};

const setRoomMembers = (roomState) => {
	const memberships = {
		[EVENTS.ROOM_MEMBER_JOIN]: [], 
		[EVENTS.ROOM_MEMBER_LEAVE]: [],
		[EVENTS.ROOM_MEMBER_INVITE]: []
	};
	const roomMemberEvents = selectEventsByType(roomState.events, EVENTS.ROOM_MEMBER);
	const roomMemberEventsByMember = _.groupBy(roomMemberEvents, (event) => {
		return event.sender;
	});

	if (roomMemberEventsByMember.length < 1) return memberships;
	Object.keys(roomMemberEventsByMember).forEach((member) => {
		const event = lastEvent(roomMemberEventsByMember[member]);
		if (!event.membership) return;
		memberships[event.membership].push(event.sender);
	});
	return memberships;
};

/**
 * Set the name for the Room
 * if no name, then returns the Id
 * @param  {Object} roomState - the state with the Object of Events
 * @return {String}           - The Room Name
 */
const setRoomName = (roomState, roomId) => {
	const roomNameEvents = selectEventsByType(roomState.events, EVENTS.ROOM_NAME);
	if (roomNameEvents.length < 1) return roomId;
	const event = lastEvent(roomNameEvents);
	return event.content.name;
};

const lastEvent = (events) => {
	events.sort((a,b) => {
		return a.unsigned.age - b.unsigned.age;
	});
	return events[0];
};

/**
 * Returns an array of events by type
 * @param  {Array} events
 * @param  {String} type
 * @return {Array}        
 */
const selectEventsByType = (events, type) => {
	const selectedEvents = events.filter((event) => { 
		return event.type === type; 
	});
	return selectedEvents;
};

/**
 * Convert the original JSON for room from 
 * { rooms: { "leave": {Rooms}, "invite": {Rooms}, "join": {Rooms} } } to
 * { rooms: { Rooms } }
 * also adding the `id` and `membershipState` attributes
 * @param  {Object} json - The orinal rooms json response from server
 * @return {Object}      The reformarted json
 */
export const fixRoomJson = json => {
	const roomsObject = (typeof json.rooms === 'undefined') ? json : json.rooms;
	const roomsArray = [];
	ROOM_MEMBERSHIP_STATES.forEach((state) => {
		Object.keys(roomsObject[state]).forEach((roomId) => {
			const formatedRoom = addAttrsToRoom(roomsObject[state][roomId], state, roomId);
			roomsArray.push(formatedRoom);
		});

	});
	if (typeof json.rooms === 'undefined') return roomsArray;
	json.rooms = roomsArray;
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
	room.currentUserMembership = membershipState;
	if (typeof room.state === 'object') room.state.id = roomId;
	return camelizeKeys(room);
};

/**
 * Function to fix timeLine JSON
 * documented at: {@link https://github.com/paularmstrong/normalizr#normalizeobj-schema-options}
 */
const assignEventsArray = function(output, key, value, input) {
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
const roomSchema = new Schema('rooms', {
	assignEntity: assignRoomEntity,
});
const roomStateSchema = new Schema('roomsStates', {
	assignEntity: assignEventsArray
});
const syncSchema = new Schema('sync', { idAttribute: 'nextBatch' });
const timelineSchema = new Schema('timelines', {
	idAttribute: 'prevBatch', 
	assignEntity: assignEventsArray 
});

const userSchema = new Schema('users');


timelineSchema.define({
	events: arrayOf(eventSchema),
});

roomStateSchema.define({
	events: arrayOf(eventSchema)
});

roomSchema.define({
	timeline: timelineSchema,
	state: roomStateSchema
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
  ROOM_STATE: roomStateSchema,
  TIMELINE: timelineSchema,
  USER: userSchema,
  SYNC: syncSchema
};
