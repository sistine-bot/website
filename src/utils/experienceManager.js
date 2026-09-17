const { EmbedBuilder } = require('discord.js');
const firebase = require("firebase");
const emojiConfig = require("./emoji.js");

// Fallback do banco caso o Firebase ainda não esteja conectado
const fallbackDb = {
  ref: () => ({
    once: () => Promise.resolve({ val: () => null }),
    push: () => Promise.resolve(),
    set: () => Promise.resolve(),
    update: () => Promise.resolve(),
    transaction: (fn) => Promise.resolve({ committed: true, snapshot: { val: () => null } })
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

/**
 * ============================================================================
 * SISTEMA DE NÍVEIS & PROGRESSÃO QUADRÁTICA (GAME DESIGN BALANCED)
 * ============================================================================
 * Curva: XP = 100 * (Nível)^2
 * - Nível 1: 100 XP
 * - Nível 5: 2.500 XP
 * - Nível 10: 10.000 XP
 * - Nível 50: 250.000 XP
 */

const XP_BASE = 100;
const CHAT_COOLDOWN_MS = 60 * 1000;   // 1 ganho por minuto por usuário por servidor
const SLASH_COOLDOWN_MS = 30 * 1000;  // 30 segundos global para comandos slash gerais

// Caches em memória volátil de alta performance (Anti-Flood que poupa o Firebase)
const chatCooldownMap = new Map();     // Key: `${userId}:${guildId}` -> timestamp
const slashCooldownMap = new Map();    // Key: `${userId}` -> timestamp
const startedUsersCache = new Set();   // Set: `${userId}` -> usuários que já usaram /start
const unstartedUsersCache = new Map(); // Key: `${userId}` -> timestamp da última verificação negativa

// Rotina de limpeza periódica de memória a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, exp] of chatCooldownMap.entries()) {
    if (now - exp > CHAT_COOLDOWN_MS) chatCooldownMap.delete(key);
  }
  for (const [key, exp] of slashCooldownMap.entries()) {
    if (now - exp > SLASH_COOLDOWN_MS) slashCooldownMap.delete(key);
  }
  for (const [key, time] of unstartedUsersCache.entries()) {
    if (now - time > 60 * 1000) unstartedUsersCache.delete(key);
  }
}, 5 * 60 * 1000).unref();

/**
 * Retorna o XP necessário para passar do nível atual para o próximo.
 * @param {number} level Nível atual
 * @returns {number} Quantidade de XP necessária
 */
function getXpForNextLevel(level) {
  const currentLvl = Math.max(1, Math.floor(Number(level) || 0));
  return XP_BASE * Math.pow(currentLvl, 2);
}

/**
 * Mapeamento oficial de recompensas e liberações por nível no ecossistema Sistine
 */
