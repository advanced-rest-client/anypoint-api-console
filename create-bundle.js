const builder = require('api-console-builder')

builder({
  dest: './bundle',
  src: './',
  mainFile: './import.html',
  noOptimization: false,
  verbose: true
})
  .then(() => console.log('Build complete'))
  .catch(error => console.log('Build error', error.message))
