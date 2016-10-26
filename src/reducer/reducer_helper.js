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
		if (!EVENTS[event.type]) return;
		const ephemeral = EVENTS[event.type].ephemeral;
		const sorted = EVENTS[event.type].ageSorted;

		if (ephemeral)
			byType.ephemeral.push(event.id);

		if (!ephemeral)
			byType.state.push(event.id);

		if (!byType[event.type])
			byType[event.type] = [];

		byType[event.type].push(event.id);
		if (sorted)
			byType[event.type] = sortByAge(byType[event.type], events);
		
	});

	return byType;
}

const sortByAge = (ids = [], events = {}) => {
	ids.sort((a,b) => {
		
		return events[b].unsigned.age - events[a].unsigned.age;
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