'use strict';

import chai from "chai";
import jsonschema from 'jsonschema';
import _ from 'lodash';
import {combineReducers} from "redux";
import MatrixClient from "../src/utils/client";
import {fetchRequest} from "../src/utils/utils";
import * as UserActions from "../src/actions/user";
import {leaveRoom} from "../src/actions/rooms";
import createStore from "../src/store/store";
import fetch from "isomorphic-fetch";
import rootReducer from "../src/reducer";

export const expect = chai.expect;
export const sdk = MatrixClient;
export const BaseURL = process.env.BASE_URL || "https://localhost:8448";
const testUserId = process.env.USER_ID || "@test:zboxapp.dev";
const testUserPassword = process.env.USER_PASS || "123456";
const testUserName = process.env.USER_NAME || "test";
const testHomeServerName = process.env.HOMESERVER_NAME || "zboxapp.dev";

export const createStoreHelper = function(preloadedState, persistOps) {
  const combinedReducers = combineReducers(rootReducer);
  return createStore(combinedReducers, preloadedState, persistOps)
}

const store = createStoreHelper({users: null, sync: null});

/**
 * Just a function to clean some values of the
 * client object
 *
 */
export const clearMatrixClient = function () {
    MatrixClient.client._http.opts = {};
    MatrixClient.client.credentials = {};
    MatrixClient.deviceId = null;
    MatrixClient.baseUrl = null;
};

export const randomElement = function(object) {
    if (Array.isArray(object)) return _.sample(object);
    if (typeof object === 'undefined') return {};
    const key = _.sample(Object.keys(object));
    return object[key];
};

export const validateSchema = function(instance, schema) {
    const Validator = jsonschema.Validator;
    const v = new Validator();
    const schemaFile = require('../docs/schemas/' + schema + '.json');
    return v.validate(instance, schemaFile);
};

export const endTest = function (err) {
    if (!err) return true;
    console.log('1. loginWithPassword', err);
    expect(err).to.not.exists;
};

export const userFixture = {
    homeServerName: testHomeServerName,
    testUserId: testUserId,
    testUserDisplayName: "test",
    testUserName: testUserName,
    testUserPassword: testUserPassword,
    baseUrl: BaseURL,
    clientOptions: {
        baseUrl: BaseURL,
        logLevel: process.env.DEBUG
    }
};

export const testRoomFixturre = {
    roomName: "TestRoomA"
};

const clientOptions = {
    baseUrl: userFixture.baseUrl,
    logLevel: process.env.DEBUG || 'INFO'
};

export const logTestUser = (opts, callback) => {
    if (typeof opts === 'function') {
        callback = opts;
        opts = clientOptions;
    }
    const testUserName = userFixture.testUserName;
    const testUserPassword = userFixture.testUserPassword;
    MatrixClient.loginWithPassword(testUserName, testUserPassword, opts, callback);
};

export const loginStore = (opts, callback) => {
    if (typeof opts === 'function') {
        callback = opts;
        opts = clientOptions;
    }
    store.dispatch(UserActions.login(testUserName, testUserPassword, opts, function(err, data){
        if (err) return callback(err);
        return callback(null, store);
    }));
};

export const randomRoomName = () => {
  const chars = "abcdefghijklmnopqrstufwxyz";
  let result = "";
  for (let i = 15; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export const createPublicRoom = (callback) => {
    logTestUser(function(err, data){
        const roomAliasName = randomRoomName();
        const newRoomOptions = {
            "visibility": "public",
            "room_alias_name": roomAliasName,
            "name": roomAliasName
        };
        MatrixClient.client.createRoom(newRoomOptions, callback);
    });
};

export const removeTestRoom = (roomId) => {
    store.dispatch(leaveRoom(roomId)).then(() => {
        return true;
    }).catch((err) => {
        //console.log(err);
    });
};
