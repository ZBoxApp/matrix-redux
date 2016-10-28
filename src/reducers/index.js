/*
 * Copyright 2015-present, ZBox Spa.
 * All rights reserved.
 */
"use strict";

import _ from 'lodash';
import EVENTS from '../utils/matrix_events';
import ReducerHelper from './reducer_helper';

const initialState = {
    "sync": {},
    "rooms": { 'byIds': {} },
    "users": {'byIds': {}},
    "events": {'byIds': {}},
    "_testing": {}
};

const MatrixReducer = (state = initialState, action = {}) => {

	let newState = {...state};
	

	const eventsToState = (events) => {
		processByReducer('rooms', events);
		processByReducer('users', events);
		
		Object.keys(newState).forEach((reducerName) => {
			if (newState[reducerName].byIds && newState[reducerName].byIds.byIds)
				delete newState[reducerName].byIds.byIds;
		});
		return newState;
	};

	const processByReducer = (reducerName, events) => {
		const reducerObject = events[reducerName];
		const reducerNames = Object.keys(reducerObject) || [];

		reducerNames.forEach((reducerName) => {
			const resourcesIds = Object.keys(reducerObject[reducerName]) || [];
			resourcesIds.forEach((resourceId) => {
				const resource = reducerObject[reducerName][resourceId];
				const eventsByType = ReducerHelper.groupByType(resource.events);
				['state', 'timeline', 'ephemeral'].forEach((eventType) => {
					processEventsByType(eventsByType[eventType], resource, eventType);
				});
			});
		});
		return newState;
	};

	const processEventsByType = (idsArray, resource, eventType) => {
		const events = getEventsFromIds(idsArray, resource.events);
		// if (eventType === 'state')
		// 	return runStateEventsActions(events);

		// else
		return runEventsActions(events);
	};

	const runStateEventsActions = (events) => {
		const results = {};
		const eventsByType = ReducerHelper.groupByType(events);
		const eventsTypes = Object.keys(EVENTS);

		eventsTypes.forEach((eventType) => {
			if (!eventsByType[eventType]) return;
			const youngerEvent = eventsByType[eventType][eventsByType[eventType].length - 1];
			results[youngerEvent.id] = youngerEvent;
		});

		runEventsActions(results);

	};

	const runEventsActions = (events) => {
		const tmpStates = [];
		const eventsIds = Object.keys(events) || [];

		eventsIds.forEach((eventId) => {
			const event = events[eventId];
			const tmpState = runActions(events[eventId]);
			tmpStates.push(tmpState);
		});

		return mergeTmpState(newState, tmpStates);
	};

	const runActions = (event) => {
		const tmpStates = [];
		const actions = getActions(event) || [];
		
		// We run every action and save the temp state;
		actions.forEach((action) => {
			const tmpState = runAction(action, event);
			tmpStates.push(tmpState);
		});

		return mergeTmpState(newState, tmpStates);
	}

	const runAction = (actionName, event) => {
		const [op, providerName, attrName] = [...(actionName.split('.'))];
		if (op === 'calculate')
			return runCalculation(actionName, event);

		else {
			return runCrud(actionName, event);			
		}
	};

	const runCalculation = (actionName, event) => {
		const [op, functionName] = [...(actionName.split('.'))];
		if (typeof calculations[functionName] !== 'function')
			return newState;
		
		return calculations[functionName](event);
	}

	const runCrud = (actionName, event) => {
		const [op, providerName, attrName] = [...(actionName.split('.'))];
		let newState = operations[op](event, providerName, attrName);

		return newState;
	}

	const getNewValue = (event, providerName, attrName) => {
		// Provider is from where we get the value we want to store
		const provider = (providerName === 'attr') ? event : event.content;
		
		const attrKey = EVENTS[event.type].actionsValues[providerName][attrName];
		const newValue = provider[attrKey];
		return newValue;
	};

	const getResource = (reducer, resourceId) => {
		if (!newState[reducer].byIds[resourceId])
			newState[reducer].byIds[resourceId] = {};

		return newState[reducer].byIds[resourceId];		
	};

	const setResource = (reducer, resourceId, resource) => {
		newState[reducer].byIds[resourceId]	= resource;
		return;
	}

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

					setResource(reducerName, resourceId, resource);
				});
			});
		});
		return newState;
	}

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
	}

	const getEventsFromIds = (eventsIds = [], eventObject) => {
		const events = {};
		eventsIds.forEach((eventId) => {
			events[eventId] = eventObject[eventId];
		});

		return events;
	}

	const superPush = (array, value, uniq = false) => {
		if (!Array.isArray(array))
			array = [];

		array.push(value);
		if(uniq)
			array = Array.from(new Set(array));

		return array;
	}

	const operations = {
		"add": (event, attrName) => {
			// Pass "attr" as providerName because for add ops its always
			// an attribute
			const newValue = getNewValue(event, "attr", attrName);
			const resource = getResource(event.reducer, event.ownerId);
			resource[attrName] = superPush(resource[attrName], newValue, 'uniq');

			setResource(event.reducer, event.ownerId, resource);
			return newState;
		},
		"update": (event, providerName, attrName) => {
			const resource = getResource(event.reducer, event.ownerId);
			const newValue = getNewValue(event, providerName, attrName);
			if (!newValue || newValue === null)
				return newState;

			resource[attrName] = newValue;

			setResource(event.reducer, event.ownerId, resource);
			return newState;
		},
	}

	const calculations = {
		"updateMembers": (event) => {
			const resource = getResource(event.reducer, event.ownerId);
			const memberId = event.state_key;

			if (!resource.membersIds)
				resource.membersIds = [];

			const membership = event.membership || event.content.membership;
			const attrKey = membership + 'MembersIds';

			resource[attrKey] = superPush(resource[attrKey], memberId, 'uniq');
			
			// We add the member to room and remove from in invited list
			if (membership === 'join') {
				resource.membersIds = superPush(resource.membersIds, memberId, 'uniq');
				
				if (resource.inviteMembersIds)
					resource.inviteMembersIds = removeFromArray(resource.inviteMembersIds, memberId);
			}

			// We remove the member from room if 
			// membership is ban or leave
			if (/(ban|leave)/.test(membership))
				resource.membersIds = removeFromArray(resource.membersIds, memberId);

			setResource(event.reducer, event.ownerId, resource);
			return newState;
		},
		"eventRead": (event) => {
			const targetEventsIds = Object.keys(event.content);

			targetEventsIds.forEach((eventId) => {
				const resource = getResource('events', eventId);
				const readData = event.content[eventId]['m.read'];
				if (!readData)
					return;

				const userIds = Object.keys(readData);
				if (!resource.readedBy)
					resource.readedBy = [];

				resource.readedBy = _.union(resource.readedBy, userIds);
				resource.readedBy = Array.from(new Set(resource.readedBy));

				setResource('events', eventId, resource);
			});

			return newState;
		}
	}

	if (action.payload && action.payload.events)
		newState = eventsToState(action.payload.events);

	newState._testing.runCrud = runCrud;
	newState._testing.runCalculation = runCalculation;
	newState._testing.runActions = runActions;
	newState._testing.runEventsActions = runEventsActions;
	newState._testing.eventsToState = eventsToState;
	
	return newState;

};



export default MatrixReducer;