const mergeStream = require('merge-stream');
const path = require('path');
const {forkStream, HtmlSplitter, getOptimizeStreams} = require('polymer-build');
const {dest} = require('vinyl-fs');
function pipeStreams(streams) {
  return Array.prototype.concat.apply([], streams)
    .reduce((a, b) => {
      return a.pipe(b);
    });
}
function waitFor(stream) {
  return new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}

const mainBuildDirectoryName = 'build';

module.exports = function(options, polymerProject, logger, workingDir) {
  const buildName = options.name || 'default';
  // If no name is provided, write directly to the build/ directory.
  // If a build name is provided, write to that subdirectory.
  const buildDirectory = path.join(mainBuildDirectoryName, buildName);
  logger.debug(`"${buildDirectory}": Building with options:`, options);
  // Fork the two streams to guarentee we are working with clean copies of each
  // file and not sharing object references with other builds.
  const sourcesStream = forkStream(polymerProject.sources());
  sourcesStream.on('error', (err) => console.error(err));
  const depsStream = forkStream(polymerProject.dependencies());
  depsStream.on('error', (err) => console.error(err));
  let buildStream = mergeStream(sourcesStream, depsStream);
  buildStream.on('error', (err) => console.error(err));
  const compiledToES5 = (options.js === undefined) ?
      false :
      options.js.compile === true || options.js.compile === 'es5' ||
          (typeof options.js.compile === 'object' &&
           options.js.compile.target === 'es5');
  if (compiledToES5) {
    buildStream =
        buildStream.pipe(polymerProject.addCustomElementsEs5Adapter());
    buildStream.on('error', (err) => console.error(err));
  }
  const bundled = !!(options.bundle);
  if (bundled) {
    const bundlerOptions = {
      rewriteUrlsInTemplates: false
    };
    if (typeof options.bundle === 'object') {
      Object.assign(bundlerOptions, options.bundle);
    }
    buildStream = buildStream.pipe(polymerProject.bundler(bundlerOptions));
    buildStream.on('error', (err) => console.error(err));
  }

  const htmlSplitter = new HtmlSplitter();
  const passedJsOpts = options.js || {};
  const jsOpts = Object.assign(passedJsOpts, {
    moduleResolution: polymerProject.config.moduleResolution
  });
  buildStream = pipeStreams([
    buildStream,
    htmlSplitter.split(),
    getOptimizeStreams({
      html: options.html,
      css: options.css,
      js: jsOpts,
      entrypointPath: polymerProject.config.entrypoint,
      rootDir: polymerProject.config.root,
    }),
    htmlSplitter.rejoin()
  ]);
  buildStream.on('error', (err) => console.error(err));

  buildStream.once('data', () => {
    logger.info(`(${buildName}) Building...`);
  });

  if (options.basePath) {
    let basePath = options.basePath === true ? buildName : options.basePath;
    if (!basePath.startsWith('/')) {
      basePath = '/' + basePath;
    }
    if (!basePath.endsWith('/')) {
      basePath = basePath + '/';
    }
    buildStream = buildStream.pipe(polymerProject.updateBaseTag(basePath));
    buildStream.on('error', (err) => console.error(err));
  }

  // Finish the build stream by piping it into the final build directory.
  buildStream = buildStream.pipe(dest(buildDirectory));
  buildStream.on('error', (err) => console.error(err));
  return waitFor(buildStream)
  .then(() => logger.info(`(${buildName}) Build complete!`));
};
