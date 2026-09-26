const { ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, version: djsVersion } = require('discord.js');

module.exports = {
  name: "botinfo",
  aliases: ["info", "bot", "sobre", "sistine", "binfo"],
  category: "utilidades",
  description: `⌊🛠️ Utilidades⌉ Veja informações sobre a Sistine.`,
  type: ApplicationCommandType.ChatInput,

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      // Cálculo preciso do tempo de atividade (uptime)
      const uptimeMs = client.uptime || (client.readyTimestamp ? (Date.now() - client.readyTimestamp) : 0);
      let totalSeconds = Math.floor(uptimeMs / 1000);
      const days = Math.floor(totalSeconds / 86400);
      totalSeconds %= 86400;
      const hours = Math.floor(totalSeconds / 3600);
      totalSeconds %= 3600;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = Math.floor(totalSeconds % 60);

      const uptimeParts = [];
      if (days > 0) uptimeParts.push(`${days}d`);
      uptimeParts.push(`${hours}h`);
      uptimeParts.push(`${minutes}m`);
      uptimeParts.push(`${seconds}s`);
      const uptimeFormatted = uptimeParts.join(' ');
      const startTimestamp = Math.floor((Date.now() - uptimeMs) / 1000);

      // Quantidades formatadas
      const totalUsers = Array.from(client.guilds.cache.values()).reduce((acc, g) => acc + (g.memberCount || 0), 0) || client.users.cache.size;
      const users = new Intl.NumberFormat('pt-BR').format(totalUsers);
      const servers = new Intl.NumberFormat('pt-BR').format(client.guilds.cache.size);

      const botMember = interaction.guild?.members?.me || (interaction.guild?.members?.cache?.get(client.user.id));
      const joinedTs = botMember?.joinedTimestamp ? Math.floor(botMember.joinedTimestamp / 1000) : null;
      const createdTs = Math.floor(client.user.createdTimestamp / 1000);

      const prefix = interaction.prefix || interaction.prefixo || '!';

      const criadoresList = client.config?.cargos?.criador?.length
        ? client.config.cargos.criador.map(c => client.users.cache.get(c) ? `${client.users.cache.get(c)}` : `<@${c}>`).join(' | ')
        : 'Equipe Sistine';

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setURL(client.config?.SUPPORT_LINK || 'https://discord.gg/sistine')
          .setLabel('Servidor de Suporte')
          .setEmoji('💬'),

        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
          .setLabel('Me Adicione')
          .setEmoji('✨')
      );

      const embed = new EmbedBuilder()
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
        .setTitle(`Informações — ${client.user.username}`)
        //.setDescription(`Olá! Eu sou a **${client.user.username}**, uma assistente multifuncional com economia completa, apostas, RPG, utilidades e integração total com dashboard web!`)
        .addFields(
          { name: `👥・Membros:`, value: `\`${users}\``, inline: true },
          { name: `💻・Servidores:`, value: `\`${servers}\``, inline: true },
          { name: `📡・Latência:`, value: `\`${client.ws.ping}ms\``, inline: true },
          { name: `⏰・Tempo online:`, value: `\`${uptimeFormatted}\` (<t:${startTimestamp}:R>)`, inline: true },
          { name: `❗・Prefixos:`, value: `\`${prefix}\` e \`/ (slash)\``, inline: true },
          { name: `👑・Desenvolvedores:`, value: criadoresList, inline: false },
          { name: `🗓️・Fui criada em:`, value: `<t:${createdTs}:D> (<t:${createdTs}:R>)`, inline: true }
        )
        .setColor(color?.embed || '#831396')
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

      if (joinedTs) {
        embed.addFields({ name: `📆・Entrei neste servidor:`, value: `<t:${joinedTs}:D> (<t:${joinedTs}:R>)`, inline: true });
      }

      return interaction.followUp({ embeds: [embed], components: [row] });

    } catch (error) {
      console.error('[botinfo command error]', error);
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
};