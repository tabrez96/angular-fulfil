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
    this._localStorage = $localStorage.$default({
      sessionId: null,
      user: {},
      login: ''
    });

    /**
     * @private
     */
    this._sessionId = null;


    /**
     * @private
     */
    this._apiBasePath = '/api/1/';

    /**
     * @public
     * Allow setting the _apiBasepath
     * 
     */
    Session.prototype.setApiBasePath = function (basePath){
      this._apiBasePath = basePath;
    };

    /**
     * @private
     * Load session from localstorage
     */
    this._load = function () {
      this._localStorage.$default({
        sessionId: null,
        user: {},
        login: ''
      });
      /**
       * @private
       */
      this._sessionId = this._localStorage.sessionId;
      this.login = this._localStorage.login;
      this.user = this._localStorage.user;
      this.userId = this._localStorage.userId;
    };

    this._load(); // Initialize
  };

  var Session = fulfil.base.Session;

  Session.prototype.isLoggedIn = function () {
    return !!this._sessionId;
  };

  Session.prototype.updateStorage = function () {
    this._localStorage.sessionId = this._sessionId;
    this._localStorage.user = this.user;
    this._localStorage.userId = this.userId;
    this._localStorage.login = this.login;
  };

  Session.prototype._clear = function () {
    this._localStorage.$reset({
      login: this.login
    });
    this._load();
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
      this.userId = result[0];
      this._sessionId = result[1];
      this.updateStorage();
      this.getUserPreference();
    }.bind(this));
  };

  Session.prototype.doLogout = function () {
    this._clear();
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
    .error(function (reason, status_code) {
      if (status_code == 401) {
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
      angular.forEach(['name', 'email'], function (field_name) {
        this.user[field_name] = result[field_name];
      }.bind(this));

      this.updateStorage();
    }.bind(this));
  };

});
