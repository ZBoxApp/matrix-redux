"use strict";

import {expect, clearMatrixClient, logTestUser, userFixture} from "./helper";
import * as SyncActions from "../src/actions/sync";
import MatrixClient from "../src/utils/client";

let store = {};
let state;

const testUserName = userFixture.testUserName;
const testUserId = userFixture.testUserId;
const testUserPassword = userFixture.testUserPassword;
const clientOptions = userFixture.clientOptions;
const homeServerName = userFixture.homeServerName;

describe('Sync Actions', function () {
    beforeEach((done) => {
        logTestUser((e, d) => {
            if (e) return console.error(e);
            store = d;
            done();
        });
    });

    afterEach((done) => {
      MatrixClient.client.stopClient();
      done();
    });

    it('1. Sync Start Should Update Sync State', function (done) {
        this.timeout(15000);
        const opts = {pollTimeout: 1000};
        store.dispatch(SyncActions.start(opts)).then(function (data) {
          setTimeout(function(){
            state = store.getState();
            expect(state.sync.isRunning).to.be.true;
            expect(state.sync.initialSyncComplete).to.be.true;
            expect(state.sync.syncToken).to.not.be.undefined;
            expect(typeof state.sync.filters).to.equal("object");
            MatrixClient.client.stopClient();
            done();
          }, 2000);
        }).catch((err) => {
            console.log(err);
            done();
        });
    });

    it('2. Stop Should Update Sync State', function (done) {
        this.timeout(20000);
        const opts = {pollTimeout: 1000};
        MatrixClient.client.startClient(opts);
        store.dispatch(SyncActions.stop(opts));
        setTimeout(function(){
          state = store.getState();
          expect(state.sync.isRunning).to.be.false;
          done();
        }, 3000);
    });



});
