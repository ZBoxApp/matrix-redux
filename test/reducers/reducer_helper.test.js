/* jshint -W024 */
/* jshint expr:true */

"use strict";

import _ from 'lodash';
import jsonschema from 'jsonschema';

import {
	createStoreHelper, expect, clearMatrixClient,
	logTestUser, userFixture, randomElement, validateSchema
} from "../helper";
import { CONSTANTS } from '../../src/utils/constants';
import MatrixClient from "../../src/utils/client";
import EVENTS from "../../src/utils/matrix_events";
import * as MatrixJsonParser from "../../src/utils/matrix_json_parser";
import ReducerHelper from "../../src/reducer/reducer_helper";

const jsonFixture = require('../model_schemas/initialSync.original.json');
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

// const randomEvent = () => {
// 	const eventRootType = _.sample(CONSTANTS.rootEventTypes);
// 	const event = randomEventByType(eventRootType);
// 	if (typeof event !== 'undefined') return event;
// 	randomEvent();
// };

// const randomEventByType = (eventRootType, roomEventType, roomType, roomId, matrixCode) => {
// 	let event;
// 	if (eventRootType === "rooms") {
// 		const ramdonEvent = randomRoomEvent(roomType, roomId);
// 		if (randomEvent) event = randomEvent.event;
// 	} else {
// 		const reducer = jsonFixture[eventRootType];
// 		event = _.sample(reducer.events);
// 	}
// 	return event;
// };

// const randomRoomEvent = (roomType, roomId) => {
// 	let event;
// 	const rooms = jsonFixture.rooms;
// 	roomType = roomType || _.sample(Object.keys(rooms));
// 	roomId = roomId || _.sample(Object.keys(rooms[roomType]));
// 	const room = rooms[roomType][roomId];
// 	if (!room) return event;
// 	if (roomType === "invite")
// 		event = _.sample(room.invite_state.events);
// 	else {
// 		const roomEventType = _.sample(Object.keys(room));
// 		event = _.sample(room[roomEventType].events);
// 	}
// 	return {
// 		event: event,
// 		roomType: roomType,
// 		roomId: roomId
// 	}
// }


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


});