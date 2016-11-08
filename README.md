# A REDUX Store for the Matrix Protocol

### What is Matrix?
No, is not the Movie, so go on and read this: [Matrix.org](http://matrix.org)


## Table of Contents
- [Installation](#installation)
- [Development](#development)
- [Reducers And Schemas](#reducers-and-schemas)
- [Tutorial](#Tutorial)
- [Network Request Function](#network-request-function)


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
$ npm i --save lodash matrix-js-sdk redux redux-thunk humps uuid
```

### For Nodejs and Browsers
This library uses the new [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), so you will also need a module tha implements this, like [isomorphic-fetch](https://github.com/matthew-andrews/isomorphic-fetch).

## Development
This repo includes the `start_docker.sh` file which starts a docker container of a **Matrix Server** for development.

To use this you **must** had installed [Docker Toolbox](https://www.docker.com/products/docker-toolbox).

```
$ sh start_docker.sh
```

## Reducers And Schemas
This is only a **Sync** Store, this means that it's only Job is to process the responses from the Matrix Server, nothing more than that.

The **Process** operation is:

1. Convert the Server `JSON` data to an Object with the reducers names as keys and every reducer with an Array of Events. This is done by following the rules defined in [matrix_events.js](./src/utils/matrix_events.js).

2. Process all the events from the step 1 and update the `state` also following the rules defined in [matrix_events.js](./src/utils/matrix_events.js).

The final State look like this:

```json
{
  "sync": "Object",
  "rooms": "Object",
  "users": "Object",
  "events":  "Object"
}
```

Every schema of this reducers is documented in the followings links:

* `sync`: [./test/schemas/sync.json](./test/schemas/sync.json),
* `rooms`: [./test/schemas/rooms.json](./test/schemas/rooms.json),
* `room`: [./test/schemas/room.json](./test/schemas/room.json),
* `users`: [./test/schemas/users.json](./test/schemas/users.json),
* `user`: [./test/schemas/user.json](./test/schemas/user.json),
* `events`: [./test/schemas/events.json](./test/schemas/events.json),
* `event`: [./test/schemas/event.json](./test/schemas/event.json)


## Tutorial

### 1. Import and create the Store

```javascript
import MatrixRedux from "__PATH_TO_Module/src/reducers";
import YourAppReducers from "../reducers/";

// You combine the reducers with MatrixRedux
const combineReducers = ....;

// Also you can apply any other middleware here, like offline store.
const store = createStore(combineReducers, applyMiddleware(thunk));
```

### 2. Login

```javascript
import * as MatrixReduxActions from '__PATH_TO_Module/src/actions';

// callback(err, response);
store.dispatch(MatrixReduxActions.login(userId, password, opts, callback);
```

#### 2.1. Restore Session
If you have saved the token after login, you don't need to login again. You just can restore 
the session like:

```javascript
import * as MatrixReduxActions from '__PATH_TO_Module/src/actions';

const matrixClientData = {
  "baseUrl": "https://matrix.example.com:8448",
  "credentials": { "userId": "@test:zboxapp.dev" },
  "deviceId": "FFKDBPLROE",
  "_http": {
    "opts": {
      "userId": "@test:zboxapp.dev",
      "refreshToken": "MDAxOWxvY2F0aW9uIHp...",
      "accessToken": "MDAxOWxvY2F0aW9uIHpib3hhcHAuZGV2CjAwMTNpZGVudGlmaWVy....",
      "deviceId": "FFKDBPLROE",
      "homeServer": "zboxapp.dev"
    }
  }
};

store.dispatch(MatrixReduxActions.restoreSession(matrixClientData));
```

### 3. Start the Sync Client
Once the Client has started, the reducers will start to mutate the state as the events from the server arrives.

```javascript
import * as MatrixReduxActions from '__PATH_TO_Module/src/actions';

store.dispatch(MatrixReduxActions.clientStart());
```

#### 3.1 Start with syncToken
You can also start the client using a stored `syncToken`, this way only new events since the `syncToken` would be asked to the server for the **InitialSync** process. In other words: **FASTER**.

```javascript
import * as MatrixReduxActions from '__PATH_TO_Module/src/actions';

const opts = {syncToken: 's85330_1452578_11378_81510_139_24_33'};

store.dispatch(MatrixReduxActions.clientStart(opts));
```

More information on what `opts` could contains in [MatrixClien Class Doc](http://matrix-org.github.io/matrix-js-sdk/0.6.1/module-client-MatrixClient.html#startClient).

### 4. Post messages and play
This library pass all the operations to the [Matrix JS SDK Library](https://github.com/matrix-org/matrix-js-sdk). In particular you should check:

* **Messages and User Operations**, like send messages and join rooms: [MatrixClient Class](http://matrix-org.github.io/matrix-js-sdk/0.6.1/module-client-MatrixClient.html),
* **Preferences and State Operations**, like creating a room or request an user profile: [MatrixBaseApis](http://matrix-org.github.io/matrix-js-sdk/0.6.1/module-base-apis-MatrixBaseApis.html),

The operations are passed using the `callApi()` Action Creator. This function takes as the **first param** the name of the function you want to call from `matrix-js-sdk`, and the reste of the params are the params that the real function expect.

#### Examples

**1. Create a Room**
```javascript
import * as MatrixReduxActions from '__PATH_TO_Module/src/actions';

const newRoomOpts = {
  "visibility": "public",
  "invite": ["@john:example.com", "@petete:zboxapp.com", "@el_negro:whatsapp.com"],
  "name": "Envy Room",
  "topic": "Your guess"
};

store.dispatch(MatrixReduxActions.callApi("createRoom", newRoomOpts, callback));
```

**2. Post a Message**
```javascript
import * as MatrixReduxActions from '__PATH_TO_Module/src/actions';

const randomMessage = 'Test from MatrixRedux: ' + new Date().getTime();

store.dispatch(MatrixReduxActions.callApi("sendTextMessage", envyRoomId, randomMessage, callback);
```

### 5. Stop the Sync Client
```javascript
import * as MatrixReduxActions from '__PATH_TO_Module/src/actions';

store.dispatch(MatrixReduxActions.clientStop());
```

### 6. Logout
```javascript
import * as MatrixReduxActions from '__PATH_TO_Module/src/actions';

store.dispatch(MatrixReduxActions.logout(callback));
```


## Network Request Function
This is the function that will make all the network requests, you can implement your own but this library includes one: `utils.fetchRequest()`.

When you initialize the client in the `loginWithPassword()` or `restoreSession()` methods you can pass the function as shown below:


```javascript
import {fetchRequest} from '__PATH_TO_Module/src/utils/utils';
import * as MatrixReduxActions from '__PATH_TO_Module/src/actions';

const userId = '@testuser:example.com';
const password = 'YouSup3rP4ssw0rd';

const opts = {
  'request': fetchRequest,
  'baseUrl': 'https://example.com:8448'
};

const callback = function(){};

store.dispatch(MatrixReduxActions.login(userId, password, opts, callback);
```

