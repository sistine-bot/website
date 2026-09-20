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
const ms = require('ms');
const parseMs = require('parse-ms');
const emojiConfig = require("../../src/utils/emoji.js");

// ==========================================
// DECLARAÇÃO DAS FUNÇÕES
// ==========================================

function Format(number, symbol = '') {
  return `${symbol} ${new Intl.NumberFormat().format(number)}`;
}

async function sendError(ctx, content, ephemeral = true) {
  const msg = `${emojiConfig.negativo} **|** ${content}`;
  try {
    if (ctx.isChatInputCommand?.()) {
      if (ctx.replied || ctx.deferred) {
        return await ctx.followUp({ content: msg, ephemeral });
      }
      return await ctx.reply({ content: msg, ephemeral });
    }
    return await ctx.reply({ content: msg });
  } catch (error) {
    console.error('[sendError]', error);
  }
}

async function eventLog(entity, Descrição, Footer, ConsoleLog, eventType = null) {
  if (!Descrição) Descrição = 'Nada definido';
  if (!Footer) Footer = 'Nada definido';

  console.log(ConsoleLog);
  
  // Descobre o servidor a partir da entidade (mensagem, canal, cargo, membro, etc)
  const guild = entity.guild || entity;
  if (!guild || !guild.id) return;

  const guildId = guild.id;

  try {
    const snapshot = await database.ref(`servers/${guildId}/events`).once('value');
    const config = snapshot.val() || {}; // Previne erro se estiver vazio

    // 1. Se o botão principal de Status estiver desligado, cancela tudo
    if (config.status === false) return;

    // 2. Filtro dos botões (Checkboxes individuais)
    if (eventType) {
      if (eventType === 'messageDelete' && config.trackMessageDelete === false) return;
      if (eventType === 'messageEdit' && config.trackMessageEdit === false) return;
      if (eventType === 'memberJoinLeave' && config.trackMemberJoinLeave === false) return;
      if (eventType === 'roleUpdate' && config.trackRoleUpdate === false) return;
      if (eventType === 'channelUpdate' && config.trackChannelCreateDelete === false) return;
      if (eventType === 'voiceStatus' && config.trackVoiceStatus === false) return;
    }

    // 3. REGISTRA NO TERMINAL DO PAINEL (Sempre registra se estiver ativado)
    let emojiStr = '🔔';
    let colorStr = 'text-teal-400';
    
    // Cores baseadas no tipo de ação
    if (ConsoleLog.includes('criado') || ConsoleLog.includes('entrou')) { emojiStr = '🟢'; colorStr = 'text-emerald-400'; }
    else if (ConsoleLog.includes('deletad') || ConsoleLog.includes('apagado') || ConsoleLog.includes('saiu') || ConsoleLog.includes('banido')) { emojiStr = '🔴'; colorStr = 'text-rose-400'; }
    else if (ConsoleLog.includes('editad') || ConsoleLog.includes('atualizado') || ConsoleLog.includes('alterado')) { emojiStr = '🔄'; colorStr = 'text-amber-400'; }

    const textStr = ConsoleLog.split('): ')[1] || ConsoleLog;
    const eventNameStr = ConsoleLog.split(' - (')[1]?.split(')')[0] || 'EVENTO';
    
    // Data nativa (sem precisar do moment.js para evitar crash)
    const timeStr = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    await database.ref(`servers/${guildId}/logs`).push({
      time: timeStr,
      emoji: emojiStr,
      event: eventNameStr,
      text: textStr,
      color: colorStr
    });

    // 4. ENVIA PARA O DISCORD (Somente se o usuário configurou um canal específico)
    if (config.channel) {
      let channel = guild.channels.cache.get(config.channel);
      
      // Validações de segurança antes de tentar mandar
      if (channel && channel.viewable && guild.members.me.permissions.has(['SendMessages', 'EmbedLinks'])) {
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
          .setDescription(Descrição)
          .setColor('#2b2d31') // Fundo escuro invisível
          .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) })
          .setTimestamp(Date.now());

        channel.send({ embeds: [embed] }).catch(() => { });
      }
    }

  } catch (error) {
    console.error('[eventLog] Erro ao processar sistema de logs:', error);
  }
}

