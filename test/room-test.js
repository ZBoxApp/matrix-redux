"use strict";

import {expect, userFixture, sdk, logTestUser, removeTestRoom} from './helper';
import createStore from '../src/store/store';
import {RoomActions} from '../src/actions/rooms';

import {getPublicRooms, leaveRoom, createRoom} from '../src/actions/rooms';
let store = {};

describe('Room Actions Tests', () => {

  beforeEach((done) =>{
    logTestUser((e,d) => {
      if (e) return console.error(e);
      store = d;
      done();
    });
  });

    it('on request public rooms action', (done) => {
        store.dispatch(getPublicRooms()).then((rooms) => {
            done();
            const state = store.getState();
            expect(state.rooms.rooms).to.not.empty;
        }).catch((err) => {
            console.log("on request public rooms action -- ", err);
            done();
        });
    });

    it('on create room action', (done) => {
        store.dispatch(createRoom({
            room_alias_name: `real_poof_pre_2${new Date().getTime()}`,
            visibility: 'public',
            pepe: true
        })).then((room) => {
            const state = store.getState();
            expect(state.rooms.rooms).to.not.empty;
            removeTestRoom(room.room_id);
            done();
        }).catch((err) => {
            console.log('on create room action ----', err);
            expect(err).to.not.exists;
            done();
        });
    });

    it('on leave room action', (done) => {
        store.dispatch(leaveRoom('!hGVbivIrTvQuQPfbvq:zboxapp.dev')).then((suc) => {
            done();
        }).catch((err) => {
            //console.log(err, 'ERROR');
            //console.log(err);
            done();
        });
    });
});
