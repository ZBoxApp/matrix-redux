/*
 * Copyright 2015-present, ZBox Spa.
 * All rights reserved.
 */

"use strict";

import {combineReducers} from "redux";
import login from "./login";
import error from "./error";
import rooms from "./rooms";
import currentUser from "./currentUser";
import sync from "./sync";

const rootReducer = combineReducers({
    sync,
    login,
    error,
    rooms,
    currentUser
});

export default rootReducer;
