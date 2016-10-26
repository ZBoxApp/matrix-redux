/**
* Copyright 2015-present, ZBox Spa.
* All rights reserved.
**/

'use strict';

import { CONSTANTS } from '../utils/constants';
import EVENTS from '../utils/matrix_events';
import { checkArguments, randomString } from '../utils/utils';
import _ from 'lodash';

const ReducerHelper = {};

ReducerHelper.groupByType = (events) => {
	const byType = { "state": [], "ephemeral": [] };
	if (!Array.isArray(events))
		events = objectToArray(events);

	events.forEach((event) => {
		if (event.ephemeral)
			byType.ephemeral.push(event.id);

		if (!event.ephemeral)
			byType.state.push(event.id);

		if (!byType[event.type])
			byType[event.type] = [];

		byType[event.type].push(event.id);
	});

	return byType;
}


const objectToArray = (object) => {
	const events = [];
	Object.keys(object).forEach((key) => {
		events.push(object[key]);
	});

	return events;
}

export default ReducerHelper;