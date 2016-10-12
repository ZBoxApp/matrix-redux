/* jshint -W024 */
/* jshint expr:true */

"use strict";

import _ from 'lodash';
import jsonschema from 'jsonschema';
import {
	createStoreHelper, expect, clearMatrixClient,
	logTestUser, userFixture
} from "./helper";
import MatrixClient from "../src/utils/client";

import { matrixJsonParser, fixTimelineJson } from "../src/utils/matrixJsonParser";
const jsonFixture = require('./model_schemas/initialSync.original.json');

const machosRoomId = "!YbkEIQjnehrBrvscpm:zboxapp.dev";

let apiFixture;

const randomElement = function(object) {
	if (Array.isArray(object)) return _.sample(object);
	const key = _.sample(Object.keys(object));
	return object[key];
};

const validateSchema = function(instance, schema) {
	const Validator = jsonschema.Validator;
	const v = new Validator();
  	const schemaFile = require('../docs/schemas/' + schema + '.json');
  	return v.validate(instance, schemaFile);
};

describe('Utils functions', function() {

	it('1. should return a empty object if timeline has no events', function() {
		apiFixture = JSON.parse(JSON.stringify(jsonFixture));
		const roomId = "!ydOOsnIkcazJZFkhPh:zboxapp.dev";
		const timelineFixture = apiFixture.rooms.invite[roomId].timeline;
		const resultTimeline = fixTimelineJson(timelineFixture, roomId);
		expect(typeof resultTimeline).to.equal('object');
		expect(Object.keys(resultTimeline.events).length).to.be.below(1);
	});

});

describe('Schema Tests', function () {

	beforeEach(function() {
		apiFixture = JSON.parse(JSON.stringify(jsonFixture));
	});

	it('1. should return nextBatch with correct token', function() {
		const matrixJson = matrixJsonParser(apiFixture);
		expect(matrixJson.nextBatch).to.not.be.undefined;
		expect(matrixJson.nextBatch).to.match(/^s[0-9]+/);
	});

	it('2. should reformat rooms object with rooms ids as firsts keys', function() {
		const matrixJson = matrixJsonParser(apiFixture);
		expect(typeof matrixJson.rooms).to.equal("object");
		expect(Array.isArray(matrixJson.rooms)).to.be.false;
		const ids = Object.keys(matrixJson.rooms);
		expect(_.sample(ids)).to.match(/^![a-zA-Z].*:zboxapp.dev$/);
	});


	it('3. should return events object with eventId as first key', function() {
		const matrixJson = matrixJsonParser(apiFixture);
		expect(typeof matrixJson.events).to.equal("object");

		const ids = Object.keys(matrixJson.events);
		expect(_.sample(ids)).to.match(/^\$[0-9].*[a-zA-Z]{5}:.*/);
	});

	it('4. should return the accountData object', function() {
		const matrixJson = matrixJsonParser(apiFixture);
		expect(typeof matrixJson.accountData).to.equal("object");
	});

	it('5. should return the toDevice object', function() {
		const matrixJson = matrixJsonParser(apiFixture);
		expect(typeof matrixJson.toDevice).to.equal("object");
	});

	it('6. should return the presence object with events as an object with keys of userIds', function() {
		const matrixJson = matrixJsonParser(apiFixture);
		expect(typeof matrixJson.presence.events).to.equal("object");
		const ids = Object.keys(matrixJson.presence.events);
		const randomId = randomElement(ids);
		expect(randomId).to.equal(matrixJson.presence.events[randomId].sender);
	});

});

describe('Room Tests', function() {

	beforeEach(function() {
		apiFixture = JSON.parse(JSON.stringify(jsonFixture));
	});

	it('1. Room should have the expected attributes', function() {
		const matrixJson = matrixJsonParser(apiFixture);
		const randomRoom = randomElement(matrixJson.rooms);
		expect(randomRoom.id).to.not.be.undefined;
		expect(randomRoom.membershipState).to.match(/(join|leave|invite)/);
	});

	it('2. Room should have info attributes added', function() {
		const matrixJson = matrixJsonParser(apiFixture);
		const randomRoom = matrixJson.rooms[machosRoomId];
		expect(randomRoom.name).to.equal('Machos');
		expect(randomRoom.topic).to.equal('Temas para solo Hombres');
		expect(randomRoom.avatarUrl).to.equal('mxc://zboxapp.com/INgKbqNGUGDxhJwIYxXUfnhZ');
		expect(randomRoom.unreadNotifications.highlightCount).to.be.above(-1);
		expect(randomRoom.unreadNotifications.notificationCount).to.be.above(-1);
	});

	it('3. Room.members should be an Object with membershipState as keys', function() {
		const matrixJson = matrixJsonParser(apiFixture);
		const randomRoom = matrixJson.rooms[machosRoomId];
		const randomMembership = randomElement(Object.keys(randomRoom.members));
		expect(randomMembership).to.match(/(join|leave|invite)/);
	});

	it('4. Room.members join be an array with user ids', function() {
		const matrixJson = matrixJsonParser(apiFixture);
		const randomRoom = matrixJson.rooms[machosRoomId];
		const randomMember = randomElement(randomRoom.members.join);
		expect(randomMember).to.match(/^@[a-zA-Z].*:zboxapp.dev$/);
	});

	it('5. Room.timeline.events should be an array with Events Ids', function() {
		const matrixJson = matrixJsonParser(apiFixture);
		const randomRoom = randomElement(matrixJson.rooms);
		expect(Array.isArray(randomRoom.timeline.events)).to.be.true;
		const randomEvent = randomElement(randomRoom.timeline.events);
		expect(matrixJson.events[randomEvent].roomId).to.equal(randomRoom.id);
	});

	it('6. Room.timeline.events should sorted by age', function() {
		const matrixJson = matrixJsonParser(apiFixture);
		const randomRoom = randomElement(matrixJson.rooms);
		const events = randomRoom.timeline.events;
		expect(matrixJson.events[events[0]].age).to.be.above(matrixJson.events[events[4]].age);
	});

	it('7. room should validate against the schema', function() {
		const matrixJson = matrixJsonParser(apiFixture);
		const randomRoom = matrixJson.rooms[machosRoomId];
		const validationResult = validateSchema(randomRoom, "room");
		expect(validationResult.errors).to.be.empty;
	});



});

