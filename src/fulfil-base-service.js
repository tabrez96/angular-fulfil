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
      login: '',
      subdomain: '',
      context: {},
    });

    /**
     * @private
     */
    this._sessionId = null;


    /**
     * @private
     */
    this.subdomain = '';
    this._apiBasePath = '/api/1/';
    this.apiBasePath = function() {
      if (this.subdomain) {
        return 'https://' + this.subdomain + '.fulfil.io' + this._apiBasePath;
      } else {
        return this._apiBasePath;
      }
    };

    Session.prototype.setSubDomain = function (subdomain){
      this.subdomain = subdomain;
    };

    /**
     * @private
     * Load session from localstorage
     */
    this._load = function () {
      this._localStorage.$default({
        sessionId: null,
        user: {},
        login: '',
        subdomain: '',
        context: {},
      });
      /**
       * @private
       */
      this._sessionId = this._localStorage.sessionId;
      this.login = this._localStorage.login;
      this.user = this._localStorage.user;
      this.userId = this._localStorage.userId;
      this.subdomain = this._localStorage.subdomain;
      this.context = this._localStorage.context;
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
    this._localStorage.subdomain = this.subdomain;
    this._localStorage.context = this.context;
  };

  Session.prototype._clear = function () {
    delete this._sessionId;
    delete this.userId;
    this.user = {};
    this.context = {};

    this.updateStorage();
  };

  Session.prototype.doLogin = function (login, password) {
    this.login = login;  // Save login

    return this._http.post(
      this.apiBasePath() + 'login',
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
      url: this.apiBasePath() + url,
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

  /**
   * @export
   * Load user context
   */
  Session.prototype.getUserContext = function () {
    return this.serverCall(
      'model/res.user/get_preferences',
      'PUT', null, [true]
    )
    .success(function (result) {
      this.context = result;
      this.updateStorage();
    }.bind(this));
  };

  /**
   * @export
   * Load user preference and context
   */
  Session.prototype.getUserPreference = function () {
    // Reload user context with UserPreferences
    this.getUserContext();

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
