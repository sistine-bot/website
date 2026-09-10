const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getCasamento, CheckUserCooldowns, CheckUserVip, UpdateMoneyWallet, Format } = require('../../utils/functions.js');

module.exports =  {
  "name": "namorar",
  "description": `⌊⚙️ Modulos⌉ Estando casado, namore e consiga dinheiro.`,
  "type": ApplicationCommandType.ChatInput, //.
 
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {
      
      const { casado, conjunge } = await getCasamento(interaction.user);
      if (!casado) return interaction.error({ content: `Você deve estar casado para namorar`})
        
      const user = client.users.cache.get(conjunge);

      const { status } = await CheckUserCooldowns(interaction.user, 3600000, 'namorar')
      
      if (status) {
        const embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`⏰ **|** Você poderá namorar novamente: <t:${~~((status)/1000)}:R>`)

        return interaction.followUp({ embeds: [embed] })
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("confirmar").setStyle(ButtonStyle.Success).setEmoji(emoji.positivo).setLabel('Confirmar').setDisabled(false),

        new ButtonBuilder().setCustomId("cancel").setStyle(ButtonStyle.Danger).setEmoji(emoji.negativo).setLabel('Cancelar').setDisabled(false),
      )

      const msg = await interaction.followUp({ content: `
💏 **|** ${interaction.user} está chamando seu cônjuge: **${user}** para o love.
🤝 **|** *${user.username}* deve confirmar.`, components: [row] })

      const coletor = msg.createMessageComponentCollector({ filter: x => x.user.id === user.id || x.user.id === interaction.user.id, time: 60000 });

      coletor.on('collect', async(i) => {
        i.deferUpdate();

        switch (i.customId) {
          case 'confirmar': {
            if (i.user.id !== user.id) {
              return interaction.followUp({ content: `Apenas seu cônjuge <@${user.id}> pode aceitar este convite!`, ephemeral: true });
            }
            coletor.stop();

            database.ref(`/economia/${interaction.user.id}/cooldowns`).update({
              namorar: Date.now()
            });

            database.ref(`/economia/${user.id}/cooldowns`).update({
              namorar: Date.now()
            });

            const VIPInteractions = await CheckUserVip(interaction.user);
            let VIPemoji1 = '';
            let multiplier1 = 1;
            if (VIPInteractions.infoVIP) {
              if (VIPInteractions.vip == 1) VIPemoji1 = '<:vipGold:1061405487628812358>', multiplier1 = 1.5;
              else if (VIPInteractions.vip == 2) VIPemoji1 = '<:vipDiamante:1061405543299821698>', multiplier1 = 2.0;
            }
            if (client.config?.cargos?.criador?.includes(interaction.user.id)) multiplier1 = 3, VIPemoji1 = '<:ownerbadge:1235848955250872391>';
            
            const VIPUsers = await CheckUserVip(user);
            let VIPemoji2 = '';
            let multiplier2 = 1;
            if (VIPUsers.infoVIP) {
              if (VIPUsers.vip == 1) VIPemoji2 = '<:vipGold:1061405487628812358>', multiplier2 = 1.5;
              else if (VIPUsers.vip == 2) VIPemoji2 = '<:vipDiamante:1061405543299821698>', multiplier2 = 2.0;
            }
            if (client.config?.cargos?.criador?.includes(user.id)) multiplier2 = 3, VIPemoji2 = '<:ownerbadge:1235848955250872391>';
            
            const number = Math.floor(Math.random() * 500) + 250;

            const MoneyInteraction = Math.floor(number * multiplier1);
            const MoneyUser = Math.floor(number * multiplier2);
            await UpdateMoneyWallet(interaction, interaction.user, '+', MoneyInteraction, `{emoji.entrada} {mensagem.namoro} | ${MoneyInteraction} | ${user.id}`);
            await UpdateMoneyWallet(interaction, user, '+', MoneyUser, `{emoji.entrada} {mensagem.namoro} | ${MoneyUser} | ${interaction.user.id}`);
            
            return msg.reply({ content: `💕 **|** ${interaction.user} e ${user} namoraram e receberam: **${Format(number)}** ${VIPemoji1 ? `(${VIPemoji1} ${interaction.user.username} ${multiplier1}x)` : ''} ${VIPemoji2 ? `(${VIPemoji2} ${user.username} ${multiplier2}x)` : ''}` });
          }
            break;

          default:
          case 'cancel': {
            coletor.stop();
            return interaction.followUp({ content: `Convite de namoro cancelado 😥.`, ephemeral: true });
          }
            break;
        }
      });

    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }

    
  }
}