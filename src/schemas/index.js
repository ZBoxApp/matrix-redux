/**
* Copyright 2015-present, ZBox Spa.
* All rights reserved.
**/

'use strict';

import { normalize, Schema, arrayOf, unionOf, valuesOf } from 'normalizr';
import { camelizeKeys } from 'humps';
import _ from 'lodash';

const ROOM_MEMBERSHIP_STATES = ['leave', 'join', 'invite'];



const notificationSchema = new Schema('notifications');

const presenceSchema = new Schema('presences');

/**
 * Schema for Rooms
 * Room is really the Master Schema in Synapse Response
 * @type {Schema}
 */



const generateSlug = function(entity) {
	console.log(" ---- START ----");
	console.log(entity);
	console.log(" ---- END ----");

};

const assignEventEntity = function(output, key, value, input) {
	// console.log(" ---- START ----");
	// // Assign [join, invite, leave] to each room
	// console.log(output);
	
	// console.log(" ---- END ----");
};

/**
 * Schema for Events Objects
 * @type {Schema}
 */
const eventSchema = new Schema('events', { idAttribute: "eventId" });

const roomSchema = new Schema('rooms');
const syncSchema = new Schema('sync', { idAttribute: 'nextBatch' });

syncSchema.define({
	rooms: arrayOf(roomSchema),
});

const assignTimelineEntity = function(output, key, value, input) {
	if (key === 'events') {
		const eventTypes = {};
		input.events.forEach((event) => {
			if (eventTypes[event.type]) {
				eventTypes[event.type].push(event.eventId);
			} else {
				eventTypes[event.type] = [event.eventId];
			}
		});
		output.eventTypes = eventTypes;
	}
	console.log(output);
	return output;
};

const timelineSchema = new Schema('timelines', {idAttribute: 'prevBatch', assignEntity: assignTimelineEntity });

const messageSchema = new Schema('messages');
const imagesSchema = new Schema('images');

const types = {
	'm.room.message': messageSchema,
	'm.room.image': imagesSchema
};

timelineSchema.define({
	events: arrayOf(eventSchema),
});

roomSchema.define({
	timeline: timelineSchema,
});









// roomSchema.define({
// 	leave: arrayOf(room),
// 	join: arrayOf(room),
// 	invite: arrayOf(room),

// });



const userSchema = new Schema('users');


// Schemas for Github API responses.
export const Schemas = {
  EVENT: eventSchema,
  MESSAGE: messageSchema,
  NOTIFICATION: notificationSchema,
  PRESENCE: presenceSchema,
  ROOM: roomSchema,
  TIMELINE: timelineSchema,
  USER: userSchema,
  SYNC: syncSchema
};
