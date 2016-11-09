/**
* Copyright 2015-present, ZBox Spa.
* All rights reserved.
**/

'use strict';

import { CONSTANTS } from '../utils/constants';
import EVENTS from '../utils/matrix_events';
import { checkArguments, randomString } from '../utils/utils';
import _ from 'lodash';

const groupByType = (events) => {
	const byType = { "state": [], "ephemeral": [] };
	let eventsArray = {...events};

	if (!Array.isArray(eventsArray))
		eventsArray = objectToArray(eventsArray);

	eventsArray.forEach((event) => {
		if (!event) return;
		if (!EVENTS[event.type]) return;
		const ephemeral = EVENTS[event.type].ephemeral;
		const sorted = EVENTS[event.type].ageSorted;

		if (!byType[event.type])
			byType[event.type] = [];

		if (isEphemeral(event)) {
			byType.ephemeral.push(event.id);
		}
		else if (!event.roomEventType) {
			byType.state.push(event.id);
		}
		else {
			if (!byType[event.roomEventType])
				byType[event.roomEventType] = [];

			byType[event.roomEventType].push(event.id);
		}

		byType[event.type].push(event.id);
	});

	byType.state = sortByAge(byType.state, events);
	byType.timeline = sortByAge(byType.timeline, events);

	return byType;
};

const isEphemeral = (event) => {
	let ephemeral = false;

	if (EVENTS[event.type].ephemeral)
		ephemeral = true;

	if (event.roomEventType && event.roomEventType !== 'ephemeral')
		ephemeral = false;

	return ephemeral;
};

const sortByAge = (ids = [], events = {}) => {
	ids.sort((a,b) => {
		if (!events[a].unsigned || !events[b].unsigned) {
		console.log(events[a]);
		console.log(events[b]);
	}
		return events[a].unsigned.age - events[b].unsigned.age;
	});

	return ids;
};


const objectToArray = (object) => {
	const events = [];
	Object.keys(object).forEach((key) => {
		events.push(object[key]);
	});

	return events;
}

const getNewValue = (event, providerName, attrName) => {
	// Provider is from where we get the value we want to store
	const provider = (providerName === 'attr') ? event : event.content;
		
	const attrKey = EVENTS[event.type].actionsValues[providerName][attrName];
	const newValue = provider[attrKey];
	return newValue;
};

const getResource = (reducer, resourceId, newState) => {
	if (!newState[reducer])
		newState[reducer] = { 'byIds': { [resourceId]: {} }};

	if (!newState[reducer].byIds[resourceId])
		newState[reducer].byIds[resourceId] = {};

	newState[reducer].byIds[resourceId].isLoading = true;
	newState[reducer].byIds[resourceId].changedAttr = false;
	return newState[reducer].byIds[resourceId];
};

const setResource = (reducer, resourceId, resource, newState) => {
	// Todo: Why fails if I remove this line;
	if (typeof resource === 'string') return newState;
	if (!newState[reducer])
		newState[reducer] = { 'byIds': { [resourceId]: {} }};
	
	resource.isLoading = false;
	newState[reducer].byIds[resourceId]	= resource;
	delete newState[reducer].byIds.byIds;
	delete newState[reducer].byIds.isLoading;
	
	return newState;
};

const mergeTmpState = (newState = {}, tmpStates) => {
	// we process the tmpStates to build the newState
	tmpStates.forEach((tmpState) => {
		const reducerNames = Object.keys(tmpState);
		reducerNames.forEach((reducerName) => {
			const reducer = tmpState[reducerName];
			const resourceIds = Object.keys(reducer);

			resourceIds.forEach((resourceId) => {
				const resource = reducer[resourceId];
				// Dont care empty results
				if (Object.keys(resource).length < 1)
					return;

				setResource(reducerName, resourceId, resource, newState);
			});
		});
	});
	return newState;
};

const removeFromArray = (array = [], element) => {
	return array.filter((el) => {
		return (el !== element);
	});
}

const getActions = (event) => {
	let actions = [];
	if (!EVENTS[event.type]) return actions;
	
	actions = EVENTS[event.type].reducers[event.reducer].actions;
	return actions;
};

const getEventsFromIds = (eventsIds = [], eventObject) => {
	const events = {};
	eventsIds.forEach((eventId) => {
		events[eventId] = eventObject[eventId];
	});

	return events;
};

const superPush = (array, value, uniq = false) => {
	if (!Array.isArray(array))
		array = [];

	array.push(value);
	if(uniq)
		array = Array.from(new Set(array));

	return array;
};

const ReducerHelper = {
	groupByType,
	sortByAge,
	superPush,
	getEventsFromIds,
	getActions,
	removeFromArray,
	mergeTmpState,
	setResource,
	getResource,
	getNewValue,
	objectToArray,
	isEphemeral
};

export default ReducerHelper;