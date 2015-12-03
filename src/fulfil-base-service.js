goog.provide('fulfil.base.Session');


goog.scope(function () {
  'use strict';

  /**
   * @param $http
   * @param $rootScope
   * @param $localStorage
   * @return {fulfil.base.Session}
   * @constructor
   */
  fulfil.base.Session = function ($http, $rootScope, $localStorage, $q) {
    /**
     * @private
     */
    this._http = $http;

    /**
     * @private
     */
    this._q = $q;

    /**
     * @private
     */
    this._rootScope = $rootScope;

    /**
     * @private
     */
    this._localStorage = $localStorage;

    /**
     * @private
     */
    this._sessionId = null;

    /**
     * @private
     */
    this.login = '';

    /**
     * @private
     */
    this._apiBasePath = '/api/1/';

    this.user = {};
  };

  var Session = fulfil.base.Session;

  Session.prototype.isLoggedIn = function () {
    return !!this._sessionId;
  };

  Session.prototype.doLogin = function (login, password) {
    this.login = login;  // Save login

    return this._http.post(
      this._apiBasePath + 'login',
      {
        login: login,
        password: password
      }
    ).success(function (result) {
      this._sessionId = result[1];
      this.getUserPreference();
    }.bind(this));
  };

  Session.prototype.doLogout = function () {
    // XXX: Perform clear session
    this.sessionId = null;
    this.user = {};
    this._rootScope.$broadcast('fulfil:logout');

    // TODO: Implement actual logout when its on server side.
    return this._q.when("logout");
  };

  Session.prototype.serverCall = function (url, method, params, data) {
    return this._http({
      method: method,
      url: this._apiBasePath + url,
      headers: {
        'x-session': this._sessionId
      },
      params: params,
      data: data || []
    })
    .error(function (reason) {
      if (reason.status == 401) {
        this._rootScope.$broadcast('fulfil:unauthorized');
      }
    }.bind(this));
  };

  Session.prototype.getUserPreference = function () {
    console.log("getting preference");
    return this.serverCall(
      'model/res.user/get_preferences',
      'PUT'
    )
    .success(function (result) {
      this.user.preference = result;
      angular.forEach([
        'name',
        'email',
      ], function (field_name) {
        console.log(field_name);
        this.user[field_name] = result[field_name];
      }.bind(this));
    }.bind(this));
  };

});
