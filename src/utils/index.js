const functions = require('./functions/index.js');
const managers = require('./managers/index.js');
const rendering = require('./rendering/index.js');
const shop = require('./shop/shopCatalog.js');
const data = require('./data/index.js');
const core = require('./core/index.js');

module.exports = {
  functions,
  managers,
  rendering,
  shop,
  data,
  core,

  // Direct access to core functions
  ...functions,

  // Direct access to managers
  ...managers,

  // Direct access to rendering
  ...rendering,

  // Direct access to shop
  ...shop,

  // Direct access to data
  ...data,

  // Direct access to core
  ...core
};
