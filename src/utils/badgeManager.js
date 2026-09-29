// src/utils/badgeManager.js
const { 
  DISCORD_FLAGS_MAP, 
  HYPESQUAD_HOUSES, 
  BADGE_LEVELS_CONFIG, 
  BOT_CUSTOM_BADGES_MAP,
  LEGACY_BADGE_URL_MAP 
} = require('./badgesMap.js');

// Caminhos padrão no Firebase Realtime Database
const DB_BADGES_PATH = 'Administração/Badges';
const DB_BADGES_CONFIG_PATH = 'config/badges';

// Cache em memória das badges dinâmicas do banco de dados
let dbBadgesCache = null;
let dbListenerAttached = false;
let lastCacheFetchTime = 0;
const CACHE_TTL_MS = 15000; // 15 segundos de cache

/**
 * Normaliza strings para busca e correspondência
 */
function normalizeStr(str) {
  return str ? String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';
}

/**
 * Constrói o catálogo padrão inicial a partir do badgesMap.js
 */
function buildDefaultCatalog() {
  const catalog = {};

  // 1. Flags Nativas do Discord
  Object.values(DISCORD_FLAGS_MAP).forEach((flag) => {
    catalog[flag.id] = {
      id: flag.id,
      name: flag.name,
      description: flag.description,
      icon: flag.icon,
      type: 'discord',
      category: 'discord',
      enabled: true,
      priority: 50,
      requires: 'discord_flag'
    };
  });

  // 2. Casas do HypeSquad
  Object.values(HYPESQUAD_HOUSES).forEach((house) => {
    catalog[house.id] = {
      id: house.id,
      name: house.name,
      description: house.description,
      icon: house.icon,
      type: 'discord',
      category: 'discord',
      enabled: true,
      priority: 60,
      requires: 'hypesquad'
    };
  });

  // 3. Badges com Níveis (Bug Hunter, Booster, VIP, Gifting, Streamer, Account Age)
  Object.values(BADGE_LEVELS_CONFIG).forEach((group) => {
    catalog[group.id] = {
      id: group.id,
      name: group.groupName || group.id,
      description: `Insígnia progressiva: ${group.groupName}`,
      icon: group.levels && group.levels[0] ? group.levels[0].icon : '',
      type: group.type || 'bot',
      category: group.type === 'discord' ? 'discord' : 'bot',
      enabled: true,
      priority: group.id === 'vip' ? 3 : (group.id === 'booster' ? 4 : 40),
      isTiered: true,
      levels: group.levels
    };
  });

  // 4. Badges Customizadas do Bot e Especiais
  Object.values(BOT_CUSTOM_BADGES_MAP).forEach((badge) => {
    const isBot = badge.type === 'bot';
    catalog[badge.id] = {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      type: badge.type || 'bot',
      category: isBot ? 'bot' : 'discord',
      enabled: true,
      priority: badge.id === 'owner' ? 1 : (badge.id === 'dev' ? 2 : (badge.id === 'married' ? 5 : 20)),
      requires: badge.id === 'owner' ? 'owner' : (badge.id === 'dev' ? 'dev' : (badge.id === 'married' ? 'married' : (badge.id === 'topmoney_badge' ? 'topmoney' : 'custom')))
    };
  });

  return catalog;
}

const DEFAULT_BADGES_CATALOG = buildDefaultCatalog();

/**
 * Inicializa o listener de tempo real do Firebase para atualizações no catálogo de badges
 */
function initBadgeManager(database) {
  if (!database || dbListenerAttached) return;

  try {
    const ref = database.ref(DB_BADGES_PATH);
    ref.on('value', (snapshot) => {
      const val = snapshot.val();
      if (val && typeof val === 'object') {
        dbBadgesCache = val;
      } else {
        dbBadgesCache = {};
      }
      lastCacheFetchTime = Date.now();
    }, (err) => {
      console.warn('[BadgeManager] Aviso ao sincronizar badges com Firebase:', err.message);
    });
    dbListenerAttached = true;
  } catch (err) {
    console.error('[BadgeManager] Erro ao registrar listener do Firebase:', err);
  }
}

/**
 * Busca todas as badges do banco de dados (com cache TTL e fallback para defaults)
 */
