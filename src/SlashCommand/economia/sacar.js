const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { UpdateMoneyWallet, UpdateMoneyBank, NumberConvert, getUserMoney, Format } = require('../../utils/functions.js');

module.exports =  {
  "name": "sacar",
  "description": `⌊💸 Economia⌉ Saque o dinheiro que você possui.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "quantidade",
      "type": ApplicationCommandOptionType.String,
      "description": "Diga quanto você deseja sacar.",
      "required": true,
    }
  ],
  

  run: async (client, interaction, args, color, database, emoji) => {
    
    try {

      const Quantidade = interaction.options.getString('quantidade');
    
      const { banco } = await getUserMoney(interaction.user)

      let number = NumberConvert(Quantidade);
      if (['all', 'tudo'].includes(Quantidade.toLowerCase())) number = banco;
      
      if (isNaN(number)) return interaction.error({ content: `\`${Quantidade}\` Isto não me parece um número válido.` })

      if (number < 1) return interaction.error({ content: `${number} deve ser um número maior que 1` })
      
      if (banco < number) return interaction.error({ content: `Você não possui esta quantia no banco para sacar.` })
      
      await UpdateMoneyBank(interaction, interaction.user, '-', number, { type: 'saque', amount: number });
      await UpdateMoneyWallet(interaction, interaction.user, '+', number);
      
      const embed = new EmbedBuilder()
      .setColor(color.embed)
      .setDescription(`💵 **|** Você sacou **${Format(number)}** de seu banco com sucesso.`)
      
      return interaction.followUp({ embeds: [embed], ephemeral: false })
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }

  }
}