/*
 * Copyright 2015-present, ZBox Spa.
 * All rights reserved.
 */

"use strict";

import error from "./error";
import rooms from "./rooms";
import users from "./users";
import events from "./events";
import sync from "./sync";

const rootReducer = {
    sync,
    error,
    rooms,
    users,
    events
};

export default rootReducer;
