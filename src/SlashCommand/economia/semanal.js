const { ApplicationCommandType, EmbedBuilder } = require('discord.js');
const { CheckUserCooldowns, XpUpdate, UpdateMoneyWallet, CheckUserVip, Format } = require('../../utils/functions.js');

module.exports =  {
  "name": "semanal",
  "description": `⌊💸 Economia⌉ seja VIP e colete sua recompensa semanal.`,
  "type": ApplicationCommandType.ChatInput,
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {

      const { status } = await CheckUserCooldowns(interaction.user, 604800000, 'weekly')
    
      if (status) {

        const Embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`⏰ **|** Seu premio semanal será liberado para coletar: **<t:${~~((status)/1000)}:R>**.`)

        return interaction.followUp({ embeds: [Embed], fetchReply: true, ephemeral: false  });
      }
      
      const { vip, tempo, data } = await CheckUserVip(interaction.user)
      
      if (!client.config.cargos.criador.includes(interaction.user.id) && (data !== null && tempo - (Date.now() - data) < 0 || vip < 1)) {
        return interaction.error({ content: `Você precisa ser um membro VIP para utilizar este comando.` });
      }
      
      const WeeklyMoney = (Math.floor(Math.random() * 10000) + 10000);
      await database.ref(`/economia/${interaction.user.id}/cooldowns`).update({
        weekly: Date.now()
      });

      await UpdateMoneyWallet(interaction, interaction.user, '+', WeeklyMoney, `{emoji.entrada} {mensagem.weekly} | ${WeeklyMoney}`);

      const EMBED = new EmbedBuilder()
      .setColor(color.embed)
      .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
      .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true}) })
      .setDescription(`💵 **|** Você recolheu sua recompensa semanal e recebeu: **${Format(WeeklyMoney)}** em sua carteira`)

      await XpUpdate(interaction, interaction.user, (Math.floor(Math.random() * 10) + 40) * 7);

      return interaction.followUp({ embeds: [EMBED], fetchReply: true, ephemeral: false  })
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
}