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



const objectToQueryString = function (a) {
  var prefix, s, add, name, r20, output;
  s = [];
  r20 = /%20/g;
  add = function (key, value) {
    // If value is a function, invoke it and return its value
    value = ( typeof value == 'function' ) ? value() : ( value == null ? "" : value );
    s[ s.length ] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
  };
  if (a instanceof Array) {
    for (name in a) {
      add(name, a[name]);
    }
  } else {
    for (prefix in a) {
      buildParams(prefix, a[ prefix ], add);
    }
  }
  output = s.join("&").replace(r20, "+");
  return output;
};


const buildParams = function (prefix, obj, add) {
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
      buildParams(prefix + "[" + name + "]", obj[ name ], add);
    }
  } else {
    // Serialize scalar item.
    add(prefix, obj);
  }
};
