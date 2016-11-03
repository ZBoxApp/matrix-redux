"use strict";
import {CONSTANTS} from "./constants";
import _ from 'lodash';


export const checkArguments = (args = []) => {
  args.forEach((variable, index) => {
    if (typeof variable === 'undefined') {
      throw new Error('Argument ' + (index + 1) + ' undefined');
    }
  });
};

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
                var error = new Error("Bad response from server: " + response.status);
                return callback(error);
            }
            return response.json();
        }).then(function (jsonResponse) {
            return callback(null, jsonResponse, jsonResponse);
        }).catch((error) => {
            callback(error);
        });
};

export const randomString = (size = 5) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  return _.sampleSize(chars, size).join('');
};

/**
 * Return a Logger method to use everywhere
 * @param {Object} loggerObject - A logger Object that response to console methods
 * @type {[type]}
 */
export const Logger = (loggerObject, logLevel) => {
  if (!loggerObject || typeof loggerObject !== 'object') {
    loggerObject = console;
  }
  logLevel = logLevel || 'INFO';
  return {
    log: logLevel => {
      if (logLevel === 'NONE') return (function(){});
      return loggerObject.log('INFO --- ', arguments)
    },
    error: () => {
      return loggerObject.error('ERROR --- ', arguments);
    },
    debug: logLevel => {
      if (logLevel === 'DEBUG')
        return loggerObject.log('DEBUG --- ', arguments);
    },
    warn: () => {
      return loggerObject.log('WARN ---', arguments);
    }
  }
}


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

