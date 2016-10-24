/* jshint -W024 */
/* jshint expr:true */

"use strict";

import _ from 'lodash';
import jsonschema from 'jsonschema';
import {
	createStoreHelper, expect, clearMatrixClient,
	logTestUser, userFixture, randomElement, validateSchema
} from "./helper";
import { CONSTANTS } from '../src/utils/constants';
import MatrixClient from "../src/utils/client";

import * as MatrixJsonParser from "../src/utils/matrixJsonParser";
const jsonFixture = require('./model_schemas/initialSync.original.json');

const machosRoomId = "!YbkEIQjnehrBrvscpm:zboxapp.dev";

let apiFixture;
let testEvent;
let recursiveCount = 0;
const testUserId = userFixture.testUserId;

const randomEvent = () => {
	const eventRootType = _.sample(CONSTANTS.rootEventTypes);
	const event = randomEventByType(eventRootType);
	if (typeof event !== 'undefined') return event;
	randomEvent();
};

const randomEventByType = (eventRootType, roomEventType, roomType, roomId, matrixCode) => {
	recursiveCount++;
	let event;
	if (eventRootType === "rooms") {
		roomType = roomType || _.sample(["join", "invite"]);
		roomEventType = roomEventType || _.sample(CONSTANTS.roomEventTypesByRoomType[roomType]);
		roomId = _.sample(Object.keys(jsonFixture.rooms[roomType])) || roomId;
		try {
			event = randomElement(jsonFixture.rooms[roomType][roomId][roomEventType].events);
		} catch (e) {
			console.error(e);
			event = false;
		}
	} else {
		try {
			event = randomElement(jsonFixture[eventRootType].events);
		} catch (e) {
			event = false;
		}
	}
	if (event) {
		if (typeof matrixCode === 'undefined') return event;
		if (event.type === matrixCode) return event;
	} 
	randomEventByType(eventRootType, roomEventType, roomType, roomId);
};

const ownerTypeRgxp = {
	"account_data": /^@[-_0-9a-zA-Z]*:[-_0-9a-zA-Z]*/,
    "presence": /^@[-_0-9a-zA-Z]*:[-_0-9a-zA-Z]*/,
    "timeline": /^![-_0-9a-zA-Z]*:[-_0-9a-zA-Z]*/,
    "room": /^![-_0-9a-zA-Z]*:[-_0-9a-zA-Z]*/,
    "state": /^![-_0-9a-zA-Z]*:[-_0-9a-zA-Z]*/,
    "invite_state": /^![-_0-9a-zA-Z]*:[-_0-9a-zA-Z]*/,
    "ephemeral": /^![-_0-9a-zA-Z]*:[-_0-9a-zA-Z]*/
};

