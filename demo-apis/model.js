const amf = require('amf-client-js');
const fs = require('fs');

amf.plugins.document.WebApi.register();
amf.plugins.document.Vocabularies.register();
amf.plugins.features.AMFValidation.register();

const files = new Map();
const r = 'demo-apis/';
files.set(`${r}demo-api/demo-api.raml`, 'RAML 1.0');
files.set(`${r}cardconnect-rest-api/cardconnect-rest-api.raml`, 'RAML 1.0');
files.set(`${r}catalog-api/catalog.raml`, 'RAML 1.0');
files.set(`${r}exchange-xapi/exchange-xapi.raml`, 'RAML 1.0');
files.set(`${r}loan-ms/loan-microservice.json`, 'OAS 2.0');
files.set(`${r}apic-98/apic-98.raml`, 'RAML 1.0');
files.set(`${r}apic-145/apic-145.raml`, 'RAML 1.0');
/**
 * Generates json/ld file from parsed document.
 *
 * @param {Object} doc
 * @param {String} file
 * @param {String} type type of source document
 * @return {Promise}
 */
function processFile(doc, file, type) {
  const generator = amf.Core.generator('AMF Graph', 'application/ld+json');
  console.log('Resolving', file);
  const r = amf.Core.resolver(type);
  doc = r.resolve(doc, 'editing');
  file = file.substr(file.lastIndexOf('/'));
  file = file.substr(0, file.lastIndexOf('.')) + '.json';
  console.log('Generating data', file);
  let genTime = Date.now();
  const opts = amf.render.RenderOptions().withSourceMaps.withCompactUris;
  return generator.generateString(doc, opts)
  // return generator.generateString(doc)
  .then((data) => {
    console.log('Generation took %d ms for %s', (Date.now() - genTime), file);
    fs.writeFileSync('demo-apis/models/' + file, data, 'utf8');
  });
}
/**
 * Parses file and sends it to process.
 *
 * @param {String} file File name in `demo` folder
 * @param {String} type Source file type
 * @return {String}
 */
function parseFile(file, type) {
  console.log('Parsing', file);
  const parser = amf.Core.parser(type, 'application/yaml');
  return parser.parseFileAsync(`file://${file}`)
  .then((doc) => processFile(doc, file, type));
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
