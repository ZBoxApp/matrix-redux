/*
 * Copyright 2015-present, ZBox Spa.
 * All rights reserved.
 */

'use strict';
import _ from 'lodash';
import pickBy from 'lodash/pickBy';
import identity from 'lodash/identity';

import {CONSTANTS} from '../utils/constants';

const EVENTS = CONSTANTS.events;


export const eventsToState = (json) => {
	const newStates = groupEventsByReducer(json.events);
	newStates.sync.syncToken = json.nextBatch;

	return newStates;
};

/**
 * Return a Object with RootTypes as Keys and IDs of reducers of events as value
 * @param  {Array} events - The array of events
 * @return {Object}
 */
export const groupEventsByReducer = (events = []) => {
	const result = {};
	result.events = {};
	result.users = {};
	result.rooms = {};
	result.sync = {};

	events.forEach((event) => {		
		const ownerObject = getOwnerObject(event, result);
		const eventsArray = getEventsByType(event, ownerObject);
		ownerObject.events.push(event.id);
		eventsArray.push(event.id);

		result.events[event.id] = event;
		if (CONSTANTS.userExtraEvents[event.type])
			addEventToUserReducer(event, result.users);

	});
	return result;
};

const addEventToUserReducer = (event, reducer) => {
	const id = event.userId;
	if (!reducer[id]) reducer[id] = {};
	if (!reducer[id].events) reducer[id].events = [];
	if (!reducer[id].eventsByType) reducer[id].eventsByType = {};
	if (!reducer[id].eventsByType[event.type]) reducer[id].eventsByType[event.type] = [];
	reducer[id].eventsByType[event.type].push(event.id);
	reducer[id].events.push(event.id);
	return true;
}

/**
 * Return an array of Events
 * @param  {Object} event       [description]
 * @param  {Object} ownerObject [description]
 * @return {[type]}             [description]
 */
const getEventsByType = (event = {}, ownerObject = {}) => {
	const eventType = (typeof event.roomEventType === 'undefined') ? event.rootType : event.roomEventType;
	if (!ownerObject.eventsByType) ownerObject.eventsByType = {};
	if (!ownerObject.eventsByType[eventType]) ownerObject.eventsByType[eventType] = [];

	const eventsArray = ownerObject.eventsByType[eventType];
	return eventsArray;
};

const getMembersByMembership = (membership, stateEvents = []) => {
	const membersIds = [];
	const events = selectEventsByType(stateEvents, EVENTS.ROOM_MEMBER);
	events.forEach((event) => {
		if (event.membership === membership)
			membersIds.push(event.state_key)
	});

	return membersIds;
}

const getOwnerObject = (event, result) => {
	const ownerType = event.ownerType + 's';
	const ownerId = event.ownerId;
	if (!result[ownerType]) result[ownerType] = {};
	if (!result[ownerType][ownerId]) result[ownerType][ownerId] = {};

	const ownerObject = result[ownerType][ownerId];
	if (!ownerObject.events) ownerObject.events = [];
	
	return ownerObject;
};


const getRoomAttrValue = (attrName, stateEvents = [], defaultValue) => {
	let attrValue = defaultValue || undefined;
	const eventType = CONSTANTS.events['ROOM_' + attrName.toUpperCase()];
	const events = selectEventsByType(stateEvents, eventType);
	const event = lastEvent(events);
	attrName = (attrName === "avatar") ? "url" : attrName;
	if (event && event.content && event.content[attrName])
		attrValue = event.content[attrName];

	return attrValue;
};

export const processRoomState = (roomId, roomStateEvents, events) => {
	const room = {};
  	const stateEvents = selectEventsById(roomStateEvents, events);
  	if (stateEvents.length < 1) return room;
  	room.id = roomId;
  	room.membershipState = stateEvents[0].roomType;
  	room.name = getRoomAttrValue("name", stateEvents);
  	room.topic = getRoomAttrValue("topic", stateEvents);
  	room.avatarUrl = getRoomAttrValue("avatar", stateEvents);
  	room.unreadNotifications = getRoomAttrValue("unread_notification", stateEvents);
  	room.members = {
  		joined: getMembersByMembership('join', stateEvents),
  		leaved: getMembersByMembership('leave', stateEvents),
  		invited: getMembersByMembership('invite', stateEvents),
  		banned: getMembersByMembership('ban', stateEvents)
  	};

  	return room;
};

export const processRoomTimeLine = (roomTimelineEvents, events) => {
	const timeline = {};
	timeline.events = roomTimelineEvents;
	timeline.eventsByType = {};

	const timelineEvents = selectEventsById(roomTimelineEvents, events);
	timelineEvents.forEach((event) => {
		if (!timeline.eventsByType[event.type])
			timeline.eventsByType[event.type] = [];

		timeline.eventsByType[event.type].push(event.id);
	});

	return timeline;
};

export const processUserState = (userId, userEvents, events) => {
	const user = {};
	const presenceEvent = userEvents.eventsByType.presence;
  	const memberEvents = selectEventsById(userEvents.eventsByType['m.room.member'], events);
  	const lastMemberEvent = lastEvent(memberEvents);
  	const lastPresenceEvent = events[presenceEvent[presenceEvent.length - 1]];
  	
  	if (lastMemberEvent) {
  		const eventContent = lastMemberEvent.content;
  		user.id = userId;
  		user.name = eventContent.name;
  		user.displayName = eventContent.name;
  		user.avatarUrl = eventContent.avatar_url;
  	}

  	if (lastPresenceEvent) {
  		user.id = userId;
  		user.presence = lastPresenceEvent.content.presence;
  		user.lastActiveAgo = lastPresenceEvent.content.last_active_ago;
  		user.currentlyActive = lastPresenceEvent.content.currently_active;
  	}

  	if(!user.id) return undefined;
  	return user;
};

/**
 * Return the last event sorted by Age
 * @param  {Array} events
 * @return {Object}       
 */
const lastEvent = (events = []) => {
	events.sort((a,b) => {
		return a.unsigned.age - b.unsigned.age;
	});
	return events[0];
};

/**
 * Return an Array of Events Objects selected by Id
 * @param  {Array}  eventsIds    [description]
 * @param  {Object} eventsObject [description]
 * @return {Array}              [description]
 */
const selectEventsById = (eventsIds = [], eventsObject = {}) => {
	const events = [];
	eventsIds.forEach((eventId) => {
		const event = eventsObject[eventId];
		if(!event) return;
		events.push(event);
	})
	return events;
};

/**
 * Returns an array of events by type
 * @param  {Object} events
 * @param  {String} type
 * @return {Array}        
 */
const selectEventsByType = (events = [], type) => {
	const selectedEvents = [];

	events.forEach((event) => {
		if (event.type === type)
			selectedEvents.push(event);
	});

	return selectedEvents;
};



// -----------------------

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