function ParseDuration(text) {
  if (!text) return null;
  text = text.toLowerCase().trim();
  if (text === '0') return 0;

  const match = text.match(/^(\d+)\s*(min|h|d|w|m|y)$/);
  if (!match) return null;

  const value = Number(match[1]);
  const unit = match[2];

  const units = {
    min: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    m: 30 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000
  };

  return value * units[unit];
}

function FormatDuration(duration) {
  if (!duration) return "0 segundos";

  const match = String(duration).trim().toLowerCase().match(/^(\d+)\s*([yMwdhms])$/i);
  if (!match) return duration;

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  const units = {
    y: ["ano", "anos"],
    w: ["semana", "semanas"],
    m: ["mês", "meses"],
    d: ["dia", "dias"],
    h: ["hora", "horas"],
    s: ["segundo", "segundos"]
  };

  const text = units[unit];
  if (!text) return duration;

  return `${value} ${value === 1 ? text[0] : text[1]}`;
}

function NumberConvert(value = "0") {
  value = String(value).trim();
  const suffix = value.slice(-1).toLowerCase();

  if (suffix === "k") return parseFloat(value) * 1e3;
  if (suffix === "m" || value.slice(-2).toLowerCase() === "kk") return parseFloat(value) * 1e6;
  if (suffix === "b") return parseFloat(value) * 1e9;
  if (suffix === "t") return parseFloat(value) * 1e12;

  return Number(value);
}

async function getUserMoney(user) {
  try {
    if (!user) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (getUserMoney): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      throw new Error(errorMessage);
    }

    const snapshot = await database.ref(`/economia/${user.id}/saldo`).once('value');
    const data = snapshot.val() || {};

    return {
      carteira: data.carteira || 0,
      banco: data.banco || 0
    };
  } catch (error) {
    console.error('Erro ao obter saldo do usuário:', error);
    throw error;
  }
}

async function getUserInventory(user) {
  try {
    if (!user) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (getUserInventory): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      throw new Error(errorMessage);
    }

    const ConsumíveisSnap = await database.ref(`economia/${user.id}/inventario/itens/Consumíveis`).once('value');
    const cVal = ConsumíveisSnap.val() || {};

    const EquipamentosSnap = await database.ref(`economia/${user.id}/inventario/itens/Equipamentos`).once('value');
    const eVal = EquipamentosSnap.val() || {}; 

    return {
      ...cVal,
      ...eVal,
      Trigo: cVal.Trigo || 0,
      Milho: cVal.Milho || 0,
      Feijão: cVal.Feijão || 0,
      Cenoura: cVal.Cenoura || 0,
      Abóbora: cVal.Abóbora || 0,
      Ovo: cVal.Ovo || 0,
      Leite: cVal.Leite || 0,
      Bacon: cVal.Bacon || 0,
      ração_animal: cVal.ração_animal || 0,
      isca: cVal.isca || 0,
      peixe: cVal.peixe || 0,
      carne: cVal.carne || 0,
      CanaDeAçucar: cVal.CanaDeAçucar || 0,
      munição: cVal.munição || 0,
      backgroundticket: cVal.backgroundticket || 0,
      baús: cVal.baús || 0,
      chave: cVal.chave || 0,
      semente_trigo: cVal.semente_trigo || 0,
      semente_milho: cVal.semente_milho || 0,
      semente_feijao: cVal.semente_feijao || 0,
      semente_cana: cVal.semente_cana || 0,
      semente_cenoura: cVal.semente_cenoura || 0,
      semente_abobora: cVal.semente_abobora || 0,
      planta_podre: cVal.planta_podre || 0,
      armacaça: eVal.armacaça || 0,
      arma: eVal.arma || 0,
      porte: eVal.porte || 0,
      anelcasamento: eVal.anelcasamento || 0,
      vara: eVal.vara || 0,
      enxada: eVal.enxada || 0,
      regador: eVal.regador || 0
    };
  } catch (error) {
    console.error('Erro ao obter o inventário do usuário:', error.message);
  }
}

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

