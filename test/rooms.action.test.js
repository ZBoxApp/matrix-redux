"use strict";

import {expect, randomRoomName, clearMatrixClient, userFixture, logTestUser} from "./helper";
import createStore from "../src/store/store";
import * as RoomsActions from "../src/actions/rooms";
import MatrixClient from "../src/utils/client";

let store = {};
let state;
var testRoomName = (new Date().getTime() + '');
var testRoomId;
var newRoomId;
const roomAliasName = randomRoomName();
const newRoomOptions = {
  "visibility":"public",
  "room_alias_name": roomAliasName,
  "name": roomAliasName
};

const testUserName = userFixture.testUserName;
const testUserId = userFixture.testUserId;
const testUserPassword = userFixture.testUserPassword;
const clientOptions = userFixture.clientOptions;
const homeServerName = userFixture.homeServerName;

describe('Room Actions Tests', function() {

    beforeEach(function(done) {
      logTestUser(function(e, d) {
        if (e) return console.error(e);
        store = d;
        done();
      });
    });

    // afterEach(function(done) {
    //   MatrixClient.client.leave(newRoomId, function(err, data) {
    //     if (err) return console.error(err);
    //     testRoomId = '';
    //     testRoomName = '';
    //     done();
    //   });
    // });

    it('1. Request public rooms action', function() {
      this.timeout(10000);
      return store.dispatch(RoomsActions.getPublicRooms()).then(function(rooms){
        state = store.getState();
        expect(Object.keys(state.rooms.items).length).to.above(0);
        expect(state.rooms.ids).to.not.be.empty;
        expect(state.rooms.publicIds).to.not.be.empty;
      }, function rejected(err) {
        throw new Error('Promise was unexpectedly fulfilled. Result: ' + err);
      });
    });

    it('2. Create Room', function() {
      const roomData = {
        "room_alias_name": testRoomName,
        "visibility": "public",
        "name": testRoomName,
      }
      return store.dispatch(RoomsActions.createRoom(roomData)).then(function(room){
        state = store.getState();
        expect(state.rooms.items[room.room_id]).to.not.be.undefined;
      }, function rejected(err) {
        throw new Error('WTF: ' + err);
      });
    });

    // it('Create Room', function(done) {
    //     store.dispatch(RoomsActions.createRoom({
    //         room_alias_name: testRoomName,
    //         visibility: 'public',
    //         pepe: true
    //     })).then(function(room) {
    //         testRoomId = room.id;
    //         state = store.getState();
    //         expect(typeof state.rooms.items[room.id]).to.equal('object');
    //         done();
    //     }).catch(function(err) {
    //         console.log('on create room action ----', err);
    //         expect(err).to.not.exists;
    //         done();
    //     });
    // });
    //
    // it('on leave room action', function(done) {
    //     store.dispatch(RoomsActions.leaveRoom(newRoomId)).then(function(suc) {
    //       state = store.getState();
    //       expect(state.rooms.items[newRoomId]).to.be.undefined;
    //       done();
    //     }).catch(function(err) {
    //       console.log('on leave room action ----', err);
    //       done();
    //     });
    // });
});
