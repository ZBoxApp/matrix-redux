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

const returnError = (error, done) => {
    console.error(error);
    done();
};

describe('User Action Creators Tests', () => {

    beforeEach(() => {
        store = createStoreHelper({});
        state = {};
    });

    it('1. login should Update MatrixClient info', function(done) {
        const callback = function(err, data) {
            if (err) returnError(err, done);

            ['userId', 'refreshToken', 'deviceId'].forEach((opt) => {
                expect(MatrixClient.client._http.opts[opt]).to.not.be.undefined;
            });
            const userId = MatrixClient.client.credentials.userId;
            expect(userId).to.be.equal(testUserId);
            expect(MatrixClient.client.deviceId).to.not.be.undefined;
            done();
        }
        store.dispatch(UserActions.login(testUserName, testUserPassword, clientOptions, callback));
    });

    it('2. loginWithPassword should Update error state', function(done) {
        const callback = function(err, data) {
            state = store.getState();
            expect(state.users.currentUser.isLogged).to.be.false;
            expect(state.error['login.loginWithPassword']).to.not.be.undefined;
            done();
        };
        store.dispatch(UserActions.login(testUserName, 'badPassword', clientOptions, callback));
    });

    it('3. login should Update user', function(done) {
        const callback = function(err, data) {
            if (err) returnError(err, done);
            state = store.getState();
            expect(state.users.currentUser.isLogged).to.be.true;
            expect(state.users.currentUser.accessToken).to.not.be.undefined;
            expect(state.users.currentUser.homeServer).to.equal(homeServerName);
            expect(state.users.currentUser.credentials.userId).to.equal(testUserId);
            expect(state.users.currentUser.userId).to.equal(testUserId);
            done();
        };
        store.dispatch(UserActions.login(testUserName, testUserPassword, clientOptions, callback));
    });

    it('4. LoginReducer must have the Auth Data for MatrixClient Constructor', function(done) {
        this.timeout(5000);
        const callback = function(err, data) {
            if (err) returnError(err, done);
            state = store.getState();
            expect(state.users.currentUser.isLogged).to.be.true;
            expect(state.users.currentUser.isLoading).to.be.false;
            expect(state.users.currentUser.matrixClientData).to.not.be.undefined;
            expect(state.users.currentUser.matrixClientData.baseUrl).to.equal(clientOptions.baseUrl);
            expect(state.users.currentUser.matrixClientData.deviceId).to.not.be.undefined;
            expect(state.users.currentUser.matrixClientData.credentials.userId).to.equal(testUserId);
            expect(state.users.currentUser.matrixClientData._http.opts.userId).to.equal(testUserId);
            expect(state.users.currentUser.matrixClientData._http.opts.refreshToken).to.not.be.undefined;
            expect(state.users.currentUser.matrixClientData._http.opts.accessToken).to.not.be.undefined;
            expect(state.users.currentUser.matrixClientData._http.opts.deviceId).to.not.be.undefined;
            expect(state.users.currentUser.matrixClientData._http.opts.homeServer).to.equal(homeServerName);
            done();
        };
        store.dispatch(UserActions.login(testUserName, testUserPassword, clientOptions, callback));
    });

    it('5. restoreSession should update user reducers', function(done) {
        this.timeout(5000);
        const callback = function(err, data) {
            if (err) returnError(err, done);
            state = store.getState();
            const matrixClientData = state.users.currentUser.matrixClientData;
            matrixClientData.optsForCreateClient = {baseUrl: matrixClientData.baseUrl};
            clearMatrixClient();
            store.dispatch(UserActions.restoreSession(matrixClientData));
            state = store.getState();
            expect(state.users.currentUser.matrixClientData).to.not.be.undefined;
            expect(state.users.currentUser.accessToken).to.not.be.undefined;
            expect(state.users.currentUser.isLogged).to.be.true;
            expect(MatrixClient.client._http.opts.accessToken).to.equal(matrixClientData._http.opts.accessToken);
            done();
        };
        store.dispatch(UserActions.login(testUserName, testUserPassword, clientOptions, callback));
    });

    it('6. logout should update user reducers', function(done) {
        this.timeout(5000);
        store.dispatch(UserActions.login(testUserName, testUserPassword, clientOptions, function(err, data){
            if (err) returnError(err, done);
            store.dispatch(UserActions.logout(function(err, data){
                if (err) returnError(err, done);
                state = store.getState();
                expect(state.users.currentUser.isLogged).to.be.false;
                expect(state.users.currentUser.accessToken).to.be.undefined;
                expect(state.users.currentUser.matrixClientData).to.be.undefined;
                done();
            }));
        }));
    });
});