async function CheckUserVip(user) {
  const snapshot = await database.ref(`/economia/${user.id}/vip/`).once('value');
  const dataVal = snapshot.val() || {};

  const tempo = Number(dataVal.tempo || 0);
  const data = Number(dataVal.data || 0);
  let rawVip = dataVal.vip;

  let vipLevel = 0;
  if (typeof rawVip === 'string') {
    const low = rawVip.toLowerCase();
    if (low === 'ouro' || low === 'diamante' || low === 'premium+') vipLevel = 2;
    else if (low === 'prata' || low === 'premium') vipLevel = 1;
    else vipLevel = parseInt(rawVip) || 0;
  } else {
    vipLevel = Number(rawVip || 0);
  }

  // Verifica se o tempo expirou
  const isExpired = (data > 0 && tempo > 0 && (tempo - (Date.now() - data) <= 0));
  const isVip = vipLevel > 0 && !isExpired;

  let levelName = 'Nenhum';
  let emojiVip = '';
  let multiplier = 1;
  let ruralBonus = 0;
  let repairDiscount = 0;

  if (isVip) {
    if (vipLevel >= 2) {
      levelName = 'VIP Ouro';
      emojiVip = '<:vipDiamante:1061405543299821698>';
      multiplier = 2.0;
      ruralBonus = 0.40; // +40% na colheita e afeto
      repairDiscount = 0.50; // 50% de desconto no /recuperar
    } else {
      levelName = 'VIP Prata';
      emojiVip = '<:vipGold:1061405487628812358>';
      multiplier = 1.5;
      ruralBonus = 0.20; // +20% na colheita e afeto
      repairDiscount = 0.25; // 25% de desconto no /recuperar
    }
  }

  const remainingMs = isVip && data > 0 && tempo > 0 ? Math.max(0, tempo - (Date.now() - data)) : 0;
  const remainingDays = remainingMs > 0 ? Math.ceil(remainingMs / (1000 * 60 * 60 * 24)) : 0;

  return {
    infoVIP: isVip,
    isVip,
    vip: isVip ? vipLevel : 0,
    level: isVip ? vipLevel : 0,
    levelName,
    emojiVip,
    multiplier,
    ruralBonus,
    repairDiscount,
    tempo,
    data,
    remainingMs,
    remainingDays,
    isExpired
  };
}

async function CheckUserCooldowns(user, Cooldowns, variável) {
  const Tempo = Cooldowns;
  const snapshotDaily = await database.ref(`economia/${user.id}/cooldowns/`).once('value');
  let Bonus = snapshotDaily.val()?.[variável] || 0;

  const DailyStats = (Bonus !== null && Tempo - (Date.now() - Bonus) > 0) ? (Bonus + Tempo) : false;
  return { status: DailyStats, tempo: Bonus };
}

async function CheckUserBlacklisted(user) {
  try {
    const userId = typeof user === 'string' ? user.trim() : (user?.id || user?.userId);
    if (!userId) return { blacklisted: false };

    const snapshot = await database.ref(`/BlackList/${userId}`).once('value');
    const dataVal = snapshot.val();
    if (!dataVal) return { blacklisted: false };

    let temp = dataVal.tempo;
    let data = dataVal.data || 0;
    let motivo = dataVal.motivo || `Motivo não foi definido, entre em contato com a staff`;
    let staff = dataVal.mod || dataVal.staff || 'Equipe Sistine';

    // Determina se a punição é permanente/indeterminada
    const isPermanent = temp === 'indeterminado' || temp === 'permanente' || temp === null || temp === undefined;
    let blacklisted = false;
    let tempoFormatado = '`Indeterminado (Permanente)`';
    let timeLeftMs = null;

    if (isPermanent) {
      blacklisted = true;
    } else if (typeof temp === 'number') {
      timeLeftMs = temp - (Date.now() - data);
      if (timeLeftMs > 0) {
        blacklisted = true;
        const time = parseMs(timeLeftMs);
        const expireTimestamp = Math.floor((data + temp) / 1000);
        tempoFormatado = `\`${time.days || 0}d ${time.hours || 0}h ${time.minutes || 0}m ${time.seconds || 0}s\` (<t:${expireTimestamp}:R>)`;
      } else {
        // Punição expirou: auto-remove do banco
        await database.ref(`/BlackList/${userId}`).remove().catch(() => {});
        return { blacklisted: false };
      }
    } else if (typeof temp === 'string') {
      const parsedMs = ParseDuration(temp);
      if (parsedMs && parsedMs > 0) {
        timeLeftMs = parsedMs - (Date.now() - data);
        if (timeLeftMs > 0) {
          blacklisted = true;
          const time = parseMs(timeLeftMs);
          const expireTimestamp = Math.floor((data + parsedMs) / 1000);
          tempoFormatado = `\`${time.days || 0}d ${time.hours || 0}h ${time.minutes || 0}m ${time.seconds || 0}s\` (<t:${expireTimestamp}:R>)`;
        } else {
          await database.ref(`/BlackList/${userId}`).remove().catch(() => {});
          return { blacklisted: false };
        }
      } else {
        blacklisted = true;
      }
    }

    if (!blacklisted) return { blacklisted: false };

    return { 
      blacklisted: true, 
      motivo,
      staff,
      tempo: tempoFormatado,
      data,
      temp,
      isPermanent,
      timeLeftMs,
      blacklistedMensagem: `⛔ **|** <@${userId}>, você está **banido** de utilizar qualquer funcionalidade, comando e dashboard da Sistine.\n\n📜 **Motivo:** \`${motivo}\`\n📆 **Duração:** ${tempoFormatado}\n🛡️ **Staff:** \`${staff}\`\n\n*Caso considere esta punição indevida, procure o suporte oficial no Discord.*` 
    };
  } catch (error) {
    console.error('[CheckUserBlacklisted] Erro:', error);
    return { blacklisted: false };
  }
}

