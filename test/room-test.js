import {makeLogin} from '../src/actions/login';
import {requestUser} from '../src/actions/currentUser';
import {removeTestRoom} from './helper';
import {getPublicRooms, leaveRoom, createRoom} from '../src/actions/rooms';
import chai from 'chai';
import createStore from '../src/store/store';
import MatrixClient from '../src/utils/client';
import {fetchRequest} from '../src/utils/utils';

const expect = chai.expect;

const homeServerName = "zboxapp.dev";
const testUserId = "@test:zboxapp.dev";
const testUserDisplayName = "test";
const testUserName = "test";
const testUserPassword = "123456";
const baseUrl = 'https://192.168.0.104:8448';
const clientOptions = {
    baseUrl: baseUrl
};

describe('room test', () => {

    it('on request public rooms action', (done) => {
        const store = createStore();

        store.dispatch(getPublicRooms()).then((rooms) => {
            done();
            const state = store.getState();
            expect(state.rooms.rooms).to.not.empty;
            //console.log(state.rooms.rooms);
        }).catch((err) => {
            console.log(err);
            done();
        });
    });

    it('on create room action', (done) => {
        const store = createStore();

        store.dispatch(createRoom({
            room_alias_name: `real_poof_pre_2${new Date().getTime()}`,
            visibility: 'public',
            pepe: true
        })).then((room) => {
            const state = store.getState();
            expect(state.rooms.rooms).to.not.empty;
            //console.log(state.rooms.rooms);
            removeTestRoom(room.room_id);
            done();
        }).catch((err) => {
            console.log(err);
            done();
        });
    });

    it('on leave room action', (done) => {
        const store = createStore({});

        store.dispatch(leaveRoom('!hGVbivIrTvQuQPfbvq:zboxapp.dev')).then((suc) => {
            done();
        }).catch((err) => {
            //console.log(err, 'ERROR');
            //console.log(err);
            done();
        });
    });
});

