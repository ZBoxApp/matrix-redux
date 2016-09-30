# A REDUX Store for the Matrix Protocol

### What is Matrix?
No, is not the Movie, so go on and read this: [Matrix.org](http://matrix.org)


## Table of Contents
- [Installation](#installation)
- [How to use this](#how-to-use-this)
- [Fetch Function](#fetch-function)
- [Login](#login)
- [Matrix Client](#matrix-client)
- [Store and reducers](#store-and-reducers)



## Installation
For now it's better to use this as a [Git Submodule](https://git-scm.com/docs/git-submodule). Maybe in the future we'll make a `NPM Module`.

### React Native
The [matrix-js-sdk](http://matrix-org.github.io/matrix-js-sdk/0.6.1/) use a lot of functions not currently available on React-Native, so you need to **nodeify** you React-Native App doing this:

#### 1. Add a Post Install Script
Your `package.json` scripts section should look similar to:

```javascript
"scripts": {
    "start": "node node_modules/react-native/local-cli/cli.js start",
    "postinstall": "node_modules/.bin/rn-nodeify --install --hack"
  },
```

#### 2. Install rn-nodeify and Nodeify your App
```
$ npm i --save-dev rn-nodeify
$ npm run postinstall
```

### Modules And Dependencies
You have to install a couple of modules on your App for this to work ok:

```
$ npm i --save lodash matrix-js-sdk redux redux-thunk
```

## How to use this

### First time

1. [Login the user](#login), your platform must have a valid [fetch function](#fetch-function)
2. [Start the client](#matrix-client), this runs the **Initial Syncs** and keeps running and `emitting` events that are captured by this library.
3. Save a local copy of the Session Data, available at `state.user.matrixClientData`
4. Make your App `React` to the change state.

### After the First time

1. [Restore the Session](#login), with the data saved on the previous `3rd step`.
2. Same as before
3. Same as before
4. Same as before

### Reacting to changes
The `Store`, `State`, `Actions` will be documented at: [Store and reducers](#store-and-reducers).

## Fetch Function
The [matrix-js-sdk](http://matrix-org.github.io/matrix-js-sdk/0.6.1/) library needs a compliant `fetch()` function, so maybe you need to implement it. For example:

#### For Nodejs

```javascript
import fetch from "isomorphic-fetch";
import * as UserActions from "../src/actions/user";
import MatrixClient from "../src/utils/client";

const userName = 'testuser';
const userPassword = 'YouSup3rP4ssw0rd';
const opts = { 'baseUrl': 'https://matrixserver.com:8448' };

// This is returns a Promise
UserActions.loginWithPassword(userName, userPassword, opts);

```

#### For React Native

```javascript
import fetchRequest from '../src/utils/utils';
import * as UserActions from "../src/actions/user";
import MatrixClient from "../src/utils/client";

const userName = 'testuser';
const userPassword = 'YouSup3rP4ssw0rd';
const opts = { 'baseUrl': 'https://matrixserver.com:8448' };

// This is returns a Promise
UserActions.loginWithPassword(userName, userPassword, opts);

```

## Login
- Return `accessToken` from server.
- Reducers: `user`.

### 1. Login With Password

```javascript
import createStore from "../src/store/store";
import * as UserActions from "../src/actions/user";
import MatrixClient from "../src/utils/client";

let store = createStore({});
const userName = 'testuser';
const userPassword = 'YouSup3rP4ssw0rd';
const opts = { 'baseUrl': 'https://matrixserver.com:8448' };

store.dispatch(UserActions.loginWithPassword(userName, userPassword, opts)).then((loginData) => {
  const state = store.getState();
  console.log(state.login);
  console.log(state.currentUser);
}).catch((err) => {
  return console.error(err);
});
```

### 2. Restore Session
Ideally you will save in a Local Storage the information for `matrixClientData`, which you
can get from `store.getState().login.matrixClientData`;

```javascript
const matrixClientData = {
  baseUrl: 'https://matrix.example.com:8448',
  credentials: { userId: '@test:zboxapp.dev' },
  deviceId: 'FFKDBPLROE',
  _http: {
    opts: {
      userId: '@test:zboxapp.dev',
      refreshToken: 'MDAxOWxvY2F0aW9uIHp...',
      accessToken: 'MDAxOWxvY2F0aW9uIHpib3hhcHAuZGV2CjAwMTNpZGVudGlmaWVy....',
      deviceId: 'FFKDBPLROE',
      homeServer: 'zboxapp.dev'
    }
  }
};

store.dispatch(UserActions.restoreSession(matrixClientData));
```

## Matrix Client
The MatrixClient runs until the App closes and `emits` events that are catched by this library. The MatrixClient has this transition:

                                          +---->STOPPED
                                          |
              +----->PREPARED -------> SYNCING <--+
              |        ^                  |       |
   null ------+        |  +---------------+       |
              |        |  V                       |
              +------->ERROR ---------------------+


#### 1. Starting the Client
This starts the syncing process, after a susccesfully initial sync, `PREPARED` state, a `syncToken` is received and saved in the reducers.

* `user.matrixClientData.store.syncToken`,
* `sync.syncToken`.

You should save this token locally for later use if the App is closed.

The `opts` object take the following paramaters:

* `opts.initialSyncLimit`: The event `limit=` to apply to initial sync. Default: 8.
* `opts.includeArchivedRooms`: True to put `archived=true` on the `/initialSync/` request. Default: `false`.
* `opts.pollTimeout`, The number of milliseconds to wait on `/events`. Default: 30000 (30 seconds).

```javascript
// @returns {Promise}
store.dispatch(SyncActions.start(opts))
```

#### 2. Stop the Client
This stop the client and close all listerners:

```javascript
store.dispatch(SyncActions.stop())
```

## Store and reducers

### Errors

### Events

### Members

### Notifications

### Rooms

### Sync

### User
