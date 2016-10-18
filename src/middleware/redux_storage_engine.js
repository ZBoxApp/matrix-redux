/*
 * Copyright 2015-present, ZBox Spa.
 * All rights reserved.
 */

'use strict';

import MatrixSdk from "matrix-js-sdk";

const ReduxStorageEngine = function (opts) {

    opts = opts || {};
    this.counter = 0;
    this.realStore = new MatrixSdk.MatrixInMemoryStore(opts);

    this.rooms = {
        // roomId: Room
    };
    this.users = {
        // userId: User
    };
    this.syncToken = null;
    this.filters = {
        // userId: {
        //    filterId: Filter
        // }
    };
    this.accountData = {
        // type : content
    };
    this.localStorage = opts.localStorage;

    return new Proxy(this, {
            get: (object, target) = > {
            if (Reflect.has(object, target))
    {
        return Reflect.get(object, target);
    }
    else
    {
        return methodMissing(target, this);
    }
}
})
    ;
};

const methodMissing = function (target, object) {
    try {
        // const newMethod = function(){
        //   // if (/^store/.test(target)) {
        //   console.log(object.counter + ": -- Called --", target)
        //   console.log("-- Arguments --");
        //   console.log(arguments);
        //   console.log("-- End --");
        //   object.counter++;
        //   // }
        //   if (typeof object.realStore[target] !== 'function') return object.realStore[target];
        //   const args = [].slice.call(arguments);
        //   if (args.length > 0) return object.realStore[target](...args);
        //   return object.realStore[target]();
        // }
        // return newMethod;
        // console.log("--- Called --- ", target);
        return object.realStore[target];
    } catch (e) {
        throw e;
    }
};


export default ReduxStorageEngine;
