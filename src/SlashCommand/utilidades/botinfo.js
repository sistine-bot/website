const { ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports =  {
  name: "botinfo",
  description: `⌊🛠️ Utilidades⌉ Veja informações sobre a sistine.`,
  type: ApplicationCommandType.ChatInput,
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {

      // sistema para identificar a quanto tempo o bot esta online!
      let dias = 0; 
      let week = 0;

      let uptime = ``;
      let totalSegundos = (client.uptime / 1000);
      let horas = Math.floor(totalSegundos / 3600);
      totalSegundos %= 3600;
      let minutos = Math.floor(totalSegundos / 60);
      let segundos = Math.floor(totalSegundos % 60);

      if(horas > 23){
        dias = dias + 1;
        horas = 0;
      }

      if(dias == 7){
        dias = 0;
        week = week + 1;
      }

      if(week > 0){
        uptime += `${week} week, `;
      }

      if(minutos > 60){ 
        minutos = 0;
      }
      
      uptime += `${horas}h ${minutos}m ${segundos}s`;
      
      const users = new Intl.NumberFormat('Pt-Br', { maximumSignificantDigits: 20 }).format(client.users.cache.size);
      const servers = new Intl.NumberFormat('Pt-Br', { maximumSignificantDigits: 20 }).format(client.guilds.cache.size);

      const bot = interaction.guild.members.cache.get(client.user.id);
      
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link)
        .setURL(client.config?.SUPPORT_LINK || 'https://discord.gg/sistine')
        .setLabel('Servidor de suporte')
        .setEmoji('<:discord:926193044154351626>'),
        
        new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
        .setLabel('Me adicione')
        .setEmoji('<:verificado:926192842748080210>'),
      )
      
      const criadoresList = client.config?.cargos?.criador?.length
        ? client.config.cargos.criador.map(c => client.users.cache.get(c) ? `${client.users.cache.get(c)}` : `<@${c}>`).join(' | ')
        : 'Não configurado';

      const embed = new EmbedBuilder()
      .setThumbnail(client.user.avatarURL({ dynamic: true }))
      .addFields(
        { name: `👤・Membros:`, value:  `\`${users}\``, inline: true  },
        { name: `📡・Ping`, value:  `\`${client.ws.ping}\``, inline: true },
        { name: `⏰・Tempo online`, value: `\`${uptime} \``, inline: true },
        { name: `💻・Servidores`, value: `\`${servers}\``, inline: true },
        { name: `❗・Prefixo`, value: `\`/ (slash)\``, inline: true },
        { name: `👑・Criadores:`,  value: criadoresList, inline: false },
        { name: `🗓️・Entrei aqui em:`, value: `<t:${~~(bot.joinedTimestamp/1000)}:D> (<t:${~~(bot.joinedTimestamp/1000)}:R>)`, inline: false},
        { name: `📆・Fui criada em:`, value: `<t:${~~(client.user.createdTimestamp/1000)}:D> (<t:${~~(client.user.createdTimestamp/1000)}:R>)`, inline: false },
      )
      .setColor(color.embed)
      
      return interaction.followUp({ embeds: [embed], components: [row] });
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  
  }
}