# Anypoint API console

The Anypoint styled API console..

## Usage

### Prerequisites

Before you get started, you'll want to register with our private npm repository so you can download the Anypoint modules.

```
npm login --registry=https://nexus3.build.msap.io/repository/npm-internal/ --scope=@mulesoft
```

### Adding Anypoint console to your project

Install anypoint-api-console as a dependency of your project

```
$ npm i --save @mulesoft/anypoint-api-console
```

The script installs latest version of the console and performs build optimized for production.
The assets are located in two bundles:

- build/es5-bundle
- build/es6-bundle

The `es5-bundle` contains bundled console for ES5 browsers (IE11, Safari 9)
that does not support web components natively and requires polyfills.
The other bundle is for browsers that support web components natively.

To make it easier to load proper bundle this module contains `import-detection.js`
script that can be included in the page sources to automatically include
proper bundle.

```html
<script>
window.apic = {
  basePath: '/path/to/console/assets/directory/' // <- trailing slash
};
</script>
<script src="node_modules/@mulesoft/api-console-assets/import-detection.js"></script>
```

Alternatively you can use module function that generates contents of a script
to be put in your project's main page:

## React application

```js
const apiConsole = require('@mulesoft/api-console-assets');
const publicRoot = await getPublicRoot();

export default function renderHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
    <script>
    ${apiConsole.importScript(publicRoot)}
    </script>
  </head>
  <body>
    <api-console></api-console>
  </body>
</html>
  `;
}
```

## Configuration

You can configure behavior of the build process by creating `"api-console"`
entry in your `package.json` file.

List of all available options are in [lib/install.js](lib/install.js#L114) script.

### Exchange example

```json
"api-console": {
  "useFragments": true,
  "addWebAnimationsApi": true,
  "out": "public/api-console"
}
```

### DC example

```json
"api-console": {
  "addXhrRequest": true,
  "addWebAnimationsApi": true,
  "out": "public/api-console"
}
```

`useFragments` option tells the build script to not include whole API console
sources but rather `api-navigation`, `api-documentation` and `api-request-panel`
components.

Bundles and React components are located in your project directory under `public/api-console`.

## Rebuilding the console

Add this command to your scripts entry of `package.json`:

```json
"build-console": "@mulesoft/anypoint-api-console"
```

and then run:

```
$ npm run build-console
```

## Development

```
git clone https://github.com/mulesoft/anypoint-api-console.git
cd anypoint-api-console
npm i
```

When ready run any web server in the directory to see demo page. You can, for example, use polymer-cli included in the module:

```
node_modules/.bin/polymer serve --open
```

## Versioning

You may notice that there's no fixed versioning of the console. It means that
each time this script runs it updates the components to newest version without
possibility to fix at any specific version of them. Well, this is exactly how released
API console behave for the last year.

Generally that is the point of this repository. It should ensure the same experience
of the console across all Anypoint applications. To do this there must be no specific
version fixing. Since application hosting the console does not rely of specific internal
API of the Console there's no reason for that.

API console components are fixed on minor version so it's safe to update the Console
whenever it's possible. You can be sure that components public API is the same. As long
as you are not using custom styling of the console (and you shouldn't!) then
you are always safe to upgrade the components.

## Issues reporting

Contact me directly on slack (Pawel Psztyc) or create a ticket here.
