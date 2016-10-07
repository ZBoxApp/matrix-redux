/* jshint -W024 */
/* jshint expr:true */

"use strict";

import { Schema, arrayOf, normalize, unionOf } from 'normalizr';
import _ from 'lodash';
import { camelizeKeys } from 'humps';
import {
	createStoreHelper, expect, clearMatrixClient,
	logTestUser, userFixture
} from "./helper";
import MatrixClient from "../src/utils/client";

import { fixRoomJson, Schemas } from "../src/schemas";
const jsonFixture = require('./model_schemas/initialSync.original.json');

let apiFixture;

const randomElement = function(object) {
	if (Array.isArray(object)) return _.sample(object);
	const key = _.sample(Object.keys(object));
	return object[key];
};

describe('Schema Tests', function () {

	beforeEach(function() {
		apiFixture = JSON.parse(JSON.stringify(jsonFixture));
	});

	it('1. should re-format the room object', function() {
		const formatedRooms = fixRoomJson(apiFixture.rooms);
		expect(Array.isArray(formatedRooms)).to.be.true;
		expect(randomElement(formatedRooms).id).to.not.be.undefined;
		const membershipState = randomElement(formatedRooms).membershipState;
		expect(membershipState).to.match(/(join|leave|invite)/);
	});

	it('2. fixRoomJson should return the full JSON if passed', function() {
		const formatedApiFixture = fixRoomJson(apiFixture);
		const formatedRooms = formatedApiFixture.rooms;
		expect(Array.isArray(formatedRooms)).to.be.true;
		expect(randomElement(formatedRooms).id).to.not.be.undefined;
		const membershipState = randomElement(formatedRooms).membershipState;
		expect(membershipState).to.match(/(join|leave|invite)/);
	});

	it('3. Should transform the Rooms', function() {
  		const formatedRooms = fixRoomJson(apiFixture.rooms);
    	const normalizedRooms = normalize(formatedRooms, arrayOf(Schemas.ROOM) );
    	console.log(normalizedRooms);
    	const randomRoom = randomElement(normalizedRooms);
    	expect(normalizedRooms.entities).to.not.be.undefined;
    	expect(normalizedRooms.results).to.not.be.undefined;
    	expect(Object.keys(normalizedRooms.entities).length).to.be.above(1);
    // console.log(JSON.stringify(normalizedSchema, 2, 2));
  	});

});

