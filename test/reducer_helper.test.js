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
import EVENTS from "../src/utils/matrix_events";
import * as MatrixJsonParser from "../src/utils/matrix_json_parser";
import ReducerHelper from "../src/reducers/reducer_helper";

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

const jsonStore = MatrixJsonParser.processMatrixJson(jsonFixture, testUserId, homeServer);


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

describe("Reducer Helper Functions", () => {

	beforeEach(() => {
		randomRoomId = _.sample(Object.keys(jsonStore.rooms.byIds));
		randomEventId = _.sample(Object.keys(jsonStore.events.byIds));
		randomUserId = _.sample(Object.keys(jsonStore.users.byIds));
		randomRoom = jsonStore.rooms.byIds[randomRoomId];
		randomEvent = jsonStore.events.byIds[randomEventId];
		randomUser = jsonStore.users.byIds[randomUserId];
	});

	it('1. groupByType should return an Object with types as keys', function() {
		[randomRoom, randomUser].forEach((resource) => {
			const groupByType = ReducerHelper.groupByType(resource.events);
			expect(Array.isArray(groupByType.state), 'state not an array').to.be.true;
			expect(Array.isArray(groupByType.ephemeral), 'ephemera not an array').to.be.true;
			expect(Object.keys(groupByType).length).to.be.above(2);
		});

		const groupByType = ReducerHelper.groupByType(jsonStore.events.byIds);
		expect(Array.isArray(groupByType.state), 'state not an array').to.be.true;
		expect(Array.isArray(groupByType.ephemeral), 'ephemeral not an array').to.be.true;
		expect(Object.keys(groupByType).length).to.be.above(2);
	});

	it('2. sortByAge should return an sorted array of Ids', function() {
		const groupByType = ReducerHelper.groupByType(randomRoom.events);
		for (var i = 0; i <= 50; i++) {
			const type = "state";		
			const sortedIds = ReducerHelper.sortByAge(groupByType[type], randomRoom.events);
			const lastEvent = randomRoom.events[sortedIds[sortedIds.length - 1]];
			const firstEvent = randomRoom.events[sortedIds[0]];
			expect(lastEvent.age).to.be.at.least(firstEvent.age);
		}
	});

	it('3. groupByType should return sorted Arrays if it must', function() {
		const groupByType = ReducerHelper.groupByType(jsonStore.events.byIds);
		const m_room_message = groupByType["m.room.message"];
		const lastEvent = jsonStore.events.byIds[m_room_message[m_room_message.length - 1]];
		const firstEvent = jsonStore.events.byIds[m_room_message[0]];
		expect(lastEvent.age).to.be.at.least(firstEvent.age);
	});

	it('4. groupByType should sorted timeline Arrays for room events', function() {
		const groupByType = ReducerHelper.groupByType(randomRoom.events);
		const timelineEvents = groupByType.timeline;
		const lastEvent = randomRoom.events[timelineEvents[timelineEvents.length - 1]];
		const firstEvent = randomRoom.events[timelineEvents[0]];
		
		expect(lastEvent.age).to.be.at.least(firstEvent.age);
	});	

	it('4. groupByType should sorted state Arrays for room events', function() {
		const groupByType = ReducerHelper.groupByType(randomRoom.events);
		const timelineEvents = groupByType.state;
		const lastEvent = randomRoom.events[timelineEvents[timelineEvents.length - 1]];
		const firstEvent = randomRoom.events[timelineEvents[0]];
		expect(lastEvent.age).to.be.at.least(firstEvent.age);
	});	

});

