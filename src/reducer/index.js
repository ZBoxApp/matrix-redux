/*
 * Copyright 2015-present, ZBox Spa.
 * All rights reserved.
 */

"use strict";

import error from "./error";
import rooms from "./rooms";
import user from "./user";
import sync from "./sync";

const rootReducer = {
    sync,
    error,
    rooms,
    user
};

export default rootReducer;
