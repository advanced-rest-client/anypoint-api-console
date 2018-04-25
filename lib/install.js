#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const {spawn} = require('child_process');
const reactor = require('wc-reactor');
/**
 * Anypoint build process for API Console.
 */
class AnypointConsoleBuild {
  constructor() {
    this._workingDir = path.join(__dirname, '..');
  }
  /**
   * Entry point to the API console application.
   */
  get entryPoint() {
    return 'import.html';
  }
  /**
   * List of "extraDependencies" as an entry in Polymer configuration file.
   * This lists all files that should be in bower_components directory after
   * the build.
   */
  get defaultExtraDepenedencies() {
    return [
      'bower_components/webcomponentsjs/webcomponents-lite.js',
      'bower_components/webcomponentsjs/webcomponents-loader.js',
      'bower_components/codemirror/mode/javascript/**.js',
      'bower_components/oauth-authorization/oauth-popup.html',
      'bower_components/prism-highlight/workers/**.js',
      'bower_components/prism/plugins/autolinker/prism-autolinker.min.js',
      'bower_components/prism/themes/prism.css',
      'bower_components/xml-viewer/workers/**.js',
      'bower_components/prism/components/**.js',
      'bower_components/codemirror/mode/**/**.js',
      'bower_components/cryptojs-lib/cryptojs-lib.html',
      'bower_components/cryptojslib/rollups/*.js',
      'bower_components/cryptojslib/components/*.js',
      'bower_components/arc-polyfills/arc-polyfills.html',
      'bower_components/url-polyfill/url.js'
    ];
  }
  /**
   * Configuration for default builds for Polymer.
   */
  get defaultBuilds() {
    return [
      {
        'name': 'es5-bundle',
        'preset': 'es5-bundled',
        'addServiceWorker': false,
        'addPushManifest': false,
        'insertPrefetchLinks': false,
        'excludes': ['bower_components/paper-styles/default-theme.html'],
        'stripComments': true
      },
      {
        'name': 'es6-bundle',
        'preset': 'es6-bundled',
        'addServiceWorker': false,
        'addPushManifest': false,
        'insertPrefetchLinks': false,
        'excludes': ['bower_components/paper-styles/default-theme.html'],
        'stripComments': true
      }
    ];
  }
  /**
   * List of imports that goes to both: fragments and not builds.
   */
  get commonImports() {
    return [
      'bower_components/raml-aware/raml-aware.html',
      'bower_components/iron-flex-layout/iron-flex-layout.html'
    ];
  }

