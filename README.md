# Anypoint API console

The Anypoint styled API console..

## Usage

### Before you begin

Before you get started, you'll want to register with our private npm repository so you can download the Anypoint modules.

```
npm login --registry=https://nexus3.build.msap.io/repository/npm-internal/ --scope=@mulesoft
```

### Configure your project

Configure behavior of the build process by creating `"api-console"` entry in your `package.json` file.

List of all available options are in [lib/install.js](lib/install.js#L135) script.

### Exchange example (uses components)

```json
"api-console": {
  "useFragments": true,
  "addWebAnimationsApi": true,
  "addCryptoJs": true,
  "addApiOAuthComponents": true,
  "out": "public/api-console"
}
```

### DC example (uses API console application)

```json
"api-console": {
  "addXhrRequest": true,
  "addCryptoJs": true,
  "addApiOAuthComponents": true,
  "addWebAnimationsApi": true,
  "out": "public/api-console"
}
```

`useFragments` option tells the build script to not include whole API console
sources but rather `api-navigation`, `api-documentation` and `api-request-panel`
components.

Bundles and React components are located in your project directory under `public/api-console`.

### Optional dependencies

API Console does not include some of the libraries previously available in the default build. If your project already uses the dependency there's no need to include it into the build.

#### OAuth 1/2 authorization components

Use `addApiOAuthComponents` option to include them into the build.
Additionally you must add the following lines into the DOM:

```html
<oauth1-authorization></oauth1-authorization>
<oauth2-authorization></oauth2-authorization>
```

If your project do not uses fragments (uses `<api-console>` element) then this 2 lines are already included.

#### CryotoJS library

It is used with OAuth 1 authorization. Add `addCryptoJs` option to your configuration. No need to declare any use of the library.

#### JS polyfills

Add `addJsPolyfills` option when your project does not include any polyfills. APIC uses new Array and String APIs.

#### Request handling

API console comes with a library to run the request (`xhr-simple-request`). If your project do not handle `api-request` event then add `addXhrRequest` configuration option (required for APID).

### Adding Anypoint console to your project

Install anypoint-api-console as a dependency of your project. __Check for current snapshot version in the `package.json` file.__

```
$ npm i --save @mulesoft/anypoint-api-console#2.0.0-preview-9
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

### Adding new API for testing

Add your API to `/demo-apis/[api-folder]/[api-file].raml` location.

Next add entry to `files` map in `/demo-apis/models.js`:

```javascript
files.set(`${r}[api-folder]/[api-file].raml`, 'RAML 1.0');
```

Generate the model:

```
$ node demo-apis/model.js
```

And finally add entry to the dropdown in demo page (`index.html`):

```html
<paper-listbox slot="dropdown-content" id="enpointsList">
  ...
  <paper-item data-src="[api-file].json">My name</paper-item>
</paper-listbox>
```

Open or refresh index.html page (must be served from `http:`, not `file:`)
and the API is in dropdown menu on the right top.

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
