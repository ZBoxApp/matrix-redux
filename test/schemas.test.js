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
import {Schemas} from "../src/schemas";

const apiFixture = require('./model_schemas/initialSync.original.json');
const camlizedApiFixture = camelizeKeys(apiFixture);
const ROOM_MEMBERSHIP_STATES = ['leave', 'join', 'invite'];

const realRooms = {};

ROOM_MEMBERSHIP_STATES.forEach((state) => {
	Object.keys(camlizedApiFixture.rooms[state]).forEach((roomId) => {
		camlizedApiFixture.rooms[state][roomId].id = roomId;
		camlizedApiFixture.rooms[state][roomId].membershipState = state;
		realRooms[roomId] = camlizedApiFixture.rooms[state][roomId];
	});

});

camlizedApiFixture.rooms = realRooms;

const ramdomElement = function(object) {
	if (Array.isArray(object)) return _.sample(object);
	const key = _.sample(Object.keys(object));
	return object[key];
};

describe('Room Tests', function () {

  it('1. Should transform the Rooms', function() {
    const normalizedSchema = normalize(camlizedApiFixture, Schemas.SYNC );
    const entities = normalizedSchema.entities;
    console.log(normalizedSchema);
    // expect(Object.keys(entities.rooms).length).to.be.above(1);
    
    const rooms = entities.rooms;
    expect(Object.keys(rooms).length).to.equal(normalizedSchema.result.rooms.length);
    
    // console.log(JSON.stringify(normalizedSchema, 2, 2));
  });

});

