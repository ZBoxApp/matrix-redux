# A REDUX Store for the Matrix Protocol

### What is Matrix?
No, is not the Movie, so go on and read this: [Matrix.org](http://matrix.org)

## Installation
For now it's better to use this as a [Git Submodule](https://git-scm.com/docs/git-submodule).

Maybe in the future we'll make a `NPM Module`

## Table of Contents
- [Login](#login)

## Login
This `login` methods update the following `reducers`:

* `login`,
* `currentUser`

### 1. Login With Password

```javascript
import createStore from './src/store/store';
import {LoginActions} from './src/actions/login';
import MatrixClient from './src/utils/client';

let store = createStore({});
const userName = 'testuser';
const userPassword = 'YouSup3rP4ssw0rd';
const opts = {
  'baseUrl': 'https://your.matrixserver.com:8448';
};

store.dispatch(LoginActions.loginWithPassword(userName, userPassword, opts)).then((loginData) => {
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

store.dispatch(LoginActions.restoreSession(matrixClientData));
```
