const { EmbedBuilder } = require('discord.js');
const { getUser, ParseDuration, isStaff, FormatDuration } = require('../../utils/functions.js');

module.exports = {
  name: 'editarvip',
  aliases: ['addvip', 'editvip', 'setvip'],
  description: 'Gerencia o status VIP de um usuário (adicionar tempo ou remover).',

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
          .setTitle('👑 Gerenciamento de VIP (Sistine)')
          .setDescription(
            `Comando administrativo para conceder ou revogar assinaturas VIP.\n\n` +
            `📖 **Modos de Uso:**\n` +
            `> \`${prefixo}editarvip <duração> <tipo: ouro|diamante> <@usuário/ID>\`\n` +
            `> \`${prefixo}editarvip 0 <@usuário/ID>\` *(Remove o VIP do usuário)*\n\n` +
            `💡 **Exemplos:**\n` +
            `> \`${prefixo}editarvip 30d ouro @user\`\n` +
            `> \`${prefixo}editarvip 7d diamante @user\`\n` +
            `> \`${prefixo}editarvip 0 @user\``
          );
        return message.reply({ embeds: [helpEmbed] });
      }

      const duration = ParseDuration(args[0]);

      if (duration === null) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Formato de tempo inválido. Use formatos como \`7d\`, \`15d\`, \`30d\`, \`1y\` ou \`0\` para remover.`
        });
      }

      let user;

      // Remoção de VIP
      if (duration === 0) {
        user = args[1] ? getUser(message, args[1]) : null;

        if (!user || !user.id) {
          return message.reply({
            content: `📖 **Uso Correto para remover:** \`${prefixo}editarvip 0 <@usuário/ID>\``
          });
        }

        await database.ref(`/economia/${user.id}/vip`).set({
          vip: 0,
          tempo: 0,
          data: 0
        });

        const embed = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle('❌ Assinatura VIP Removida')
          .setDescription(
            `O status VIP de <@${user.id}> foi totalmente revogado com sucesso!\n\n` +
            `👤 **Usuário:** \`${user.username || user.tag || user.id}\` (\`${user.id}\`)\n` +
            `🛡️ **Administrador:** <@${message.author.id}>`
          )
          .setFooter({ text: 'Sistine Administração' })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      // Adição de VIP
      let vipType = 1;
      const typeArg = (args[1] || '').toLowerCase();

      switch (typeArg) {
        case '1':
        case 'ouro':
        case 'gold':
          vipType = 1;
          break;

        case '2':
        case 'diamante':
        case 'diamond':
          vipType = 2;
          break;

        default:
          return message.reply({
            content: `${emoji.negativo || '❌'} **|** Tipo de VIP inválido. Utilize \`ouro\` (Tier 1) ou \`diamante\` (Tier 2).`
          });
      }

      user = args[2] ? getUser(message, args[2]) : null;

      if (!user || !user.id) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Usuário inválido ou não informado. Use: \`${prefixo}editarvip ${args[0]} ${args[1]} <@usuário/ID>\``
        });
      }

      const vipRef = database.ref(`/economia/${user.id}/vip`);
      const snapshot = await vipRef.once('value');
      const vipData = snapshot.val() || {};

      let restante = 0;
      if (vipData.data && vipData.tempo) {
        restante = Math.max(0, vipData.tempo - (Date.now() - vipData.data));
      }

      const novoTempo = restante + duration;
      const agora = Date.now();

      await vipRef.set({
        vip: vipType,
        tempo: novoTempo,
        data: agora
      });

      const nomeVip = vipType === 1 ? '🌟 VIP Ouro' : '💎 VIP Diamante';
      const timestampFim = Math.floor((agora + novoTempo) / 1000);

      const embed = new EmbedBuilder()
        .setColor('#eab308')
        .setTitle('👑 Assinatura VIP Atualizada!')
        .setDescription(
          `O usuário <@${user.id}> agora é membro **${nomeVip}**!\n\n` +
          `⏱️ **Tempo Adicionado:** \`${args[0]}\`\n` +
          `⏳ **Expira em:** <t:${timestampFim}:F> (<t:${timestampFim}:R>)\n\n` +
          `🛡️ **Administrador:** <@${message.author.id}>`
        )
        .setFooter({ text: 'Sistine Administração' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('[Command editarvip]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao atualizar o VIP.`
      });
    }
  }
};