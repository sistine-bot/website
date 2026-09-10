const { EmbedBuilder } = require('discord.js');
const { getUser, ParseDuration } = require('../../utils/functions.js');

module.exports = {
  name: 'editarantiroubo',
  aliases: ['addantiroubo', 'editantiroubo', 'antiroubo'],

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {

      if (!(client.config.cargos.criador).includes(message.author.id)) {
        return;
      }

      const duration = ParseDuration(args[0]);

      if (duration === null) {
        return message.reply(
          `Use:\n` +
          `\`${prefixo}editarantiroubo 30d @user\`\n` +
          `\`${prefixo}editarantiroubo 30d @user\`\n` +
          `\`${prefixo}editarantiroubo 0 @user\``
        );
      }
      
      let user;

      // Remover VIP
      if (duration === 0) {

        user = getUser(message, args[1]);

        if (!user) {
          return message.reply(
            `Use: \`${prefixo}editarantiroubo 0 @usuário\``
          );
        }

        await database.ref(`/economia/${user.id}/AntiRoubo`).remove();

        const embed = new EmbedBuilder()
          .setColor(color.embed)
          .setDescription(
            `❌ **|** Anti roubo removido de ${user}.`
          );

        return message.reply({ embeds: [embed] });
      }

      user = getUser(message, args[1]);

      if (!user) {
        return message.reply('Usuário inválido.');
      }

      const antirouboRef = database.ref(`/economia/${user.id}/AntiRoubo`);
      const snapshot = await antirouboRef.once('value');

      const AntiRData = snapshot.val() || {};

      let restante = 0;

      if (AntiRData.data && AntiRData.tempo) {
        restante = Math.max(
          0,
          AntiRData.tempo - (Date.now() - AntiRData.data)
        );
      }

      const novoTempo = restante + duration;

      await antirouboRef.set({
        tempo: novoTempo,
        data: Date.now()
      });
      
      const embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(
          `👑 **|** ${user} recebeu **Proteção Anti-Roubo**\n` +
          `⏱️ **Tempo adicionado:** ${args[0]}`
        );

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      return message.error();
    }
  }
};