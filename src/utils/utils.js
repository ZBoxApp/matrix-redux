import isomorphicFetch from 'isomorphic-fetch';

if (typeof(fetch) === 'undefined') {
    fetch = isomorphicFetch;
}

export const fetchRequest = (obj, callback) => {
    const uri = obj.uri;
    obj.body = JSON.stringify(obj.body);
    // delete(obj.uri);
    // delete(obj._matrix_opts);
    // delete(obj.qs);
    // delete(obj.withCredentials);

    fetch(uri, obj)
        .then(function(response) {
            if (response.status >= 400) {
                var error = new Error("Bad response from server");
                return callback(error);
            }
            return response.json();

        })
        .then(function(response) {
            callback(null, response, response);
        }).catch((error) => {
            callback(error);
        });
};
