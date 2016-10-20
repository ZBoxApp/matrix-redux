/*
 * Copyright 2015-present, ZBox Spa.
 * All rights reserved.
 */

'use strict';
import _ from 'lodash';
import pickBy from 'lodash/pickBy';
import identity from 'lodash/identity';

// import * as MatrixJsonParser from "../utils/matrixJsonParser";

// export const eventsToState = (rawJson) => {
//   const newState = {};
//   const processedJson = MatrixJsonParser.processJson(rawJson);
//   newState.sync = processSync(processedJson);
//   newState.rooms = processRooms()
// };
// 

export const calculateState = (reducer, oldState, event) => {
	if (!event) return;
	let newState;
	if (event.rootType === 'rooms') {
		if (event.roomEventType === 'state') {
			newState = calculateRoomState(event);
			newState = _.merge({}, oldState, newState[reducer]);
			newState.event = event;
		}
		if (event.roomEventType === 'timeline') {
			newState = {};
			let newTimeLine;
			if (oldState.timelive && oldState.timelive.events) {
				oldState.timeline.events.push(event.id);
				newState.room = oldState;
			} else {
				newState.room = {
					id: event.ownerId
				}
			}
		}
		newState.event = event;
		return newState;
	}
};

const calculateRoomState = (event) => {
	const newRoom = createRoom(event);
	const result = {};
	Object.keys(newRoom).forEach((reducer) => {
		result[reducer] = pickBy(newRoom, identity);
	});
	return result;
};

/**
 * Adds the membershipState and roomId attributes to a room json
 * @param  {Object} room            - Room JSON
 * @param  {String} membershipState - The state
 * @param  {String} roomId          - The roomId
 * @return {Object}                 - The updated Room JSON
 */
const createRoom = (event) => {
	const result = {};
	result.user = getMember(event);
	result.room = {};
	result.room.id = event.ownerId;
	result.room.name = getContentValue(event, "name");
	result.room.topic = getContentValue(event, "topic");
	result.room.avatarUrl = getContentValue(event, "url");
	result.room.unreadNotifications = getContentValue(event, "unread_notifications");
	result.room.newMemberId = result.user.id;
	return result;
};

/**
 * Build a User Object with all the members of the room
 * @param {Object} room - Room Json
 * @param {Object} presenceState - The presence Events
 * @return {[Object}      Users for this room
 */
const getMember = (event) => {
	const user = setUserAttrs(event);
	return user;
};

const setUserAttrs = (user) => {
	let formatedUser = {};
	formatedUser.id = user.sender;
	formatedUser.name = user.content.displayname || formatedUser.id;
	formatedUser.displayName = user.content.displayname || formatedUser.id;
	if (user.content.avatar_url) formatedUser.avatarUrl = user.content.avatar_url;
	return formatedUser;
};

const getContentValue = (event, valueName) => {
	let value;

	if (event.content && event.content[valueName]) {
		value = event.content[valueName];
	}

	return value;
}