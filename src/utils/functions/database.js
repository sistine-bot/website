const firebase = require("firebase");

const fallbackDb = {
  ref: () => ({
    once: () => Promise.resolve({ val: () => null }),
    push: () => Promise.resolve(),
    set: () => Promise.resolve(),
    update: () => Promise.resolve()
  })
};

const database = new Proxy({}, {
  get(target, prop) {
    try {
      const db = (global.database) || firebase.database();
      const val = db[prop];
      return typeof val === 'function' ? val.bind(db) : val;
    } catch (e) {
      const val = fallbackDb[prop];
      return typeof val === 'function' ? val.bind(fallbackDb) : val;
    }
  }
});

module.exports = { database, fallbackDb };
