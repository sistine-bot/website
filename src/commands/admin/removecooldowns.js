
const { EmbedBuilder } = require('discord.js')
const { NumberConvert, UpdateMoneyBank, Format, getUser } = require('../../utils/functions.js');

module.exports = {
  name: "removecooldowns",
  aliases: ['rt', 'removetimers'],
  
  run: async(client, message, args, prefixo, color, database, emoji)=> {
  
    try {
      
      if (!(client.config.cargos.criador).includes(message.author.id)) {
        return false;
      }
      
      const user = getUser(message, args[0]);
      
      await database.ref(`economia/${user.id}/cooldowns`).remove()
      
      const embed = new EmbedBuilder()
      .setDescription(`${emoji.relogio} **|** ${user} teve todos os seus cooldowns resetados.`)
      .setColor(color.embed)
      
      return message.reply({ embeds: [embed] })
      
    } catch (error) {
      console.error(error);
      return message.error()
    }

  }
};
