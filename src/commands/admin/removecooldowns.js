const { EmbedBuilder } = require('discord.js');
const { getUser, isStaff } = require('../../utils/functions.js');

module.exports = {
  name: "removecooldowns",
  aliases: ["rt", "removetimers", "resetcooldowns", "resetcd"],
  description: "Reseta todos os tempos de espera (cooldowns) de um usuário.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      const user = args[0] ? getUser(message, args[0]) : message.author;

      if (!user || !user.id) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Usuário não encontrado.`
        });
      }

      const specificKey = args[1] ? args[1].toLowerCase() : null;

      if (specificKey && specificKey !== 'all' && specificKey !== 'todos') {
        await database.ref(`economia/${user.id}/cooldowns/${specificKey}`).remove();

        const embed = new EmbedBuilder()
          .setColor(color.embed || '#831396')
          .setTitle('⏱️ Cooldown Específico Resetado')
          .setDescription(
            `${emoji.positivo || '✅'} **|** O cooldown de \`${specificKey}\` de <@${user.id}> foi liberado!\n\n` +
            `👤 **Usuário:** \`${user.username || user.tag || user.id}\`\n` +
            `🛡️ **Staff:** <@${message.author.id}>`
          )
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      await database.ref(`economia/${user.id}/cooldowns`).remove();

      const embed = new EmbedBuilder()
        .setColor(color.embed || '#831396')
        .setTitle('⏱️ Todos os Cooldowns Resetados')
        .setDescription(
          `${emoji.positivo || '✅'} **|** Todos os temporizadores de economia, módulos e apostas de <@${user.id}> foram zerados!\n\n` +
          `👤 **Usuário:** \`${user.username || user.tag || user.id}\` (\`${user.id}\`)\n` +
          `🛡️ **Staff:** <@${message.author.id}>`
        )
        .setFooter({ text: 'Sistine Administração' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('[Command removecooldowns]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao resetar os cooldowns.`
      });
    }
  }
};
