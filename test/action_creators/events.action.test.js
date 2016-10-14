"use strict";

import {createStoreHelper, expect, clearMatrixClient,
  logTestUser, userFixture, loginStore, randomElement, validateSchema
} from "../helper";
import * as EventActions from "../../src/actions/events";
import MatrixClient from "../../src/utils/client";

let store = {};
let state;

const testUserName = userFixture.testUserName;
const testUserId = userFixture.testUserId;
const testUserPassword = userFixture.testUserPassword;
const clientOptions = userFixture.clientOptions;
const homeServerName = userFixture.homeServerName;

const returnError = (error, done) => {
    console.error(error);
    done();
};

describe('User Action Creators Tests', function() {

    this.timeout(10000);
    beforeEach(function(done){
        loginStore(function(err, data){
            if (err) console.error(err);
            store = data;
            done();
        });
    });

    it('1. Send Message', function(done) {
        this.timeout(20000);
        store.dispatch(EventActions.sendTextMessage('!YbkEIQjnehrBrvscpm:zboxapp.com', 'Hola desde Sublime', function(err, data){
        	if (err) returnError(err, done);
        	console.log(data);
        	done();
        }));
    });

});