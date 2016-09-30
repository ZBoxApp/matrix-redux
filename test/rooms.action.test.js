"use strict";

import {expect, clearMatrixClient, userFixture} from "./helper";
import createStore from "../src/store/store";
import * as RoomsActions from "../src/actions/rooms";
import MatrixClient from "../src/utils/client";

let store = {};
let state;

const testUserName = userFixture.testUserName;
const testUserId = userFixture.testUserId;
const testUserPassword = userFixture.testUserPassword;
const clientOptions = userFixture.clientOptions;
const homeServerName = userFixture.homeServerName;

describe('Room Actions Tests', () => {

    beforeEach((done) => {
        logTestUser((e, d) => {
            if (e) return console.error(e);
            store = d;
            done();
        });
    });

    it('Request public rooms action', (done) => {
        store.dispatch(RoomsActions.loadPublicRooms()).then((rooms) => {
            const state = store.getState();
            expect(state.rooms.items).to.not.empty;
            done();
        }).catch((err) => {
            console.log("on request public rooms action -- ", err);
            done();
        });
    });

    it('on create room action', (done) => {
        store.dispatch(RoomsActions.createRoom({
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
        store.dispatch(RoomsActions.leaveRoom('!hGVbivIrTvQuQPfbvq:zboxapp.dev')).then((suc) => {
            done();
        }).catch((err) => {
            //console.log(err, 'ERROR');
            //console.log(err);
            done();
        });
    });
});
