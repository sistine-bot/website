// market/database.js
const { getUserMoney, getUserInventory } = require('../../../src/utils/functions.js');
 
async function getMarketItems(database) {
  const snapshot = await database.ref('/economia/Market').once('value');
  const data = snapshot.val();
  return (data && data.itens) ? data.itens : [];
}

async function updateMarketItems(database, itemsArray) {
  await database.ref('economia/Market').update({ itens: itemsArray });
}

async function getUserInventoryItem(database, userId, itemDbName, itemInfoDb) {
  const snapshot = await database.ref(`economia/${userId}/inventario/itens${itemInfoDb}`).once('value');
  const data = snapshot.val();
  return (data && data[itemDbName]) ? data[itemDbName] : 0;
}

async function updateUserInventoryItem(database, userId, itemDbName, itemInfoDb, value) {
  await database.ref(`economia/${userId}/inventario/itens${itemInfoDb}`).update({
    [itemDbName]: value
  });
}

module.exports = {
  getMarketItems,
  updateMarketItems,
  getUserInventoryItem,
  updateUserInventoryItem
};