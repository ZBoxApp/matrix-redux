// "use strict";

// import {createStoreHelper, logTestUser, expect, clearMatrixClient, userFixture} from "../helper";
// import MatrixClient from "../../src/utils/client";
// import * as SyncActions from "../../src/actions/sync";
// import ReduxStorageEngine from "../../src/middleware/redux_storage_engine";

// let store = {};
// let state;

// const testUserName = userFixture.testUserName;
// const testUserId = userFixture.testUserId;
// const testUserPassword = userFixture.testUserPassword;
// const clientOptions = userFixture.clientOptions;
// const homeServerName = userFixture.homeServerName;

// describe('User Action Creators Tests', function() {
//   this.timeout(100000);

//   beforeEach((done) => {
//     const storageEngine = new ReduxStorageEngine();
//     clientOptions.store = storageEngine;
//     logTestUser(clientOptions, (e, d) => {
//       if (e) return console.error(e);
//       store = d;
//       done();
//     });
//   });

//   it('1. Sync Should Use the ReduxStorageEngine', function (done) {
//       const qps = { };
//       MatrixClient.client._http.authedRequest( undefined, "GET", "/sync", qps, undefined, 10000).then(function(data, headers, code){
//         console.log(JSON.stringify(data, 2, 2));
//         done();
//       }).catch((err) => {
//           console.log(err);
//           done();
//       });
//   });


// });
