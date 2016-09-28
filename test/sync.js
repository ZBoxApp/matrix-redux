"use strict";

import {expect, userFixture, sdk, logTestUser} from './helper';
import createStore from '../src/store/store';
import {SyncActions} from '../src/actions/sync';

const store = createStore({ currentUser: null, login: null });

describe('Sync Actions', () =>{
  beforeEach((done) =>{
    logTestUser();
    done();
  });

  it('SYNC_EVENTS without filter', (done) => {
    store.dispatch(SyncActions.startedRequestSync());
    done();
  });


})
