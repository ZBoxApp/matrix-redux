/*
 * Copyright 2015-present, ZBox Spa.
 * All rights reserved.
 */
"use strict";

import _ from 'lodash';
import EVENTS from '../utils/matrix_events';
import ReducerHelper from './reducer_helper';

const initialState = {
    "sync": { },
    "rooms": { 'byIds': {} },
    "users": {'byIds': {}},
    "events": {'byIds': {}},
    "_testing": {}
};

const MatrixReducer = (state = initialState, action = {}) => {

	let newState = {...state};
	
	const eventsToState = (events) => {
		newState.events.byIds = _.merge({}, newState.events.byIds, events.events.byIds);
		processByReducer('rooms', events);
		processByReducer('users', events);
		
		Object.keys(newState).forEach((reducerName) => {
			if (newState[reducerName].byIds && newState[reducerName].byIds.byIds)
				delete newState[reducerName].byIds.byIds;
		});

		newState.sync.syncToken = events.nextBatch;
		newState.sync.initialSyncComplete = true;
		newState.sync.isRunning = true;
		newState.sync.error = false;

		newState.users.currentUserId = events.currentUserId;

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

		updateReducer(reducerName);

		return newState;
	};

	const updateReducer = (reducerName) => {
		const reducerUpdate = {
			'rooms': () => {
				const roomsIds = Object.keys(newState.rooms.byIds);
				roomsIds.forEach((id) => {
					if (!id) return;
					const room = newState.rooms.byIds[id];
					let resource = newState.rooms[room.membership];
					resource = ReducerHelper.superPush(resource, id, 'uniq');
					
					newState.rooms[room.membership] = resource;
				});

				// TODO: Fix this fucker and make test
				['undefined', 'join', 'ban', 'invite', 'leave'].forEach((key) => {
					if (newState.rooms.byIds[key])
						delete newState.rooms.byIds[key];
				});

				if (newState.rooms[undefined])
					delete(newState.rooms[undefined]);
			},
		};

		if (typeof reducerUpdate[reducerName] === 'function')
			return reducerUpdate[reducerName]();

		return;
	};

	const processEventsByType = (idsArray, resource, eventType) => {
		const events = ReducerHelper.getEventsFromIds(idsArray, resource.events);
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
	};

	const runAction = (actionName, event) => {
		const [op, providerName, attrName] = [...(actionName.split('.'))];
		if (op === 'calculate')
			return runCalculation(providerName, event);

		else {
			return runCrud(op, providerName, attrName, event);
		}
	};

	const runCalculation = (calculationName, event) => {
		if (typeof calculations[calculationName] !== 'function')
			return newState;
		
		return calculations[calculationName](event);
	};

	const runCrud = (op, providerName, attrName, event) => {
		if (typeof operations[op] !== 'function')
			return;

		const resource = ReducerHelper.getResource(event.reducer, event.ownerId, newState);
		const newValue = ReducerHelper.getNewValue(event, providerName, attrName);

		if (!newValue || newValue === null)
				return newState;
			
		return operations[op](event, newValue, attrName, resource);
	};

	const operations = {
		"add": (event, newValue, attrName, resource) => {
			resource[attrName] = ReducerHelper.superPush(resource[attrName], newValue, 'uniq');
			ReducerHelper.setResource(event.reducer, event.ownerId, resource, newState);
			
			return newState;
		},
		"update": (event, newValue, attrName, resource) => {
			resource[attrName] = newValue;
			ReducerHelper.setResource(event.reducer, event.ownerId, resource, newState);
			
			return newState;
		},
	};

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
		},
		"synced": (event) => {
			const resource = ReducerHelper.getResource("events", event.id, newState);
			resource.synced = (!event.local) ? true : false;

			if(event.content && event.content.transaction_id) {
				const transaction_id = event.content.transaction_id;
				resource.synced = (transaction_id === resource.txnId);
			}

			ReducerHelper.setResource('events', event.id, resource, newState);
			return newState;
		}
	};

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