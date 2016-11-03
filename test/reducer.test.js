/* jshint -W024 */
/* jshint expr:true */

"use strict";

import _ from 'lodash';
import jsonschema from 'jsonschema';
import {createStore, applyMiddleware, compose} from "redux";
import thunk from "redux-thunk";

import {
	createStoreHelper, expect, clearMatrixClient,
	logTestUser, userFixture, randomElement, validSchema
} from "./helper";
import { CONSTANTS } from '../src/utils/constants';
import MatrixClient from "../src/utils/client";
import EVENTS from "../src/utils/matrix_events";
import * as MatrixJsonParser from "../src/utils/matrix_json_parser";
import ReducerHelper from "../src/reducers/reducer_helper";
import MatrixReducer from "../src/reducers";

const jsonFixture = require('./model_schemas/initialSync.original.json');
const machosRoomId = "!YbkEIQjnehrBrvscpm:zboxapp.dev";


let apiFixture;
let testEvent;
let recursiveCount = 0;
const testUserId = userFixture.testUserId;
const homeServer = userFixture.homeServerName;
let randomEvent;
let randomRoom;
let randomUser;
let randomEventId;
let randomRoomId;
let randomUserId;
let store;
let state;
let testState;

const initialState = {
    "sync": {},
    "rooms": { 'byIds': {} },
    "users": {'byIds': {}},
    "events": {'byIds': {}},
    "_testing": {}
};

const rgxp = {
	"eventId": /^\$[0-9]{10,}\w{5}/,
    "roomId": /^![-_0-9a-zA-Z]*:[-_0-9a-zA-Z]*/,
    "userId": /^@[-_0-9a-zA-Z]*:[-_0-9a-zA-Z]*/,
    "roomTypes": /(join|leave|invite|ban)/,
    "ownerIdByReducer": {
    	"rooms": /^![-_0-9a-zA-Z]*:[-_0-9a-zA-Z]*/,
    	"users": /^@[-_0-9a-zA-Z]*:[-_0-9a-zA-Z]*/,
    	"events": /^\$[0-9]{10,}\w{5}/,
    }
};

const jsonStore = MatrixJsonParser.processMatrixJson(jsonFixture, testUserId, homeServer);

const getActions = (event, crudOnly = false) => {
	let crudActions = [];
	if (!EVENTS[event.type]) return crudActions;
	const actions = EVENTS[event.type].reducers[event.reducer].actions;
	if (!crudOnly) return actions;
	
	crudActions = actions.filter((action) => { 
		return action.split('.')[0] !== 'calculate'
	});

	return crudActions;
}

const getNewValue = (event, providerName, attrName) => {
	// Provider is from where we get the value we want to store
	const provider = (providerName === 'attr') ? event : event.content;

	const attrKey = EVENTS[event.type].actionsValues[providerName][attrName];
	const newValue = provider[attrKey];
	return newValue;
};

const runActionTests = (reducer, testAction, id) => {
	for (var i = 0; i <= 50; i++) {
		const randomId = id || _.sample(Object.keys(jsonStore[reducer].byIds));
		const randomResource = jsonStore[reducer].byIds[randomId];
		let events;
		if (reducer === 'events')
			events = jsonStore.events.byIds;
		else
			events = randomResource.events; 
		
		Object.keys(events).forEach((id) => {
			const event = events[id];
			const actions = getActions(event);
			if (!actions || actions.length < 1) {
				return;
			}
				
			actions.forEach((action) => { testAction(action, event) });
		})
	}
}