async function loadDbBadges(database) {
  if (dbBadgesCache && (Date.now() - lastCacheFetchTime < CACHE_TTL_MS)) {
    return dbBadgesCache;
  }

  if (!database) {
    return dbBadgesCache || {};
  }

  try {
    const snap = await database.ref(DB_BADGES_PATH).once('value').catch(() => null);
    const val = snap ? snap.val() : null;
    if (val && typeof val === 'object') {
      dbBadgesCache = val;
    } else {
      // Tenta fallback para config/badges caso exista dados legados
      const snapConfig = await database.ref(DB_BADGES_CONFIG_PATH).once('value').catch(() => null);
      const valConfig = snapConfig ? snapConfig.val() : null;
      if (valConfig && typeof valConfig === 'object') {
        dbBadgesCache = valConfig;
      } else {
        dbBadgesCache = {};
      }
    }
    lastCacheFetchTime = Date.now();
  } catch (e) {
    console.error('[BadgeManager] Falha ao carregar badges do DB:', e.message);
    if (!dbBadgesCache) dbBadgesCache = {};
  }

  return dbBadgesCache;
}

/**
 * Retorna o catálogo unificado de badges de forma síncrona a partir do cache e defaults
 */
function getCachedBadges(includeDisabled = false) {
  const catalog = { ...DEFAULT_BADGES_CATALOG };
  if (dbBadgesCache && typeof dbBadgesCache === 'object') {
    for (const [id, customConfig] of Object.entries(dbBadgesCache)) {
      if (!customConfig || typeof customConfig !== 'object') continue;
      if (customConfig.deleted === true) {
        delete catalog[id];
        continue;
      }
      catalog[id] = {
        ...(catalog[id] || {}),
        ...customConfig,
        id
      };
    }
  }

  if (includeDisabled) return catalog;

  const enabled = {};
  for (const [id, b] of Object.entries(catalog)) {
    if (b.enabled !== false) enabled[id] = b;
  }
  return enabled;
}

/**
 * Retorna o catálogo unificado de todas as badges (Defaults + DB Overrides + Novas Badges DB)
 * @param {any} database
 * @param {boolean} includeDisabled Se deve incluir badges com enabled: false (para admins)
 */
async function getAllBadges(database = null, includeDisabled = false) {
  const dbData = await loadDbBadges(database);
  const catalog = { ...DEFAULT_BADGES_CATALOG };

  // Aplica overrides e insere novas badges criadas no DB
  if (dbData && typeof dbData === 'object') {
    for (const [id, customConfig] of Object.entries(dbData)) {
      if (!customConfig || typeof customConfig !== 'object') continue;
      if (customConfig.deleted === true) {
        delete catalog[id];
        continue;
      }

      if (catalog[id]) {
        // Override parcial de propriedades configuradas via DB
        catalog[id] = {
          ...catalog[id],
          ...customConfig,
          id: id // garante ID correto
        };
      } else {
        // Nova badge 100% customizada criada pelo admin
        catalog[id] = {
          id: id,
          name: customConfig.name || id,
          description: customConfig.description || 'Badge customizada da Sistine.',
          icon: customConfig.icon || '/src/utils/assets/badges/diamond_badge.png',
          type: customConfig.type || 'bot',
          category: customConfig.category || (customConfig.type === 'discord' ? 'discord' : 'bot'),
          enabled: customConfig.enabled !== false,
          priority: customConfig.priority !== undefined ? customConfig.priority : 100,
          requires: customConfig.requires || 'custom',
          isCustomCreated: true,
          ...customConfig
        };
      }
    }
  }

  if (includeDisabled) {
    return catalog;
  }

  // Filtra apenas as que estão habilitadas globalmente
  const enabledCatalog = {};
  for (const [id, badge] of Object.entries(catalog)) {
    if (badge.enabled !== false) {
      enabledCatalog[id] = badge;
    }
  }

  return enabledCatalog;
}

/**
 * Busca uma badge por ID exato, nome ou correspondência aproximada
 */
async function findBadge(query, database = null, includeDisabled = true) {
  if (!query) return null;
  const rawQuery = String(query).trim().toLowerCase();
  const normalizedQuery = normalizeStr(rawQuery);
  const idFormatted = normalizedQuery.replace(/\s+/g, '_');

  const all = await getAllBadges(database, includeDisabled);
  const badgeList = Object.values(all);

  // 1. Correspondência exata por ID
  let match = badgeList.find(b => b.id.toLowerCase() === rawQuery || b.id.toLowerCase() === idFormatted);
  if (match) return match;

  // 2. Correspondência exata por Nome
  match = badgeList.find(b => normalizeStr(b.name) === normalizedQuery);
  if (match) return match;

  // 3. Começa com Nome ou ID
  match = badgeList.find(b => normalizeStr(b.name).startsWith(normalizedQuery) || b.id.toLowerCase().startsWith(idFormatted));
  if (match) return match;

  // 4. Contém (Includes) em Nome ou ID
  match = badgeList.find(b => normalizeStr(b.name).includes(normalizedQuery) || b.id.toLowerCase().includes(idFormatted));
  if (match) return match;

  return null;
}

