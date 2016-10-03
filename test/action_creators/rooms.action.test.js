"use strict";

import {createStoreHelper, expect, randomRoomName,
  clearMatrixClient, userFixture, logTestUser} from "../helper";
import * as RoomsActions from "../../src/actions/rooms";
import MatrixClient from "../../src/utils/client";

let store = {};
let state;
var testRoomName = (new Date().getTime() + '');
var testRoomId;
var newRoomId;

const testUserName = userFixture.testUserName;
const testUserId = userFixture.testUserId;
const testUserPassword = userFixture.testUserPassword;
const clientOptions = userFixture.clientOptions;
const homeServerName = userFixture.homeServerName;

describe('Room Actions Tests', function() {

    beforeEach(function(done) {
      const roomAliasName = randomRoomName();
      const newRoomOptions = {
        "visibility":"public",
        "room_alias_name": roomAliasName,
        "name": roomAliasName
      };
      logTestUser(function(e, d) {
        if (e) return console.error(e);
        store = d;
        store.dispatch(RoomsActions.createRoom(newRoomOptions)).then(function(data){
          newRoomId = data.room_id;
          done();
        }).catch(function(err){
          return console.log(err);
          done();
        });
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
      this.timeout(10000);
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

    it('3. Leave Room', function() {
      this.timeout(20000);
      return store.dispatch(RoomsActions.leaveRoom(newRoomId)).then(function(){
        state = store.getState();
        expect(state.rooms.items[newRoomId]).to.be.undefined;
      }, function rejected(err) {
        throw new Error('WTF: ' + err);
      });
    });
});