const LEVEL_UNLOCKS = {
  1: [
    { type: 'job', name: 'Taxista (Salário ≈150-280)', emoji: '🚕' },
    { type: 'weapon', name: 'Glock (Tier 1)', emoji: '🔫' },
    { type: 'farm', name: 'Lote 1 de Cultivo', emoji: '🌱' },
    { type: 'ranch', name: 'Espaço 1 do Rancho & Galinha', emoji: '🐣' },
    { type: 'system', name: 'Reparo de Ferramentas Básicas (/recuperar)', emoji: '🛠️' }
  ],
  3: [
    { type: 'farm', name: 'Lote 2 de Cultivo (5.000 moedas)', emoji: '🌱' }
  ],
  4: [
    { type: 'ranch', name: 'Espaço 2 do Rancho (5.000 moedas)', emoji: '🏡' }
  ],
  5: [
    { type: 'job', name: 'Caminhoneiro (Salário ≈250-420)', emoji: '🚚' },
    { type: 'seed', name: 'Semente de Feijão', emoji: '🫘' }
  ],
  8: [
    { type: 'ranch', name: 'Espaço 3 do Rancho (12.000 moedas)', emoji: '🏡' }
  ],
  10: [
    { type: 'job', name: 'Gari (Salário ≈350-550)', emoji: '🗑️' },
    { type: 'seed', name: 'Semente de Cana-de-açúcar', emoji: '🎋' },
    { type: 'farm', name: 'Lote 3 de Cultivo (10.000 moedas)', emoji: '🌱' }
  ],
  12: [
    { type: 'ranch', name: 'Vaca Leiteira no Rancho (7.500 moedas)', emoji: '🐮' }
  ],
  13: [
    { type: 'system', name: 'Acesso Antecipado a Reparo Especial (/recuperar)', emoji: '🔧' }
  ],
  14: [
    { type: 'ranch', name: 'Espaço 4 do Rancho (25.000 moedas)', emoji: '🏡' }
  ],
  15: [
    { type: 'job', name: 'Entregador (Salário ≈450-700)', emoji: '🛵' },
    { type: 'seed', name: 'Semente de Cenoura', emoji: '🥕' },
    { type: 'farm', name: 'Lote 4 de Cultivo (20.000 moedas)', emoji: '🌱' },
    { type: 'weapon', name: 'MP5 (Tier 2)', emoji: '🔫' }
  ],
  20: [
    { type: 'job', name: 'Frentista (Salário ≈600-900 - 1ª Profissão Legal)', emoji: '⛽' },
    { type: 'seed', name: 'Semente de Abóbora', emoji: '🎃' },
    { type: 'farm', name: 'Lote 5 de Cultivo (35.000 moedas)', emoji: '🌱' },
    { type: 'ranch', name: 'Espaço 5 do Rancho (45.000 moedas)', emoji: '🏡' }
  ],
  22: [
    { type: 'ranch', name: 'Porco no Rancho (Produção de Bacon - 15.000 moedas)', emoji: '🐷' }
  ],
  25: [
    { type: 'job', name: 'Mecânico (Salário ≈750-1.150)', emoji: '👨‍🔧' },
    { type: 'farm', name: 'Lote 6 de Cultivo (50.000 moedas - Máximo)', emoji: '🌱' },
    { type: 'weapon', name: 'M4-A1 (Tier 3)', emoji: '🔫' }
  ],
  28: [
    { type: 'ranch', name: 'Espaço 6 do Rancho (70.000 moedas - Rancho Máximo)', emoji: '⭐' }
  ],
  30: [
    { type: 'job', name: 'Médico (Salário ≈950-1.450)', emoji: '👨‍⚕️' }
  ],
  40: [
    { type: 'weapon', name: 'Ak-47 (Tier 4 - Dano e Roubo Máximos)', emoji: '🔥' }
  ],
  50: [
    { type: 'job', name: 'Policial (Salário ≈1.250-1.750 - Carreira Máxima)', emoji: '👮' }
  ]
};

/**
 * Retorna os desbloqueios acumulados entre dois níveis.
 */
function getUnlocksBetween(startLevel, targetLevel) {
  const unlocks = [];
  for (let l = startLevel + 1; l <= targetLevel; l++) {
    if (LEVEL_UNLOCKS[l]) {
      unlocks.push(...LEVEL_UNLOCKS[l]);
    }
  }
  return unlocks;
}

/**
 * Consulta a preferência de alerta de level up no Firebase (Dashboard e Bot)
 * Caminho oficial: `users/{id}/settings/levelUpAlert: boolean`
 * Fallback retrocompatível: `economia/{id}/nível/notifyNível`
 */
async function isLevelUpAlertEnabled(userId) {
  try {
    const dashSnap = await database.ref(`users/${userId}/settings/levelUpAlert`).once('value');
    const dashVal = dashSnap.val();
    if (dashVal !== null && dashVal !== undefined) {
      return Boolean(dashVal);
    }

    const legacySnap = await database.ref(`economia/${userId}/nível/notifyNível`).once('value');
    const legacyVal = legacySnap.val();
    if (legacyVal === 0 || legacyVal === false) {
      return false;
    }

    return true; // Padrão: ativado
  } catch (err) {
    console.error('[ExperienceManager] Erro ao verificar settings de levelUpAlert:', err);
    return true;
  }
}

/**
 * Atualiza a preferência de alerta de level up
 */
