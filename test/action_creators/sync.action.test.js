"use strict";

import {createStoreHelper, expect, clearMatrixClient,
  logTestUser, userFixture, loginStore} from "../helper";
import * as SyncActions from "../../src/actions/sync";
import MatrixClient from "../../src/utils/client";

let store = {};
let state;

const testUserName = userFixture.testUserName;
const testUserId = userFixture.testUserId;
const testUserPassword = userFixture.testUserPassword;
const clientOptions = userFixture.clientOptions;
const homeServerName = userFixture.homeServerName;

describe('Sync Actions', function () {
  this.timeout(10000);
    beforeEach((done) => {
        loginStore(function(err, data){
            store = data;
            done();
        });
    });

    afterEach((done) => {
      MatrixClient.client.stopClient();
      MatrixClient.client.store.setSyncToken(null);
      MatrixClient.client.store.rooms = {};
      done();
    });

    it('1. Sync Start Should Update Sync State', function (done) {
        this.timeout(10000);
        const opts = {pollTimeout: 1000};
        store.dispatch(SyncActions.start(opts));
        setTimeout(function() {
            state = store.getState();
            expect(state.sync.isRunning).to.be.true;
            expect(state.sync.initialSyncComplete).to.be.true;
            expect(state.sync.syncToken).to.not.be.undefined;
            expect(typeof state.sync.filters).to.equal("object");
            MatrixClient.client.stopClient();
            done();
        }, 2000);
    });

    it('2. Stop Should set isRunning to False', function (done) {
        this.timeout(10000);
        const opts = {pollTimeout: 1000};
        store.dispatch(SyncActions.start(opts));
        store.dispatch(SyncActions.stop());
        setTimeout(function(){
          state = store.getState();
          expect(state.sync.isRunning).to.be.false;
          done();
        }, 1000);
    });

    it('3. Should works with pre-existing SyncToken', function(done) {
        this.timeout(15000);
        let oldSyncToken;
        const opts = {pollTimeout: 1000};
        store.dispatch(SyncActions.start(opts));
        setTimeout(function(){
            state = store.getState();
            oldSyncToken = state.sync.syncToken;
            store.dispatch(SyncActions.stop());
        }, 4000);
        opts.syncToken = oldSyncToken;
        store.dispatch(SyncActions.start(opts));
        setTimeout(function(){
            state = store.getState();
            const newSyncToken = state.sync.syncToken;
            store.dispatch(SyncActions.stop());
            expect(oldSyncToken).to.not.equal(newSyncToken);
            done();
        }, 2000);
    });

});
