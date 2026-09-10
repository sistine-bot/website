const { ApplicationCommandType, EmbedBuilder } = require('discord.js');
const { CheckUserCooldowns, XpUpdate, UpdateMoneyWallet, CheckUserVip, Format } = require('../../utils/functions.js');

module.exports =  {
  "name": "daily",
  "description": `⌊💸 Economia⌉ Colete sua recompensa diária.`,
  "type": ApplicationCommandType.ChatInput,
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {

      const { status } = await CheckUserCooldowns(interaction.user, 86400000, 'daily')
    
      if (status) {
        const Embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`⏰ **|** Seu premio diário será liberado para coletar: **<t:${~~((status)/1000)}:R>**.`)

        return interaction.followUp({ embeds: [Embed], fetchReply: true, ephemeral: false  });
      }
      
      const { infoVIP, vip, tempo, data } = await CheckUserVip(interaction.user)
      const VIP = (data !== null && tempo - (Date.now() - data) < 0 || infoVIP == false) ? false : true
      
      // const desconto = VIP ? number : number * 95 / 100

      let VIPemoji = '';
      let multiplier = 1;
      if (infoVIP) {
        if (vip == 1) {
          VIPemoji = '<:vipGold:1061405487628812358>';
          multiplier = 1.5;
        } else if (vip == 2) {
          VIPemoji = '<:vipDiamante:1061405543299821698>';
          multiplier = 2;
        }
      }
      if (client.config?.cargos?.criador?.includes(interaction.user.id)) {
        multiplier = 3;
        VIPemoji = '<:ownerbadge:1235848955250872391>';
      }
      
      const DailyMoney = Math.floor((Math.floor(Math.random() * 1500) + 1000) * multiplier);
      await database.ref(`/economia/${interaction.user.id}/cooldowns`).update({
        daily: Date.now()
      });

      await UpdateMoneyWallet(interaction, interaction.user, '+', DailyMoney, `{emoji.entrada} {mensagem.daily} | ${DailyMoney}`);

      const EMBED = new EmbedBuilder()
      .setColor(color.embed)
      .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
      .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true}) })
      .setDescription(`💵 **|** Você recolheu sua recompensa diária e recebeu: **${Format(DailyMoney)} ${VIPemoji ? `(${VIPemoji} ${multiplier}x)` : ''}** em sua carteira`)

      await XpUpdate(interaction, interaction.user, Math.floor(Math.random() * 10) + 40);

      return interaction.followUp({ embeds: [EMBED], fetchReply: true, ephemeral: false  })
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
}