async function setUserBlacklist(userId, { motivo = 'Não definido', tempo = 'indeterminado', staff = 'Equipe Sistine', staffId = null } = {}) {
  if (!userId) return { success: false, error: 'ID do usuário inválido' };
  const targetId = String(userId).trim();

  let tempValue = 'indeterminado';
  if (tempo && tempo !== 'indeterminado' && tempo !== 'permanente') {
    const parsed = typeof tempo === 'number' ? tempo : ParseDuration(tempo);
    tempValue = parsed && parsed > 0 ? parsed : 'indeterminado';
  }

  const payload = {
    data: Date.now(),
    tempo: tempValue,
    motivo: motivo || 'Violação das diretrizes do bot Sistine',
    mod: staff || 'Equipe Sistine',
    staffId: staffId || null
  };

  await database.ref(`/BlackList/${targetId}`).set(payload);
  return { success: true, payload };
}

async function removeUserBlacklist(userId) {
  if (!userId) return { success: false, error: 'ID do usuário inválido' };
  const targetId = String(userId).trim();
  await database.ref(`/BlackList/${targetId}`).remove();
  return { success: true };
}

async function CheckUserAntiRoubo(user) {
  const snapshot = await database.ref(`/economia/${user.id}/AntiRoubo/`).once('value');
  const dataVal = snapshot.val() || {};

  const tempo = dataVal.tempo || 0;
  const data = dataVal.data || 0;
  const isPermanent = tempo === 'indeterminado' || tempo === 'permanente';
  const isActive = isPermanent || (data > 0 && typeof tempo === 'number' && tempo > 0 && (tempo - (Date.now() - data) > 0));

  return { anti: isActive, tempo, data };
}

