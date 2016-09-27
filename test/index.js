import {makeLogin} from '../src/actions/login';
import {requestUser} from '../src/actions/currentUser';
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
const clientOptions = {
  baseUrl: 'https://192.168.0.104:8448'
};

describe('login test', () => {

   it('on make login action', (done) => {
     const store = createStore({ currentUser: null, login: null });
     store.dispatch(makeLogin(testUserName, testUserPassword, clientOptions)).then((data) => {
       const state = store.getState();
       expect(state.currentUser.isLogged).to.be.true;
       expect(state.currentUser.accessToken).to.exists;
       expect(state.currentUser.homeServer).to.equal(homeServerName);
       expect(state.login.isLogged).to.be.true;
       done();
     }).catch((err) => {
       console.log(err);
       done();
     });
    });

    it('on REQUEST_USER action', (done) => {
      const store = createStore({ currentUser: null, login: null });
      store.dispatch(makeLogin(testUserName, testUserPassword, clientOptions)).then((data) => {
        let state = store.getState();
        store.dispatch(requestUser(testUserId, state.currentUser)).then((data) => {
          state = store.getState();
          expect(state.currentUser.profile.displayName).to.equal(testUserDisplayName);
          done();
        }).catch((err) => {
          console.log(err);
          done();
        });
      });
    });

});
