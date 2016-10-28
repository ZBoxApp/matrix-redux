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
		return runEventsActions(events);
	};

	const runEventsActions = (events) => {
		const tmpStates = [];
		const eventsIds = Object.keys(events) || [];

		eventsIds.forEach((eventId) => {
			const event = events[eventId];
			const tmpState = runActions(events[eventId]);
			tmpStates.push(tmpState);
		});

		return ReducerHelper.mergeTmpState(newState, tmpStates);
	};

	const runActions = (event) => {
		const tmpStates = [];
		const actions = ReducerHelper.getActions(event) || [];
		
		// We run every action and save the temp state;
		actions.forEach((action) => {
			const tmpState = runAction(action, event);
			tmpStates.push(tmpState);
		});

		return ReducerHelper.mergeTmpState(newState, tmpStates);
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

	const operations = {
		"add": (event, attrName) => {
			// Pass "attr" as providerName because for add ops its always
			// an attribute
			const newValue = ReducerHelper.getNewValue(event, "attr", attrName);
			const resource = ReducerHelper.getResource(event.reducer, event.ownerId, newState);
			resource[attrName] = ReducerHelper.superPush(resource[attrName], newValue, 'uniq');

			ReducerHelper.setResource(event.reducer, event.ownerId, resource, newState);
			return newState;
		},
		"update": (event, providerName, attrName) => {
			const resource = ReducerHelper.getResource(event.reducer, event.ownerId, newState);
			const newValue = ReducerHelper.getNewValue(event, providerName, attrName);
			if (!newValue || newValue === null)
				return newState;

			resource[attrName] = newValue;

			ReducerHelper.setResource(event.reducer, event.ownerId, resource, newState);
			return newState;
		},
	}

	const calculations = {
		"updateMembers": (event) => {
			const resource = ReducerHelper.getResource(event.reducer, event.ownerId, newState);
			const memberId = event.state_key;

			if (!resource.membersIds)
				resource.membersIds = [];

			const membership = event.membership || event.content.membership;
			const attrKey = membership + 'MembersIds';

			resource[attrKey] = ReducerHelper.superPush(resource[attrKey], memberId, 'uniq');
			
			// We add the member to room and remove from in invited list
			if (membership === 'join') {
				resource.membersIds = ReducerHelper.superPush(resource.membersIds, memberId, 'uniq');
				
				if (resource.inviteMembersIds)
					resource.inviteMembersIds = ReducerHelper.removeFromArray(resource.inviteMembersIds, memberId);
			}

			// We remove the member from room if 
			// membership is ban or leave
			if (/(ban|leave)/.test(membership))
				resource.membersIds = ReducerHelper.removeFromArray(resource.membersIds, memberId);

			ReducerHelper.setResource(event.reducer, event.ownerId, resource, newState);
			return newState;
		},
		"eventRead": (event) => {
			const targetEventsIds = Object.keys(event.content);

			targetEventsIds.forEach((eventId) => {
				const resource = ReducerHelper.getResource('events', eventId, newState);
				const readData = event.content[eventId]['m.read'];
				if (!readData)
					return;

				const userIds = Object.keys(readData);
				if (!resource.readedBy)
					resource.readedBy = [];

				resource.readedBy = _.union(resource.readedBy, userIds);
				resource.readedBy = Array.from(new Set(resource.readedBy));

				ReducerHelper.setResource('events', eventId, resource, newState);
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