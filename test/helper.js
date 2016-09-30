'use strict';

import chai from "chai";
import MatrixClient from "../src/utils/client";
import * as UserActions from "../src/actions/user";
import {leaveRoom} from "../src/actions/rooms";
import createStore from "../src/store/store";

export const expect = chai.expect;
export const sdk = MatrixClient;
const store = createStore({user: null, sync: null});


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

export const endTest = function (err) {
    if (!err) return true;
    console.log('1. loginWithPassword', err);
    expect(err).to.not.exists;
};

export const userFixture = {
    homeServerName: "zboxapp.dev",
    testUserId: "@test:zboxapp.dev",
    testUserDisplayName: "test",
    testUserName: "test",
    testUserPassword: "123456",
    baseUrl: 'https://192.168.0.104:8448',
    clientOptions: {
        baseUrl: 'https://192.168.0.104:8448'
    }
};

export const testRoomFixturre = {
    roomName: "TestRoomA"
};

const clientOptions = {
    baseUrl: userFixture.baseUrl
};

export const logTestUser = (callback) => {
    const testUserName = userFixture.testUserName;
    const testUserPassword = userFixture.testUserPassword;
    store.dispatch(UserActions.loginWithPassword(testUserName, testUserPassword, clientOptions)).then((data) => {
        callback(null, store);
    }).catch((e) => {
        callback(e);
    });
    // MatrixClient.login(testUserName, testUserPassword, clientOptions, callback);
};

export const removeTestRoom = (roomId) => {
    store.dispatch(leaveRoom(roomId)).then(() => {
        return true;
    }).catch((err) => {
        //console.log(err);
    });
};
