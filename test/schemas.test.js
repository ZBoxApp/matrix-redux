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
			resultEvent = MatrixJsonParser.processRoomEvent(testEvent, eventType, roomId, testUserId, roomType);
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
		const resultEvent = MatrixJsonParser.processRoomEvent(testEvent, "timeline", roomId, testUserId, "join");
		expect(Object.keys(CONSTANTS.messageTypes)).to.include(resultEvent.msgType);
		expect(resultEvent.userId).to.match(ownerTypeRgxp["account_data"]);
		expect(resultEvent.id).to.equal(resultEvent.event_id);
		expect(resultEvent.ownerId).to.equal(roomId);
	});	

	// it('8. should parse Invite Rooms', function() {
	// 	expect(false).to.be.true;
	// });
	// 
	// it('9. should parse Leave Rooms', function() {
	// 	expect(false).to.be.true;
	// });
	// 
	// it('10. should parse ban Rooms', function() {
	// 	expect(false).to.be.true;
	// });
	// 


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
		const randomEvent = randomElement(resultEvents);
		expect(randomEvent.ownerType).to.be.equal(CONSTANTS.eventOwnerTypes.rooms);
		expect(randomEvent.id).to.not.be.undefined;
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



// 	it('2. should reformat rooms object with rooms ids as firsts keys', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		expect(typeof matrixJson.rooms).to.equal("object");
// 		expect(Array.isArray(matrixJson.rooms)).to.be.false;
// 		const ids = Object.keys(matrixJson.rooms);
// 		expect(_.sample(ids)).to.match(/^![a-zA-Z].*:zboxapp.dev$/);
// 	});


// 	it('3. should return events object with eventId as first key', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		expect(typeof matrixJson.events).to.equal("object");

// 		const ids = Object.keys(matrixJson.events);
// 		expect(_.sample(ids)).to.match(/^\$[0-9].*[a-zA-Z]{5}:.*/);
// 	});

// 	it('4. should return the accountData object', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		expect(typeof matrixJson.accountData).to.equal("object");
// 	});

// 	it('5. should return the toDevice object', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		expect(typeof matrixJson.toDevice).to.equal("object");
// 	});

// 	it('6. should return the presence object with events as an object with keys of userIds', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		expect(typeof matrixJson.presence.events).to.equal("object");
// 		const ids = Object.keys(matrixJson.presence.events);
// 		const randomId = randomElement(ids);
// 		expect(randomId).to.equal(matrixJson.presence.events[randomId].sender);
// 	});

// 	it('7. should return user object with users ids as firsts keys', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		expect(typeof matrixJson.users).to.equal("object");
// 		expect(Array.isArray(matrixJson.users)).to.be.false;
// 		const randomUserId = randomElement(Object.keys(matrixJson.users));
// 		const randomUser = matrixJson.users[randomUserId];
// 		expect(randomUser.id).to.match(/^@[_a-zA-Z].*:.*/);
// 	});

// });

// describe('Room Tests', function() {

// 	beforeEach(function() {
// 		apiFixture = JSON.parse(JSON.stringify(jsonFixture));
// 	});

// 	it('1. Room should have the expected attributes', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		const randomRoom = randomElement(matrixJson.rooms);
// 		expect(randomRoom.id).to.not.be.undefined;
// 		expect(randomRoom.membershipState).to.match(/(join|leave|invite)/);
// 	});

// 	it('2. Room should have info attributes added', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		const randomRoom = matrixJson.rooms[machosRoomId];
// 		expect(randomRoom.name).to.equal('Machos');
// 		expect(randomRoom.topic).to.equal('Temas para solo Hombres');
// 		expect(randomRoom.avatarUrl).to.equal('mxc://zboxapp.com/INgKbqNGUGDxhJwIYxXUfnhZ');
// 		expect(randomRoom.unreadNotifications.highlightCount).to.be.above(-1);
// 		expect(randomRoom.unreadNotifications.notificationCount).to.be.above(-1);
// 	});