async function setLevelUpAlert(userId, enabled) {
  const boolVal = Boolean(enabled);
  await database.ref(`users/${userId}/settings`).update({ levelUpAlert: boolVal });
  await database.ref(`economia/${userId}/nível`).update({ notifyNível: boolVal ? 1 : 0 });
  return boolVal;
}

/**
 * Verifica se o usuário já resgatou o /start para liberar ganho de XP e evolução de nível.
 * Utiliza cache volátil em memória (RAM) para poupar leituras no Firebase Realtime Database.
 * @param {string} userId ID do usuário no Discord
 * @returns {Promise<boolean>} Retorna true se o usuário já executou /start
 */
async function checkUserStarted(userId) {
  if (!userId) return false;
  const idStr = String(userId);

  // 1. Verificação rápida em RAM (Usuários verificados ou recém-iniciados)
  if (startedUsersCache.has(idStr)) return true;

  // 2. Proteção contra flood de leituras para usuários não iniciados (Cache negativo de 60s)
  const now = Date.now();
  const unstartedTime = unstartedUsersCache.get(idStr);
  if (unstartedTime && (now - unstartedTime < 60 * 1000)) {
    return false;
  }

  // 3. Consulta ao Firebase Realtime Database
  try {
    const kitSnap = await database.ref(`economia/${idStr}/starterKitClaimed`).once('value');
    if (kitSnap.val() === true) {
      startedUsersCache.add(idStr);
      unstartedUsersCache.delete(idStr);
      return true;
    }

    // Retrocompatibilidade: Se já possui nível >= 1 gravado no banco, considera iniciado
    const lvlSnap = await database.ref(`economia/${idStr}/nível/nível`).once('value');
    if (typeof lvlSnap.val() === 'number' && lvlSnap.val() >= 1) {
      startedUsersCache.add(idStr);
      unstartedUsersCache.delete(idStr);
      return true;
    }

    // Registra no cache negativo para evitar consultas repetidas em flood
    unstartedUsersCache.set(idStr, now);
    return false;
  } catch (err) {
    console.error('[ExperienceManager] Erro ao verificar status de inicialização (/start):', err);
    return false;
  }
}

/**
 * Marca o usuário como iniciado imediatamente no cache em memória.
 * Chamado logo após o resgate com sucesso do /start.
 * @param {string} userId ID do usuário
 */
function markUserStarted(userId) {
  if (!userId) return;
  const idStr = String(userId);
  startedUsersCache.add(idStr);
  unstartedUsersCache.delete(idStr);
}

/**
 * Dispara o alerta visual de Level Up quando o jogador sobe de nível
 */
async function handleLevelUp(context, user, oldLevel, newLevel, options = {}) {
  try {
    if (newLevel <= oldLevel) return;

    const alertEnabled = await isLevelUpAlertEnabled(user.id);
    if (!alertEnabled) return;

    const unlocks = getUnlocksBetween(oldLevel, newLevel);
    const nextReqXp = getXpForNextLevel(newLevel);

    let unlockText = '';
    if (unlocks.length > 0) {
      unlockText = `\n\n🎁 **Novos Desbloqueios Conquistados:**\n` +
        unlocks.map(u => `> ${u.emoji} **${u.name}**`).join('\n');
    } else {
      unlockText = `\n\n💡 *Continue evoluindo para desbloquear novas profissões, armas e lotes!*`;
    }

    const embed = new EmbedBuilder()
      .setColor('#f59e0b')
      .setAuthor({
        name: `🎉 Subida de Nível! Parabéns, ${user.username || user.tag}!`,
        iconURL: typeof user.displayAvatarURL === 'function' ? user.displayAvatarURL({ dynamic: true }) : undefined
      })
      .setDescription(
        `⭐ **Parabéns!** Você evoluiu do **Nível ${oldLevel}** para o **Nível ${newLevel}**!\n` +
        `📊 **Próximo Objetivo:** \`0 / ${new Intl.NumberFormat('pt-BR').format(nextReqXp)} XP\` para o **Nível ${newLevel + 1}**` +
        unlockText
      )
      .setFooter({ text: 'Sistine ・ Gerencie alertas em /nível ou no seu Dashboard' })
      .setTimestamp();

    // Roteamento inteligente de notificação conforme a origem
    if (options.isChat && context) {
      // Chat público: responde no canal atual onde a mensagem foi enviada
      if (typeof context.reply === 'function') {
        await context.reply({ embeds: [embed] }).catch(() => {
          if (context.channel?.send) context.channel.send({ embeds: [embed] }).catch(() => {});
        });
      } else if (context.channel?.send) {
        await context.channel.send({ embeds: [embed] }).catch(() => {});
      }
    } else if (options.isInteraction && context) {
      // Comandos Slash: envia de forma efêmera para não poluir o canal de comandos
      if (context.deferred || context.replied) {
        await context.followUp({ embeds: [embed], ephemeral: true }).catch(() => {});
      } else if (typeof context.reply === 'function') {
        await context.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
      }
    } else if (context && (context.deferred || context.replied)) {
      await context.followUp({ embeds: [embed], ephemeral: true }).catch(() => {});
    }
  } catch (err) {
    console.error('[ExperienceManager.handleLevelUp] Erro ao enviar aviso de level up:', err);
  }
}

