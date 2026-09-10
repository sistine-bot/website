const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: "rs",
  aliases: ['restartslash'],
  
  run: async(client, message, args, prefixo, color, database, emoji)=> {
    
    if (!(client.config.cargos.criador).includes(message.author.id)) {
      return false;
    }
    
    try {
      
      let pasta = args[0];
      let comando = args[1];
      
      if (!pasta || !comando) {
        return message.reply(`Modo de Uso: **${prefixo}restartslash <caminho> <comando>**`);
      }
      
      delete require.cache[require.resolve(`../../../src/SlashCommand/${pasta}/${comando}.js`)];

      await client.slashCommands.delete(comando);
      const pull = require(`../../../src/SlashCommand/${pasta}/${comando}.js`);
      await client.slashCommands.set(comando, pull);
      
      return message.reply("O comando **" + comando + "** da categoria **" + pasta + "** foi reiniciado")
    } catch (e) {
      return message.reply(`Ocorreu um erro ao reiniciar este comando:\n${e}`)
    }
    
  }
};