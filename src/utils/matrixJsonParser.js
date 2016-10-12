/**
* Copyright 2015-present, ZBox Spa.
* All rights reserved.
**/

'use strict';

import { camelizeKeys } from 'humps';
import { CONSTANTS } from '../utils/constants';
import uuid from 'uuid';
import _ from 'lodash';

/**
 * Return a JSON parsed as we like it
 * @param  {Object} json - The original JSON as returned by the Matrix Server
 * @return {Object}      - Formated Json
 */
export const matrixJsonParser = (json) => {
	let newJson = camelizeKeys(json);
	newJson = fixRoomJson(newJson);
	newJson.events = extractTimelineEvents(newJson.rooms);
	return newJson;
};

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

const extractTimelineEvents = (rooms) => {
	const result = {};
	const roomsIds = Object.keys(rooms);
	roomsIds.forEach((roomId) => {
		const roomEvents = rooms[roomId].timeline.events;
		_.merge(result, roomEvents);
	});
	return result;
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
export const fixRoomJson = (json) => {
	const roomsObject = json.rooms;
	const newRoomsObject = [];
	ROOM_MEMBERSHIP_STATES.forEach((state) => {
		Object.keys(roomsObject[state]).forEach((roomId) => {
			const formatedRoom = formatRoom(roomsObject[state][roomId], state, roomId);

			newRoomsObject[roomId] = formatedRoom;
		});

	});
	json.rooms = newRoomsObject;
	return json;
};

/**
 * Format the rooms as we need
 * @param  {Object} room            - Room JSON
 * @param  {String} membershipState - The state
 * @param  {String} roomId          - The roomId
 * @return {Object}                 - The updated Room JSON
 */
const formatRoom = (room, membershipState, roomId) => {
	const newRoom = addAttrsToRoom(room, membershipState, roomId);
	newRoom.timeline = fixTimelineJson(newRoom.timeline, roomId);

	return newRoom;
};

/**
 * Convert the original JSON for room.timeline
 * @param {Object} timeline - The orinal timeline json response from server
 * @param {String} roomId - The room id
 * @return {Object}      The reformarted json
 */
export const fixTimelineJson = (timeline, roomId) => {
	timeline = timeline || { 'events': [] };
	const newEvents = {};
	timeline.events.forEach((event) => {
		newEvents[event.eventId] = event;
		newEvents[event.eventId].roomId = roomId;
	});
	timeline.events = newEvents;
	return timeline;
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
	return room;
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