/**
 * Salva ou atualiza uma badge no Firebase Database
 */
async function saveBadgeToDb(database, badgeData) {
  if (!database) throw new Error("Instância do banco de dados indisponível.");
  if (!badgeData || !badgeData.id) throw new Error("A badge precisa de um ID único.");

  const cleanId = String(badgeData.id).trim().replace(/[.#$/[\]]/g, '_');
  const now = Date.now();

  const payload = {
    id: cleanId,
    name: badgeData.name || cleanId,
    description: badgeData.description || 'Sem descrição.',
    icon: badgeData.icon || '/src/utils/assets/badges/diamond_badge.png',
    type: badgeData.type || 'bot',
    category: badgeData.category || (badgeData.type === 'discord' ? 'discord' : 'bot'),
    enabled: badgeData.enabled !== undefined ? Boolean(badgeData.enabled) : true,
    requires: badgeData.requires || 'custom',
    priority: Number(badgeData.priority || 50),
    updatedAt: now
  };

  if (badgeData.createdAt) {
    payload.createdAt = badgeData.createdAt;
  } else {
    payload.createdAt = now;
  }

  if (badgeData.levels && Array.isArray(badgeData.levels)) {
    payload.levels = badgeData.levels;
    payload.isTiered = true;
  }

  // Salva em Administração/Badges e espelha em config/badges
  await Promise.all([
    database.ref(`${DB_BADGES_PATH}/${cleanId}`).set(payload),
    database.ref(`${DB_BADGES_CONFIG_PATH}/${cleanId}`).set(payload)
  ]);

  if (dbBadgesCache) {
    dbBadgesCache[cleanId] = payload;
  }

  return payload;
}

/**
 * Remove / exclui uma badge do banco de dados
 */
async function deleteBadgeFromDb(database, badgeId) {
  if (!database) throw new Error("Instância do banco de dados indisponível.");
  if (!badgeId) throw new Error("ID da badge é obrigatório.");

  const cleanId = String(badgeId).trim().replace(/[.#$/[\]]/g, '_');

  await Promise.all([
    database.ref(`${DB_BADGES_PATH}/${cleanId}`).remove(),
    database.ref(`${DB_BADGES_CONFIG_PATH}/${cleanId}`).remove()
  ]);

  if (dbBadgesCache && dbBadgesCache[cleanId]) {
    delete dbBadgesCache[cleanId];
  }

  return true;
}

/**
 * Ativa ou desativa uma badge globalmente no sistema
 */
async function toggleGlobalBadge(database, badgeId, enabled) {
  if (!database) throw new Error("Instância do banco de dados indisponível.");
  const cleanId = String(badgeId).trim().replace(/[.#$/[\]]/g, '_');
  const boolVal = Boolean(enabled);

  await Promise.all([
    database.ref(`${DB_BADGES_PATH}/${cleanId}`).update({ enabled: boolVal, updatedAt: Date.now() }),
    database.ref(`${DB_BADGES_CONFIG_PATH}/${cleanId}`).update({ enabled: boolVal, updatedAt: Date.now() })
  ]);

  if (dbBadgesCache && dbBadgesCache[cleanId]) {
    dbBadgesCache[cleanId].enabled = boolVal;
  }

  return boolVal;
}

/**
 * Concede (desbloqueia) uma badge para um usuário específico
 */
async function giveUserBadge(database, userId, badgeId) {
  if (!database || !userId || !badgeId) throw new Error("Parâmetros inválidos.");
  const uId = String(userId);
  const bId = String(badgeId);

  const snap = await database.ref(`economia/${uId}/Perfil/Badges/customUnlocked`).once('value');
  let customUnlocked = snap.val();
  if (!Array.isArray(customUnlocked)) {
    if (customUnlocked && typeof customUnlocked === 'object') {
      customUnlocked = Object.keys(customUnlocked);
    } else if (typeof customUnlocked === 'string') {
      customUnlocked = [customUnlocked];
    } else {
      customUnlocked = [];
    }
  }

  if (!customUnlocked.includes(bId)) {
    customUnlocked.push(bId);
    await database.ref(`economia/${uId}/Perfil/Badges/customUnlocked`).set(customUnlocked);
    // Ativa por padrão ao receber
    await database.ref(`economia/${uId}/Perfil/Badges/display/${bId}`).set(true);
    await database.ref(`economia/${uId}/Perfil/Badges/active/${bId}`).set(true);
  }

  return customUnlocked;
}

/**
 * Concede TODAS as badges disponíveis para o usuário (Substitui o hardcode de devs!)
 */
async function giveAllBadgesToUser(database, userId) {
  if (!database || !userId) throw new Error("Parâmetros inválidos.");
  const uId = String(userId);

  const allBadgesCatalog = await getAllBadges(database, true);
  const allIds = Object.keys(allBadgesCatalog);

  // Adiciona também IDs de níveis se houver
  const fullBadgeList = [...allIds];
  Object.values(allBadgesCatalog).forEach(b => {
    if (b.levels && Array.isArray(b.levels)) {
      b.levels.forEach(lvl => {
        if (lvl.id && !fullBadgeList.includes(lvl.id)) fullBadgeList.push(lvl.id);
        if (lvl.flagId && !fullBadgeList.includes(lvl.flagId)) fullBadgeList.push(lvl.flagId);
      });
    }
  });

  const displayMap = {};
  fullBadgeList.forEach(id => {
    displayMap[id] = true;
  });

  await Promise.all([
    database.ref(`economia/${uId}/Perfil/Badges/customUnlocked`).set(fullBadgeList),
    database.ref(`economia/${uId}/Perfil/Badges/display`).update(displayMap),
    database.ref(`economia/${uId}/Perfil/Badges/active`).update(displayMap),
    database.ref(`economia/${uId}/Perfil/Badges/disabled`).set([])
  ]);

  return fullBadgeList;
}

/**
 * Remove uma badge de um usuário
 */
async function removeUserBadge(database, userId, badgeId) {
  if (!database || !userId || !badgeId) throw new Error("Parâmetros inválidos.");
  const uId = String(userId);
  const bId = String(badgeId);

  const snap = await database.ref(`economia/${uId}/Perfil/Badges/customUnlocked`).once('value');
  let customUnlocked = snap.val();
  if (Array.isArray(customUnlocked)) {
    customUnlocked = customUnlocked.filter(id => id !== bId);
  } else if (customUnlocked && typeof customUnlocked === 'object') {
    customUnlocked = Object.keys(customUnlocked).filter(id => id !== bId);
  } else {
    customUnlocked = [];
  }

  await Promise.all([
    database.ref(`economia/${uId}/Perfil/Badges/customUnlocked`).set(customUnlocked),
    database.ref(`economia/${uId}/Perfil/Badges/display/${bId}`).set(false),
    database.ref(`economia/${uId}/Perfil/Badges/active/${bId}`).set(false)
  ]);

  return customUnlocked;
}

/**
 * Remove todas as badges concedidas via customUnlocked de um usuário
 */
async function removeAllBadgesFromUser(database, userId) {
  if (!database || !userId) throw new Error("Parâmetros inválidos.");
  const uId = String(userId);

  await Promise.all([
    database.ref(`economia/${uId}/Perfil/Badges/customUnlocked`).set([]),
    database.ref(`economia/${uId}/Perfil/Badges/display`).remove(),
    database.ref(`economia/${uId}/Perfil/Badges/active`).remove(),
    database.ref(`economia/${uId}/Perfil/Badges/disabled`).set([])
  ]);

  return true;
}

/**
 * Define se uma badge está ativa (equipada) ou desativada (oculta) no perfil de um usuário
 */
async function setUserBadgeActive(database, userId, badgeId, active) {
  if (!database || !userId || !badgeId) throw new Error("Parâmetros inválidos.");
  const uId = String(userId);
  const bId = String(badgeId);
  const boolVal = Boolean(active);

  const snapDisabled = await database.ref(`economia/${uId}/Perfil/Badges/disabled`).once('value');
  let disabledList = snapDisabled.val();
  if (!Array.isArray(disabledList)) disabledList = [];

  if (boolVal) {
    disabledList = disabledList.filter(id => id !== bId);
  } else {
    if (!disabledList.includes(bId)) disabledList.push(bId);
  }

  await Promise.all([
    database.ref(`economia/${uId}/Perfil/Badges/display/${bId}`).set(boolVal),
    database.ref(`economia/${uId}/Perfil/Badges/active/${bId}`).set(boolVal),
    database.ref(`economia/${uId}/Perfil/Badges/${bId}`).set(boolVal),
    database.ref(`economia/${uId}/Perfil/Badges/disabled`).set(disabledList)
  ]);

  return boolVal;
}

module.exports = {
  DB_BADGES_PATH,
  DB_BADGES_CONFIG_PATH,
  DEFAULT_BADGES_CATALOG,
  initBadgeManager,
  getCachedBadges,
  getAllBadges,
  findBadge,
  saveBadgeToDb,
  deleteBadgeFromDb,
  toggleGlobalBadge,
  giveUserBadge,
  giveAllBadgesToUser,
  removeUserBadge,
  removeAllBadgesFromUser,
  setUserBadgeActive
};