async function getCasamento(user) {
  try {
    if (!user) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (getCasamento): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      throw new Error(errorMessage);
    }

    const snapshot = await database.ref(`economia/${user.id}/Casamento`).once('value');
    const dataVal = snapshot.val() || {};

    let CasamentoID = dataVal.casado || 0;
    let datanow = dataVal.datanow || 0;

    const Casado = (CasamentoID > 0);
    return { casado: Casado, conjunge: CasamentoID, durante: datanow, tempo: `<t:${~~(datanow / 1000)}:D> (<t:${~~(datanow / 1000)}:R>)` };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getUserReps(user) {
  try {
    if (!user) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (getUserReps): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      throw new Error(errorMessage);
    }

    const snapshot = await database.ref(`/economia/${user.id}/Reputações/`).once('value');
    const dataVal = snapshot.val() || {};

    let reputações_enviadas = dataVal.reputações_enviadas || 0;
    let reputações_recebidas = dataVal.reputações_recebidas || 0;
    let reps = dataVal.reputações || [`${user} **não possui nenhuma reputação.**`];

    return { enviadas: reputações_enviadas, recebidas: reputações_recebidas, lista: reps };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

function getUser(message, toFind = '') {
  try {
    if (!message) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (getUser): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      throw new Error(errorMessage);
    }

    let { client } = message;
    toFind = toFind.toLowerCase();
    let target = client.users.cache.get(toFind);

    if (!target && message.mentions.members) target = message.mentions.users.first();

    if (!target && toFind) {
      target = client.users.cache.find(member => {
        return member.username.toLowerCase().includes(toFind) || member.tag.toLowerCase().includes(toFind)
      }) || client.users.cache.find(member => member.id.toLowerCase().includes(toFind));
    }

    return target || message.author;
  } catch (e) {
    if (message?.channel?.error) message.channel.error(`Um erro interno aconteceu ao utilizar uma função, tente novamente mais tarde.`);
    return console.error(e);
  }
}

const {
  TRANSACTION_TYPES,
  buildTransactionString,
  recordTransaction,
  resolveTransactionList
} = require('./transactionManager.js');

async function TransactionUpdate(ctx, mensagem, user) {
  try {
    const targetUser = user || ctx?.user || ctx?.author;
    if (!targetUser || !mensagem) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (TransactionUpdate): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      if (ctx && typeof sendError === 'function') await sendError(ctx, "Ocorreu um erro ao registrar a transação.");
      return;
    }

    if (targetUser.bot) {
      return;
    }

    await recordTransaction(ctx, targetUser, mensagem);
  } catch (error) {
    console.error('[FUNCTIONS - TransactionUpdate]', error);
  }
}

