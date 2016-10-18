/*
 * Copyright 2015-present, ZBox Spa.
 * All rights reserved.
 */

"use strict";

import {createStore, applyMiddleware, compose} from "redux";
import {persistStore, autoRehydrate} from "redux-persist";
import thunk from "redux-thunk";


const enhancer = compose(
    applyMiddleware(thunk)
);

const enhancerWithRehydrate = compose(
    autoRehydrate(),
    applyMiddleware(thunk)
);

/**
 * Returns the Redux Store
 * @param {Object} combinedReducers - The `combinedReducers`
 * @param {Object} preloadedState - The initial state
 * @param {Object} persistOps
 * @param {Object} persistOps.config - Config for redux-persist
 * @param {Array} persistOps.config.blacklist - array keys (read: reducers) to ignore
 * @param {Array} persistOps.config.whitelist - array keys (read: reducers) to persist, if set all other keys will be ignored.
 * @param {Object} persistOps.config.storage - [a conforming storage engine](https://github.com/rt2zz/redux-persist#storage-backends).
 * @param {Array} persistOps.config.transforms - transforms to be applied during storage and during rehydration.
 * @param {Integer} persistOps.config.debounce - debounce interval applied to storage calls.
 * @param {String} persistOps.config.keyPrefix - change localstorage default key (default: reduxPersist:)
 * @param {Function} persistOps.callback - function will be called after rehydration is finished.
 * @return {Object}                - Store
 */
export default function createAppStore(combinedReducers, preloadedState, persistOps) {
    if (persistOps && typeof persistOps === 'object') {
        const store = createStore(combinedReducers, preloadedState, enhancerWithRehydrate);
        persistStore(store);
        return store;
    }
    return createStore(combinedReducers, preloadedState, enhancer);
}
