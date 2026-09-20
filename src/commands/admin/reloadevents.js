const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { isStaff } = require('../../utils/functions.js');

module.exports = {
  name: "reloadevents",
  aliases: ["reloadevent", "reloadev", "syncevents"],
  description: "Limpa o cache dos arquivos de eventos e recarrega os handlers.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      const eventsDir = path.join(process.cwd(), 'src', 'events');
      const eventFiles = fs.readdirSync(eventsDir).filter(f => f.endsWith('.js'));

      // Limpa cache de cada arquivo de evento individualmente
      for (const file of eventFiles) {
        const filePath = path.join(eventsDir, file);
        delete require.cache[require.resolve(filePath)];
      }

      const handlerPath = path.join(process.cwd(), 'handlers', 'events.js');
      delete require.cache[require.resolve(handlerPath)];

      await require(handlerPath)(client);

      const embed = new EmbedBuilder()
        .setColor('#10b981')
        .setTitle('🔄 Eventos Recarregados!')
        .setDescription(
          `Todos os arquivos de eventos foram atualizados em memória com sucesso!\n\n` +
          `📁 **Arquivos processados:** \`${eventFiles.length}\` arquivos em \`src/events/\`\n` +
          `🛡️ **Operador:** <@${message.author.id}>`
        )
        .setFooter({ text: 'Sistine Event System' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (e) {
      console.error('[Command reloadevents error]', e);
      return message.reply({
        content: `❌ **|** Ocorreu um erro ao reiniciar os eventos:\n\`\`\`js\n${e.message || e}\n\`\`\``
      });
    }
  }
};