// 	it('3. Room.members should be an Object with membershipState as keys', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		const randomRoom = matrixJson.rooms[machosRoomId];
// 		const randomMembership = randomElement(Object.keys(randomRoom.members));
// 		expect(randomMembership).to.match(/(join|leave|invite|ban)/);
// 	});

// 	it('4. Room.members join be an array with user ids', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		const randomRoom = matrixJson.rooms[machosRoomId];
// 		const randomMember = randomElement(randomRoom.members.join);
// 		expect(randomMember).to.match(/^@[a-zA-Z].*:zboxapp.dev$/);
// 	});

// 	it('5. Room.timeline.events should be an array with Events Ids', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		const randomRoom = randomElement(matrixJson.rooms);
// 		expect(Array.isArray(randomRoom.timeline.events)).to.be.true;
// 		const randomEvent = randomElement(randomRoom.timeline.events);
// 		if (!matrixJson.events[randomEvent].roomId) {
// 			console.error(randomRoom);
// 		}
// 		expect(matrixJson.events[randomEvent].roomId).to.equal(randomRoom.id);
// 	});

// 	it('6. Room.timeline.events should sorted by age', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		const randomRoom = randomElement(matrixJson.rooms);
// 		const events = randomRoom.timeline.events;
// 		if (randomRoom.membershipState !== 'invite')
// 			expect(matrixJson.events[events[0]].age).to.be.above(matrixJson.events[events[4]].age);
// 	});

// 	it('7. room should validate against the schema', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		const randomRoom = matrixJson.rooms[machosRoomId];
// 		const validationResult = validateSchema(randomRoom, "room");
// 		expect(validationResult.errors).to.be.empty;
// 	});

// });

// describe('Event Tests', function() {

// 	beforeEach(function() {
// 		apiFixture = JSON.parse(JSON.stringify(jsonFixture));
// 	});

// 	it('1. Event should have the expected attributes', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		const randomEvent = randomElement(matrixJson.events);
// 		expect(randomEvent.id).to.match(/^\$[0-9].*[a-zA-Z]{5}:.*/);
// 		expect(randomEvent.userId).to.match(/^@[_a-zA-Z].*:.*/);
// 	});

// 	it('2. event should validate against the schema', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		const randomEvent = randomElement(matrixJson.events);
// 		const validationResult = validateSchema(randomEvent, "event");
// 		expect(validationResult.errors).to.be.empty;
// 	});
// });

// describe('Users Tests', function() {

// 	beforeEach(function() {
// 		apiFixture = JSON.parse(JSON.stringify(jsonFixture));
// 	});

// 	it('1. User should have the expected attributes', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		const randomUser = matrixJson.users["@pbruna:zboxapp.dev"];
// 		expect(randomUser.id).to.match(/^@[a-zA-Z].*:.*/);
// 		expect(randomUser.avatarUrl).to.match(/^mxc:\/\/.*/);
// 		expect(randomUser.name).to.exists;
// 		expect(randomUser.displayName).to.exists;
// 	});

// 	it('2. User should have presence information', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		const randomUser = matrixJson.users["@pbruna:zboxapp.dev"];		
// 		expect(randomUser.presence).to.match(/(online|offline|unavailable)/);
// 		expect(randomUser.lastActiveAgo).to.be.above(1);
// 		expect(randomUser.currentlyActive).to.be.true;
// 	});

// 	it('3. User should validate against the schema', function() {
// 		const matrixJson = matrixJsonParser(apiFixture);
// 		const randomUser = randomElement(matrixJson.users);
// 		const validationResult = validateSchema(randomUser, "user");
// 		if (validationResult.errors.length > 0) {
// 			console.error(randomUser);
// 			console.error(validationResult.errors);
// 		}
// 		expect(validationResult.errors).to.be.empty;
// 	});