/**
 * Concede XP ao usuário atomicamente no Firebase Realtime Database
 */
async function grantXpCore(context, user, rawXp, options = {}) {
  if (!user || !user.id || !rawXp || rawXp <= 0) return { success: false };

  // Trava Obrigatória: Só ganha XP e evolução de nível após utilizar /start
  const isStarted = await checkUserStarted(user.id);
  if (!isStarted) {
    return { success: false, skipped: true, reason: 'not_started' };
  }

  try {
    // 1. Aplica bônus de VIP caso ativo
    let multiplier = 1;
    try {
      const { CheckUserVip } = require('./functions.js');
      const vipInfo = await CheckUserVip(user);
      if (vipInfo?.isVip) {
        multiplier = (vipInfo.level >= 2) ? 3 : 2;
      }
    } catch (e) {
      // Fallback gracioso
    }

    const finalXpToAdd = Math.round(rawXp * multiplier);
    const nivelRef = database.ref(`economia/${user.id}/nível`);

    let levelUpData = null;

    // Transação Atômica no nó de nível para garantir consistência
    const transactionResult = await nivelRef.transaction((current) => {
      // Como o usuário já usou /start, o nível mínimo da progressão é 1
      const curLvl = (current && typeof current.nível === 'number' && current.nível >= 1) ? current.nível : 1;
      const curXp = (current && typeof current.xp === 'number') ? current.xp : 0;
      const totalXp = curXp + finalXpToAdd;

      let newLvl = curLvl;
      let remainingXp = totalXp;
      let needed = getXpForNextLevel(newLvl);

      // Suporte a subidas de múltiplos níveis caso receba grande montante de XP
      while (remainingXp >= needed) {
        remainingXp -= needed;
        newLvl += 1;
        needed = getXpForNextLevel(newLvl);
      }

      if (newLvl > curLvl) {
        levelUpData = { oldLevel: curLvl, newLevel: newLvl };
      }

      return {
        ...(current || {}),
        nível: newLvl,
        xp: remainingXp
      };
    });

    if (levelUpData) {
      await handleLevelUp(context, user, levelUpData.oldLevel, levelUpData.newLevel, options);
    }

    return {
      success: true,
      xpAdded: finalXpToAdd,
      multiplier,
      leveledUp: !!levelUpData,
      levelUpData
    };
  } catch (err) {
    console.error(`[ExperienceManager] Erro ao conceder XP para ${user.id}:`, err);
    return { success: false, error: err };
  }
}

/**
 * PROCESSADOR DE XP DE MENSAGENS (CHAT) COM ANTI-FLOOD DUPLO
 * - Ignora bots e webhooks
 * - Trava de Qualidade: Mínimo 5 caracteres úteis
 * - Trava de Cooldown: 1 ganho a cada 60s por usuário por servidor (Map em RAM)
 * - Valor: 15 a 25 XP aleatório (+ bônus VIP)
 */
