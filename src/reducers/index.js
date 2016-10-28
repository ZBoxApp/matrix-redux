/*
 * Copyright 2015-present, ZBox Spa.
 * All rights reserved.
 */

import _ from 'lodash';
import EVENTS from '../utils/matrix_events';
import ReducerHelper './reducer_helper';

"use strict";

const initialState = {
    "sync": {},
    "rooms": {},
    "users": {},
    "events": {},
    "_testing": {}
};

const MatrixReducer = (state = initialState, action = {}) => {

	const eventsToState = (events) => {
		let result = {};
		const rooms = processByReducer('rooms', events);
		const users = processByReducer('users', events);
		// const events = processByReducer('events', events.events);
	};

	const processByReducer = (reducerName, events) => {
		const reducerObject = events[reducerName];
		const reducerNames = Object.keys(reducerObject) || [];
		reducerNames.forEach((reducerName) => {
			const resource = reducerObject[reducerName];
			const eventsByType = ReducerHelper.groupByType(resource.events);

			let newState = processEventsByType(eventsByType.state, resource, 'state');
			newState = processEventsByType(eventsByType.timeline, resource);
			newState = processEventsByType(eventsByType.ephemeral, resource);
		});
	};

	const processEventsByType = (idsArray, resource, state) => {
		const events = getEventsFromIds(idsArray, resource);
		if (state)
			return runStateEventsActions(events);

		else
			return runEventsActions(events);
	};

	const runStateEventsActions = (events) => {
		const results = {};
		const eventsByType = ReducerHelper.groupByType(events);
		const eventsTypes = Object.keys(EVENTS);

		eventsTypes.forEach((evenType) => {
			if (!eventsByType[eventType]) return;

			const youngerEvent = eventsByType[eventType][eventsByType[eventType].length - 1];
			results[youngerEvent.id];
		});

		return runEventsActions(results);

	};

	const runEventsActions = (events) => {
		const tmpStates = [];
		const eventsIds = Object.keys(events) || [];
		let newState = {};

		eventsIds.forEach((eventId) => {
			const tmpState = runActions(events[eventId]);
			tmpStates.push(tmpState);
		});

		newState = mergeTmpState(newState, tmpStates);
		return newState;
	};

	const runActions = (event) => {
		const tmpStates = [];
		let newState = {};
		const actions = getActions(event) || [];
		
		// We run every action and save the temp state;
		actions.forEach((action) => {
			const tmpState = runAction(action, event);
			tmpStates.push(tmpState);
		});

		newState = mergeTmpState(newState, tmpStates);
		return newState;
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
		let newState = stateFactory(event);
		if (typeof calculations[functionName] !== 'function')
			return newState;
		
		newState = calculations[functionName](event);
		return newState;
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

					if(!newState[reducerName])
						newState[reducerName] = {};

					newState[reducerName][resourceId] = resource;
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

	const stateFactory = (event) => {
		const newState = {
			[event.reducer]: {
				[event.ownerId]: ({...state[event.reducer][event.ownerId]} || {})
			}
		}
		
		return newState;
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

	const superPush = (array, value) => {
		if (!Array.isArray(array))
			array = [];

		array.push(value);
		return array;
	}

	const operations = {
		"add": (event, attrName) => {
			// Pass "attr" as providerName because for add ops its always
			// an attribute
			const newValue = getNewValue(event, "attr", attrName);
			const newState = stateFactory(event);
			const resource = newState[event.reducer][event.ownerId];
			resource[attrName] = superPush(resource[attrName], newValue);

			newState[event.reducer][event.ownerId] = resource;
			return newState;
		},
		"update": (event, providerName, attrName) => {
			const newState = stateFactory(event);
			const resource = newState[event.reducer][event.ownerId];
			const newValue = getNewValue(event, providerName, attrName);
			if (!newValue || newValue === null)
				return newState;

			resource[attrName] = newValue;

			newState[event.reducer][event.ownerId] = resource;
			return newState;
		},
	}

	const calculations = {
		"updateMembers": (event) => {
			const newState = stateFactory(event);
			const resource = newState[event.reducer][event.ownerId];
			const memberId = event.sender;

			if (!resource.membersIds)
				resource.membersIds = [];

			const membership = event.membership || event.content.membership;
			const attrKey = membership + 'MembersIds';

			resource[attrKey] = superPush(resource[attrKey], memberId);
			
			// We add the member to room and remove from in invited list
			if (membership === 'join') {
				resource.membersIds.push(memberId);
				
				if (resource.inviteMembersIds)
					resource.inviteMembersIds = removeFromArray(resource.inviteMembersIds, memberId);
			}

			// We remove the member from room if 
			// membership is ban or leave
			if (/(ban|leave)/.test(membership))
				resource.membersIds = removeFromArray(resource.membersIds, memberId);

			newState[event.reducer][event.ownerId] = resource;
			return newState;
		},
		"eventRead": (event) => {
			const targetEventsIds = Object.keys(event.content);
			const newState = { 'events': {} };

			targetEventsIds.forEach((eventId) => {
				const tmpState = stateFactory({'reducer': 'events', 'ownerId': eventId});
				const resource = tmpState.events[eventId];
				const readData = event.content[eventId]['m.read'];
				if (!readData)
					return;

				const userIds = Object.keys(readData);
				if (!resource.readedBy)
					resource.readedBy = [];

				resource.readedBy = _.union(resource.readedBy, userIds);
				newState.events[eventId] = resource;
			});

			return newState;
		}
	}

	state._testing.runCrud = runCrud;
	state._testing.runCalculation = runCalculation;
	state._testing.runActions = runActions;
	state._testing.runEventsActions = runEventsActions ;
	return state;
};



export default MatrixReducer;