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
 * This are the room memberships returnerd by the server
 * @type {Array}
 */
const ROOM_MEMBERSHIP_STATES = ['leave', 'join', 'invite'];
const EVENTS = CONSTANTS.events;


/**
 * Return a JSON parsed as we like it
 * @param  {Object} json - The original JSON as returned by the Matrix Server
 * @return {Object}      - Formated Json
 */
export const matrixJsonParser = (json) => {
	let newJson = camelizeKeys(json);
	newJson = fixRoomJson(newJson);
	newJson.events = extractTimelineEvents(newJson.rooms);
	newJson.presence = fixPresenceJson(newJson.presence);
	return newJson;
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
	const newRoomsObject = {};
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
		newEvents[event.eventId].age = event.unsigned.age || null;
	});
	// Keep a copy for later use when we call extractTimelineEvents();
	timeline._oldEvents = newEvents;

	timeline.events = Object.keys(newEvents);
	return timeline;
};

const fixPresenceJson = (presenceJson) => {
	const newEvents = {};
	const events = presenceJson.events || [];

	events.forEach((event) => {
		newEvents[event.sender] = event;
	});

	presenceJson.events = newEvents;
	return presenceJson;
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
	room.name = setRoomName(room);
	room.topic = setRoomTopic(room);
	room.avatarUrl = setRoomAvatarUrl(room);
	room.members = setRoomMembers(room);
	if (typeof room.state === 'object') room.state.id = roomId;
	return room;
};


const extractTimelineEvents = (rooms) => {
	const result = {};
	const roomsIds = Object.keys(rooms);
	roomsIds.forEach((roomId) => {
		const roomEvents = rooms[roomId].timeline._oldEvents;
		_.merge(result, roomEvents);
		delete(rooms[roomId].timeline._oldEvents);
	});
	return result;
};


export const setRoomAttr = (room, attrName, defaultValue) => {
	defaultValue = defaultValue || '';
	const eventName = EVENTS['ROOM_' + attrName.toUpperCase()];
	if (!room.state || !room.state.events) return defaultValue;
	const roomEvents = selectEventsByType(room.state.events, eventName);
	if (roomEvents.length < 1) return defaultValue;
	const event = lastEvent(roomEvents);
	return event.content[attrName];
};


const setRoomMembers = (room) => {
	if (!room.state || !room.state.events) return [];
	const memberships = {
		[EVENTS.ROOM_MEMBER_JOIN]: [], 
		[EVENTS.ROOM_MEMBER_LEAVE]: [],
		[EVENTS.ROOM_MEMBER_INVITE]: []
	};
	const roomState = room.state;
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
 * @param  {Object} room - the room Object
 * @return {String}           - The Room Name
 */
const setRoomName = (room) => {
	return setRoomAttr(room, "name", room.id);
};

const setRoomTopic = (room) => {
	return setRoomAttr(room, "topic");
};

// TODO: Make it work withj setRoomAttr
const setRoomAvatarUrl = (room) => {
	if (!room.state || !room.state.events) return null;
	const roomEvents = selectEventsByType(room.state.events, EVENTS.ROOM_AVATAR);
	if (roomEvents.length < 1) return null;
	const event = lastEvent(roomEvents);
	return event.content.url;
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














