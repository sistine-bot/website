const { EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Format, UpdateMoneyWallet, CheckUserVip, CheckUserCooldowns, XpUpdate } = require('../../utils/functions.js');
const moment = require('moment');

module.exports =  {
  "name": "vip",
  "description": `⌊⚙️ Modulos⌉ Veja informações sobre seu vip`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "usuário",
      "type": ApplicationCommandOptionType.User,
      "description": "Mencione alguém para saber o dinheiro dela",
      "required": false,
    }
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    
    try { 
      
      const user = interaction.options.getUser("usuário") || interaction.user;
      
      const { vip, tempo, data } = await CheckUserVip(user)
      
      if (vip < 1) {

        const embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`${emoji.negativo} **|** <@${user.id}> Não possui VIP cadastrado.`)

        return await interaction.followUp({ content: `${user}`, embeds: [embed] });
      }
      else
        if (data !== null && tempo - (Date.now() - data) < 0) {

          const embed = new EmbedBuilder()
          .setColor(color.embed)
          .setDescription(`${emoji.negativo} **|** <@${user.id}>, Seu VIP não possui mais tempo disponível.`)

          return await interaction.followUp({ content: `${user}`, embeds: [embed] });
        }

      let vipName,
          VipEmoji;
      
      if (vip == 1) vipName = 'Ouro', VipEmoji = '<:vipGold:1061405487628812358>'
      else if (vip == 2) vipName = 'Diamante', VipEmoji = '<:vipDiamante:1061405543299821698>'
      
      const { status } = await CheckUserCooldowns(interaction.user, 604800000, 'weekly')

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("week").setStyle(ButtonStyle.Success).setEmoji('🗓️').setLabel('Coletar').setDisabled(false),
      ),
        row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("weekX").setStyle(ButtonStyle.Secondary).setEmoji('🗓️').setLabel('Coletar').setDisabled(true),
      )
      
      const embed = new EmbedBuilder()
      .setColor(color.embed)
      .setDescription(`
${VipEmoji} **|** VIP: **${vipName}**
📅 **|** Ativo desde: **${data ? moment(data).format('LLL') : ""}**
<:time:931648036562694225> **|** Tempo restante: <t:${~~((tempo + data)/1000)}:R>
${user.id == interaction.user.id ? `🗓️ **|** Semanal: **${status ? `Disponível: <t:${~~((status)/1000)}:R>` : 'Pronto para coletar'}**` : ''}
`)

      const msg = await interaction.followUp({ content: `${user}`, embeds: [embed] });
      
      if (user.id == interaction.user.id && !status) msg.edit({ components: [row] })
      else if (user.id == interaction.user.id && status) msg.edit({ components: [row2] })
      
      const coletor = msg.createMessageComponentCollector({ filter: x => x.user.id === interaction.user.id });

      coletor.on('collect', async(i) => {
        i.deferUpdate()

        switch (i.customId) {
          case 'week': {
            coletor.stop();

            const { status } = await CheckUserCooldowns(interaction.user, 604800000, 'weekly')
            
            if (status) {
              const embed = new EmbedBuilder()
              .setColor(color.embed)
              .setDescription(`⏰ **|** Você já coletou seu semanal, aguarde: **<t:${~~((status)/1000)}:R>**.`)
              
              return interaction.followUp({ embeds: [embed] });
            }
            
            database.ref(`/economia/${interaction.user.id}/cooldowns`).update({
              weekly: Date.now()
            })
            
            const WeeklyMoney = (Math.floor(Math.random() * 10000) + 10000);
            
            await UpdateMoneyWallet(interaction, interaction.user, '+', WeeklyMoney, `{emoji.entrada} {mensagem.weekly} | ${WeeklyMoney}`);

            const EMBED = new EmbedBuilder()
            .setColor(color.embed)
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true}) })
            .setDescription(`💵 **|** Você recolheu sua recompensa semanal e recebeu: **${Format(WeeklyMoney)}** em sua carteira`)

            await XpUpdate(interaction, interaction.user, Math.floor(Math.random() * 10) + 40);
            
            return interaction.followUp({ embeds: [EMBED], fetchReply: true, ephemeral: false  })
          
          }
        }
      })
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }

    
  }
}