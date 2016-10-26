/**
* Copyright 2015-present, ZBox Spa.
* All rights reserved.
**/

'use strict';

import { CONSTANTS } from './constants';
import EVENTS from './matrix_events';
import { checkArguments, randomString } from './utils';
import _ from 'lodash';

/**
 * Process de Matrix Server response and return a json ready for the reducers
 * @param  {Object} matrixJson    - Original json from server
 * @param  {String} currentUserId - The logged user id
 * @param  {String} homeServer    - The user home server
 * @return {Object}               - The parsed json ready for reducers
 */
export const processMatrixJson = (matrixJson, currentUserId, homeServer) => {
	checkArguments([matrixJson, currentUserId, homeServer]);
	let jsonStore = { "rooms": {}, "users": {}, "events": {}, "sync": {} };
	const events = concatEvents(matrixJson);
	jsonStore.nextBatch = matrixJson.next_batch;
	jsonStore = processEvents(events, jsonStore, currentUserId, homeServer);
	jsonStore = processEvents(matrixJson.rooms, jsonStore, currentUserId, homeServer, "rooms");

	return jsonStore;
};

/**
 * Process each event of the original server response
 * @param  {Object} events        - The root events: rooms, account_data,
 *                                	presence, to_device
 * @param  {Object} jsonStore     - Store to save the processed events
 * @param  {String} currentUserId - The logged user id
 * @param  {String} homeServer    - The user home server
 * @param  {Boolean} rooms        - If the events belongs to rooms
 * @return {Object}               - The jsonStore
 */
export const processEvents = (events, jsonStore, currentUserId, homeServer, rooms) => {
	let results;
	if (rooms) return processRoomEvents(events, jsonStore, currentUserId, homeServer);
	events.forEach((event) => {
		results = processEvent(event, currentUserId, homeServer);
	});

	jsonStore = addEventsToJsonStore(results, jsonStore);

	return jsonStore;
};

/**
 * Add the events to the jsonStore by Reducer
 * @param  {Array} events    
 * @param  {Object} jsonStore 
 * @return {Object}           
 */
const addEventsToJsonStore = (events, jsonStore) => {
	events.forEach((event) => {
		const reducer = event.reducer;
		const ownerId = event.ownerId;
		if (!jsonStore[reducer]) jsonStore[reducer] = {};
		if (!jsonStore[reducer][ownerId]) jsonStore[reducer][ownerId] = { "events": [] };
		jsonStore[reducer][ownerId].events.push(event);
	});

	return jsonStore;
};

/**
 * Process rooms event of the original server response
 * @param  {Object} rooms        - The rooms object from the server response
 * @param  {Object} jsonStore     - Store to save the processed events
 * @param  {String} currentUserId - The logged user id
 * @param  {String} homeServer    - The user home server
 * @return {Object}               - The jsonStore
 */
export const processRoomEvents = (rooms, jsonStore, currentUserId, homeServer) => {
	let events = [];
	events = events.concat(getEventsFromRoomsByType(rooms, "join"));
	events = events.concat(getEventsFromRoomsByType(rooms, "leave"));
	events = events.concat(getEventsFromRoomsByType(rooms, "invite"));

	jsonStore = processEvents(events, jsonStore, currentUserId, homeServer);
	return jsonStore;
};

/**
 * Process an Event adding missing attributes and check to wich reducers it must
 * belong
 * @param  {Object} event        - The event to process
 * @param  {String} currentUserId - The logged user id
 * @param  {String} homeServer    - The user home server
 * @return {Array}               - New events for each reducer
 */
export const processEvent = (event, currentUserId, homeServer) => {
	let events = [];
	let newEvent = {...event};
	newEvent = setEventId(event);
	newEvent = setMetadata(newEvent, currentUserId, homeServer);

	events = getEventsByReducer(newEvent);
	return events;
};

/**
 * Set room metadata to the events. Metadata includes: roomType and roomId.
 * @param  {Object} event    - The room's event
 * @param  {String} roomType - The type of room: join, leave, invite
 * @param  {String} roomId   
 * @return {Object}          - The event with the metadata
 */
export const setRoomEventMetadata = (event, roomType, roomId) => {
	checkArguments([event, roomType, roomId]);
	event.roomType = roomType;
	event.roomId = roomId;

	return event;
};

/**
 * Check the event type agains matrix_events.json and return an array of new
 * events for each reducer defined.
 * @param  {Object} event - The event to process
 * @return {Array}
 */
