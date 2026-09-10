const { EmbedBuilder } = require('discord.js')
const { NumberConvert, UpdateMoneyBank, Format, getUser } = require('../../utils/functions.js');

module.exports = {
  name: "addbanco",
  aliases: [],
  
  run: async (client, message, args, prefixo, color, database, emoji) => {
    
    try {

      if (!(client.config.cargos.criador).includes(message.author.id)) {
        return false;
      }
      
      if (!args[0]) return message.reply(`Você deve inserir uma quantia para adicionar.`);
      let quantia = NumberConvert(args[0]);
      if (!quantia) return message.reply(`\`${args[0]}\` não me parece um número.`);

      let user = getUser(message, args[1]);
      
      await UpdateMoneyBank(message, user, '+', quantia);
      
      const embed = new EmbedBuilder()
      .setDescription(`${emoji.dinheiro} **|** ${user} recebeu ${Format(quantia)} direto no banco`)
      .setColor(color.embed)
      
      return message.reply({ embeds: [embed] })
      
    } catch (error) {
      console.error(error);
      return message.error()
    }
    
  }
};