/* jshint -W024 */
/* jshint expr:true */

"use strict";

import _ from 'lodash';
import {
	createStoreHelper, expect, clearMatrixClient,
	logTestUser, userFixture
} from "./helper";
import MatrixClient from "../src/utils/client";

import { matrixJsonParser, fixTimelineJson } from "../src/utils/matrixJsonParser";
const jsonFixture = require('./model_schemas/initialSync.original.json');

let apiFixture;

const randomElement = function(object) {
	if (Array.isArray(object)) return _.sample(object);
	const key = _.sample(Object.keys(object));
	return object[key];
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
		const ids = Object.keys(matrixJson.rooms);
		expect(_.sample(ids)).to.match(/^![a-zA-Z].*:zboxapp.dev$/);
	});


	it('3. should return timeLine object with eventId as first key', function() {
		const matrixJson = matrixJsonParser(apiFixture);
		expect(typeof matrixJson.events).to.equal("object");
		const ids = Object.keys(matrixJson.events);
		expect(_.sample(ids)).to.match(/^\$[0-9].*[a-zA-Z]{5}:zboxapp.dev$/);
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

	// const randomRoom = randomElement(formatedRooms);
	// 	expect(randomRoom.id).to.not.be.undefined;
	// 	expect(randomRoom.state.id).to.be.equal(randomRoom.id);
	// 	const membershipState = randomRoom.currentUserMembership;
	// 	expect(membershipState).to.match(/(join|leave|invite)/);

	// it('2. fixRoomJson should return the full JSON if passed', function() {
	// 	const formatedApiFixture = fixRoomJson(apiFixture);
	// 	const formatedRooms = formatedApiFixture.rooms;
	// 	expect(Array.isArray(formatedRooms)).to.be.true;
	// 	const randomRoom = randomElement(formatedRooms);
	// 	expect(randomRoom.id).to.not.be.undefined;
	// 	expect(randomRoom.state.id).to.be.equal(randomRoom.id);
	// 	const membershipState = randomRoom.currentUserMembership;
	// 	expect(membershipState).to.match(/(join|leave|invite)/);
	// });

	// it('3. Should transform the Rooms', function() {
 //  		const formatedRooms = fixRoomJson(apiFixture.rooms);
 //    	const normalizedRooms = normalize(formatedRooms, arrayOf(Schemas.ROOM) );
 //    	// Two times because first is an Array of Objects :(
 //    	let randomRoom = normalizedRooms.entities.rooms[randomElement(normalizedRooms.result)];
 //    	expect(normalizedRooms.entities).to.not.be.undefined;
 //    	expect(normalizedRooms.result).to.not.be.undefined;
 //    	expect(Object.keys(normalizedRooms.entities).length).to.be.above(1);
 //    	expect(randomRoom.currentUserMembership).to.match(/(leave|join|invite)/);
 //    	expect(normalizedRooms.entities.rooms[randomRoom.id]).to.not.be.undefined;
 //    	expect(randomRoom.state).to.be.equal(randomRoom.id);
 //    	expect(normalizedRooms.entities.roomsStates[randomRoom.id]).to.not.be.undefined;
 //    	expect(randomRoom.name).to.not.be.undefined;
 //    	expect(randomRoom.memberships).to.not.be.undefined;
 //    	expect(randomElement(randomRoom.memberships.join)).to.match(/@/);
 //    	console.log(JSON.stringify(normalizedRooms, 2, 2));
    	
 //    // console.log(JSON.stringify(normalizedSchema, 2, 2));
 //  	});

});

