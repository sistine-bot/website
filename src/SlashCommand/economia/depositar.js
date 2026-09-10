const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { UpdateMoneyWallet, UpdateMoneyBank, NumberConvert, getUserMoney, Format } = require('../../utils/functions.js');

module.exports =  {
  "name": "depositar",
  "description": `⌊💸 Economia⌉ Deposite seu dinheiro.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "quantidade",
      "type": ApplicationCommandOptionType.String,
      "description": "Diga quanto você deseja depositar.",
      "required": true,
    }
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    
    try {

      const Quantidade = interaction.options.getString('quantidade');
      
      const { carteira } = await getUserMoney(interaction.user)

      let number = NumberConvert(Quantidade);
      if (['all', 'tudo'].includes(Quantidade.toLowerCase())) number = carteira;
      
      if (isNaN(number)) return interaction.error({ content: `\`${Quantidade}\` Isto não me parece um número válido.`})

      if (number < 100) return interaction.error({ content: `O valor mínimo para depositar é de **R$ 100**`})

      if (number > carteira) return interaction.error({ content: `Você não possui dinheiro o suficiente na carteira para depositar`})

      await UpdateMoneyWallet(interaction, interaction.user, '-', number);
      await UpdateMoneyBank(interaction, interaction.user, '+', number, `{emoji.entrada} {mensagem.deposito} | ${number}`);
      
      const embed = new EmbedBuilder()
      .setColor(color.embed)
      .setDescription(`💵 **|** Você depositou **${Format(number)}** no seu banco com sucesso.`)

      interaction.followUp({ embeds: [embed], fetchReply: true, ephemeral: false  })
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }

  }
}