//import polyfiil from 'es6-promise';
import matrixSDK from 'matrix-js-sdk';

export default class MatrixClient {
    static login(username, passwd, options, callback) {
        this.client = matrixSDK.createClient(options);
        this.client.loginWithPassword(username, passwd, (err, data) => {
            if (err) return callback(err);
            this.client._http.opts.accessToken = data.access_token;
    				this.client._http.opts.userId = data.user_id;
    				this.client._http.opts.refreshToken = data.refresh_token;
    				this.client._http.opts.deviceId = data.device_id;
            callback(null, data);
        });
    }

    static callApi() {
      const args = [].slice.call(arguments);
      const name = args.shift();
      return this.client[name](...args);
    }

};