export const getEventsByReducer = (event) => {
	const events = [];
	const reducersName = getReducersName(event.type);
	reducersName.forEach((reducerName) => {
		const newEvent = {...event};
		newEvent.reducer = reducerName;
		newEvent.reducerActions = getReducerActions(event.type, reducerName);
		newEvent.ownerId = setOwnerId(newEvent);
		events.push(newEvent);
	});
	return events;
};

/**
 * Get the actions for the event's reducer.
 * @param  {String} eventType - The event.type
 * @param  {String} reducer   - The reducer name
 * @return {Array}
 */
const getReducerActions = (eventType, reducer) => {
	checkArguments([eventType, reducer]);
	const actions = EVENTS[eventType].reducers[reducer].actions;
	return actions;
};

/**
 * Get the reducers names given the event type
 * @param  {String} eventType - The event.type
 * @return {Array}           
 */
const getReducersName = (eventType) => {
	let reducers = [];
	if (!eventType) return reducers;
	
	try {
		reducers = Object.keys(EVENTS[eventType].reducers);
	} catch (e) {
		console.log(eventType + " is not defined with reducers in matrix_events.json");
	}

	return reducers;
};

/**
 * Process every room in the given roomType, (invite|join|leave) and return it's events.
 * @param  {Object} rooms    - The rooms object
 * @param  {String} roomType - The type of the room
 * @return {Array}           - Array of events
 */
const getEventsFromRoomsByType = (rooms, roomType) => {
	let events = [];
	const roomsIds = Object.keys(rooms[roomType]);

	roomsIds.forEach((roomId) => {
		const room = rooms[roomType][roomId];
		const eventsFromRoom = getEventsFromRoom(room, roomId, roomType);
		events = events.concat(eventsFromRoom)
	});

	return events;
};

/**
 * Parse the given room and returns its events
 * @param  {Object} room     - A room
 * @param  {String} roomId   - The room Id
 * @param  {String} roomType - The room type: invite, join, leave
 * @return {Array}
 */
const getEventsFromRoom = (room, roomId, roomType) => {
	let events = [];
	CONSTANTS.roomEventTypes.forEach((roomEventType) => {
		if (!room[roomEventType]) return;
		if (room[roomEventType].events.length < 1) return;

		room[roomEventType].events.forEach((event) => {
			events.push(setRoomEventMetadata(event, roomType, roomId));
		});
	});

	return events;
};

/**
 * Return an array of events from the rootTypes: account_data, presence and to_device
 * @param  {Object} matrixJson - The server json response
 * @return {Array}
 */
export const concatEvents = (matrixJson) => {
	let events = [];
	events = events.concat(matrixJson.account_data.events);
	events = events.concat(matrixJson.presence.events);
	events = events.concat(matrixJson.to_device.events);
	return events;
};

/**
 * Generate an Event Id
 * @return {String}
 */
const generateId = () => {
	const id = "$" + (new Date() * 1) + randomString(5);
	return id;
};

/**
 * Set the eventId using the rules in matrix_events.json
 * @param  {Object} event
 * @return {Object}       - The event with id attribute
 */
const setEventId = (event) => {
	const eventDefinition = EVENTS[event.type];
	let idRule;
	try {
		idRule = eventDefinition.idAttr;
	} catch (e) {
		console.log(event.type + " is not defined int matrix_events.json");
	}
	
	if (!idRule) return event;
	if (idRule === 'attr.event_id') event.id = event.event_id;
	if (idRule === 'calculate.generateId') event.id = generateId();
	return event;
};

/**
 * Set attributes to the event
 * @param  {Object} event         [description]
 * @param  {String} currentUserId - The logged user id
 * @param  {String} homeServer    - The user home server
 * @return {Object}
 */
const setMetadata = (event, currentUserId, homeServer) => {
	event.currentUserId = currentUserId || throwUndef("currentUserId");
	event.homeServer = homeServer || throwUndef("homeServer");

	return event;
};

/**
 * Set the ownerId of the event using the rules on matrix_events.json
 * @param  {Object} event
 * @return {String}        - The ownerId
 */
const setOwnerId = (event) => {
	let ownerId;
	try	{
		let ownerAttribute = EVENTS[event.type].reducers[event.reducer].ownerId;
		ownerAttribute = ownerAttribute.split('.');
		const type = ownerAttribute[0];
		const attrName = ownerAttribute[1];
		if (type !== 'attr') return event;
		ownerId = event[attrName];
	} catch (e) {
		console.log(ownerAttribute + " is not defined with reducers in matrix_events.json");
	}

	return ownerId;
};

/**
 * Util function that throws an error for undefined variables
 * @param  {String} name - Name of the undefined variable
 * @return {Error}
 */
const throwUndef = (name = "") => {
	throw new Error("Undefined " + name);
};