describe('Master functions', function() {

	beforeEach(() => {
		// recursiveCount = 0;
		// testEvent = randomEvent();
	});

	it('1. Should take an event an return a processed one', function() {
		for (var i = 0; i <= 200; i++) {
			["rooms", "account_data", "presence"].forEach((rootEventType) => {
				testEvent = randomEventByType(rootEventType);
				if(!testEvent) return;
				const resultEvent = MatrixJsonParser.processEvent(testEvent, rootEventType);
				expect(Object.keys(CONSTANTS.rootEventTypes)).to.include(resultEvent.rootType);
				expect(Object.keys(CONSTANTS.eventCodes)).to.include(resultEvent.matrixCode);
				expect(resultEvent.age).to.be.above(-1);
				expect(resultEvent.id, "Event ID").to.not.be.undefined;
				if (resultEvent.event_id) {
					expect(resultEvent.id).to.equal(resultEvent.event_id);
				}
			});
		}
	});

	if('2. it should not create the resource if it already exists', function() {
		expect(false, "Create an existing user should do nothing").to.be.true;
	});

	it('2. processAccountDataEvent should have an ownerType and an ownerId', function() {
		testEvent = randomEventByType("account_data");
		const resultEvent = MatrixJsonParser.processAccountDataEvent(testEvent, testUserId);
		expect(resultEvent.ownerType).to.be.equal(CONSTANTS.eventOwnerTypes.account_data);
		expect(resultEvent.ownerId).to.be.equal(testUserId);
	});

	it('3. processPresenceEvent shoud have an ownerType and an ownerId', function() {
		testEvent = randomEventByType("presence");
		const resultEvent = MatrixJsonParser.processPresenceEvent(testEvent);
		expect(resultEvent.ownerType).to.be.equal(CONSTANTS.eventOwnerTypes.presence);
		expect(resultEvent.ownerId).to.be.equal(testEvent.sender);
	});

	it('4. processRoomEvent should have an ownerType and an ownerId', function() {
		CONSTANTS.roomEventTypes.forEach((eventType) => {
			if (eventType === 'invite_state') return;
			const roomId = _.sample(Object.keys(jsonFixture.rooms.join));
			testEvent = jsonFixture.rooms.join[roomId][eventType];
			let resultEvent = MatrixJsonParser.processRoomEvent(testEvent, eventType, roomId, testUserId, "join");
			expect(resultEvent.ownerType, eventType).to.be.equal("room");
			expect(resultEvent.ownerId, eventType).to.match(ownerTypeRgxp["room"]);
		});
	});

	it('5. processRoomEvent for invite room should have an ownerType and an ownerId', function() {
		const eventType = 'invite_state';
		const roomId = _.sample(Object.keys(jsonFixture.rooms.invite));
		testEvent = jsonFixture.rooms.invite[roomId][eventType];
		let resultEvent = MatrixJsonParser.processRoomEvent(testEvent, eventType, roomId, testUserId, "invite");
		expect(resultEvent.ownerType, eventType).to.be.equal(CONSTANTS.eventOwnerTypes[eventType]);
		expect(resultEvent.ownerId, eventType).to.match(ownerTypeRgxp[eventType]);
	});


	it('6. Room events should have the attributes', function() {
		let resultEvent;
		const roomType = _.sample(["join"])
		for (var i = 0; i <= 200; i++) {
			const roomId = _.sample(Object.keys(jsonFixture.rooms[roomType]));
			const room = jsonFixture.rooms[roomType][roomId];
			const eventType = (roomType === 'invite') ? 'invite_state' : _.sample(["ephemeral", "state", "timeline", "account_data"]);
			testEvent = randomEventByType("rooms", eventType, roomType, roomId);
			if(!testEvent) return;
			resultEvent = MatrixJsonParser.processRoomEvent(testEvent, eventType, roomId, roomType, testUserId);
			expect(resultEvent.roomType, "roomType").to.match(/(join|leave|invite|ban)/);
			expect(resultEvent.roomEventType, "roomEventType").to.match(/(timeline|state|account_data|ephemeral)/);
		}
	});

	it('7. processRoomEvents should skip if there is not events', function() {
		// this rooms does not have account_data events
		// roomJson, roomId, roomType, userId
		const roomId = "!WpOfSOyezKBxsrseMM:zboxapp.dev";
		const roomJson = jsonFixture.rooms.join[roomId];
		let resultEvents = MatrixJsonParser.processRoomEvents(roomJson, roomId, "join", testUserId);
		expect(resultEvents).to.not.be.undefined;
	});


	it('8. Message events should have the attributes', function() {
		for (var i = 0; i <= 200; i++) {
			const roomId = _.sample(Object.keys(jsonFixture.rooms["join"]));
			testEvent = randomEventByType("rooms", "timeline", "join", roomId, "m.room.message");
			if(!testEvent) return;
			const resultEvent = MatrixJsonParser.processRoomEvent(testEvent, "timeline", roomId, testUserId, "join");
			if(!resultEvent.msgType) console.error(roomId, testEvent);
			expect(Object.keys(CONSTANTS.messageTypes)).to.include(resultEvent.msgType);
			expect(resultEvent.userId).to.match(ownerTypeRgxp["account_data"]);
			expect(resultEvent.id).to.equal(resultEvent.event_id);
			expect(resultEvent.ownerId).to.equal(roomId);
		}
	});

	it('9. Correct process of redacted events', function() {
		const roomId = "!FLzLGzbgSygIxVWBEo:zboxapp.dev";
		const timelineEvents = jsonFixture.rooms.join[roomId].timeline.events;
		testEvent = timelineEvents.filter((event) => {return event.event_id === '$14757016681139OxWId:zboxapp.dev'})[0];
		const resultEvent = MatrixJsonParser.processRoomEvent(testEvent, "timeline", roomId, "join", testUserId);
		expect(Object.keys(CONSTANTS.messageTypes)).to.include(resultEvent.msgType);
		expect(resultEvent.userId).to.match(ownerTypeRgxp["account_data"]);
		expect(resultEvent.id).to.equal(resultEvent.event_id);
		expect(resultEvent.ownerId).to.equal(roomId);
	});	

	it('10. Correct process of ephemeral events', function() {
		const roomId = "!FLzLGzbgSygIxVWBEo:zboxapp.dev";
		const events = jsonFixture.rooms.join[roomId].ephemeral.events;
		events.forEach((testEvent) => {
			const resultEvent = MatrixJsonParser.processRoomEvent(testEvent, "ephemeral", roomId, "join", testUserId);
			
			expect(resultEvent.roomType, "roomType").to.match(/(join|leave|invite|ban)/);
			expect(resultEvent.roomEventType, "roomEventType").to.match(/(timeline|state|account_data|ephemeral)/);
			expect(resultEvent.rootType).to.equal("rooms");
			expect(resultEvent.id).to.match(/^\$.*/);
			expect(resultEvent.ownerId).to.equal(roomId);
		})
	});

	it('11. accountData Events should have a currentUserId attr', function() {
		expect(false).to.be.true;
	});

	it('14. should return a empty object if timeline has no events', function() {
		apiFixture = JSON.parse(JSON.stringify(jsonFixture));
		const roomId = "!ydOOsnIkcazJZFkhPh:zboxapp.dev";
		const timelineFixture = apiFixture.rooms.invite[roomId].timeline;
		const resultTimeline = MatrixJsonParser.fixTimelineJson(timelineFixture, roomId);
		expect(typeof resultTimeline).to.equal('object');
		expect(Object.keys(resultTimeline.events).length).to.be.below(1);
	});

});

