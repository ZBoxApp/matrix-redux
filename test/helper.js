'use strict';

import chai from 'chai';
import MatrixClient from '../src/utils/client';
import {fetchRequest} from '../src/utils/utils';
import {makeLogin} from '../src/actions/login';
import {leaveRoom} from '../src/actions/rooms';
import createStore from '../src/store/store';

export const expect = chai.expect;
export const sdk = MatrixClient;
const store = createStore({ currentUser: null, login: null });

export const userFixture = {
  homeServerName: "zboxapp.dev",
  testUserId: "@test:zboxapp.dev",
  testUserDisplayName: "test",
  testUserName: "test",
  testUserPassword: "123456",
  baseUrl: 'https://192.168.0.104:8448'
}

export const testRoomFixturre = {
  roomName: "TestRoomA"
};

const clientOptions = {
  baseUrl: userFixture.baseUrl
};

export const logTestUser = (callback) => {
  const testUserName = userFixture.testUserName;
  const testUserPassword = userFixture.testUserPassword;
  store.dispatch(makeLogin(testUserName, testUserPassword, clientOptions)).then((data) => {
    callback(null, store);
  }).catch((e) => {
    callback(e);
  });
  // MatrixClient.login(testUserName, testUserPassword, clientOptions, callback);
}

export const removeTestRoom = (roomId) => {
  store.dispatch(leaveRoom(roomId)).then(() => {
    return true;
  }).catch((err) => {
    //console.log(err);
  });
}
