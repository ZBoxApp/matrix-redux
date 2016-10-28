/**
* Copyright 2015-present, ZBox Spa.
* All rights reserved.
**/

'use strict';

import { CONSTANTS } from '../utils/constants';
import EVENTS from '../utils/matrix_events';
import { checkArguments, randomString } from '../utils/utils';
import _ from 'lodash';

const groupByType = (events) => {
	const byType = { "state": [], "ephemeral": [] };
	let eventsArray = {...events};

	if (!Array.isArray(eventsArray))
		eventsArray = objectToArray(eventsArray);

	eventsArray.forEach((event) => {
		if (!event) return;
		if (!EVENTS[event.type]) return;
		const ephemeral = EVENTS[event.type].ephemeral;
		const sorted = EVENTS[event.type].ageSorted;

		if (!byType[event.type])
			byType[event.type] = [];

		if (isEphemeral(event)) {
			byType.ephemeral.push(event.id);
		}
		else if (!event.roomEventType) {
			byType.state.push(event.id);
		}
		else {
			if (!byType[event.roomEventType])
				byType[event.roomEventType] = [];

			byType[event.roomEventType].push(event.id);
		}

		byType[event.type].push(event.id);
	});

	byType.state = sortByAge(byType.state, events);
	byType.timeline = sortByAge(byType.timeline, events);

	return byType;
};

const isEphemeral = (event) => {
	let ephemeral = false;

	if (EVENTS[event.type].ephemeral)
		ephemeral = true;

	if (event.roomEventType && event.roomEventType !== 'ephemeral')
		ephemeral = false;

	return ephemeral;
};

const sortByAge = (ids = [], events = {}) => {
	ids.sort((a,b) => {
		if (!events[a].unsigned || !events[b].unsigned) {
		console.log(events[a]);
		console.log(events[b]);
	}
		return events[a].unsigned.age - events[b].unsigned.age;
	});

	return ids;
};


const objectToArray = (object) => {
	const events = [];
	Object.keys(object).forEach((key) => {
		events.push(object[key]);
	});

	return events;
}

const ReducerHelper = {
	"groupByType": groupByType,
	"sortByAge": sortByAge
};

export default ReducerHelper;