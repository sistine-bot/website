const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const client = require("../../index.js"); // Adapte para o caminho do seu index
const firebase = require("firebase");
const database = firebase.database();

// =======================================================
// FUNÇÃO INTERNA: Sincronizar com o Painel e Enviar Embed
// =======================================================
async function syncNativePunishment(guild, targetUser, executorUser, type, reason = 'Nenhum motivo definido', durationMs = null) {
  try {
    // 1. Salva no Histórico do Painel
    const punishmentId = Date.now().toString();
    await database.ref(`servers/${guild.id}/punishments/${punishmentId}`).set({
      id: punishmentId,
      target: targetUser.username,
      targetId: targetUser.id,
      targetAvatar: targetUser.avatar || "",
      moderator: executorUser.username,
      moderatorId: executorUser.id,
      moderatorAvatar: executorUser.avatar || "",
      type: type,
      reason: reason,
      date: new Date().toISOString()
    });

    // 2. Registra no Event Log (Caixa preta do painel)
    const timeStr = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    let emojiStr = type === 'Ban' ? '🔨' : type === 'Kick' ? '👢' : type === 'Mute' ? '🔇' : '⚠️';
    let colorStr = type === 'Ban' ? 'text-red-500' : type === 'Kick' ? 'text-orange-500' : type === 'Mute' ? 'text-blue-500' : 'text-amber-500';

    await database.ref(`servers/${guild.id}/logs`).push({
      time: timeStr,
      emoji: emojiStr,
      event: `PUNIÇÃO NATIVA: ${type.toUpperCase()}`,
      color: colorStr,
      text: `O admin ${executorUser.username} aplicou um ${type} em ${targetUser.username} direto pelo Discord. Motivo: ${reason}`
    });

    // 3. Envia no Canal de Punições do Servidor
    const configSnap = await database.ref(`servers/${guild.id}/punishments_config`).once('value');
    const config = configSnap.val() || {};

    if (config.logChannel) {
      const logChannel = guild.channels.cache.get(config.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle(`${emojiStr} Nova Punição: ${type}`)
          .setColor(type === 'Ban' ? '#ef4444' : type === 'Kick' ? '#f97316' : type === 'Mute' ? '#3b82f6' : '#f59e0b')
          .addFields(
            { name: '👤 Usuário Punido', value: `${targetUser.username} \`(${targetUser.id})\``, inline: true },
            { name: '🛡️ Moderador', value: `${executorUser.username} \`(${executorUser.id})\``, inline: true },
            { name: '📝 Motivo da Punição', value: `\`\`\`${reason}\`\`\`` }
          )
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
          .setTimestamp();
        
        if (type === 'Mute' && durationMs) {
          const timeFormated = durationMs >= 3600000 ? `${durationMs / 3600000} hora(s)` : `${durationMs / 60000} minuto(s)`;
          embed.addFields({ name: '⏱️ Duração do Mute', value: timeFormated, inline: false });
        }

        logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[SYNC PUNIÇÃO ERRO]", err);
  }
}

// =======================================================
// EVENTO 1: BANIMENTOS NATIVOS
// =======================================================
client.on('guildBanAdd', async (ban) => {
  try {
    // Busca no registro de auditoria quem deu o ban
    const fetchedLogs = await ban.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberBanAdd,
    });
    
    const banLog = fetchedLogs.entries.first();
    if (!banLog) return; // Não encontrou log

    const { executor, target, reason } = banLog;

    // INTEGRAÇÃO DE SEGURANÇA: Se foi o PRÓPRIO BOT quem baniu (via dashboard ou comando), 
    // ele cancela para não enviar a mensagem duplicada!
    if (executor.id === client.user.id) return; 
    
    // Confirma se o alvo do log é a mesma pessoa que foi banida
    if (target.id === ban.user.id) {
      const finalReason = reason || "Nenhum motivo especificado (Ação nativa)";
      await syncNativePunishment(ban.guild, ban.user, executor, 'Ban', finalReason);
    }
  } catch (e) {
    console.error(e);
  }
});

// =======================================================
// EVENTO 2: SILENCIAMENTOS NATIVOS (MUTE/TIMEOUT)
// =======================================================
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  try {
    // Verifica se a mudança foi especificamente um Timeout (Mute)
    const isNowMuted = !oldMember.isCommunicationDisabled() && newMember.isCommunicationDisabled();
    
    if (isNowMuted) {
      const fetchedLogs = await newMember.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberUpdate,
      });
      
      const muteLog = fetchedLogs.entries.first();
      if (!muteLog) return;
      
      const { executor, target, reason } = muteLog;

      // Anti-Duplicação
      if (executor.id === client.user.id) return;
      
      if (target.id === newMember.id) {
        // Calcula quanto tempo de mute o admin colocou
        const muteEnd = newMember.communicationDisabledUntilTimestamp;
        const durationMs = muteEnd - Date.now();
        const finalReason = reason || "Nenhum motivo especificado (Ação nativa)";
        
        await syncNativePunishment(newMember.guild, newMember.user, executor, 'Mute', finalReason, durationMs);
      }
    }
  } catch (e) {
    console.error(e);
  }
});

// =======================================================
// EVENTO 3: EXPULSÕES NATIVAS (KICK)
// =======================================================
client.on('guildMemberRemove', async (member) => {
  try {
    // Kicks são um pouco demorados no Discord, damos um pequeno atraso de 1 segundo para garantir que o log gerou
    setTimeout(async () => {
      const fetchedLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberKick,
      });

      const kickLog = fetchedLogs.entries.first();
      if (!kickLog) return;

      const { executor, target, reason, createdAt } = kickLog;
      
      // Verifica se esse log é recente (menos de 5 segundos), para não puxar um log antigo sem querer
      if (Date.now() - createdAt.getTime() > 5000) return;

      // Anti-Duplicação
      if (executor.id === client.user.id) return;

      if (target.id === member.id) {
        const finalReason = reason || "Nenhum motivo especificado (Ação nativa)";
        await syncNativePunishment(member.guild, member.user, executor, 'Kick', finalReason);
      }
    }, 1000);
  } catch (e) {
    console.error(e);
  }
});