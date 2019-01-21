#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const winston = require('winston');
const reactor = require('wc-reactor');
const buildLib = require('./build');
const {PolymerProject} = require('polymer-build');
const tmp = require('tmp');
/**
 * Anypoint build process for API Console.
 */
class AnypointConsoleBuild {
  /**
   * @constructor
   */
  constructor() {
    this.moduleDir = path.join(__dirname, '..');
    this.logger = this.__setupLogger();
  }
  /**
   * Creates a logger object to log debug output.
   * @return {Object}
   */
  __setupLogger() {
    const level = 'debug';
    const format = winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    );
    const logger = winston.createLogger({
      level,
      format,
      exitOnError: false,
      transports: [
        new winston.transports.Console()
      ]
    });
    return logger;
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
      'bower_components/webcomponentsjs/**.js',
      'bower_components/codemirror/mode/javascript/**.js',
      'bower_components/oauth-authorization/oauth-popup.html',
      'bower_components/prism-highlight/workers/**.js',
      'bower_components/prism/plugins/autolinker/prism-autolinker.min.js',
      'bower_components/prism/prism.js',
      'bower_components/prism/themes/prism.css',
      'bower_components/prism/components/**.js',
      'bower_components/xml-viewer/workers/**.js',
      'bower_components/codemirror/mode/**/**.js',
      'bower_components/cryptojs-lib/cryptojs-lib.html',
      'bower_components/cryptojslib/rollups/*.js',
      'bower_components/cryptojslib/components/*.js',
      'bower_components/arc-polyfills/arc-polyfills.html',
      'bower_components/arc-polyfills/polyfills.js',
      'bower_components/url/url-polyfill.html'
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
        'excludes': [
          'bower_components/paper-styles/default-theme.html',
          'bower_components/arc-polyfills/arc-polyfills.html',
          'bower_components/arc-polyfills/polyfills.js',
          'bower_components/url/url.js'
        ],
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
  /**
   * Theme file import definition.
   */
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
   * Creates a working directory where the files will be processed.
   *
   * @return {Promise} Resolved promise when the tmp dire was created
   * with path to the working
   * directory.
   */
  createWorkingDir() {
    return this.createTempDir()
    .then((path) => fs.realpath(path))
    .then((dir) => {
      this.logger.verbose('Created working directory ' + dir);
      this.workingDir = dir;
    });
  }
  /**
   * Cleans up the temporaty directory.
   * @return {Promise}
   */
  cleanup() {
    if (!this.workingDir) {
      return Promise.resolve();
    }
    this.logger.debug('Cleaning up temporaty dir...');
    return fs.pathExists(this.workingDir)
    .then((exists) => {
      if (exists) {
        this.logger.debug('Removing ' + this.workingDir);
        return fs.remove(this.workingDir);
      }
    });
  }
  /**
   * Creates a temp working dir for the console.
   * @return {Promise}
   */
  createTempDir() {
    this.logger.debug('Creating working directory...');
    return new Promise((resolve, reject) => {
      tmp.dir((err, _path) => {
        if (err) {
          reject(new Error('Unable to create a temp dir: ' + err.message));
        } else {
          resolve(_path);
        }
      });
    });
  }
  /**
   * Analyzes local package.json file (of target package / application)
   * and checks for `api-console` selection for configuration.
   *
   * This also sets `conf` property so it mus be called as a first method.
   */
  analyzePackage() {
    this.logger.info('Reading configuration from package.json file...');
    const file = './package.json';
    let pkg;
    try {
      let content = fs.readFileSync(file, 'utf8');
      pkg = JSON.parse(content);
    } catch (e) {
      this.logger.info('No configuration found. Setting defaults.');
      this.conf = this.createConfig();
      return;
    }
    const conf = pkg['api-console'];
    if (conf) {
      this.logger.info('Found API console configuration in package.json file.');
    }
    this.conf = this.createConfig(conf);
    this.logger.info('Configuration set.');
  }
  /**
   * Creates build configuration.
   * @param {?Object} defaults User defined parameters
   * @return {Object} Configuration options including defaults.
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
    config.importFile = this.entryPoint;
    /**
     * A place where to output build bundles.
     * Note, this location is removed when performing the build.
     */
    if (defaults.out) {
      config.out = defaults.out;
    } else {
      config.out = path.join(this.moduleDir, 'build');
    }
    /**
     * Output path for generated React components.
     * It defaults to `out` configuration property.
     */
    if (defaults['react-out']) {
      config.reactOut = defaults['react-out'];
    } else {
      config.reactOut = config.out;
    }
    /**
     * A list of extra dependencies to add to the final build.
     * This dependencies are not getting into the build but rather to
     * `bower_components` directory.
     * Any list of extra dependencies is added to the default list.
     */
    config.extraDependencies = this.defaultExtraDepenedencies;
    if (defaults.extraDependencies &&
      defaults.extraDependencies instanceof Array) {
      config.extraDependencies =
        config.extraDependencies.concat(defaults.extraDependencies);
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
     * Otherwise set this to `true` to include
     * `advanced-rest-client/oauth-authorization` component into the build
     */
    if (defaults.addApiOAuthComponents) {
      config.addApiOAuthComponents = true;
    }
    /**
     * OAuth1 component requires Crypto JS library which is not loaded
     * by default.
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
  /**
   * Lists all APIC dependencies to be included into `import.html` file.
   * This components automatically are included into each build bundle.
   */
  listDependencies() {
    let imports = this.commonImports;
    if (this.conf.useFragments) {
      imports = imports.concat(this.fragmentsImportsData);
    } else {
      imports = imports.concat(this.consoleImportsData);
    }
    const bc = 'bower_components/';
    if (this.conf.addApiOAuthComponents) {
      imports.push(bc + 'oauth-authorization/oauth-authorization.html');
      this.logger.info('Adding OAuth authorization to the dependencies.');
    }
    if (this.conf.addCryptoJs) {
      imports.push(bc + 'cryptojs-lib/cryptojs-lib.html');
      this.logger.info('Adding CryptoJS to the dependencies.');
    }
    if (this.conf.addJsPolyfills) {
      imports.push(bc + 'arc-polyfills/arc-polyfills.html');
      this.logger.info('Adding Polyfills to the dependencies.');
    }
    if (this.conf.addXhrRequest) {
      imports.push(bc + 'xhr-simple-request/xhr-simple-request.html');
      this.logger.info('Adding XHR to the dependencies.');
    }
    // Theme import MUST be the last one or any other component can
    // override common variables.
    imports.push(this.themeImport);
    this.buildImports = imports;
    this.logger.info('Dependencies list set.');
    this.logger.info(imports.join(', '));
  }
  /**
   * Creates and saves `import.html` file.
   */
  buildImport() {
    this.logger.info('Building import.html file...');
    let txt = '';
    this.buildImports.forEach((item) => txt += this._buildImportLink(item));
    this.logger.debug('Writing import file.\n' + txt);
    fs.writeFileSync(path.join(this.workingDir, this.conf.importFile), txt, 'utf8');
  }
  /**
   * Creates a `link[rel="import"]` entry for the inport file
   *
   * @param {String} location Component location
   * @return {String}
   */
  _buildImportLink(location) {
    return `<link rel="import" href="${location}">\n`;
  }
  /**
   * Creates a `polymer.json` configuration file to the build command.
   */
  buildPolymerConfig() {
    this.logger.info('Creating configuration for Polymer builder...');
    const cnf = {
      entrypoint: this.conf.importFile,
      fragments: [],
      sources: ['bower.json'],
      extraDependencies: this.conf.extraDependencies,
      lint: {
        rules: ['polymer-2']
      },
      builds: this.conf.builds,
      root: this.workingDir
    };
    this.projectConfig = cnf;
  }
  /**
   * Installs bower dependencies.
   *
   * @return {Promise}
   */
  install() {
    this.logger.info('Installing bower dependencies...');
    const Logger = require('bower-logger');
    const log = new Logger();
    log.on('log', (info) => {
      let name;
      if (info.data && info.data.endpoint) {
        name = info.data.endpoint.name + '#' + info.data.endpoint.target;
      }
      this.logger.verbose(`bower ${name}       ${info.id} ${info.message}`);
    });
    log.on('info', (info) => {
      let name;
      if (info.data && info.data.endpoint) {
        name = info.data.endpoint.name + '#' + info.data.endpoint.target;
      }
      this.logger.info(`bower ${name}       ${info.id} ${info.message}`);
    });
    log.on('warn', (info) => {
      this.logger.warn(`bower       ${info.id} ${info.message}`);
    });
    log.on('error', (info) => {
      this.logger.error(`bower       ${info.id} ${info.message}`);
    });
    const install = require('bower/lib/commands/install');
    return install(log, undefined, {
      // cwd: this._workingDir,
      verbose: true,
      loglevel: 'debug',
      silent: false
    }, {
      cwd: this.workingDir,
      verbose: true,
      loglevel: 'debug',
      silent: false
    })
    .then(() => {
      this.logger.info('Bower dependencies ready.');
    });
  }
  /**
   * Runs `polymer build` in working directory.
   *
   * TODO: This may be customized with `polymer-build`.
   * @return {Promise}
   */
  build() {
    this.logger.info('Running main build process...');
    const cwd = process.cwd();
    process.chdir(this.workingDir);
    const polymerProject = new PolymerProject(this.projectConfig);
    const promises = polymerProject.config.builds.map((buildOptions) => {
      return buildLib(buildOptions, polymerProject, this.logger, this.workingDir);
    });
    return Promise.all(promises)
    .then(() => {
      process.chdir(cwd);
      this.logger.info('Main build process finished.');
    })
    .catch((cause) => {
      process.chdir(cwd);
      throw cause;
    });
  }
  /**
   * Creates a React component from the import file.
   *
   * @return {Promise}
   */
  react() {
    this.logger.info('Creating React wrappers.');
    let reactNames;
    if (this.conf.useFragments) {
      reactNames = [
        'raml-aware',
        'api-navigation',
        'api-request-panel',
        'api-documentation'
      ];
    } else {
      reactNames = ['raml-aware', 'api-console'];
    }
    return reactor({
      webComponent: path.join(this.workingDir, this.conf.importFile),
      dest: path.join(this.workingDir, 'build'),
      bundle: true,
      bundleName: 'ApiConsole.js',
      reactComponents: reactNames
    })
    .then(() => {
      this.logger.info('React wrappers ready.');
    });
  }
  /**
   * Polymer CLI doesn't have "output" option so it creates a buid in current
   * _workingDir. This copies the build files to whatever was set in
   * configuration file.
   *
   * @return {Promise}
   */
  buildDest() {
    this.logger.info('Copying files to final destination.');
    const localBuild = path.join(this.workingDir, 'build');
    return fs.readdir(localBuild)
    .then((data) => {
      const p = data.map((item) => {
        const from = path.join(localBuild, item);
        const to = path.join(this.conf.out, item);
        return this._replacePath(from, to);
      });
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
    const toPath = path.dirname(to);
    return fs.ensureDir(toPath)
    .then(() => fs.pathExists(to))
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
    this.logger.info('Clearing output directory...');
    return fs.pathExists(this.conf.out)
    .then((exists) => {
      if (exists) {
        return fs.remove(this.conf.out);
      }
    });
  }
  /**
   * Compies missing libraries from the build.
   * Polymer build does not copy prism.js library (probably because it compiles
   * it to an empty file). It has to be done manually.
   *
   * @return {Promise}
   */
  copyMissing() {
    this.logger.info('Copying dependencies not included into the build...');
    const buildPath = path.join(this.workingDir, 'build');
    return this.getFolders(buildPath)
    .then((buildFolders) => {
      const libs = [];
      buildFolders.forEach((item) => {
        libs.push([
          path.join(this.workingDir, 'bower_components', 'prism', 'prism.js'),
          path.join(item, 'bower_components', 'prism', 'prism.js')
        ]);
      });
      return libs.map((data) => fs.copy(data[0], data[1]));
    });
  }
  /**
   * Returns a list of folders in a given location
   * @param {String} location Location to search for folders.
   * @return {Promise} Promise resolved to a listy of directories.
   */
  getFolders(location) {
    return fs.readdir(location)
    .then((objects) => {
      const p = objects.map((object) =>
        this.pathIfDir(path.join(location, object)));
      return Promise.all(p);
    })
    .then((dirs) => dirs.filter((item) => !!item));
  }
  /**
   * @param {String} location Location to a file or directory
   * @return {Promise} Passed location if the location is directory or
   * `undefined` if the location does not exists or is not a directory.
   */
  pathIfDir(location) {
    return fs.stat(location)
    .then((stat) => stat && stat.isDirectory())
    .then((isDir) => isDir ? location : undefined)
    .catch(() => {});
  }
  /**
   * Copies bower.json file to the temp location.
   * @return {Promise}
   */
  prepareWorkingDir() {
    const bowerSrc = path.join(this.moduleDir, 'bower.json');
    const bowerDesc = path.join(this.workingDir, 'bower.json');
    return fs.copy(bowerSrc, bowerDesc);
  }
  /**
   * Apparently Creates a temporary path location build location
   * where files are created.
   * @return {Promise}
   */
  makeDest() {
    const loc = path.join(this.workingDir, 'build');
    return fs.ensureDir(loc);
  }
}

let run = true;
if (process.env.npm_config_argv) {
  let arg;
  try {
    arg = JSON.parse(process.env.npm_config_argv);
  } catch (_) {}
  const orig = arg && arg.original;
  if (orig instanceof Array) {
    if (orig.findIndex((item) => item === '--skip-apic') !== -1) {
      run = false;
    }
  }
}
if (run) {
  const builder = new AnypointConsoleBuild();
  builder.createWorkingDir()
  .then(() => {
    builder.analyzePackage();
    builder.listDependencies();
    builder.buildImport();
    builder.buildPolymerConfig();
    builder.clearOut();
    return builder.prepareWorkingDir();
  })
  .then(() => builder.install())
  .then(() => builder.makeDest())
  .then(() => builder.build())
  .then(() => builder.react())
  .then(() => builder.buildDest())
  .then(() => builder.copyMissing())
  .then(() => builder.cleanup())
  .then(() => builder.end())
  .catch((cause) => builder.error(cause));
}
