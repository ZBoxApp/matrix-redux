/*
 * Copyright 2015-present, ZBox Spa.
 * All rights reserved.
 */

"use strict";

import {createStore, applyMiddleware, compose} from "redux";
import DevTools from '../containers/DevTools';
import thunk from "redux-thunk";
import rootReducer from "../reducer";

const args = [applyMiddleware(thunk)];

if(process.env.NODE_ENV === 'development') {
    args.push(DevTools.instrument());
}

const enhancer = compose(...args);

export default function createAppStore(preloadedState) {
    return createStore(rootReducer, preloadedState, enhancer);
}