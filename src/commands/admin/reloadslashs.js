
const { EmbedBuilder } = require('discord.js')
const functions = require('../../utils/functions.js');

module.exports = {
  name: "reloadslashs",
  aliases: ['reloadslash'],
  
  run: async(client, message, args, prefixo, color, database, emoji)=> {
  
    if (!(client.config.cargos.criador).includes(message.author.id)) {
      return false;
    }
    
    try {
      
      await require(`${process.cwd()}/handlers/slashCommand.js`)(client, client.token);

      return message.reply("Todos os slashs foram atualizados.")
    } catch (e) {
      return message.reply(`Ocorreu um erro ao reiniciar este comando:\n${e}`)
    }

  }
};
