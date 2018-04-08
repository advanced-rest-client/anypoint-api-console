# Anypoint build of API console

The build to be used in Exchange, API designer or any Anypoint application.

It contains Restyled and customized version of the console to match Anypoint style guide.


## Usage

Install anypoint-api-console as a dependency of your project

```
$ npm i --save @mulesoft/anypoint-api-console
```

The install script will install current version of the console and perform
a build for production. The assets are located in two bundles:

- build/es5-bundle
- build/es6-bundle

The `es5-bundle` contains bundled console for ES5 browsers (IE11, Safari 9)
that does not support web components natively and requires polyfills.
The other bundle is for browsers that support web components natively.

To make it easier to load proper bundle this module contains `import-detection.js`
script that can be included in the page sources to automatically include
proper bundle.

```html
<script src="node_modules/@mulesoft/api-console-assets/build/es6-bundle/webcomponentsjs/webcomponents-loader.js"></script>
<script src="node_modules/@mulesoft/api-console-assets/import-detection.js"></script>
```

It doesn't matter from which bundle `webcomponents-loader.js` is loaded from.

And that's it. Console's sources are now loaded and ready to use.

## React application

```js
const apiConsole = require('@mulesoft/api-console-assets');
export default function renderHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
    ${apiConsole.preImportScript(publicRoot)}
    ${apiConsole.importScript(publicRoot)}
  </head>
  <body>
    <api-console></api-console>
  </body>
</html>
  `;
}
```
