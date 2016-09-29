"use strict";

import {expect, clearMatrixClient, userFixture, endTest, sdk, logTestUser} from './helper';
import createStore from '../src/store/store';
import {LoginActions} from '../src/actions/login';
import MatrixClient from '../src/utils/client';

let store = {};
let state;

const testUserName = userFixture.testUserName;
const testUserId = userFixture.testUserId;
const testUserPassword = userFixture.testUserPassword;
const clientOptions = userFixture.clientOptions;
const homeServerName = userFixture.homeServerName;

describe('Login Action Creators Tests', () => {

  beforeEach(() =>{
    store = createStore({});
    state = {};
  });

  it('1. restoreSession should update client', (endTest) => {
    store.dispatch(LoginActions.loginWithPassword(testUserName, testUserPassword, clientOptions)).then(() => {
      state = store.getState();
      const matrixClientData = state.login.matrixClientData;
      matrixClientData.optsForCreateClient = { baseUrl: matrixClientData.baseUrl };
      clearMatrixClient();
      MatrixClient.restoreSession(matrixClientData);
      expect(MatrixClient.client).to.not.be.undefined;
      expect(MatrixClient.client.baseUrl).to.equal(clientOptions.baseUrl);
      expect(MatrixClient.client.deviceId).to.not.be.undefined;
      expect(MatrixClient.client.credentials.userId).to.equal(testUserId);
      expect(MatrixClient.client._http.opts.userId).to.equal(testUserId);
      expect(MatrixClient.client._http.opts.refreshToken).to.not.be.undefined;
      expect(MatrixClient.client._http.opts.accessToken).to.not.be.undefined;
      expect(MatrixClient.client._http.opts.deviceId).to.not.be.undefined;
      expect(MatrixClient.client._http.opts.homeServer).to.equal(homeServerName);
      endTest();
    }).catch((err) => {
      endTest(err);
    });
  });


  it('2. restoreSession should permit make calls to the server', (endTest) => {
    store.dispatch(LoginActions.loginWithPassword(testUserName, testUserPassword, clientOptions)).then(() => {
      state = store.getState();
      const matrixClientData = state.login.matrixClientData;
      matrixClientData.optsForCreateClient = { baseUrl: matrixClientData.baseUrl };
      clearMatrixClient();
      MatrixClient.restoreSession(matrixClientData);
      MatrixClient.callApi('getProfileInfo', testUserId, function(err, profile){
        expect(err).to.be.null;
        expect(profile.displayname).to.not.be.undefined;
        endTest();
      });
    }).catch((err) => {
      endTest(err);
    });
  });

});
