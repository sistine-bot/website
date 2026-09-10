const { ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { CheckUserBlacklisted, getUserMoney, UpdateMoneyWallet, NumberConvert, Format } = require('../../utils/functions.js');

module.exports =  {
  "name": "transferir",
  "description": `⌊💸 Economia⌉ Faça uma transferência bancaria.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "usuário",
      "type": ApplicationCommandOptionType.User,
      "description": "Mencione um usuário",
      "required": true,
    },
    {
      "name": "quantidade",
      "type": ApplicationCommandOptionType.String,
      "description": "Diga quanto você deseja transferir.",
      "required": true,
    }
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {

      const user = interaction.options.getUser("usuário");
      if (!user) return interaction.error({ content: `Você deve mencionar um usuário para poder transferir dinheiro.`})
      
      if (user.id == interaction.user.id) return interaction.error({ content: `Você não pode transferir dinheiro para você mesmo.` });
      
      if (user.bot) return interaction.error({ content: `Você não pode transferir dinheiro para um bot.` });

      const quantidade = interaction.options.getString('quantidade')
      
      const { blacklisted, blacklistedMensagem } = await CheckUserBlacklisted(user)
      if (blacklisted) return interaction.followUp({ content: blacklistedMensagem, ephemeral: true })
      
      const { carteira } = await getUserMoney(interaction.user)
      
      let number = NumberConvert(quantidade);

      if (isNaN(number) || number <= 0) return interaction.error({ content: `\`${quantidade}\` Isto não me parece um número válido.` });

      if (number < 100) return interaction.aviso({ content: `O valor mínimo para transferência é de **${Format(100)}**` });
      
      if (carteira < number) return interaction.error({ content: `Você não possui dinheiro o suficiente na carteira para poder transferir.` });
      
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("confirmar").setStyle(ButtonStyle.Success).setEmoji(emoji.positivo).setLabel('Confirmar').setDisabled(false),

        new ButtonBuilder().setCustomId("cancel").setStyle(ButtonStyle.Danger).setEmoji(emoji.negativo).setLabel('Cancelar').setDisabled(false),
      )

      const msg = await interaction.followUp({ content: `
💵 **|** ${user} O usuário: **${interaction.user.username}** deseja transferir para você: **${Format(number)}** 
🤝 **|** Para concluir esta transação *${interaction.user.username}* deve confirmar.`, components: [row] })

      const coletor = msg.createMessageComponentCollector({ filter: x => x.user.id === interaction.user.id });

      coletor.on('collect', async(i) => {
        i.deferUpdate()

        switch (i.customId) {
          case 'confirmar': {
            coletor.stop();

            const { blacklisted, blacklistedMensagem } = await CheckUserBlacklisted(user)
            if (blacklisted) return interaction.followUp({ content: blacklistedMensagem, ephemeral: true })
            
            const { carteira } = await getUserMoney(interaction.user)
            
            if (carteira < number) return interaction.error({ content: `Você não possui dinheiro o suficiente na carteira para poder transferir.` })
            
            await UpdateMoneyWallet(interaction, interaction.user, '-', number, `{emoji.saida} {mensagem.transferencia.enviou} | ${number} | ${user.id}`);
            await UpdateMoneyWallet(interaction, user, '+', number, `{emoji.entrada} {mensagem.transferencia.recebeu} | ${number} | ${interaction.user.id}`);

            return msg.reply({ content: `💵 **|** <@${interaction.user.id}> transferiu ${Format(number)} para: <@${user.id}>` })
            
          }
            break;

          case 'cancel': {
            coletor.stop();
            return interaction.positivo({ content: `Transferência cancelada com sucesso.` });
          }
            break;

          default: 
            return interaction.error({ content: `Ocorreu um erro inesperado, tente novamente.` })
            break;
        }
      })

    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
}