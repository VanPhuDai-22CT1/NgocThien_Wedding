const path = require('path');

module.exports = function override(config) {
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    assets: path.resolve(__dirname, 'src/assets'),
    component: path.resolve(__dirname, 'src/component'),
    pages: path.resolve(__dirname, 'src/pages'),
    style: path.resolve(__dirname, 'src/style'),
    utils: path.resolve(__dirname, 'src/utils'),
  };
  config.resolve.modules = [
    path.resolve(__dirname, 'src'),
    'node_modules',
    ...(config.resolve.modules || []),
  ];

  return config;
};