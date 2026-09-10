const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: "reloadevents",
  aliases: ['reloadevent', 'reloadev'],
  
  run: async (client, message, args, prefixo, color, database, emoji) => {
    // Verifica se é o criador do bot
    if (!client.config.cargos.criador.includes(message.author.id)) {
      return false;
    }
    
    try {
      const handlerPath = `${process.cwd()}/handlers/events.js`; // Ajuste o caminho para o seu handler de eventos

      // Limpa o cache do próprio arquivo do handler para garantir que ele leia as atualizações
      delete require.cache[require.resolve(handlerPath)];

      // Executa o handler de eventos novamente
      await require(handlerPath)(client);

      return message.reply("🔄 **|** Todos os eventos do bot foram recarregados com sucesso e o cache foi limpo!");
    } catch (e) {
      console.error(e);
      return message.reply(`❌ **|** Ocorreu um erro ao reiniciar os eventos:\n\`\`\`js\n${e}\n\`\`\``);
    }
  }
};