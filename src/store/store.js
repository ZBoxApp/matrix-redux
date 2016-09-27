/*
 * Copyright 2015-present, ZBox Spa.
 * All rights reserved.
 */

"use strict";

import {createStore, applyMiddleware, compose} from "redux";
import thunk from "redux-thunk";
import rootReducer from "../reducer";

const enhancer = compose(
    applyMiddleware(thunk)
);

export default function createAppStore(preloadedState) {
    const store = createStore(rootReducer, preloadedState, enhancer);

    return store;
}