const parseMs = require('parse-ms');
const { database } = require('./database.js');
const { ParseDuration } = require('./formatters.js');

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

module.exports = {
  CheckUserVip,
  CheckUserBlacklisted,
  setUserBlacklist,
  removeUserBlacklist
};
