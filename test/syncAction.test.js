"use strict";

import {expect, userFixture, sdk, logTestUser} from './helper';
import createStore from '../src/store/store';
import {startSync, getSyncState, SyncActions} from '../src/actions/sync';
import MatrixClient from '../src/utils/client';

let store = {};
let reduxState = {};

describe('Sync Actions', function() {
  beforeEach((done) =>{
    logTestUser((e,d) => {
      if (e) return console.error(e);
      store = d;
      done();
    });
  });

  it('SYNC_EVENTS At Start', function(done) {
    this.timeout(7000);
    const opts = {pollTimeout: 5000};
    store.dispatch(startSync(opts)).then(function(sync) {
      MatrixClient.client.on("sync", function(state, prevState, data) {
        if (state === 'PREPARED') {
          MatrixClient.client.stopClient();
          reduxState = store.getState();
          expect(Object.keys(reduxState.rooms.rooms).length).to.be.above(1);
          done();
        }
      })
    }).catch((err) => {
      console.log(err);
      done();
    })
    // const result = store.dispatch(getSyncState());
  });
});
