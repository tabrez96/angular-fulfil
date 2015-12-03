goog.provide('fulfil.base.module');

goog.require('fulfil.base.Session');


goog.scope(function (){
'use strict';

  /**
   * Module for Base Service
   */
  fulfil.base.module = angular.module(
    'fulfil.base', []
  );

  fulfil.base.module
    .service('Session', fulfil.base.Session);
});
