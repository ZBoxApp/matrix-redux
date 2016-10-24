/* jshint -W024 */
/* jshint expr:true */

"use strict";

import _ from 'lodash';
import {
	createStoreHelper, expect, clearMatrixClient,
	logTestUser, userFixture, randomElement, validateSchema
} from "./helper";
import { CONSTANTS } from '../src/utils/constants';
import MatrixClient from "../src/utils/client";
import * as API from "../src/middleware/api";

import * as MatrixJsonParser from "../src/utils/matrixJsonParser";
const jsonFixture = require('./model_schemas/initialSync.original.json');
const emptyFixture = require('./model_schemas/emptys.json');

const machosRoomId = "!YbkEIQjnehrBrvscpm:zboxapp.dev";

let apiFixture;
let testEvent;
let processedJson;
let recursiveCount = 0;
const testUserId = userFixture.testUserId;

describe('Util functions', function() {

	beforeEach(function() {
		processedJson = MatrixJsonParser.processJson(jsonFixture, testUserId);
	});

	it('1. groupEventsByReducer Should take the events and return and Hash', function() {
		const events = API.groupEventsByReducer(processedJson.events);
		const reducers = ["users", "rooms"];
		const owners = ["users", "rooms", "events"];
		reducers.forEach((reducer) => {
			const ownerType = reducer;
			expect(owners, "1").to.include(ownerType);
			expect(typeof events[ownerType], "2").to.equal('object');

			const randomOwnerId = _.sample(Object.keys(events[ownerType]));
			const randomOwner = events[ownerType][randomOwnerId];
			expect(Array.isArray(randomOwner.events), "3").to.be.true;
			expect(randomOwner.eventsByType, "4").to.not.be.undefined;

			const eventTypes = Object.keys(randomOwner.eventsByType);
			eventTypes.forEach((type) => {
				expect(Array.isArray(randomOwner.eventsByType[type]), "7").to.be.true;
			})
		});
	});

	it("2. groupEventsByReducer should add member events to user", function() {
		const events = API.groupEventsByReducer(processedJson.events);
		const userEvents = events.users;
		const randomUserId = _.sample(Object.keys(userEvents));
		const randomUser = userEvents[randomUserId];
		expect(randomUser.eventsByType['m.room.member']).to.not.be.undefined;
		const memberEvent = randomUser.eventsByType['m.room.member'][0];
		expect(randomUser.events.indexOf(memberEvent)).to.be.above(-1);
	});

	// it("3. groupEventsByReducer should add member events to user", function() {
	// 	const events = API.groupEventsByReducer(processedJson.events);
	// 	const userEvents = events.users;
	// 	const randomUserId = _.sample(Object.keys(userEvents));
	// 	const randomUser = userEvents[randomUserId];
	// 	expect(randomUser.eventsByType['m.room.member']).to.not.be.undefined;
	// 	const memberEvent = randomUser.eventsByType['m.room.member'][0];
	// 	expect(randomUser.events.indexOf(memberEvent)).to.be.above(-1);
	// });
});

let randomRoomEvents;
let randomRoomId;
let processedEvents;
let roomsEvents;
let machosRoomEvents;

