let badgesMap;
try {
  badgesMap = require('../shop/badgesMap.js');
} catch (e) {
  badgesMap = require('../badgesMap.js');
}

let badgeManager;
try {
  badgeManager = require('../managers/badgeManager.js');
} catch (e) {
  badgeManager = require('../badgeManager.js');
}

const { DISCORD_FLAGS_MAP, HYPESQUAD_HOUSES, BADGE_LEVELS_CONFIG, BOT_CUSTOM_BADGES_MAP } = badgesMap;
const { getAllBadges } = badgeManager;

const globalRankCache = new Map();
const globalRankInFlight = new Map();

async function getUserGlobalRank(database, userId, path = 'saldo/banco', cacheTtlMs = 60000) {
  if (!database) return { rank: "N/A", total: 0 };
  try {
    const cacheKey = path || 'saldo/banco';
    const now = Date.now();
    const cached = globalRankCache.get(cacheKey);

    if (cached && (now - cached.timestamp < cacheTtlMs)) {
      const index = cached.leaderboardMap.get(String(userId));
      return {
        rank: index !== undefined ? index + 1 : "N/A",
        total: cached.total
      };
    }

    if (globalRankInFlight.has(cacheKey)) {
      if (cached) {
        const index = cached.leaderboardMap.get(String(userId));
        return {
          rank: index !== undefined ? index + 1 : "N/A",
          total: cached.total
        };
      }
      const result = await globalRankInFlight.get(cacheKey);
      const index = result.leaderboardMap.get(String(userId));
      return {
        rank: index !== undefined ? index + 1 : "N/A",
        total: result.total
      };
    }

    const fetchPromise = (async () => {
      try {
        const snapshot = await database.ref('economia').once('value');
        const leaderboard = [];
        const pathParts = String(path).split('/');
        const rawVal = typeof snapshot?.val === 'function' ? snapshot.val() : snapshot;
        if (typeof snapshot?.forEach === 'function') {
          snapshot.forEach((child) => {
            if (child.key === 'assaltos') return;
            let val = typeof child.val === 'function' ? child.val() : child;
            for (const part of pathParts) {
              if (val && typeof val === 'object') {
                val = val[part];
              } else {
                val = 0;
                break;
              }
            }
            val = Number(val) || 0;
            if (val > 0) {
              leaderboard.push({ id: child.key, val: val });
            }
          });
        } else if (rawVal && typeof rawVal === 'object') {
          for (const [key, obj] of Object.entries(rawVal)) {
            if (key === 'assaltos') continue;
            let val = obj;
            for (const part of pathParts) {
              if (val && typeof val === 'object') {
                val = val[part];
              } else {
                val = 0;
                break;
              }
            }
            val = Number(val) || 0;
            if (val > 0) {
              leaderboard.push({ id: key, val: val });
            }
          }
        }

        leaderboard.sort((a, b) => b.val - a.val);
        const leaderboardMap = new Map();
        leaderboard.forEach((item, idx) => leaderboardMap.set(item.id, idx));

        const cacheData = {
          leaderboardMap,
          total: leaderboard.length,
          timestamp: Date.now()
        };
        globalRankCache.set(cacheKey, cacheData);
        return cacheData;
      } catch (err) {
        console.error("Erro ao atualizar cache de rank:", err);
        return cached || { leaderboardMap: new Map(), total: 0, timestamp: Date.now() };
      } finally {
        globalRankInFlight.delete(cacheKey);
      }
    })();

    globalRankInFlight.set(cacheKey, fetchPromise);

    if (cached) {
      const index = cached.leaderboardMap.get(String(userId));
      return {
        rank: index !== undefined ? index + 1 : "N/A",
        total: cached.total
      };
    }

    const result = await fetchPromise;
    const index = result.leaderboardMap.get(String(userId));
    return {
      rank: index !== undefined ? index + 1 : "N/A",
      total: result.total
    };
  } catch (e) {
    console.error("Erro ao buscar rank global:", e);
    return { rank: "N/A", total: 0 };
  }
}

function parseFirebaseList(rawData) {
  if (!rawData) return [];
  if (Array.isArray(rawData)) return rawData.filter(Boolean).map(String);
  if (typeof rawData === 'object') {
    const values = Object.values(rawData);
    if (values.every(v => typeof v === 'string')) return values;
    return Object.keys(rawData).filter(k => Boolean(rawData[k]));
  }
  if (typeof rawData === 'string') return [rawData];
  return [];
}

