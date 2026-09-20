const { EmbedBuilder } = require('discord.js');
const { getUser, ParseDuration, isStaff } = require('../../utils/functions.js');

module.exports = {
  name: 'editarantiroubo',
  aliases: ['addantiroubo', 'editantiroubo', 'antiroubo'],
  description: 'Gerencia a proteção anti-roubo de um usuário (adicionar tempo ou remover).',

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      if (!args[0]) {
        const helpEmbed = new EmbedBuilder()
          .setColor(color.embed || '#831396')
          .setTitle('🛡️ Gerenciamento de Anti-Roubo (Sistine)')
          .setDescription(
            `Comando administrativo para conceder ou revogar o escudo de proteção contra assaltos.\n\n` +
            `📖 **Modos de Uso:**\n` +
            `> \`${prefixo}editarantiroubo <duração> <@usuário/ID>\`\n` +
            `> \`${prefixo}editarantiroubo 0 <@usuário/ID>\` *(Remove a proteção imediatamente)*\n\n` +
            `💡 **Exemplos:**\n` +
            `> \`${prefixo}editarantiroubo 7d @user\`\n` +
            `> \`${prefixo}editarantiroubo 30d @user\`\n` +
            `> \`${prefixo}editarantiroubo 0 @user\``
          );
        return message.reply({ embeds: [helpEmbed] });
      }

      const duration = ParseDuration(args[0]);

      if (duration === null) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Formato de tempo inválido. Use formatos como \`1d\`, \`7d\`, \`30d\` ou \`0\` para remover.`
        });
      }

      let user;

      // Remover Anti-Roubo
      if (duration === 0) {
        user = args[1] ? getUser(message, args[1]) : null;

        if (!user || !user.id) {
          return message.reply({
            content: `📖 **Uso Correto para remover:** \`${prefixo}editarantiroubo 0 <@usuário/ID>\``
          });
        }

        await database.ref(`/economia/${user.id}/AntiRoubo`).remove();

        const embed = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle('🔓 Escudo Anti-Roubo Removido')
          .setDescription(
            `A proteção Anti-Roubo de <@${user.id}> foi removida com sucesso!\n\n` +
            `👤 **Usuário:** \`${user.username || user.tag || user.id}\` (\`${user.id}\`)\n` +
            `🛡️ **Administrador:** <@${message.author.id}>`
          )
          .setFooter({ text: 'Sistine Administração' })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      // Adicionar Anti-Roubo
      user = args[1] ? getUser(message, args[1]) : null;

      if (!user || !user.id) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Usuário inválido ou não informado. Use: \`${prefixo}editarantiroubo ${args[0]} <@usuário/ID>\``
        });
      }

      const antirouboRef = database.ref(`/economia/${user.id}/AntiRoubo`);
      const snapshot = await antirouboRef.once('value');
      const antiData = snapshot.val() || {};

      let restante = 0;
      if (antiData.data && antiData.tempo) {
        restante = Math.max(0, antiData.tempo - (Date.now() - antiData.data));
      }

      const novoTempo = restante + duration;
      const agora = Date.now();

      await antirouboRef.set({
        tempo: novoTempo,
        data: agora
      });

      const timestampFim = Math.floor((agora + novoTempo) / 1000);

      const embed = new EmbedBuilder()
        .setColor('#10b981')
        .setTitle('🛡️ Proteção Anti-Roubo Ativada!')
        .setDescription(
          `O usuário <@${user.id}> recebeu um escudo reforçado de **Anti-Roubo**!\n\n` +
          `⏱️ **Tempo Adicionado:** \`${args[0]}\`\n` +
          `⏳ **Protegido até:** <t:${timestampFim}:F> (<t:${timestampFim}:R>)\n\n` +
          `🛡️ **Administrador:** <@${message.author.id}>`
        )
        .setFooter({ text: 'Sistine Administração' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('[Command editarantiroubo]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao atualizar a proteção anti-roubo.`
      });
    }
  }
};