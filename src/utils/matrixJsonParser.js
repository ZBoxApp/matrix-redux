/**
* Copyright 2015-present, ZBox Spa.
* All rights reserved.
**/

'use strict';

import { camelizeKeys } from 'humps';
import { CONSTANTS } from '../utils/constants';
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
 * @param {String}	userId
 * @return {Object}      - Formated Json
 */
export const processJson = (json, userId) => {
	if (typeof userId !== 'string') {
  		throw new Error('userId undefined: ' + userId);
  	}
	if (!json || typeof json !== 'object') return {};
	const newJson = {};
	const roomsEvents = processRoomsEvents(json.rooms, userId);
	const accountDataEvents = processAccountDataEvents(json.account_data, userId);
	const toDeviceEvents = processToDeviceEvents(json.to_device, userId);
	const presenceEvents = processPresenceEvents(json.presence);

	newJson.events = _.flatten([roomsEvents, accountDataEvents, toDeviceEvents, presenceEvents]);
	newJson.nextBatch = json.next_batch;

	return newJson;
};

/**
 * Receive and process the Account Data JSON
 * @param  {Object} accountDataJson 
 * @param  {String} userId          
 * @return {Array}  - Array of Events
 */
export const processAccountDataEvents = (accountDataJson, userId) => {
	let result = [];
	if (!accountDataJson || !accountDataJson.events) return result;
	const events = accountDataJson.events || [];
	events.forEach((event) => {
		const processedEvent = processAccountDataEvent(event, userId);
		result.push(processedEvent);
	});
	return result;
};

/**
 * Return a processed Event with all the data we need
 * @param  {Object} eventJson - The original Event Json
 * @param {String} [userId] - Matrix User Id
 * @return {Object}
 */
export const processAccountDataEvent = (eventJson, userId) => {
	if (typeof userId !== 'string') {
  		throw new Error('userId undefined: ' + userId);
  	}
	const resultJson = processEvent(eventJson, CONSTANTS.rootEventTypes.account_data);
	resultJson.ownerType = CONSTANTS.eventOwnerTypes.account_data;
	resultJson.ownerId = setOwnerId(resultJson, userId);
	resultJson.id = setEventId(resultJson);
	return resultJson;
};


export const processPresenceEvents = (presenceJson) => {
	let result = [];
	if (!presenceJson || !presenceJson.events) return result;
	const events = presenceJson.events || [];
	events.forEach((event) => {
		const processedEvent = processPresenceEvent(event);
		result.push(processedEvent);
	});

	return result;
};

export const processToDeviceEvents = (toDeviceEventsJson) => {
	return [];
};

/**
 * For each room, process each Event
 * @param  {Object} roomsJson - The room object returned by the server
 * @param  {String} userId    - The logged userId
 * @return {Array}            - Array of processed Events
 */
export const processRoomsEvents = (roomsJson, userId) => {
	let result = [];
	if (!roomsJson) return result;
	CONSTANTS.roomTypes.forEach((roomType) => {
		if (!roomsJson[roomType]) return;
		const roomsIds = Object.keys(roomsJson[roomType]);
		roomsIds.forEach((roomId) => {
			const roomJson = roomsJson[roomType][roomId];
			const resultJson = processRoom(roomJson, roomId, roomType, userId);
			result = _.concat(result, resultJson);
		});
	});

	return result;
};

/**
 * Process the Room looking the Events
 * @param  {Object} roomsJson - The room object returned by the server
 * @param  {String} roomId
 * @param  {String} roomType 
 * @param  {String} userId    - The logged userId
 * @return {Array}            - Array of events
 */
export const processRoom = (roomJson, roomId, roomType, userId) => {
	let result = [];
	const processedRoomEvents = processRoomEvents(roomJson, roomId, roomType, userId);
	const unreadNotificationEvent = processRoomUnreadNotifications(roomJson, roomId, roomType, userId);
	if (unreadNotificationEvent) result.push(unreadNotificationEvent);
	result = _.concat(result, processedRoomEvents);
	return result;
};

/**
 * Process all the Room Event Types
 * @param  {Object} roomJson 
 * @param  {String} roomId   
 * @param  {String} roomType 
 * @param  {String} userId 
 */
export const processRoomEvents = (roomJson, roomId, roomType, userId) => {
	const result = [];
	CONSTANTS.roomEventTypes.forEach((eventType) => {
		if (!roomJson[eventType] || !Array.isArray(roomJson[eventType].events)) return;
		roomJson[eventType].events.forEach((roomEvent) => {
			if(!roomEvent) return;
			const resultJson = processRoomEvent(roomEvent, eventType, roomId, roomType, userId);
			result.push(resultJson);
		});
	});

	return result;
};

/**
 * Return a processed Event with all the data we need
 * @param  {Object} eventJson - The original Event Json
 * @param {String} roomEventType
 * @param {String} roomId
 * @param {String} userId
 * @return {Object}
 */
