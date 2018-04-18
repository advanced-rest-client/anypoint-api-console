const amf = require('amf-client-js');
const fs = require('fs');

amf.plugins.document.WebApi.register();
amf.plugins.document.Vocabularies.register();
amf.plugins.features.AMFValidation.register();

const files = new Map();
const r = 'demo-apis/';
files.set(`${r}cardconnect-rest-api/cardconnect-rest-api.raml`, 'RAML 1.0');
files.set(`${r}catalog-api/catalog.raml`, 'RAML 1.0');
files.set(`${r}exchange-xapi/exchange-xapi.raml`, 'RAML 1.0');
/**
 * Generates json/ld file from parsed document.
 *
 * @param {Object} doc
 * @param {String} file
 * @return {Promise}
 */
function processFile(doc, file) {
  const generator = amf.Core.generator('AMF Graph', 'application/ld+json');
  const r = amf.Core.resolver('RAML 1.0');
  doc = r.resolve(doc, 'editing');
  file = file.substr(file.lastIndexOf('/'));
  file = file.substr(0, file.lastIndexOf('.')) + '.json';
  return generator.generateString(doc)
  .then((data) => fs.writeFileSync('demo-apis/models/' + file, data, 'utf8'));
}
/**
 * Parses file and sends it to process.
 *
 * @param {String} file File name in `demo` folder
 * @param {String} type Source file type
 * @return {String}
 */
function parseFile(file, type) {
  const parser = amf.Core.parser(type, 'application/yaml');
  return parser.parseFileAsync(`file://${file}`)
  .then((doc) => processFile(doc, file));
}

amf.Core.init().then(() => {
  const promises = [];
  for (const [file, type] of files) {
    promises.push(parseFile(file, type));
  }

  Promise.all(promises)
  .then(() => console.log('Success'))
  .catch((e) => console.error(e));
});