describe('Rooms Functions', function() {
	beforeEach(function() {
		processedJson = MatrixJsonParser.processJson(jsonFixture, testUserId);
		processedEvents = API.groupEventsByReducer(processedJson.events);
		roomsEvents = processedEvents.rooms;
		randomRoomId = _.sample(Object.keys(roomsEvents));
		randomRoomEvents = roomsEvents[randomRoomId];
		machosRoomEvents = roomsEvents[machosRoomId];
	});

	it('1. processRoomState should have the expected attributes', function() {
		const stateEvents = randomRoomEvents.eventsByType.state;
		const room = API.processRoomState(randomRoomId, stateEvents, processedEvents.events);
		expect(room.id).to.not.be.undefined;
		expect(room.membershipState).to.match(/(join|leave|invite)/);
	});


	it('2. processRoomState should have info attributes added', function() {
		const stateEvents = machosRoomEvents.eventsByType.state;
		const room = API.processRoomState(randomRoomId, stateEvents, processedEvents.events);
		expect(room.name, "name").to.equal('Machos');
		expect(room.topic, "topic").to.equal('Temas para solo Hombres');
		expect(room.avatarUrl, "avatarUrl").to.equal('mxc://zboxapp.com/INgKbqNGUGDxhJwIYxXUfnhZ');
		expect(room.unreadNotifications.highlightCount, "highlightCount").to.be.above(-1);
		expect(room.unreadNotifications.notificationCount, "notificationCount").to.be.above(-1);
	});

	it('3. Room.members should be an Object with membershipState as keys', function() {
		const stateEvents = machosRoomEvents.eventsByType.state;
		const room = API.processRoomState(randomRoomId, stateEvents, processedEvents.events);
		expect(Array.isArray(room.members.joined)).to.be.true;
		expect(Array.isArray(room.members.leaved)).to.be.true;
		expect(Array.isArray(room.members.banned)).to.be.true;
		expect(Array.isArray(room.members.invited)).to.be.true;
	});

	it('4. Room.members join be an array with user ids', function() {
		const stateEvents = machosRoomEvents.eventsByType.state;
		const room = API.processRoomState(randomRoomId, stateEvents, processedEvents.events);
		const randomMember = randomElement(room.members.joined);
		expect(randomMember).to.match(/^@[a-zA-Z].*:zboxapp.dev$/);
	});

	it('5. processRoomTimeLine should return an timeline object', function() {
		const timelineEvents = machosRoomEvents.eventsByType.timeline;
		const timeline = API.processRoomTimeLine(timelineEvents, processedEvents.events);
		expect(Array.isArray(timeline.events)).to.be.true;
		expect(timeline.eventsByType).to.not.be.undefined;
		const randomType = _.sample(Object.keys(timeline.eventsByType));
		let randomEvent = randomElement(timeline.eventsByType[randomType]);
		if (!processedEvents.events[randomEvent].ownerId) {
			console.error(room);
		}

		expect(processedEvents.events[randomEvent].ownerId).to.equal(machosRoomId);
		expect(processedEvents.events[randomEvent].roomType).to.match(/join|invite|ban|leave/);
	});

	it('6. Room.timeline.events should sorted by age', function() {
		const timelineEvents = machosRoomEvents.eventsByType.timeline;
		const timeline = API.processRoomTimeLine(timelineEvents, processedEvents.events);
		const events = [];
		timeline.events.forEach((eventId) => {
			events.push(processedEvents.events[eventId]);
		})
		expect(events[0].age).to.be.above(events[4].age);
	});
});

let usersEvents;
let randomUserId;
let randomUserEvents;
let selectedUserId;
let selectedUserEvents;
describe('Users Tests', function() {
	beforeEach(function() {
		processedJson = MatrixJsonParser.processJson(jsonFixture, testUserId);
		processedEvents = API.groupEventsByReducer(processedJson.events);
		usersEvents = processedEvents.users;
		randomUserId = _.sample(Object.keys(usersEvents));
		randomUserEvents = usersEvents[randomUserId];
		selectedUserId = '@pbruna:zboxapp.dev';
		selectedUserEvents = usersEvents[selectedUserId];
	});

	it('1. getUserEvents should return all the events we need', function() {
		const user = API.processUserState(selectedUserId, selectedUserEvents, processedEvents.events);
		expect(user.id).to.match(/^@[a-zA-Z].*:.*/);
		expect(user.avatarUrl).to.match(/^mxc:\/\/.*|null/);
		expect(user.name).to.match(/\w+|null/);
		expect(user.displayName).to.match(/\w+|null/);
	});

	it('2. User should have presence information', function() {

		const randomUser = API.processUserState(selectedUserId, selectedUserEvents, processedEvents.events);
		expect(randomUser.presence).to.match(/(online|offline|unavailable)/);
		expect(randomUser.lastActiveAgo).to.be.above(1);
		expect(randomUser.currentlyActive).to.be.true;
	});	
});

let emptyJson;
describe('Events to State', function() {
	beforeEach(function() {
		processedJson = MatrixJsonParser.processJson(jsonFixture, testUserId);
		emptyJson = MatrixJsonParser.processJson(_.sample(emptyFixture), testUserId);
	});

	it('1. eventsToState should return a object with the reducers as keys', function() {
		const newState = API.eventsToState(emptyJson);
		['users', 'rooms', 'events', 'sync'].forEach((reducer) => {
			expect(newState[reducer]).to.not.be.undefined;
		});
	});

	it('2. sync should have the new syncToken', function(){
		const newState = API.eventsToState(emptyJson);
		expect(newState.sync.syncToken).match(/[a-zA-Z]{1}[0-9].*/);
	});
})