async function grantChatXp(message) {
  if (!message || message.author?.bot || !message.guild || !message.content) {
    return { skipped: true, reason: 'invalid_message' };
  }

  // Trava 2 (Qualidade): Ignora mensagens com menos de 5 caracteres
  const cleanContent = message.content.trim();
  if (cleanContent.length < 5) {
    return { skipped: true, reason: 'too_short' };
  }

  // Trava 0 (Starter Check): Só ganha XP quem já resgatou o /start
  const isStarted = await checkUserStarted(message.author.id);
  if (!isStarted) {
    return { skipped: true, reason: 'not_started' };
  }

  // Trava 1 (Cooldown): 1 ganho por minuto por usuário em cada servidor
  const cacheKey = `${message.author.id}:${message.guild.id}`;
  const now = Date.now();
  const lastEarned = chatCooldownMap.get(cacheKey) || 0;

  if (now - lastEarned < CHAT_COOLDOWN_MS) {
    return { skipped: true, reason: 'cooldown' };
  }

  // Registra no cache de memória imediatamente ANTES de chamar o banco
  chatCooldownMap.set(cacheKey, now);

  const randomXp = Math.floor(Math.random() * 11) + 15; // 15 a 25 XP
  return await grantXpCore(message, message.author, randomXp, { isChat: true });
}

/**
 * PROCESSADOR DE XP DE COMANDOS SLASH GERAIS
 * - Trava de Cooldown: 30 segundos global por usuário
 * - Valor: 10 a 15 XP fixo (+ bônus VIP)
 */
async function grantSlashCommandXp(interaction) {
  if (!interaction || !interaction.user || interaction.user.bot) {
    return { skipped: true, reason: 'invalid_interaction' };
  }

  const userId = interaction.user.id;

  // Trava 0 (Starter Check): Só ganha XP quem já resgatou o /start
  const isStarted = await checkUserStarted(userId);
  if (!isStarted) {
    return { skipped: true, reason: 'not_started' };
  }

  const now = Date.now();
  const lastEarned = slashCooldownMap.get(userId) || 0;

  if (now - lastEarned < SLASH_COOLDOWN_MS) {
    return { skipped: true, reason: 'cooldown' };
  }

  slashCooldownMap.set(userId, now);

  const slashXp = Math.floor(Math.random() * 6) + 10; // 10 a 15 XP
  return await grantXpCore(interaction, interaction.user, slashXp, { isInteraction: true });
}

/**
 * PROCESSADOR DE XP DE AÇÕES DA ECONOMIA (TRABALHAR, MINIGAMES, COLHEITA, PESCA)
 * - Não tem cooldown fixo (atrelado à ação legítima executada)
 */
async function grantActionXp(context, user, xpAmount, actionName = 'economia') {
  return await grantXpCore(context, user, xpAmount, {
    isAction: true,
    actionName,
    isInteraction: context?.isCommand?.() || context?.isChatInputCommand?.()
  });
}

/**
 * Compatibilidade com o legado `XpUpdate(ctx, user, quantia)`
 */
async function XpUpdate(ctx, user, quantia = null) {
  if (!user) return;
  const xpAmount = (typeof quantia === 'number' && quantia > 0)
    ? quantia
    : Math.floor(Math.random() * 11) + 15;

  return await grantXpCore(ctx, user, xpAmount, {
    isInteraction: ctx?.isCommand?.() || ctx?.isChatInputCommand?.(),
    isChat: !ctx?.isCommand && !ctx?.isChatInputCommand && !!ctx?.author
  });
}

module.exports = {
  XP_BASE,
  CHAT_COOLDOWN_MS,
  SLASH_COOLDOWN_MS,
  LEVEL_UNLOCKS,
  getXpForNextLevel,
  getUnlocksBetween,
  isLevelUpAlertEnabled,
  setLevelUpAlert,
  handleLevelUp,
  checkUserStarted,
  markUserStarted,
  startedUsersCache,
  grantChatXp,
  grantSlashCommandXp,
  grantActionXp,
  XpUpdate
};
