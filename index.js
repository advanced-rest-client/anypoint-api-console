/**
 * This function returns a complete script to be placed in document body
 * to detect whether we are dealing with ES5 or ES6 client and
 * loads import file depending on the support.
 *
 * @param {String} bp Base path of the components
 * @return {String} A script to load.
 */
module.exports.importScript = function(bp) {
  return `
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
    var moduleRoot = '${bp}/';
    if (isEs6) {
      moduleRoot += 'es6-bundle';
    } else {
      moduleRoot += 'es5-bundle';
    }
    var script = document.createElement('script');
    var src = moduleRoot + '/bower_components/webcomponentsjs/webcomponents-loader.js';
    document.head.appendChild(script);
    var importFile = moduleRoot + '/import.html';
    var link = document.createElement('link');
    link.setAttribute('rel', 'import');
    link.setAttribute('href', importFile);
    document.head.appendChild(link);

    var polyfills = [];
    if (typeof Array.prototype.find === 'undefined') {
      polyfills.push('arc-polyfills/arc-polyfills.html');
    }
    if (typeof CryptoJS === 'undefined') {
      polyfills.push('cryptojs-lib/cryptojs-lib.html');
    }
    if (polyfills.length) {
      for (var i = 0, len = polyfills.length; i < len; i++) {
        var polyfillSrc = moduleRoot + '/bower_components/' + polyfills[i];
        var pscript = document.createElement('link');
        pscript.setAttribute('rel', 'import');
        pscript.setAttribute('href', polyfillSrc);
        if (document.readyState === 'loading') {
          document.write(pscript.outerHTML);
        } else {
          document.head.appendChild(pscript);
        }
      }
    }
    if (typeof window.URL === 'undefined') {
      var urlScript = document.createElement('script');
      urlScript.src = moduleRoot + '/bower_components/url-polyfill/url.js';
      if (document.readyState === 'loading') {
        document.write(newScript.urlScript);
      } else {
        document.head.appendChild(urlScript);
      }
    }

  })();
  `;
};
