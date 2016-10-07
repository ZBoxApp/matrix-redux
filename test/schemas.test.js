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

const ramdomElement = function(object) {
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
		expect(formatedRooms.join).to.be.undefined;
		expect(ramdomElement(formatedRooms).id).to.not.be.undefined;
		const membershipState = ramdomElement(formatedRooms).membershipState;
		expect(membershipState).to.match(/(join|leave|invite)/);
	});

	it('2. fixRoomJson should return the full JSON if passed', function() {
		const formatedApiFixture = fixRoomJson(apiFixture);
		const formatedRooms = formatedApiFixture.rooms;
		expect(formatedRooms.join).to.be.undefined;
		expect(ramdomElement(formatedRooms).id).to.not.be.undefined;
		const membershipState = ramdomElement(formatedRooms).membershipState;
		expect(membershipState).to.match(/(join|leave|invite)/);
	});

  // it('2. Should transform the Rooms', function() {
  //   const normalizedSchema = normalize(camlizedApiFixture, Schemas.SYNC );
  //   const entities = normalizedSchema.entities;
  //   console.log(normalizedSchema);
  //   // expect(Object.keys(entities.rooms).length).to.be.above(1);
    
  //   const rooms = entities.rooms;
  //   expect(Object.keys(rooms).length).to.equal(normalizedSchema.result.rooms.length);
    
  //   // console.log(JSON.stringify(normalizedSchema, 2, 2));
  // });

});