  get themeImport() {
    return 'bower_components/anypoint-styles/anypoint-theme.html';
  }
  /**
   * Imports list relevant to API console full build.
   */
  get consoleImportsData() {
    return [
      'bower_components/api-console/api-console.html',
    ];
  }
  /**
   * Imports list relevant to console fragments (used by Exchange)
   */
  get fragmentsImportsData() {
    return [
      'bower_components/api-navigation/api-navigation.html',
      'bower_components/api-request-panel/api-request-panel.html',
      'bower_components/api-documentation/api-documentation.html'
    ];
  }
  /**
   * Analyzes local package.json file (of target package / application)
   * and checks for `api-console` selection for configuration.
   *
   * This also sets `conf` property so it mus be called as a first method.
   */
  analyzePackage() {
    const file = './package.json';
    let pkg;
    try {
      let content = fs.readFileSync(file, 'utf8');
      pkg = JSON.parse(content);
    } catch (e) {
      this.conf = this.createConfig();
      return;
    }
    const conf = pkg['api-console'];
    this.conf = this.createConfig(conf);
  }
  /**
   * Creates build configuration.
   * @param {?Object} defaults User defined parameters
   */
  createConfig(defaults) {
    if (!defaults) {
      defaults = {};
    }
    const config = {};
    /**
     * Exchange uses fragments instead of API console. Set to true to not
     * generate an import file for the whole API console but for navigation,
     * documentation and try it.
     */
    config.useFragments = defaults.useFragments || false;
    config.importFile = path.join(this._workingDir, this.entryPoint);
    /**
     * A place where to output data.
     */
    if (defaults.out) {
      config.out = defaults.out;
    } else {
      config.out = path.join(this._workingDir, 'build');
    }
    /**
     * A list of extra dependencies to add to the final build.
     * This dependencies are not getting into the build but rather to
     * `bower_components` directory.
     * Any list of extra dependencies is added to the default list.
     */
    config.extraDependencies = this.defaultExtraDepenedencies;
    if (defaults.extraDependencies && defaults.extraDependencies instanceof Array) {
      config.extraDependencies = config.extraDependencies.concat(defaults.extraDependencies);
    }
    /**
     * List of Polymer build build configurations.
     * https://www.polymer-project.org/2.0/docs/tools/polymer-json#builds
     */
    config.builds = defaults.builds || this.defaultBuilds;
    /**
     * If you have own way to authorize the use in OAuth1 and OAuth2
     * and want to handle `oauth2-token-requested` and `oauth1-token-requested`
     * to handle token exchange then do not set this value.
     * Otherwise set this to `true` to include `advanced-rest-client/oauth-authorization`
     * component into the build
     */
    if (defaults.addApiOAuthComponents) {
      config.addApiOAuthComponents = true;
    }
    /**
     * OAuth1 component requires Crypto JS library which is not loaded by default.
     * If your project does not uses this library already the you may want to
     * include it into the build.
     */
    if (defaults.addCryptoJs) {
      config.addCryptoJs = true;
    }
    /**
     * If set it adds `arc-polyfills` to the build file.
     * Normally any polyfills should be downloaded on demand using
     * capability detection so use it only when nothing else works.
     */
    if (defaults.addJsPolyfills) {
      config.addJsPolyfills = true;
    }
    /**
     * If set is adds `xhr-simple-request` to the import file.
     * Do not use this if you planning to handle `api-request`
     * event by your own in the application.
     */
    if (defaults.addXhrRequest) {
      config.addXhrRequest = true;
    }
    /**
     * Currently (April 2018) you probably want to add it as web animation API
     * has not yet landed in the Browsers. This is required by anumations
     * used in the console.
     *
     * TODO: This is required by `paper-dropdown-menu` elsement. Otherwise it
     * doesn't work. However, this version uses own implementation of
     * the component (but not internal paper-menu-button). If the element can
     * avoid using animations (Anypoint doesn't actually use animations) then
     * this option should be removed.
     */
    if (defaults.addWebAnimationsApi) {
      config.addWebAnimationsApi = true;
    }
    return config;
  }

  listDependencies() {
    let imports = this.commonImports;
    if (this.conf.useFragments) {
      imports = imports.concat(this.fragmentsImportsData);
    } else {
      imports = imports.concat(this.consoleImportsData);
    }
    if (this.conf.addApiOAuthComponents) {
      imports.push('bower_components/oauth-authorization/oauth-authorization.html');
    }
    if (this.conf.addCryptoJs) {
      imports.push('bower_components/cryptojs-lib/cryptojs-lib.html');
    }
    if (this.conf.addJsPolyfills) {
      imports.push('bower_components/arc-polyfills/arc-polyfills.html');
    }
    if (this.conf.addXhrRequest) {
      imports.push('bower_components/xhr-simple-request/xhr-simple-request.html');
    }
    // Theme import MUST be the last one or any other component can
    // override common variables.
    imports.push(this.themeImport);
    this.buildImports = imports;
  }
  /**
   * Builds import file for selected
   * @return {[type]} [description]
   */
  buildImport() {
    let txt = '';
    this.buildImports.forEach((item) => txt += this._buildImportLink(item));
    fs.writeFileSync(this.conf.importFile, txt, 'utf8');
  }

