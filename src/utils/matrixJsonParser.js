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
	let newJson = json;
	newJson.nextBatch = json.next_batch;
	delete newJson.next_batch;
	newJson = fixRoomJson(json);
	newJson.events = extractTimelineEvents(newJson.rooms);
	newJson.presence = fixPresenceJson(newJson.presence);
	newJson.users = extractUsersFromRooms(newJson.rooms, newJson.presence);
	newJson.accountData = newJson.account_data;
	delete newJson.account_data;
	newJson.toDevice = newJson.to_device;
	delete newJson.to_device;
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
	const roomsObject = json.rooms || {};
	const newRoomsObject = {};
	ROOM_MEMBERSHIP_STATES.forEach((state) => {
		if (!roomsObject[state]) return;
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
		newEvents[event.event_id] = event;
		newEvents[event.event_id].roomId = roomId;
		newEvents[event.event_id].id = event.event_id;
		newEvents[event.event_id].userId = event.sender;
		newEvents[event.event_id].age = event.unsigned.age || null;
		delete(newEvents[event.event_id].event_id);
	});
	// Keep a copy for later use when we call extractTimelineEvents();
	timeline._oldEvents = newEvents;

	timeline.events = Object.keys(newEvents) || [];
	return timeline;
};

const fixPresenceJson = (presenceJson) => {
	const newEvents = {};
	const events = Array.isArray(presenceJson.events) ? presenceJson.events : [];

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
	room = setRoomAvatarUrl(room);
	room.members = setRoomMembers(room);
	room.unreadNotifications = camelizeKeys(room.unread_notifications);
	delete(room.unread_notifications);
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

const extractUsersFromRooms = (rooms, presenceState) => {
	const users = {};
	const roomsIds = Object.keys(rooms);
	roomsIds.forEach((roomId) => {
		const room = rooms[roomId];
		const roomUsers = extractUsersFromRoom(room, presenceState);
		_.merge(users, roomUsers);
	});
	return users;
};

/**
 * Build a User Object with all the members of the room
 * @param {Object} room - Room Json
 * @param {Object} presenceState - The presence Events
 * @return {[Object}      Users for this room
 */
const extractUsersFromRoom = (room, presenceState) => {
	const users = {};
	if (!room.state || !room.state.events) return users;
	const roomMemberEvents = selectEventsByType(room.state.events, EVENTS.ROOM_MEMBER);
	roomMemberEvents.forEach((event) => {
		const user = setUserAttrs(event, presenceState);
		if(users[event.sender])
			_.merge(users[event.sender], user);
		else
			users[event.sender] = user;
	});
	return users;
};

const setUserAttrs = (user, presenceState) => {
	let formatedUser = {};
	formatedUser.id = user.sender;
	formatedUser.name = user.content.displayname || formatedUser.id;
	formatedUser.displayName = user.content.displayname || formatedUser.id;
	if (user.content.avatar_url) formatedUser.avatarUrl = user.content.avatar_url;
	formatedUser = setUserPresence(formatedUser, presenceState);
	return formatedUser;
};

const setUserPresence = (user, presenceState) => {
	const presenceData = presenceState.events[user.id] || { "content": {} };
	user.presence = presenceData.content.presence || "offline";
	user.lastActiveAgo = presenceData.content.last_active_ago || 0;
	user.currentlyActive = presenceData.content.currently_active || false;

	return user;
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
		[EVENTS.ROOM_MEMBER_INVITE]: [],
		[EVENTS.ROOM_MEMBER_BAN]: []
	};
	const roomState = room.state;
	const roomMemberEvents = selectEventsByType(roomState.events, EVENTS.ROOM_MEMBER);
	const roomMemberEventsByMember = _.groupBy(roomMemberEvents, (event) => {
		return event.sender;
	});

	if (roomMemberEventsByMember.length < 1) return memberships;
	Object.keys(roomMemberEventsByMember).forEach((member) => {
		const event = lastEvent(roomMemberEventsByMember[member]);
		if (typeof event.membership === 'undefined') return;
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
	if (!room.state || !room.state.events) return room;
	const roomEvents = selectEventsByType(room.state.events, EVENTS.ROOM_AVATAR);
	if (roomEvents.length < 1) return room;
	const event = lastEvent(roomEvents);
	room.avatarUrl = event.content.url;
	return room;
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














