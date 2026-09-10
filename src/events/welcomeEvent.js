const { EmbedBuilder } = require('discord.js');
const client = require("../../index.js"); 
const firebase = require("firebase");
const database = firebase.database();

// Função para formatar as tags dinâmicas da mensagem
const formatWelcomeMessage = (text, member) => {
    if (!text) return "";
    return text
        .replace(/{user}/g, `<@${member.user.id}>`)
        .replace(/{members}/g, member.guild.memberCount)
        .replace(/{server}/g, member.guild.name);
};

// =======================================================
// EVENTO: ENTRADA DE MEMBROS
// =======================================================
client.on('guildMemberAdd', async (member) => {
  try {
    const dbSnap = await database.ref(`servers/${member.guild.id}/welcome`).once('value');
    const config = dbSnap.val();

    // Verificação correta com joinChannel
    if (!config || !config.status || !config.joinChannel || !config.joinStatus) return;

    const logChannel = member.guild.channels.cache.get(config.joinChannel);
    if (logChannel) {
        const formattedMessage = formatWelcomeMessage(config.joinMessage, member);

        if (config.joinEmbed) {
            const embed = new EmbedBuilder()
            .setTitle(config.joinEmbedTitle || 'Bem-vindo(a)!')
            .setColor(config.joinEmbedColor || '#10b981')
            .setDescription(formattedMessage)
            .setTimestamp();
            
            if (config.joinThumbnail) embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

            logChannel.send({ embeds: [embed] }).catch(() => {});
        } else {
            logChannel.send({ content: formattedMessage }).catch(() => {});
        }
    }
  } catch (error) { console.error(error); }
});

// =======================================================
// EVENTO: SAÍDA DE MEMBROS
// =======================================================
client.on('guildMemberRemove', async (member) => {
  try {
    const dbSnap = await database.ref(`servers/${member.guild.id}/welcome`).once('value');
    const config = dbSnap.val();

    // CORRIGIDO: Agora verifica leaveChannel em vez de channel
    if (!config || !config.status || !config.leaveChannel || !config.leaveStatus) return;

    const logChannel = member.guild.channels.cache.get(config.leaveChannel);
    if (logChannel) {
        const formattedMessage = formatWelcomeMessage(config.leaveMessage, member);

        if (config.leaveEmbed) {
            const embed = new EmbedBuilder()
            .setTitle(config.leaveEmbedTitle || 'Membro Saiu')
            .setColor(config.leaveEmbedColor || '#f43f5e')
            .setDescription(formattedMessage)
            .setTimestamp();
            
            if (config.leaveThumbnail) embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

            logChannel.send({ embeds: [embed] }).catch(() => {});
        } else {
            logChannel.send({ content: formattedMessage }).catch(() => {});
        }
    }
  } catch (error) { console.error(error); }
});