export const processRoomEvent = (eventJson, roomEventType, roomId, roomType, userId) => {
	if (typeof eventJson !== 'object'){
		throw new Error('roomEvent Json undefined');
	}
	[roomId, roomEventType, userId, roomType].forEach((variable, index) => {
		if (typeof variable !== 'string') {
			throw new Error(index + ' undefined: ');
		}
	});
	let resultJson = processEvent(eventJson, CONSTANTS.rootEventTypes.rooms);
	resultJson.ownerType = "room";
	resultJson.ownerId = roomId;
	resultJson.roomType = roomType;
	resultJson.roomEventType = roomEventType;
	resultJson = setExtraEventAttrs(resultJson);
	resultJson.id = setEventId(resultJson);
	return resultJson;
};


/**
 * Take the unread_notification object and build an event
 * @param  {Object} roomJson 
 * @param  {String} roomId   
 * @param  {String} roomType 
 * @param  {String} userId   
 * @return {Object}          The unread Event
 */
export const processRoomUnreadNotifications = (roomJson, roomId, roomType, userId) => {
	let unreadNotificationEvent;
	const homeServer = roomId.split(/:/)[1];
	if (!roomJson.unread_notifications) return false;
	unreadNotificationEvent = {
		"roomEventType": "state",
		content: {
			"unread_notification": {
				"highlightCount": roomJson.unread_notifications.highlight_count,
				"notificationCount": roomJson.unread_notifications.notification_count,
			}
		},
		"ownerType": "room",
		"ownerId": roomId,
		"id": buildEventId(homeServer),
		"rootType": "rooms",
		"matrixCode": "z.unread_notification",
		"age": 0,
		"type": "z.unread_notification",
		"roomType": roomType
	};
	return unreadNotificationEvent;
};

/**
 * Build event Id
 * @param  {String} homeServer - The Home server Name
 * @return {String}
 */
const buildEventId = (homeServer) => {
	const timeStamp = new Date(2010, 6, 26).getTime() / 1000;
	const chars = randomString(5);
	const id = "$" + timeStamp + chars + ":" + homeServer;
	return id;
};

/**
 * Return a processed Event with all the data we need
 * @param  {Object} eventJson - The original Event Json
 * @param  {String} rootEventTypes - a Root Event Type as defined in CONSTANTS.rootEventTypes
 * @return {Object}
 */
export const processEvent = (eventJson, rootEventType) => {
	if (typeof eventJson !== 'object') {
    	throw new Error('eventJson is not an Object: ');
  	}
	const resultJson = {...eventJson};
	resultJson.rootType = rootEventType;
	resultJson.matrixCode = setMatrixCode(resultJson);
	resultJson.age = setAge(resultJson);
	resultJson.id = setEventId(resultJson);
	if (eventJson.sender) resultJson.userId = eventJson.sender;
	return resultJson;
};


/**
 * Return a processed Event with all the data we need
 * @param  {Object} eventJson - The original Event Json
 * @return {Object}
 */
export const processPresenceEvent = (eventJson) => {
	const resultJson = processEvent(eventJson, CONSTANTS.rootEventTypes.presence);
	resultJson.ownerType = CONSTANTS.eventOwnerTypes.presence;
	resultJson.ownerId = setOwnerId(resultJson);
	return resultJson;
};

const setAge = (eventJson) => {
	let age = 0;
	if (eventJson.unsigned && eventJson.unsigned.age) {
		age = eventJson.unsigned.age;
	}
	return age;
};

const setExtraEventAttrs = (eventJson) => {
	if (eventJson.matrixCode === CONSTANTS.eventTypes.message) {
		eventJson = setMessageAttributes(eventJson);
	}
	return eventJson;
};

const setMessageAttributes = (eventJson) => {
	// Redacted Events does not have msgtype
	if (!eventJson.content.msgtype) {
		 eventJson.msgType = eventJson.unsigned.redacted_because.type;
	} else {
		eventJson.msgType = eventJson.content.msgtype;
	}
	eventJson.userId = eventJson.sender;
	return eventJson;
};

const setEventId = (eventJson) => {
	let eventId;
	if (eventJson.event_id) eventId = eventJson.event_id;
	if (!eventJson.event_id) {
		const timeStamp = new Date() * 1;
		const text = randomString(5);
		eventId = "$" + timeStamp + text;
	}
	return eventId;
};

const setMatrixCode = (eventJson) => {
	let eventType;
	eventType = (eventJson.type && (/^m\./).test(eventJson.type)) ? eventJson.type : 'z.nomatrix';
	return eventType;
};

const setOwnerId = (eventJson, userId, roomId) => {
	let ownerId;
	switch (eventJson.ownerType) {
        case CONSTANTS.ownerTypes.room:
        	ownerId = roomId;
        	break;
        case CONSTANTS.ownerTypes.user:
        	ownerId = (typeof userId !== 'undefined') ? userId : eventJson[CONSTANTS.eventOwnerAttribute.user];
        	break;
        default:
        	break;
	}
	return ownerId;
};

const setOwnerType = (eventJson) => {

	CONSTANTS.eventOwnerTypes[rootEventType];
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
 * Return a random string
 * @param  {Integer} length - The length of the string
 * @return {String}        
 */
const randomString = (length) => {
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
};