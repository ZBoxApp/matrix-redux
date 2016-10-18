"use strict";

import {expect, userFixture, loginStore, randomElement, validateSchema} from "../helper";
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
    beforeEach(function (done) {
        loginStore(function (err, data) {
            if (err) console.error(err);
            store = data;
            done();
        });
    });

    afterEach(function (done) {
        MatrixClient.client.stopClient();
        MatrixClient.client.store.setSyncToken(null);
        MatrixClient.client.store.rooms = {};
        done();
    });

    it('1. Sync Start Should Update Sync State', function (done) {
        this.timeout(20000);
        store.dispatch(SyncActions.start());
        setTimeout(function () {
            state = store.getState();
            expect(state.sync.isRunning).to.be.true;
            expect(state.sync.initialSyncComplete).to.be.true;
            expect(state.sync.syncToken).to.not.be.undefined;
            expect(typeof state.sync.filters).to.equal("object");
            MatrixClient.client.stopClient();
            done();
        }, 8000);
    });

    it('2. Stop Should set isRunning to False', function (done) {
        this.timeout(10000);
        const opts = {pollTimeout: 1000};
        store.dispatch(SyncActions.start(opts));
        store.dispatch(SyncActions.stop());
        setTimeout(function () {
            state = store.getState();
            expect(state.sync.isRunning).to.be.false;
            done();
        }, 1000);
    });


    it('4. Sync should update the state', function (done) {
        this.timeout(20000);
        MatrixClient.client.on("sync", function (syncState, prevState, data) {
            state = store.getState();
            const syncStatus = MatrixClient.getSyncState();
            if (state.sync && state.sync.initialSyncComplete && syncStatus) {
                MatrixClient.client.stopClient();
                ['room', 'user', 'event'].forEach(function (resource) {
                    const reducer = resource + 's';
                    const randomResource = randomElement(state[reducer].byIds);
                    let validationResult = validateSchema(randomResource, resource);
                    if (validationResult.errors.length > 0) {
                        console.log(validationResult.errors);
                        console.log(validationResult.instance);
                    }
                    if (randomResource) expect(validationResult.errors).to.be.empty;
                });
                done();
            }
        });
        store.dispatch(SyncActions.start());
    });

    // it('5. After initial sync it should update on events', function(done){
    //     this.timeout(20000);
    //     MatrixClient.client.on("event", function(event) {
    //         state = store.getState();
    //         if (state.sync && state.sync.initialSyncComplete) {
    //             console.log("--- START ---");
    //             console.log(state.users.byIds['@pbruna:zboxapp.com']);
    //             // console.log(MatrixClient.client._reduxRawResponse.rooms.join);
    //             console.log("--- END ---");
    //         }
    //     });
    //     store.dispatch(SyncActions.start());
    // });

});