  _buildImportLink(location) {
    return `<link rel="import" href="${location}">\n`;
  }
  /**
   * Creates a `polymer.json` configuration file to the build command.
   *
   * @return {[type]} [description]
   */
  buildPolymerConfig() {
    const cnf = {
      entrypoint: this.conf.importFile,
      fragments: [],
      sources: ['bower.json'],
      extraDependencies: this.conf.extraDependencies,
      lint: {
        rules: ['polymer-2']
      },
      builds: this.conf.builds
    };
    const data = JSON.stringify(cnf, null, 2);
    fs.writeFileSync(path.join(this._workingDir, 'polymer.json'), data, 'utf8');
  }
  /**
   * Installs bower dependencies.
   *
   * @return {Promise}
   */
  install() {
    return new Promise((resolve, reject) => {
      const bower = spawn('bower', ['update'], {
        cwd: this._workingDir
      });
      bower.stdout.on('data', (data) => {
        console.log(` install: ${data}`);
      });

      bower.stderr.on('data', (data) => {
        console.error(` install: ${data}`);
      });

      bower.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Installation exited with code #{code}`));
        }
      });
    });
  }
  /**
   * Runs `polymer build` in current directory (script directory).
   *
   * TODO: This may be customized with `polymer-build`.
   * @return {Promise}
   */
  build() {
    return new Promise((resolve, reject) => {
      const cmd = spawn('polymer', ['build'], {
        cwd: this._workingDir
      });
      cmd.stdout.on('data', (data) => {
        console.log(` build: ${data}`);
      });
      cmd.stderr.on('data', (data) => {
        console.error(` build: ${data}`);
      });
      cmd.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Build exited with code #{code}`));
        }
      });
    });
  }
  /**
   * Creates a React component from the import file.
   *
   * @return {Promise}
   */
  react() {
    let reactNames;
    if (this.conf.useFragments) {
      reactNames = ['raml-aware', 'api-navigation', 'api-request-panel', 'api-documentation'];
    } else {
      reactNames = ['raml-aware', 'api-console'];
    }
    return reactor({
      webComponent: this.conf.importFile,
      dest: this.conf.out,
      bundle: true,
      bundleName: 'ApiConsole.js',
      reactComponents: reactNames
    });
  }
  /**
   * Polymer CLI doesn't have "output" option so it creates a buid in current
   * _workingDir. This copies the build files to whatever was set in
   * configuration file.
   */
  buildDest() {
    const localBuild = path.join(this._workingDir, 'build');
    if (this.conf.out === localBuild) {
      return Promise.resolve();
    }
    return fs.readdir(localBuild)
    .then((data) => {
      const p = data.map((item) => this._replacePath(path.join(localBuild, item), path.join(this.conf.out, item)));
      return Promise.all(p);
    });
  }
  /**
   * Replaces one file/dir with another.
   * It chacks if destination exists and if it does then it removes the path.
   * Then it performs move operation.
   *
   * @param {String} from
   * @param {String} to
   * @return {Promise}
   */
  _replacePath(from, to) {
    return fs.pathExists(to)
    .then((exists) => {
      if (exists) {
        return fs.remove(to);
      }
    })
    .then(() => fs.copy(from, to));
  }
  /**
   * Prints end build message.
   */
  end() {
    console.log('Build complete. <3');
  }
  /**
   * Renders error message in the console.
   *
   * @param {Error} error
   */
  error(error) {
    console.error(error);
  }
  /**
   * Clears the output directory.
   * @return {Promise}
   */
  clearOut() {
    return fs.pathExists(this.conf.out)
    .then((exists) => {
      if (exists) {
        return fs.remove(this.conf.out);
      }
    });
  }
  /**
   * Clears local build directory and bower_components.
   * @return {Promsie}
   */
  clearLocal() {
    const bc = path.join(this._workingDir, 'bower_components');
    const bu = path.join(this._workingDir, 'build');
    return fs.pathExists(bc)
    .then((exists) => {
      if (exists) {
        return fs.remove(bc);
      }
    })
    .then(() => fs.pathExists(bu))
    .then((exists) => {
      if (exists) {
        return fs.remove(bu);
      }
    });
  }
}

const builder = new AnypointConsoleBuild();
builder.analyzePackage();
builder.listDependencies();
builder.buildImport();
builder.buildPolymerConfig();
builder.clearOut()
.then(() => builder.clearLocal())
.then(() => builder.install())
.then(() => builder.build())
.then(() => builder.react())
.then(() => builder.buildDest())
.then(() => builder.end())
.catch((cause) => builder.error(cause));