async function UpdateMoneyWallet(ctx, user, AddOrSub, quantia, transação) {
  try {
    if (!user || !AddOrSub) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (UpdateMoneyWallet): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      if (ctx && typeof sendError === 'function') await sendError(ctx, "Ocorreu um erro ao atualizar o dinheiro da sua carteira.");
      throw new Error(errorMessage);
    }
    if (user.bot) {
      return;
    }

    const snapshot = await database.ref(`/economia/${user.id}/saldo`).once('value');
    const saldo = snapshot.val() || {};
    const { carteira = 0 } = saldo;

    const numQuantia = Number(quantia) || 0;
    let newCarteira;
    if (AddOrSub === '+') newCarteira = carteira + numQuantia;
    else if (AddOrSub === '-') newCarteira = Math.max(0, carteira - numQuantia);
    else throw new Error("[LOGS] - [DETAILS_NOT_PROVIDED] (UpdateMoneyWallet): O objeto 'AddOrSub' foi definido diferente de: '+' ou '-' ");

    await database.ref(`/economia/${user.id}/saldo`).update({ carteira: newCarteira });

    if (transação) {
      await recordTransaction(ctx, user, transação, numQuantia, AddOrSub);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function UpdateMoneyBank(ctx, user, AddOrSub, quantia, transação) {
  try {
    if (!user || !AddOrSub) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (UpdateMoneyBank): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      if (ctx && typeof sendError === 'function') await sendError(ctx, "Ocorreu um erro ao atualizar o dinheiro do seu banco.");
      throw new Error(errorMessage);
    }
    if (user.bot) {
      return;
    }

    const snapshot = await database.ref(`/economia/${user.id}/saldo`).once('value');
    const saldo = snapshot.val() || {};
    const { banco = 0 } = saldo;

    const numQuantia = Number(quantia) || 0;
    let newBank;
    if (AddOrSub === '+') newBank = banco + numQuantia;
    else if (AddOrSub === '-') newBank = Math.max(0, banco - numQuantia);
    else throw new Error("[LOGS] - [DETAILS_NOT_PROVIDED] (UpdateMoneyBank): O objeto 'AddOrSub' foi definido diferente de: '+' ou '-' ");

    await database.ref(`/economia/${user.id}/saldo/`).update({ banco: newBank });

    if (transação) {
      await recordTransaction(ctx, user, transação, numQuantia, AddOrSub);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function XpUpdate(ctx, user, quantia = null) {
  try {
    const experienceManager = require('./experienceManager.js');
    return await experienceManager.XpUpdate(ctx, user, quantia);
  } catch (error) {
    console.error('[FUNCTIONS - XpUpdate]', error);
    throw error;
  }
}

async function ReputationUpdate(ctx, user, mensagem, Dadas, Recebidas) {
  try {
    if (!ctx || !user || !mensagem) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (ReputationUpdate): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      if (ctx) return await sendError(ctx, "Ocorreu um erro ao atualizar a reputação do usuário.");
      throw new Error(errorMessage);
    }

    const snapshot = await database.ref(`/economia/${user.id}/Reputações`).once('value');
    const dataVal = snapshot.val() || {};

    let reputações_enviadas = dataVal.reputações_enviadas || 0;
    let reputações_recebidas = dataVal.reputações_recebidas || 0;
    let reputações = dataVal.reputações || [];

    let Mensagem = `[<t:${~~(Date.now() / 1000)}:d> <t:${~~(Date.now() / 1000)}:t>] | <t:${~~(Date.now() / 1000)}:R> ${mensagem}`;
    reputações.unshift(Mensagem);

    return database.ref(`/economia/${user.id}/Reputações`).set({
      reputações_enviadas: reputações_enviadas + Dadas,
      reputações_recebidas: reputações_recebidas + Recebidas,
      reputações: reputações,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const { DISCORD_FLAGS_MAP, HYPESQUAD_HOUSES, BADGE_LEVELS_CONFIG, BOT_CUSTOM_BADGES_MAP } = require('./badgesMap.js');

const OWNER_IDS = ['1443828312936812554'];

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
  const isOwnerOrDev = OWNER_IDS.includes(userId);

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

  const resolvedBadges = [];

  // 2. Extrai as Flags nativas do Discord
  let userFlagsArray = [];
  if (userDiscordObj.flags && typeof userDiscordObj.flags.toArray === 'function') {
    userFlagsArray = userDiscordObj.flags.toArray();
  } else if (typeof userDiscordObj.fetchFlags === 'function') {
    const flags = await userDiscordObj.fetchFlags().catch(() => null);
    if (flags) userFlagsArray = flags.toArray();
  } else {
    userFlagsArray = parseFirebaseList(userDiscordObj.flags);
  }

  // 3. FLAGS ESTÁTICAS NATIVAS DO DISCORD
  Object.values(DISCORD_FLAGS_MAP).forEach((badgeInfo) => {
    const isUnlocked = userFlagsArray.includes(badgeInfo.id) || isOwnerOrDev || customUnlocked.includes(badgeInfo.id);
    if (isUnlocked) {
      resolvedBadges.push({
        ...badgeInfo,
        unlocked: true,
        active: isBadgeActive(badgeInfo.id)
      });
    }
  });

  // 4. HYPESQUAD DINÂMICO
  let userHouseId = userFlagsArray.find(f => HYPESQUAD_HOUSES[f]);
  if (!userHouseId && isOwnerOrDev && selectedHypeSquad && HYPESQUAD_HOUSES[selectedHypeSquad]) {
    userHouseId = selectedHypeSquad;
  }
  if (userHouseId && HYPESQUAD_HOUSES[userHouseId]) {
    const houseInfo = HYPESQUAD_HOUSES[userHouseId];
    resolvedBadges.push({
      ...houseInfo,
      type: 'discord',
      unlocked: true,
      active: isBadgeActive(houseInfo.id, userHouseId)
    });
  }

  // 5. BADGES COM NÍVEIS
  // A) Bug Hunter
  const hasBug2 = userFlagsArray.includes('BugHunterLevel2') || customUnlocked.includes('bug_hunter_2') || isOwnerOrDev;
  const hasBug1 = userFlagsArray.includes('BugHunterLevel1') || customUnlocked.includes('bug_hunter_1') || hasBug2;
  const bugMaxLevel = hasBug2 ? 2 : (hasBug1 ? 1 : 0);

  if (bugMaxLevel > 0) {
    const chosenLevelNum = Number(selectedLevels.bug_hunter) || bugMaxLevel;
    const finalLevel = Math.min(chosenLevelNum, bugMaxLevel);
    const levelInfo = BADGE_LEVELS_CONFIG.bug_hunter.levels.find(l => l.level === finalLevel) || BADGE_LEVELS_CONFIG.bug_hunter.levels[0];

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

  // B) Booster (Detecta automaticamente do servidor se for membro, ou do Firebase, ou Dev)
  const isMemberBooster = Boolean(member && member.premiumSince);
  let calculatedBoosterLvl = Number(userBadgesData.boosterLevel) || 0;

  if (isMemberBooster && member.premiumSince) {
    const boostMonths = Math.max(1, Math.floor((Date.now() - new Date(member.premiumSince).getTime()) / (1000 * 60 * 60 * 24 * 30)));
    // Calcula o nível de boost (1 a 9) com base nos meses
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

  const hasBoosterUnlocked = isMemberBooster || customUnlocked.includes('booster') || customUnlocked.includes('server_booster') || isOwnerOrDev;
  const boosterMaxLevel = isOwnerOrDev ? 9 : (hasBoosterUnlocked ? Math.max(calculatedBoosterLvl, 1) : 0);

  if (boosterMaxLevel > 0) {
    const chosenLevelNum = Number(selectedLevels.booster) || boosterMaxLevel;
    const finalLevel = Math.min(chosenLevelNum, boosterMaxLevel);
    const levelInfo = BADGE_LEVELS_CONFIG.booster.levels.find(l => l.level === finalLevel) || BADGE_LEVELS_CONFIG.booster.levels[0];

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

  // C) VIP
  const isVipOuro = vipData.vip === 'ouro' || vipData.vip === 2 || customUnlocked.includes('vip_ouro') || isOwnerOrDev;
  const isVipPrata = vipData.vip === 'prata' || vipData.vip === 1 || customUnlocked.includes('vip_prata') || isVipOuro;
  const vipMaxLevel = isVipOuro ? 2 : (isVipPrata ? 1 : 0);

  if (vipMaxLevel > 0) {
    const chosenLevelNum = Number(selectedLevels.vip) || vipMaxLevel;
    const finalLevel = Math.min(chosenLevelNum, vipMaxLevel);
    const levelInfo = BADGE_LEVELS_CONFIG.vip.levels.find(l => l.level === finalLevel) || BADGE_LEVELS_CONFIG.vip.levels[0];

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

  // 6. BADGES CUSTOMIZADAS (Slash Commands, Quests, AutoMod, Nitro, etc.)
  for (const [badgeId, badgeInfo] of Object.entries(BOT_CUSTOM_BADGES_MAP)) {
    let isUnlocked = isOwnerOrDev || customUnlocked.includes(badgeId);

    // Se o alvo for um bot, ativa automaticamente a badge de Slash Commands se ele for bot
    if (badgeId === 'supports_commands' && userDiscordObj.bot) {
      isUnlocked = true;
    }

    // Se o bot estiver configurado com AutoMod ou regras no servidor
    if (badgeId === 'automod' && (userDiscordObj.bot || isOwnerOrDev || customUnlocked.includes('automod'))) {
      isUnlocked = true;
    }

    if (isUnlocked) {
      resolvedBadges.push({
        ...badgeInfo,
        unlocked: true,
        active: isBadgeActive(badgeId)
      });
    }
  }

  return resolvedBadges;
}

function isStaff(client, userId) {
  if (!userId) return false;
  const isCreator = client?.config?.cargos?.criador?.includes(userId);
  const isDev = client?.config?.cargos?.developer?.includes(userId);
  return Boolean(isCreator || isDev);
}

// ==========================================
// EXPORTAÇÃO DOS MÓDULOS
// ==========================================
module.exports = {
  Format,
  sendError,
  ParseDuration,
  FormatDuration,
  NumberConvert,
  getUserMoney,
  getUserInventory,
  CheckUserVip,
  CheckUserCooldowns,
  CheckUserBlacklisted,
  setUserBlacklist,
  removeUserBlacklist,
  CheckUserAntiRoubo,
  getCasamento,
  getUserReps,
  getUser,
  UpdateMoneyWallet,
  UpdateMoneyBank,
  TransactionUpdate,
  XpUpdate,
  getXpForNextLevel: require('./experienceManager.js').getXpForNextLevel,
  checkUserStarted: require('./experienceManager.js').checkUserStarted,
  markUserStarted: require('./experienceManager.js').markUserStarted,
  ReputationUpdate,
  eventLog,
  getUserGlobalRank,
  getResolvedUserBadges,
  isStaff,
  recordTransaction,
  buildTransactionString,
  resolveTransactionList,
  TRANSACTION_TYPES
};