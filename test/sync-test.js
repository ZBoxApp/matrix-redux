"use strict";

import {expect, userFixture, sdk, logTestUser} from './helper';
import createStore from '../src/store/store';
import {startSync, getSyncState, SyncActions} from '../src/actions/sync';
import MatrixClient from '../src/utils/client';

let store = {};

describe('Sync Actions', function(){
  beforeEach((done) =>{
    logTestUser((e,d) => {
      if (e) return console.error(e);
      store = d;
      done();
    });
  });

  it('SYNC_EVENTS without filter', (done) => {

    store.dispatch(startSync()).then((sync) => {
      MatrixClient.client.on("sync", function(e){
        console.log("EVENTO", e);
        console.log(MatrixClient.client);
      })
    }).catch((err) => {
      console.log(err);
      done();
    })
    // const result = store.dispatch(getSyncState());
  });
});
