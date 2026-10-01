const badgeManager = require('./badgeManager.js');
const experienceManager = require('./experienceManager.js');
const transactionManager = require('./transactionManager.js');
const punishmentHandler = require('./punishmentHandler.js');
const shiftEngine = require('./shiftEngine.js');
const commandBridge = require('./commandBridge.js');

module.exports = {
  badgeManager,
  experienceManager,
  transactionManager,
  punishmentHandler,
  shiftEngine,
  commandBridge,
  ...badgeManager,
  ...experienceManager,
  ...transactionManager,
  ...shiftEngine,
  ...commandBridge
};
