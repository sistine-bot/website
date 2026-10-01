const satoriProfile = require('./satoriProfile.js');
const satoriMinigames = require('./satoriMinigames.js');
const satoriItemTemplates = require('./satoriItemTemplates.js');
const ProfileTemplates = require('./ProfileTemplates.js');
const layoutSvgEngine = require('./layoutSvgEngine.js');

module.exports = {
  ...satoriProfile,
  ...satoriMinigames,
  ...satoriItemTemplates,
  ...ProfileTemplates,
  ...layoutSvgEngine,
  satoriProfile,
  satoriMinigames,
  satoriItemTemplates,
  ProfileTemplates,
  layoutSvgEngine
};
