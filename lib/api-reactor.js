const reactor = require('wc-reactor');
reactor({
  // Polymer web component import file or Polymer bundle.
  webComponent: 'import.html',
  // Default destination where to put files.
  dest: './',
  // print a lot of stuff unto the console
  verbose: true,
  // Creates separate component definition for each module
  bundle: true
})
.then(() => console.log('Build complete <3'))
.catch((cause) => {
  console.error(cause);
  process.exit(1);
});
