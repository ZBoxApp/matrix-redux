/**
* Copyright 2015-present, ZBox Spa.
* All rights reserved.
**/

'use strict';

import { camelizeKeys } from 'humps';
import { CONSTANTS } from './constants';
import EVENTS from './matrix_events';

import { checkArguments, randomString } from './utils';
import _ from 'lodash';

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

const getReducerActions = (eventType, reducer) => {
	checkArguments([eventType, reducer]);
	const actions = EVENTS[eventType].reducers[reducer].actions;
	return actions;
};

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

export const processMatrixJson = (matrixJson, currentUserId, homeServer) => {
	checkArguments([matrixJson, currentUserId, homeServer]);
	let jsonStore = { "rooms": {}, "users": {}, "events": {}, "sync": {} };
	jsonStore.nextBatch = matrixJson.next_batch;
	const events = concatEvents(matrixJson);
	jsonStore = processEvents(events, jsonStore, currentUserId, homeServer);
	jsonStore = processEvents(matrixJson.rooms, jsonStore, currentUserId, homeServer, "rooms");

	return jsonStore;
};

export const processEvents = (events, jsonStore, currentUserId, homeServer, rooms) => {
	if (rooms) return processRoomEvents(events, jsonStore, currentUserId, homeServer);
	events.forEach((event) => {
		const results = processEvent(event, currentUserId, homeServer);
		results.forEach((result) => {
			if (!jsonStore[result.reducer]) jsonStore[result.reducer] = {};
			if (!jsonStore[result.reducer][result.ownerId]) jsonStore[result.reducer][result.ownerId] = { "events": [] };
			jsonStore[result.reducer][result.ownerId].events.push(result);
		});
	});

	return jsonStore;
}

export const processRoomEvents = (rooms, jsonStore, currentUserId, homeServer) => {
	let events = [];
	events = events.concat(getEventsFromRoomsByType(rooms, "join"));
	events = events.concat(getEventsFromRoomsByType(rooms, "leave"));
	events = events.concat(getEventsFromRoomsByType(rooms, "invite"));

	const result = processEvents(events, jsonStore, currentUserId, homeServer);
	return result;
}

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

const getEventsFromRoom = (room, roomId, roomType) => {
	let events = [];
	CONSTANTS.roomEventTypes.forEach((roomEventType) => {
		if (!room[roomEventType]) return;
		if (room[roomEventType].events.length < 1) return;

		room[roomEventType].events.forEach((event) => {
			events.push(processRoomEvent(event, roomType, roomId));
		});
	});

	return events;
};

export const concatEvents = (matrixJson) => {
	let events = [];
	events = events.concat(matrixJson.account_data.events);
	events = events.concat(matrixJson.presence.events);
	events = events.concat(matrixJson.to_device.events);
	return events;
};


export const processEvent = (event, currentUserId, homeServer) => {
	let events = [];
	let newEvent = {...event};
	newEvent = setEventId(event);
	newEvent = setMetadata(newEvent, currentUserId, homeServer);

	events = processEventByReducers(newEvent);
	return events;
};

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

const processEventByReducers = (event) => {
	const events = getEventsByReducer(event);

	// const mutator = {
	// 	"rooms": (event) => {

	// 	};
	// };

	return events;
}

export const processRoomEvent = (event, roomType, roomId) => {
	checkArguments([event, roomType, roomId]);
	event.roomType = roomType;
	event.roomId = roomId;

	return event;
};

const generateId = () => {
	const id = "$" + (new Date() * 1) + randomString(5);
	return id;
};

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

const setMetadata = (event, currentUserId, homeServer) => {
	event.currentUserId = currentUserId || throwUndef("currentUserId");
	event.homeServer = homeServer || throwUndef("homeServer");

	return event;
};

const throwUndef = (name = "") => {
	throw new Error("Undefined " + name);
};

