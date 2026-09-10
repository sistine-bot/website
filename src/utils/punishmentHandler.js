const { EmbedBuilder } = require('discord.js');
const firebase = require("firebase");
const database = firebase.database();

/**
 * Função Global para Aplicar Punições e Registrar Logs
 * 
 * @param {Object} options Parâmetros da punição
 * @param {Object} options.client O Client do seu bot (Discord.js)
 * @param {string} options.guildId ID do Servidor
 * @param {string} options.targetId ID do Usuário Infrator
 * @param {string} options.moderatorId ID do Administrador/Moderador (Pode ser do painel ou autor do comando)
 * @param {string} options.type Tipo da punição ('Warn', 'Mute', 'Kick', 'Ban')
 * @param {string} options.reason Motivo da punição
 * @param {number} [options.durationMs] Tempo do mute em milissegundos (Apenas para Mute)
 */
module.exports = async function applyPunishment({ client, guildId, targetId, moderatorId, type, reason, durationMs = null }) {
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) throw new Error("Servidor não encontrado.");

    // Busca o Moderador (Quem aplicou)
    const modMember = await guild.members.fetch(moderatorId).catch(() => null);
    const modUser = modMember ? modMember.user : await client.users.fetch(moderatorId).catch(() => null);
    const modName = modUser ? modUser.username : "Administrador";
    const modAvatar = modUser ? modUser.avatar : "";

    // Busca o Alvo (Quem sofreu a punição)
    let member = await guild.members.fetch(targetId).catch(() => null);
    let user = member ? member.user : await client.users.fetch(targetId).catch(() => null);
    if (!user) throw new Error("Usuário não encontrado.");

    const fullReason = `Punido por ${modName}: ${reason}`;

    // ==========================================
    // 1. APLICA A PUNIÇÃO NO DISCORD
    // ==========================================
    if (type === 'Ban') {
      await guild.members.ban(targetId, { reason: fullReason });
    } else if (type === 'Kick') {
      if (!member) throw new Error("Usuário não está no servidor para ser expulso.");
      await member.kick(fullReason);
    } else if (type === 'Mute') {
      if (!member) throw new Error("Usuário não está no servidor para ser silenciado.");
      await member.timeout(durationMs, fullReason).catch(err => {
        console.error("❌ ERRO REAL DO DISCORD AO APLICAR MUTE:", err.message);
      });
    }

    // ==========================================
    // 2. SALVA NO HISTÓRICO DE PUNIÇÕES (PAINEL)
    // ==========================================
    const punishmentId = Date.now().toString();
    const punishmentRecord = {
      id: punishmentId,
      target: user.username,
      targetId: user.id,
      targetAvatar: user.avatar || "",
      moderator: modName,
      moderatorId: moderatorId,
      moderatorAvatar: modAvatar,
      type: type,
      reason: reason,
      date: new Date().toISOString()
    };
    
    // Salva direto com a chave sendo o ID (Melhor para objetos no Firebase)
    await database.ref(`servers/${guildId}/punishments/${punishmentId}`).set(punishmentRecord);

    // ==========================================
    // 3. SALVA NO TERMINAL DE EVENTOS (EVENT LOGS)
    // ==========================================
    const timeStr = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    let emojiStr = type === 'Ban' ? '🔨' : type === 'Kick' ? '👢' : type === 'Mute' ? '🔇' : '⚠️';
    let colorStr = type === 'Ban' ? 'text-red-500' : type === 'Kick' ? 'text-orange-500' : type === 'Mute' ? 'text-blue-500' : 'text-amber-500';

    await database.ref(`servers/${guildId}/logs`).push({
      time: timeStr,
      emoji: emojiStr,
      event: `PUNIÇÃO: ${type.toUpperCase()}`,
      color: colorStr,
      text: `O moderador ${modName} aplicou um ${type} em ${user.username}. Motivo: ${reason}`
    });

    // ==========================================
    // 4. ENVIA NO CANAL DE DISCORD (Se configurado)
    // ==========================================
    const configSnap = await database.ref(`servers/${guildId}/punishments_config`).once('value');
    const config = configSnap.val() || {};

    if (config.logChannel) {
      const logChannel = guild.channels.cache.get(config.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle(`${emojiStr} Nova Punição: ${type}`)
          .setColor(type === 'Ban' ? '#ef4444' : type === 'Kick' ? '#f97316' : type === 'Mute' ? '#3b82f6' : '#f59e0b')
          .addFields(
            { name: '👤 Usuário Punido', value: `${user.username} \`(${user.id})\``, inline: true },
            { name: '🛡️ Moderador', value: `${modName} \`(${moderatorId})\``, inline: true },
            { name: '📝 Motivo da Punição', value: `\`\`\`${reason}\`\`\`` }
          )
          .setThumbnail(user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();
        
        if (type === 'Mute' && durationMs) {
          const timeFormated = durationMs >= 3600000 ? `${durationMs / 3600000} hora(s)` : `${durationMs / 60000} minuto(s)`;
          embed.addFields({ name: '⏱️ Duração do Mute', value: timeFormated, inline: false });
        }

        logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }

    // Devolve os dados bonitinhos para quem chamou a função
    return { success: true, user: { name: user.username, id: user.id, avatar: user.avatar } };
    
  } catch (error) {
    console.error("[PUNISHMENT HANDLER]", error);
    throw error;
  }
}