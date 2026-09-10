const { EmbedBuilder } = require('discord.js')
const { getUserMoney, getUser, Format } = require('../../utils/functions.js');

module.exports = {
  name: "saldo",
  aliases: [],
  
  run: async (client, message, args, prefixo, color, database, emoji) => {
    
    try {
      const user = getUser(message, args[0]);
      
      let { carteira, banco } = await getUserMoney(user)
      // if (!saldo || !saldo.carteira || saldo.carteira == null) saldo = { carteira: 0, banco: 0 }
      
      const embed = new EmbedBuilder()
      .setColor(color.embed)
      .setDescription(`💸 **|** Carteira: ${Format(carteira)}\n🏦 **|** Banco: ${Format(banco)}`)
      
      return message.reply({ content: `${user}`, embeds: [embed] });
      
    } catch (error) {
      console.error(error);
      return message.error()
    }
    
  }
};