describe('Schema Tests', function () {

	beforeEach(function() {
		apiFixture = JSON.parse(JSON.stringify(jsonFixture));
	});

	it('1. should return nextBatch with correct token', function() {
		const matrixJson = MatrixJsonParser.processJson(apiFixture, testUserId);
		expect(matrixJson.nextBatch).to.not.be.undefined;
		expect(matrixJson.nextBatch).to.match(/^s[0-9]+/);
	});
	
	it('2. processRoom should return an array of Events', function(){
		const roomId = _.sample(Object.keys(apiFixture.rooms.join));
		const room = apiFixture.rooms.join[roomId];
		let resultEvents = MatrixJsonParser.processRoom(room, roomId, 'join', testUserId);
		expect(Array.isArray(resultEvents)).to.be.true;
		expect(randomElement(resultEvents).ownerType).to.be.equal(CONSTANTS.eventOwnerTypes.rooms);
		expect(randomElement(resultEvents).ownerId).to.be.equal(roomId);
	});

	it('3. processRoom should return an empty array for empty Events', function(){
		const roomId = _.sample(Object.keys(apiFixture.rooms.join));
		const room = apiFixture.rooms.join[roomId];
		room.timeline.events = [];
		room.state.events = [];
		room.account_data.events = [];
		room.ephemeral.events = [];
		let resultEvents = MatrixJsonParser.processRoom(room, roomId, 'join', testUserId);
		expect(Array.isArray(resultEvents)).to.be.true;
		expect(resultEvents.length).to.be.below(2);		
	});

	it('4. processRoomsEvents should return and Array of Events from Room', function(){
		const rooms = apiFixture.rooms;
		const resultEvents = MatrixJsonParser.processRoomsEvents(rooms, testUserId);
		expect(Array.isArray(resultEvents)).to.be.true;
		for (var i = 0; i <= 200; i++) {
			const randomEvent = randomElement(resultEvents);
			expect(randomEvent.ownerType).to.be.equal(CONSTANTS.eventOwnerTypes.rooms);
			expect(randomEvent.ownerId).to.not.match(/^@/);
			expect(randomEvent.id).to.not.be.undefined;
		}
	});

	it('5. processRoomsEvents should return an empty Array of Events from Room', function(){
		let rooms = {};
		let resultEvents = MatrixJsonParser.processRoomsEvents(rooms, testUserId);
		expect(Array.isArray(resultEvents)).to.be.true;
		expect(resultEvents.length).to.be.below(1);
		resultEvents = MatrixJsonParser.processRoomsEvents(undefined, testUserId);
		expect(Array.isArray(resultEvents)).to.be.true;
		expect(resultEvents.length).to.be.below(1);
	});

	it('6. each event of processRoom should have and unreadNotification Event', function(){
		const roomId = _.sample(Object.keys(apiFixture.rooms.join));
		const room = apiFixture.rooms.join[roomId];
		let resultEvents = MatrixJsonParser.processRoom(room, roomId, 'join', testUserId);
		const filtered = resultEvents.filter((event) => { return (event.roomEventType === 'state' && event.content.unread_notification) });
		expect(filtered.length).to.be.above(0);
		const event = _.sample(filtered);
		expect(event.ownerType).to.be.equal('room');
		expect(event.rootType).to.equal('rooms');
		expect(event.roomType).to.equal('join');
		expect(event.id).to.match(/^\$[0-9]{10}[0-9a-zA-Z]{5}:.*/);
	});

	it('7. processAccountDataEvents should return an array of events', function() {
		const account_data = apiFixture.account_data;
		const resultEvents = MatrixJsonParser.processAccountDataEvents(account_data, testUserId);
		expect(Array.isArray(resultEvents)).to.be.true;
		const randomEvent = randomElement(resultEvents);
		expect(randomEvent.ownerType).to.be.equal(CONSTANTS.eventOwnerTypes.account_data);
		expect(randomEvent.id).to.not.be.undefined;
		expect(randomEvent.rootType).to.be.equal("account_data");
	});

	it('8. processAccountDataEvents with empty events should return an empty array of events', function() {
		let resultEvents = MatrixJsonParser.processAccountDataEvents([], testUserId);
		expect(Array.isArray(resultEvents)).to.be.true;
		expect(resultEvents.length).to.be.below(1);
		resultEvents = MatrixJsonParser.processAccountDataEvents(undefined, testUserId);
		expect(Array.isArray(resultEvents)).to.be.true;
		expect(resultEvents.length).to.be.below(1);
	});

	it('9. processPresenceEvents should return an array of events', function() {
		const presence = apiFixture.presence;
		const resultEvents = MatrixJsonParser.processPresenceEvents(presence, testUserId);
		expect(Array.isArray(resultEvents)).to.be.true;
		const randomEvent = randomElement(resultEvents);
		expect(randomEvent.ownerType).to.be.equal(CONSTANTS.eventOwnerTypes.presence);
		expect(randomEvent.id).to.not.be.undefined;
		expect(randomEvent.rootType).to.be.equal("presence");
	});

	it('10. processPresenceEvents with empty events should return an empty array of events', function() {
		let resultEvents = MatrixJsonParser.processPresenceEvents([], testUserId);
		expect(Array.isArray(resultEvents)).to.be.true;
		expect(resultEvents.length).to.be.below(1);
		resultEvents = MatrixJsonParser.processPresenceEvents(undefined, testUserId);
		expect(Array.isArray(resultEvents)).to.be.true;
		expect(resultEvents.length).to.be.below(1);
	});

	it('11. processToDeviceEvents with empty events should return an empty array of events', function() {
		let resultEvents = MatrixJsonParser.processToDeviceEvents([], testUserId);
		expect(Array.isArray(resultEvents)).to.be.true;
		expect(resultEvents.length).to.be.below(1);
		resultEvents = MatrixJsonParser.processToDeviceEvents(undefined, testUserId);
		expect(Array.isArray(resultEvents)).to.be.true;
		expect(resultEvents.length).to.be.below(1);
	});

	it('12. processJson should process the full Json Events and return a processed Object', function() {
		const processedJson = MatrixJsonParser.processJson(jsonFixture, testUserId);
		expect(typeof processedJson).to.equal('object');
		expect(processedJson.nextBatch).to.match(/^s[0-9]+/);
		expect(Array.isArray(processedJson.events)).to.be.true;
		const toDeviceEvents = processedJson.events.filter((event) => { return event.rootType === 'to_device' });
		expect(toDeviceEvents.length).to.be.below(1);
		for (var i = 0; i <= 200; i++) {
			const resultEvent = randomElement(processedJson.events);
			if(!resultEvent.rootType) console.error(resultEvent);
			expect(Object.keys(CONSTANTS.rootEventTypes)).to.include(resultEvent.rootType);
			if (!resultEvent.matrixCode) console.log(resultEvent)
			expect(Object.keys(CONSTANTS.eventCodes)).to.include(resultEvent.matrixCode);
			expect(resultEvent.age).to.be.above(-1);
			expect(resultEvent.id, "Event ID").to.not.be.undefined;
			expect(Object.keys(CONSTANTS.ownerTypes)).to.include(resultEvent.ownerType);
			expect(resultEvent.ownerId, "ownerId").to.not.be.undefined;
		}
	});
});