async function getResolvedUserBadges(userDiscordObj, firebaseDb, member = null, preloadedData = null) {
  const userId = String(userDiscordObj.id);

  let clientInstance = userDiscordObj.client || global.client;
  if (!clientInstance) {
    try {
      clientInstance = require('../../../index.js');
    } catch (e) {}
  }
  const isCreatorRole = Boolean(clientInstance?.config?.cargos?.criador?.includes(userId));
  const isDevRole = Boolean(clientInstance?.config?.cargos?.developer?.includes(userId));

  let userBadgesData = {};
  let vipData = {};

  if (preloadedData && (preloadedData.badges !== undefined || preloadedData.vip !== undefined)) {
    userBadgesData = preloadedData.badges || {};
    vipData = preloadedData.vip || {};
  } else if (firebaseDb) {
    const [badgesDbSnap, vipDbSnap] = await Promise.all([
      firebaseDb.ref(`/economia/${userId}/Perfil/Badges/`).once('value').catch(() => null),
      firebaseDb.ref(`/economia/${userId}/vip/`).once('value').catch(() => null)
    ]);
    userBadgesData = badgesDbSnap ? badgesDbSnap.val() || {} : {};
    vipData = vipDbSnap ? vipDbSnap.val() || {} : {};
  }

  const disabledBadges = parseFirebaseList(userBadgesData.disabled);
  const customUnlocked = parseFirebaseList(userBadgesData.customUnlocked);
  const selectedLevels = userBadgesData.selectedLevels || {};
  const selectedHypeSquad = userBadgesData.selectedHypeSquad || null;

  const displayMap = {
    ...(userBadgesData.display || {}),
    ...(userBadgesData.active && typeof userBadgesData.active === 'object' && !Array.isArray(userBadgesData.active) ? userBadgesData.active : {})
  };

  function isBadgeActive(badgeId, houseKey = null) {
    if (typeof displayMap[badgeId] === 'boolean') return displayMap[badgeId];
    if (typeof userBadgesData[badgeId] === 'boolean') return userBadgesData[badgeId];
    if (houseKey) {
      if (typeof displayMap[houseKey] === 'boolean') return displayMap[houseKey];
      if (typeof userBadgesData[houseKey] === 'boolean') return userBadgesData[houseKey];
    }
    if (disabledBadges.includes(badgeId) || (houseKey && disabledBadges.includes(houseKey))) return false;
    return true;
  }

  const allBadgesCatalog = await getAllBadges(firebaseDb, true).catch(() => ({}));

  const resolvedBadges = [];

  let userFlagsArray = [];
  if (userDiscordObj.flags && typeof userDiscordObj.flags.toArray === 'function') {
    userFlagsArray = userDiscordObj.flags.toArray();
  } else if (typeof userDiscordObj.fetchFlags === 'function') {
    const flags = await userDiscordObj.fetchFlags().catch(() => null);
    if (flags) userFlagsArray = flags.toArray();
  } else {
    userFlagsArray = parseFirebaseList(userDiscordObj.flags);
  }

  Object.values(DISCORD_FLAGS_MAP).forEach((badgeInfo) => {
    const dbConfig = allBadgesCatalog[badgeInfo.id] || {};
    if (dbConfig.enabled === false) return;

    const isUnlocked = userFlagsArray.includes(badgeInfo.id) || customUnlocked.includes(badgeInfo.id);
    if (isUnlocked) {
      resolvedBadges.push({
        ...badgeInfo,
        name: dbConfig.name || badgeInfo.name,
        description: dbConfig.description || badgeInfo.description,
        icon: dbConfig.icon || badgeInfo.icon,
        unlocked: true,
        active: isBadgeActive(badgeInfo.id)
      });
    }
  });

  let userHouseId = userFlagsArray.find(f => HYPESQUAD_HOUSES[f]);
  if (!userHouseId && selectedHypeSquad && HYPESQUAD_HOUSES[selectedHypeSquad] && customUnlocked.some(k => HYPESQUAD_HOUSES[k])) {
    userHouseId = selectedHypeSquad;
  }
  if (userHouseId && HYPESQUAD_HOUSES[userHouseId]) {
    const houseInfo = HYPESQUAD_HOUSES[userHouseId];
    const dbConfig = allBadgesCatalog[userHouseId] || allBadgesCatalog.hypesquad || {};
    if (dbConfig.enabled !== false) {
      resolvedBadges.push({
        ...houseInfo,
        name: dbConfig.name || houseInfo.name,
        description: dbConfig.description || houseInfo.description,
        icon: dbConfig.icon || houseInfo.icon,
        type: 'discord',
        unlocked: true,
        active: isBadgeActive(houseInfo.id, userHouseId)
      });
    }
  }

  const bugConfig = allBadgesCatalog.bug_hunter || BADGE_LEVELS_CONFIG.bug_hunter;
  if (bugConfig.enabled !== false) {
    const hasBug2 = userFlagsArray.includes('BugHunterLevel2') || customUnlocked.includes('bug_hunter_2') || customUnlocked.includes('BugHunterLevel2');
    const hasBug1 = userFlagsArray.includes('BugHunterLevel1') || customUnlocked.includes('bug_hunter_1') || customUnlocked.includes('BugHunterLevel1') || hasBug2;
    const bugMaxLevel = hasBug2 ? 2 : (hasBug1 ? 1 : 0);

    if (bugMaxLevel > 0) {
      const chosenLevelNum = Number(selectedLevels.bug_hunter) || bugMaxLevel;
      const finalLevel = Math.min(chosenLevelNum, bugMaxLevel);
      const levelsArray = bugConfig.levels || BADGE_LEVELS_CONFIG.bug_hunter.levels;
      const levelInfo = levelsArray.find(l => l.level === finalLevel) || levelsArray[0];

      resolvedBadges.push({
        id: BADGE_LEVELS_CONFIG.bug_hunter.id,
        name: levelInfo.name,
        description: levelInfo.description,
        icon: levelInfo.icon,
        type: 'discord',
        unlocked: true,
        active: isBadgeActive(BADGE_LEVELS_CONFIG.bug_hunter.id)
      });
    }
  }

  const boosterConfig = allBadgesCatalog.booster || BADGE_LEVELS_CONFIG.booster;
  if (boosterConfig.enabled !== false) {
    const isMemberBooster = Boolean(member && member.premiumSince);
    let calculatedBoosterLvl = Number(userBadgesData.boosterLevel) || 0;

    if (isMemberBooster && member.premiumSince) {
      const boostMonths = Math.max(1, Math.floor((Date.now() - new Date(member.premiumSince).getTime()) / (1000 * 60 * 60 * 24 * 30)));
      if (boostMonths >= 24) calculatedBoosterLvl = 9;
      else if (boostMonths >= 18) calculatedBoosterLvl = 8;
      else if (boostMonths >= 15) calculatedBoosterLvl = 7;
      else if (boostMonths >= 12) calculatedBoosterLvl = 6;
      else if (boostMonths >= 9) calculatedBoosterLvl = 5;
      else if (boostMonths >= 6) calculatedBoosterLvl = 4;
      else if (boostMonths >= 3) calculatedBoosterLvl = 3;
      else if (boostMonths >= 2) calculatedBoosterLvl = 2;
      else calculatedBoosterLvl = 1;
    }

    const hasBoosterUnlocked = isMemberBooster || customUnlocked.includes('booster') || customUnlocked.includes('server_booster');
    const boosterMaxLevel = hasBoosterUnlocked ? Math.max(calculatedBoosterLvl, 1) : 0;

    if (boosterMaxLevel > 0) {
      const chosenLevelNum = Number(selectedLevels.booster) || boosterMaxLevel;
      const finalLevel = Math.min(chosenLevelNum, boosterMaxLevel);
      const levelsArray = boosterConfig.levels || BADGE_LEVELS_CONFIG.booster.levels;
      const levelInfo = levelsArray.find(l => l.level === finalLevel) || levelsArray[0];

      resolvedBadges.push({
        id: BADGE_LEVELS_CONFIG.booster.id,
        name: levelInfo.name,
        description: levelInfo.description,
        icon: levelInfo.icon,
        type: 'bot',
        unlocked: true,
        active: isBadgeActive(BADGE_LEVELS_CONFIG.booster.id)
      });
    }
  }

  const vipConfig = allBadgesCatalog.vip || BADGE_LEVELS_CONFIG.vip;
  if (vipConfig.enabled !== false) {
    const isVipOuro = vipData.vip === 'ouro' || vipData.vip === 2 || customUnlocked.includes('vip_ouro');
    const isVipPrata = vipData.vip === 'prata' || vipData.vip === 1 || customUnlocked.includes('vip_prata') || isVipOuro;
    const vipMaxLevel = isVipOuro ? 2 : (isVipPrata ? 1 : 0);

    if (vipMaxLevel > 0) {
      const chosenLevelNum = Number(selectedLevels.vip) || vipMaxLevel;
      const finalLevel = Math.min(chosenLevelNum, vipMaxLevel);
      const levelsArray = vipConfig.levels || BADGE_LEVELS_CONFIG.vip.levels;
      const levelInfo = levelsArray.find(l => l.level === finalLevel) || levelsArray[0];

      resolvedBadges.push({
        id: BADGE_LEVELS_CONFIG.vip.id,
        name: levelInfo.name,
        description: levelInfo.description,
        icon: levelInfo.icon,
        type: 'bot',
        unlocked: true,
        active: isBadgeActive(BADGE_LEVELS_CONFIG.vip.id)
      });
    }
  }

  let userBankRank = preloadedData?.rankBanco;
  if (userBankRank === undefined && firebaseDb) {
    const rankRes = await getUserGlobalRank(firebaseDb, userId, 'saldo/banco').catch(() => ({ rank: "N/A" }));
    userBankRank = rankRes?.rank;
  }
  const numericBankRank = Number(userBankRank);
  const isTop5Rich = !isNaN(numericBankRank) && numericBankRank >= 1 && numericBankRank <= 5;

  const processedBadgeIds = new Set(resolvedBadges.map(b => b.id));
  processedBadgeIds.add('hypesquad_house');
  processedBadgeIds.add('HypeSquadOnlineHouse1');
  processedBadgeIds.add('HypeSquadOnlineHouse2');
  processedBadgeIds.add('HypeSquadOnlineHouse3');

  for (const [badgeId, badgeInfo] of Object.entries(allBadgesCatalog)) {
    if (processedBadgeIds.has(badgeId)) continue;
    if (badgeInfo.enabled === false) continue;
    if (badgeInfo.isTiered && ['bug_hunter', 'booster', 'vip'].includes(badgeId)) continue;

    let isUnlocked = customUnlocked.includes(badgeId);

    if (badgeId === 'owner') {
      isUnlocked = isCreatorRole || customUnlocked.includes('owner');
    } else if (badgeId === 'dev') {
      isUnlocked = isDevRole || customUnlocked.includes('dev');
    } else if (badgeId === 'married') {
      const isMarried = Boolean(preloadedData?.casamento?.casado || customUnlocked.includes('married'));
      isUnlocked = isMarried;
    } else if (badgeId === 'topmoney_badge') {
      isUnlocked = isTop5Rich || customUnlocked.includes('topmoney_badge');
    } else if (badgeId === 'supports_commands' && userDiscordObj.bot) {
      isUnlocked = true;
    } else if (badgeId === 'automod' && userDiscordObj.bot) {
      isUnlocked = true;
    }

    if (isUnlocked) {
      resolvedBadges.push({
        ...badgeInfo,
        id: badgeId,
        unlocked: true,
        active: isBadgeActive(badgeId)
      });
      processedBadgeIds.add(badgeId);
    }
  }

  const botBadgeIds = new Set([
    'owner',
    'dev',
    'vip',
    'booster',
    'married',
    'topmoney_badge',
    'diamond_badge'
  ]);
  const botPriorityOrder = ['owner', 'dev', 'vip', 'booster', 'married', 'topmoney_badge', 'diamond_badge'];

  resolvedBadges.sort((a, b) => {
    const isBotA = a.type === 'bot' || botBadgeIds.has(a.id);
    const isBotB = b.type === 'bot' || botBadgeIds.has(b.id);

    if (isBotA && !isBotB) return -1;
    if (!isBotA && isBotB) return 1;

    if (isBotA && isBotB) {
      const idxA = botPriorityOrder.indexOf(a.id);
      const idxB = botPriorityOrder.indexOf(b.id);
      const orderA = idxA === -1 ? (a.priority !== undefined ? a.priority : 99) : idxA;
      const orderB = idxB === -1 ? (b.priority !== undefined ? b.priority : 99) : idxB;
      return orderA - orderB;
    }

    return (a.priority || 50) - (b.priority || 50);
  });

  return resolvedBadges;
}

module.exports = {
  getUserGlobalRank,
  getResolvedUserBadges,
  parseFirebaseList,
  badgeManager
};
