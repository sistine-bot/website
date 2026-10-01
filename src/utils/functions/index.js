const { database, fallbackDb } = require('./database.js');
const {
  Format,
  sendError,
  ParseDuration,
  FormatDuration,
  NumberConvert
} = require('./formatters.js');
const {
  getUserMoney,
  getUserInventory,
  TransactionUpdate,
  UpdateMoneyWallet,
  UpdateMoneyBank,
  recordTransaction,
  buildTransactionString,
  resolveTransactionList,
  TRANSACTION_TYPES
} = require('./economy.js');
const {
  getUser,
  isStaff,
  getUserReps,
  ReputationUpdate,
  CheckUserCooldowns,
  CheckUserAntiRoubo,
  getCasamento,
  XpUpdate,
  getXpForNextLevel,
  checkUserStarted,
  markUserStarted
} = require('./users.js');
const {
  CheckUserVip,
  CheckUserBlacklisted,
  setUserBlacklist,
  removeUserBlacklist
} = require('./moderation.js');
const {
  getUserGlobalRank,
  getResolvedUserBadges,
  parseFirebaseList,
  badgeManager
} = require('./badges.js');
const { eventLog } = require('./logging.js');

module.exports = {
  // Formatters & Parsing
  Format,
  sendError,
  ParseDuration,
  FormatDuration,
  NumberConvert,

  // Economy & Transactions
  getUserMoney,
  getUserInventory,
  UpdateMoneyWallet,
  UpdateMoneyBank,
  TransactionUpdate,
  recordTransaction,
  buildTransactionString,
  resolveTransactionList,
  TRANSACTION_TYPES,

  // Users, Experience & Relationships
  getUser,
  isStaff,
  getUserReps,
  ReputationUpdate,
  CheckUserCooldowns,
  CheckUserAntiRoubo,
  getCasamento,
  XpUpdate,
  getXpForNextLevel,
  checkUserStarted,
  markUserStarted,

  // VIP & Moderation
  CheckUserVip,
  CheckUserBlacklisted,
  setUserBlacklist,
  removeUserBlacklist,

  // Badges & Ranking
  getUserGlobalRank,
  getResolvedUserBadges,
  parseFirebaseList,
  badgeManager,

  // Logging & Database
  eventLog,
  database,
  fallbackDb
};
