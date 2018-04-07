module.exports.polymerPolyfillScript = function(basePath) {
  return `
    <script>
      if (!window.customElements) {
        window.ShadyDOM = {
          force: true
        };
        window.ShadyCSS = {
          shimcssproperties: true
        };
      }
    </script>
    <script src="${basePath}/webcomponentsjs/webcomponents-loader.js"></script>
  `;
};

module.exports.imports = function(basePath) {
  return `
  <link rel="import" href="${basePath}/api-navigation/api-navigation.html">
  <link rel="import" href="${basePath}/api-request-panel/api-request-panel.html">
  <link rel="import" href="${basePath}/raml-aware/raml-aware.html">
  <link rel="import" href="${basePath}/iron-flex-layout/iron-flex-layout.html">
  <link rel="import" href="${basePath}/anypoint-styles/colors.html">
  <link rel="import" href="${basePath}/anypoint-styles/typography.html">
  <link rel="import" href="${basePath}/anypoint-styles/anypoint-theme.html">
  `;
};
