const { EmbedBuilder } = require('discord.js');
const { getUser, ParseDuration } = require('../../utils/functions.js');

module.exports = {
  name: 'editarvip',
  aliases: ['addvip', 'editvip'],

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {

      if (!(client.config.cargos.criador).includes(message.author.id)) {
        return;
      }

      const duration = ParseDuration(args[0]);

      if (duration === null) {
        return message.reply(
          `Use:\n` +
          `\`${prefixo}editarvip 30d ouro @user\`\n` +
          `\`${prefixo}editarvip 30d diamante @user\`\n` +
          `\`${prefixo}editarvip 0 @user\``
        );
      }

      let vipType;
      let user;

      // Remover VIP
      if (duration === 0) {

        user = getUser(message, args[1]);

        if (!user) {
          return message.reply(
            `Use: \`${prefixo}editarvip 0 @usuário\``
          );
        }

        await database.ref(`/economia/${user.id}/vip`).set({
          vip: 0,
          tempo: 0,
          data: 0
        });

        const embed = new EmbedBuilder()
          .setColor(color.embed)
          .setDescription(
            `❌ **|** VIP removido de ${user}.`
          );

        return message.reply({ embeds: [embed] });
      }

      switch ((args[1] || '').toLowerCase()) {
        case '1':
        case 'ouro':
          vipType = 1;
          break;

        case '2':
        case 'diamante':
          vipType = 2;
          break;

        default:
          return message.reply(
            'Tipo de VIP inválido.\nUse `1`/`ouro` ou `2`/`diamante`.'
          );
      }

      user = getUser(message, args[2]);

      if (!user) {
        return message.reply('Usuário inválido.');
      }

      const vipRef = database.ref(`/economia/${user.id}/vip`);
      const snapshot = await vipRef.once('value');

      const vipData = snapshot.val() || {};

      let restante = 0;

      if (vipData.data && vipData.tempo) {
        restante = Math.max(
          0,
          vipData.tempo - (Date.now() - vipData.data)
        );
      }

      const novoTempo = restante + duration;

      await vipRef.set({
        vip: vipType,
        tempo: novoTempo,
        data: Date.now()
      });

      const nomeVip = vipType === 1
        ? 'VIP Ouro'
        : 'VIP Diamante';

      const embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(
          `👑 **|** ${user} recebeu **${nomeVip}**.\n` +
          `⏱️ **Tempo adicionado:** ${args[0]}`
        );

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      return message.error();
    }
  }
};