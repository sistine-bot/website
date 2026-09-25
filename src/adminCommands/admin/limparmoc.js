const { EmbedBuilder } = require('discord.js');
const { getUser, isStaff } = require('../../utils/functions.js');

module.exports = {
  name: "limparmoc",
  aliases: ["limparmochila", "clearmochila", "clearmoc"],
  description: "Limpa todos os itens e equipamentos da mochila de um usuário.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      const user = args[0] ? getUser(message, args[0]) : message.author;
      if (!user || !user.id) {
        return message.reply({ content: `${emoji.negativo || '❌'} **|** Usuário não encontrado.` });
      }

      await database.ref(`economia/${user.id}/inventario/itens`).remove();

      const embed = new EmbedBuilder()
        .setColor(color.embed || '#831396')
        .setTitle('🗑️ Mochila Limpa')
        .setDescription(
          `${emoji.positivo || '✅'} **|** Todos os itens e equipamentos de <@${user.id}> foram removidos com sucesso!\n\n` +
          `👤 **Usuário:** \`${user.username || user.tag || user.id}\` (\`${user.id}\`)\n` +
          `🛡️ **Staff:** <@${message.author.id}>`
        )
        .setFooter({ text: 'Sistine Administração' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('[Command limparmoc]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao limpar a mochila.`
      });
    }
  }
};