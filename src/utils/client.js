//import polyfiil from 'es6-promise';
import matrixSDK from 'matrix-js-sdk';
import _ from 'lodash';

export default class MatrixClient {

  /** Create the Matrix Client
  * @param {Object} opts - Options to initialize Matrix Client
  * @param {Object} opts.store If not set, defaults to
  * {@link module:store/memory.MatrixInMemoryStore}.
  * @param {Object} opts.scheduler If not set, defaults to
  * {@link module:scheduler~MatrixScheduler}.
  **/
  static createClient(options) {
    this.client = matrixSDK.createClient(options);
  }

  static callApi() {
    const args = [].slice.call(arguments);
    const name = args.shift();
    if (args.length > 0) return this.client[name](...args);
    return this.client[name];
  }

  static logout(callback) {
    this.client.logout((err, data) => {
      if (err) return callback(err);
      // this.client = null;
      callback(null, data);
    })
  }

  /**
   * This method use the loginWithPassword from Matrix SDK to log
   * a user with a password
   * @param {String} userName - Matrix User Name
   * @param {String} userPassword - Matrix User Password
   * @param {Object} opts - Options to initialize Matrix Client
   * @param {Object} opts.store If not set, defaults to
   * {@link module:store/memory.MatrixInMemoryStore}.
   * @param {Object} opts.scheduler If not set, defaults to
   * {@link module:scheduler~MatrixScheduler}.
   * @param {requestFunction} opts.request If not set, defaults to the function
   * supplied to {@link request} which defaults to the request module from NPM.
   * @param {Function} callback - Callback to call when Finish
   **/
   static loginWithPassword(userName, userPassword, opts, callback) {
     this.createClient(opts);
     this.client.loginWithPassword(userName, userPassword, (err, data) => {
       if (err) return callback(err);
       this._updateMatrixClient(data);
       const formatedData = _.mapKeys(data, function (v, k) {return _.camelCase(k);});
       callback(null, formatedData);
     });
   }

    /**
     * High level helper method to call initialSync, emit the resulting events,
     * and then start polling the eventStream for new events. To listen for these
     * events, add a listener for {@link module:client~MatrixClient#event:"event"}
     * via {@link module:client~MatrixClient#on}.
     * @param {Object=} opts Options to apply when syncing.
     * @param {Number=} opts.initialSyncLimit The event <code>limit=</code> to apply
     * to initial sync. Default: 8.
     * @param {Boolean=} opts.includeArchivedRooms True to put <code>archived=true</code>
     * on the <code>/initialSync</code> request. Default: false.
     * @param {Boolean=} opts.resolveInvitesToProfiles True to do /profile requests
     * on every invite event if the displayname/avatar_url is not known for this user ID.
     * Default: false.
     *
     * @param {String=} opts.pendingEventOrdering Controls where pending messages
     * appear in a room's timeline. If "<b>chronological</b>", messages will appear
     * in the timeline when the call to <code>sendEvent</code> was made. If
     * "<b>detached</b>", pending messages will appear in a separate list,
     * accessbile via {@link module:models/room#getPendingEvents}. Default:
     * "chronological".
     *
     * @param {Number=} opts.pollTimeout The number of milliseconds to wait on /events.
     * Default: 30000 (30 seconds).
    **/

    static getSyncState() {
      return this.client.getSyncState();
    }

    /**
     * Update the MatrixClient.client with session information
     * @param {Object}  loginResult - Object returned after a successful login
     */
    static _updateMatrixClient(loginResult) {
      this.client._http.opts.userId = loginResult.user_id;
    	this.client._http.opts.refreshToken = loginResult.refresh_token;
      this.client._http.opts.accessToken = loginResult.access_token;
    	this.client._http.opts.deviceId = loginResult.device_id;
      this.client.credentials.userId = loginResult.user_id;
      this.client.deviceId = loginResult.device_id;
    }



};
