const { EmbedBuilder } = require('discord.js');
const { isStaff } = require('../../utils/functions.js');

module.exports = {
  name: "reloadslashs",
  aliases: ["reloadslash", "syncslashs", "syncslash"],
  description: "Recarrega e sincroniza todos os comandos Slash na API do Discord.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      const avisando = await message.reply({
        content: `⏳ **|** Sincronizando todos os comandos slash com a API do Discord, aguarde alguns instantes...`
      });

      const slashHandlerPath = `${process.cwd()}/handlers/slashCommand.js`;
      delete require.cache[require.resolve(slashHandlerPath)];

      await require(slashHandlerPath)(client);

      const embed = new EmbedBuilder()
        .setColor('#10b981')
        .setTitle('⚡ Comandos Slash Sincronizados!')
        .setDescription(
          `Todos os comandos da pasta \`src/SlashCommand/\` foram recarregados e registrados na API com sucesso!\n\n` +
          `📊 **Total em Memória:** \`${client.slashCommands.size}\` comandos ativos.\n` +
          `🛡️ **Operador:** <@${message.author.id}>`
        )
        .setFooter({ text: 'Sistine Handler System' })
        .setTimestamp();

      return avisando.edit({ content: null, embeds: [embed] });

    } catch (e) {
      console.error('[Command reloadslashs error]', e);
      return message.reply({
        content: `❌ **|** Ocorreu um erro ao sincronizar os slash commands:\n\`\`\`js\n${e.message || e}\n\`\`\``
      });
    }
  }
};