describe("Reducer Tests", function() {

	beforeEach(() => {
		randomRoomId = _.sample(Object.keys(jsonStore.rooms.byIds));
		randomEventId = _.sample(Object.keys(jsonStore.events.byIds));
		randomUserId = _.sample(Object.keys(jsonStore.users.byIds));
		randomRoom = jsonStore.rooms.byIds[randomRoomId];
		randomEvent = jsonStore.events.byIds[randomEventId];
		randomUser = jsonStore.users.byIds[randomUserId];
		store = createStore(MatrixReducer);
		state = store.getState();
	});

	it('1. Should return blank initial state', function() {
		expect(validSchema(state, "store")).to.be.true;
	});

	it('2. runCrud add should add the value to the array', function() {
		const testAction = (action, event) => {
			const [op, providerName, attrName] = [...(action.split('.'))];
			if (op !== 'add') return;
			
			const newValue = ReducerHelper.getNewValue(event, providerName, attrName);
			const newState = state._testing.runCrud(op, providerName, attrName, event);

			const attr = newState[event.reducer].byIds[event.ownerId][attrName];
			expect(Array.isArray(attr), 'not an array').to.be.true;
			expect(attr[attr.length - 1], attrName + ' undefined for even_type: ' + event.type).to.not.be.undefined;
			expect((attr.indexOf(newValue) > -1), 'value not added value').to.be.true;
		};
		
		runActionTests('rooms', testAction);
		runActionTests('users', testAction);
	});

	it('3. runCrud update should update the value', function() {
		const testAction = (action, event) => {
			const [op, providerName, attrName] = [...(action.split('.'))];
			if (op !== 'update') return;
			
			const newValue = getNewValue(event, providerName, attrName);
			const newState = state._testing.runCrud(op, providerName, attrName, event);
			
			const attr = newState[event.reducer].byIds[event.ownerId][attrName];
			if (!newValue || newValue === null) {
				if(attr)
					expect(attr, attrName + ' undefined' + event.type).to.not.be.undefined;
			} else {
				expect(attr, attrName + ' undefined for even_type: ' + event.type).to.not.be.undefined;
				expect(attr, 'value not added value').equal(newValue);
			}
		};

		runActionTests('rooms', testAction);
		runActionTests('users', testAction);
	});

	it('4. runCalculate updateMembers should update room members info', function() {
		const testAction = (action, event) => {
			const [op, calculationName] = [...(action.split('.'))];
			if (calculationName !== 'updateMembers') return;

			const membership = event.membership || event.content.membership;
			const newState = state._testing.runCalculation(calculationName, event);
			const resource = newState[event.reducer].byIds[event.ownerId];

			expect(Array.isArray(resource.membersIds)).to.be.true;
			expect(Array.isArray(resource[membership + 'MembersIds'])).to.be.true;

			const randomId = _.sample(resource[membership + 'MembersIds']);
			expect(randomId).to.match(rgxp.userId);
			let included;

			if (/(leave|ban)/.test(membership))
				included = (resource.membersIds.indexOf(event.state_key) < 0);
			else if (membership === 'invite') {
				included = (resource.inviteMembersIds.indexOf(event.state_key) > -1);
			}
			else {
				included = (resource.membersIds.indexOf(event.state_key) > -1);
			}
			expect(included).to.be.true;
		};

		runActionTests('rooms', testAction);
	});

	it('5. runCalculate eventRead should update the event in question', function() {
		const testAction = (action, event) => {
			const [op, calculationName] = [...(action.split('.'))];
			if (calculationName !== 'eventRead') return;

			const newState = state._testing.runCalculation(calculationName, event);
			expect(newState.events).to.not.be.undefined;
			
			const randomEvent = newState.events.byIds[_.sample(Object.keys(newState.events.byIds))];
			expect(_.sample(randomEvent.readedBy), 'no userId').to.match(rgxp.userId);
		};

		runActionTests('rooms', testAction);
	});

	it('6. runCalculate should skip if function not implemented', function() {
		const testAction = (action, event) => {
			const [op, attrName] = [...(action.split('.'))];

			const newState = state._testing.runCalculation(action, event);
			expect(typeof newState).to.equal('object');
		};

		runActionTests('rooms', testAction);
	});

	/**
	 * This test and calculations are missing
	 * "calculate.new" <- parece que no es necesario
	 * "calculate.powerLevels"
	 * "calculate.tags"
	 * "calculate.updateByType"
	 * "calculate.updateEventsByType"
	 * "calculate.updateMemberships"
	 * "calculate.updateMessagesByType"
	 * "calculate.updateRedactedEvent"
	 */
	
	/**
	 * This events are mising
	 
	m.room.bot.options is not defined int matrix_events.json
	m.room.config
	m.call.invite
	m.call.candidates 
	m.call.answer 
	m.call.hangup 
	 */
	
	it('7. runActions calls runCalculate or runCrud', function() {
		const testAction = (action, event) => {
			const [op, attrName] = [...(action.split('.'))];
			const newState = state._testing.runActions(event);
			testState = newState;
		};

		runActionTests('rooms', testAction);
		runActionTests('users', testAction);

		delete testState.users.byIds[undefined];
		delete testState.rooms.byIds[undefined];
		const randomUser = testState.users.byIds['@pbruna:zboxapp.dev'];
		const randomRoom = testState.rooms.byIds[machosRoomId];

		expect(randomRoom).to.not.be.undefined;
		expect(randomUser).to.not.be.undefined;
	});

	it('8. runEventsActions calls runActions for every Event', function() {
		testState = {"users": {}, "rooms": {}, "events": {}};

		const testAction = (events) => {
			const newState = state._testing.runEventsActions(events);
			testState = _.merge({}, testState, newState);
			delete testState.users[undefined];
		};

		for (var i = 0; i <= 50; i++) {
			const randomReducer = _.sample(['users', 'rooms']);
			const randomId =  _.sample(Object.keys(jsonStore[randomReducer].byIds));
			const randomResource = jsonStore[randomReducer].byIds[randomId];
			const events = randomResource.events;
			return testAction(events);
		};
	});
});

