const { EmbedBuilder } = require('discord.js')
const { getUser } = require('../../utils/functions.js');

module.exports = {
  name: "limparmoc",
  aliases: ['limparmochila', 'clearmochila'],
  
  run: async (client, message, args, prefixo, color, database, emoji) => {
    
    try {

        if (!(client.config.cargos.criador).includes(message.author.id)) {
            return false;
        }
        
        let user = getUser(message, args[1]);
        
        database.ref(`economia/${user.id}/inventario/itens`).remove();
        
        const embed = new EmbedBuilder()
        .setDescription(`${emoji.dinheiro} **|** ${user} ficou com a mochila vazia.`)
        .setColor(color.embed)
        
        return message.reply({ embeds: [embed] })
        
    } catch (error) {
      console.error(error);
      return message.error()
    }

  }
}