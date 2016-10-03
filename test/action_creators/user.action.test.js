"use strict";

import {createStoreHelper,expect, clearMatrixClient, userFixture} from "../helper";
import * as UserActions from "../../src/actions/user";
import MatrixClient from "../../src/utils/client";

let store = {};
let state;

const testUserName = userFixture.testUserName;
const testUserId = userFixture.testUserId;
const testUserPassword = userFixture.testUserPassword;
const clientOptions = userFixture.clientOptions;
const homeServerName = userFixture.homeServerName;

describe('User Action Creators Tests', () => {

    beforeEach(() => {
        store = createStoreHelper({});
        state = {};
    });

    it('1. loginWithPassword should Update MatrixClient info', (endTest) => {
        store.dispatch(UserActions.loginWithPassword(testUserName, testUserPassword, clientOptions)).then(() => {
            ['userId', 'refreshToken', 'deviceId'].forEach((opt) => {
                expect(MatrixClient.client._http.opts[opt]).to.not.be.undefined;
            });
            expect(MatrixClient.client.credentials.userId).to.be.equal(testUserId);
            expect(MatrixClient.client.deviceId).to.not.be.undefined;
            endTest();
        }).catch((err) => {
            endTest(err);
        });
    });

    it('2. loginWithPassword should Update error state', function () {
        return store.dispatch(UserActions.loginWithPassword(testUserName, 'badPassword', clientOptions)).then((data) => {
            throw new Error('Promise was unexpectedly fulfilled. Result: ' + data);
        }, function rejected(err) {
            state = store.getState();
            expect(state.user.isLogged).to.be.false;
            expect(state.error['login.loginWithPassword']).to.not.be.undefined;
        });
    });

    it('3. loginWithPassword should Update user', function (endTest) {
        store.dispatch(UserActions.loginWithPassword(testUserName, testUserPassword, clientOptions)).then(() => {
            state = store.getState();
            expect(state.user.isLogged).to.be.true;
            expect(state.user.accessToken).to.not.be.undefined;
            expect(state.user.homeServer).to.equal(homeServerName);
            expect(state.user.credentials.userId).to.equal(testUserId);
            expect(state.user.userId).to.equal(testUserId);
            endTest();
        }).catch(function (err) {
            endTest(err);
        });
    });

    it('4. LoginReducer must have the Auth Data for MatrixClient Constructor', function (endTest) {
      this.timeout(5000);
        store.dispatch(UserActions.loginWithPassword(testUserName, testUserPassword, clientOptions)).then((loginData) => {
            state = store.getState();
            expect(state.user.isLogged).to.be.true;
            expect(state.user.isLoading).to.be.false;
            expect(state.user.matrixClientData).to.not.be.undefined;
            expect(state.user.matrixClientData.baseUrl).to.equal(clientOptions.baseUrl);
            expect(state.user.matrixClientData.deviceId).to.not.be.undefined;
            expect(state.user.matrixClientData.credentials.userId).to.equal(testUserId);
            expect(state.user.matrixClientData._http.opts.userId).to.equal(testUserId);
            expect(state.user.matrixClientData._http.opts.refreshToken).to.not.be.undefined;
            expect(state.user.matrixClientData._http.opts.accessToken).to.not.be.undefined;
            expect(state.user.matrixClientData._http.opts.deviceId).to.not.be.undefined;
            expect(state.user.matrixClientData._http.opts.homeServer).to.equal(homeServerName);
            endTest();
        }).catch(function (err) {
            endTest(err);
        });
    });

    it('5. restoreSession should update user and login reducers', function (endTest) {
      this.timeout(5000);
        store.dispatch(UserActions.loginWithPassword(testUserName, testUserPassword, clientOptions)).then(() => {
            state = store.getState();
            const matrixClientData = state.user.matrixClientData;
            matrixClientData.optsForCreateClient = {baseUrl: matrixClientData.baseUrl};
            clearMatrixClient();
            store.dispatch(UserActions.restoreSession(matrixClientData));
            state = store.getState();
            expect(state.user.matrixClientData).to.not.be.undefined;
            expect(state.user.accessToken).to.not.be.undefined;
            expect(state.user.isLogged).to.be.true;
            expect(state.user.isLogged).to.be.true;
            expect(MatrixClient.client._http.opts.accessToken).to.equal(matrixClientData._http.opts.accessToken);
            endTest();
        }).catch((err) => {
            endTest(err)
        });
    });
});