describe("Schemas Tests", function(){

	beforeEach(() => {
		store = createStore(MatrixReducer);
		state = store.getState();
		testState = {"users": {}, "rooms": {}, "events": {}, "sync": {}};
	});

	it('1. should pass Room Schema', function() {
		const randomReducer = 'rooms';
		const randomId = machosRoomId;
		const randomResource = jsonStore[randomReducer].byIds[randomId];
		const events = randomResource.events;
		const newState = state._testing.runEventsActions(events);
		testState = _.merge({}, testState, newState);
		
		const resource = testState[randomReducer].byIds[randomId];
		expect(resource).to.not.be.undefined;

		const isValidSchema = validSchema(resource, 'room');
		expect(isValidSchema, 'room').to.be.true;
	});

	it('2. should pass User Schema', function() {
		const randomReducer = 'users';
		const randomId = "@pbruna:zboxapp.dev";
		const randomResource = jsonStore[randomReducer].byIds[randomId];
		const events = randomResource.events;
		const newState = state._testing.runEventsActions(events);
		testState = _.merge({}, testState, newState);
		
		const resource = testState[randomReducer].byIds[randomId];
		expect(resource).to.not.be.undefined;
		
		const isValidSchema = validSchema(resource, 'user');
		expect(isValidSchema, 'user').to.be.true;
	});

	it('3. should pass Event Schema', function() {
		testState = state._testing.eventsToState(jsonStore);
		const randomId = _.sample(Object.keys(testState.events.byIds));
		
		const resource = testState.events.byIds[randomId];
		expect(resource).to.not.be.undefined;
		
		const isValidSchema = validSchema(resource, 'event');
		expect(isValidSchema, 'event').to.be.true;
	});

	it('4. should pass Sync Schema', function() {
		testState = state._testing.eventsToState(jsonStore);
		const randomId = _.sample(Object.keys(testState.events.byIds));
		const resource = testState.sync;
		expect(resource).to.not.be.undefined;
		
		const isValidSchema = validSchema(resource, 'sync');
		expect(isValidSchema, 'sync').to.be.true;
	});

});

// 1. Paso JSON como Payload al reducer. El type es SYNC
// 2. El reducer toma el JSON y hace un newState = eventsToState(json, state)
// 2. eventsToState llama proccessByReducer(reducerName, JSON, state), en el siguiente orden:
//  1. rooms
//  2. users
//  3. events
// 
// 3. processByReducer llama processByResource por cada resource del reducer
// 4. processByResource llama a groupByType con los eventos del resource
// 5. processByResource llama processEventsByType(typeName, groupByType[typeName], JSON, state) en el siguiente orden:
// 	1. state
// 	2. timeline
// 	3. ephemeral
// 	
// 4. processEventsByType:
//  1. copia el arreglo de IDS a nuevo objeto
//  2. Si el typo es "state" llama a runStateEventsActions con IDS
//  3. De lo contrario llama a runEventsActions con IDS
// 
// 5. runStateEventsActions recorre el array, toma todos los eventos del mismo tipo y los 
// guarda ordenado por fecha en nuevo arreglo. Con este arreglo llama a executeEventsActions.
// ----
// 
// 6. runEventsActions procesa todos los IDS llamando a runActions con el event, type, JSON, etc.

