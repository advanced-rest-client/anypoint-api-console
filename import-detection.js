/**
 * This file is to be included into the Exchange or other application
 * main page that serves the console so it can detect which build
 * to use.
 * ES6 enabled browsers will use es6 build and ES5 otherwise.
 */
(function() {
  'use strict';
  /**
   * Detects ES6 support by testing arrow functions.
   * It has to be executed in eval or otherwise the script would
   * throw syntax error and won't be executed at all.
   *
   * @return {Boolean} True if the browser is a moderm browser.
   */
  function detectEs6() {
    if (typeof Symbol === 'undefined') {
      return false;
    }
    try {
      eval('const foo = (x)=>x+1;');
      eval('class Foo {}');
    } catch (e) {
      return false;
    }
    return true;
  }
  var isEs6 = detectEs6();
  var moduleRoot = '/build/';
  if (isEs6) {
    moduleRoot += 'es6-bundle';
  } else {
    moduleRoot += 'es5-bundle';
  }
  var importFile = moduleRoot + '/import.html';
  var link = document.createElement('link');
  link.setAttribute('rel', 'import');
  link.setAttribute('href', importFile);
  document.head.appendChild(link);
})();
