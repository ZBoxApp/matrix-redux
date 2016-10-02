"use strict";
import {CONSTANTS} from "./constants";

/**
 * @param {Object} options - The options for the request to Matrix
 * this is returned by the MatrixClient constructor
 * @param {Function} callback - Callback to return the data
 */
export const fetchRequest = (options, callback) => {
    options.body = JSON.stringify(options.body);
    const queryString = objectToQueryString(options.qs);
    const uri = options.uri + '?' + queryString;
    delete options.qs;
    delete options._matrix_opts;

    return fetch(uri, options)
        .then(function (response) {
            if (response.status >= 400) {
                var error = new Error("Bad response from server");
                return callback(error);
            }
            return response.json();
        })
        .then(function (response) {
            return callback(null, response, response);
        }).catch((error) => {
            callback(error);
        });
};

// const nodeRequest = function(options, callback) => {
//
// }


/**
 * A builder of Action Creators
 * @param  {String} actionName The ActionCreator name
 * @param  {[type]} status     The Status of the Action
 * @return {Function}          The Action Creator Function
 */
const actionCreator = (actionName, status) => {
    const type = [status, 'request', actionName].join('_').toUpperCase();
    const action = (payload) => {
        payload = payload || {};
        payload.isLoading = isLoading(status);
        return {
            type: type,
            payload: payload
        }
    };
    return action;
};

/**
 * Creates the Default Action Creators
 * @param  {String} actionName The Action Creator Module Name
 * @return {Object}            Object with all the Action Creator Functions
 */
export const createDefaultActions = (actionName) => {
    const result = {};
    CONSTANTS.defaultStatus.forEach((status) => {
        const method = actionCreator(actionName, status);
        const methodName = status + 'Request' + actionName.charAt(0).toUpperCase() + actionName.slice(1);
        result[methodName] = method;
    });
    return result;
};

/**
 * Creates the Default Constants for the Action Creator Module
 * @param  {String} actionName The Action Creator Module Name
 * @return {Object}            Object with all the Constants
 */
export const createDefaultConstants = (actionName) => {
    const result = {};
    CONSTANTS.defaultStatus.forEach((status) => {
        const constName = [status, 'request', actionName].join('_').toUpperCase();
        result[constName] = constName;
    });
    return result;
};

/**
 * Return if the state should be marked as loading
 * @param  {String}  status The status of the Action Creator
 * @return {Boolean}        If should be loading or not
 */
const isLoading = (status) => {
    return (status === 'started');
};

const objectToQueryString = function (a) {
    var prefix, s, add, name, r20, output;
    s = [];
    r20 = /%20/g;
    add = function (key, value) {
        // If value is a function, invoke it and return its value
        value = ( typeof value == 'function' ) ? value() : ( value == null ? "" : value );
        s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
    };
    if (a instanceof Array) {
        for (name in a) {
            add(name, a[name]);
        }
    } else {
        for (prefix in a) {
            buildParams(prefix, a[prefix], add);
        }
    }
    output = s.join("&").replace(r20, "+");
    return output;
};
function buildParams(prefix, obj, add) {
    var name, i, l, rbracket;
    rbracket = /\[\]$/;
    if (obj instanceof Array) {
        for (i = 0, l = obj.length; i < l; i++) {
            if (rbracket.test(prefix)) {
                add(prefix, obj[i]);
            } else {
                buildParams(prefix + "[" + ( typeof obj[i] === "object" ? i : "" ) + "]", obj[i], add);
            }
        }
    } else if (typeof obj == "object") {
        // Serialize object item.
        for (name in obj) {
            buildParams(prefix + "[" + name + "]", obj[name], add);
        }
    } else {
        // Serialize scalar item.
        add(prefix, obj);
    }
};