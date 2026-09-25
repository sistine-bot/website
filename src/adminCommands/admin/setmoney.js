const { EmbedBuilder } = require('discord.js');
const { getUser, isStaff, NumberConvert, Format, TransactionUpdate } = require('../../utils/functions.js');

module.exports = {
  name: "setmoney",
  aliases: ["setsaldo", "setbanco", "setcarteira", "definirsaldo"],
  description: "Define um valor exato para o saldo da carteira ou banco de um usuário.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      if (!args[0] || !args[1] || !args[2]) {
        return message.reply({
          content: `📖 **Uso Correto:**\n> \`${prefixo}setmoney <@usuário/ID> <carteira|banco|ambos> <valor>\`\n\n` +
            `💡 **Exemplos:**\n` +
            `> \`${prefixo}setmoney @user carteira 10000\`\n` +
            `> \`${prefixo}setmoney @user banco 500k\`\n` +
            `> \`${prefixo}setmoney @user ambos 0\``
        });
      }

      const targetUser = getUser(message, args[0]);
      if (!targetUser || !targetUser.id) {
        return message.reply({ content: `${emoji.negativo || '❌'} **|** Usuário não encontrado ou inválido.` });
      }

      const tipo = args[1].toLowerCase();
      if (!['carteira', 'banco', 'ambos', 'tudo'].includes(tipo)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Tipo inválido. Especifique \`carteira\`, \`banco\` ou \`ambos\`.`
        });
      }

      const valorRaw = NumberConvert(args[2]);
      if (isNaN(valorRaw) || valorRaw < 0) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Por favor informe um valor numérico válido maior ou igual a 0.`
        });
      }

      const valor = Math.floor(valorRaw);
      const saldoRef = database.ref(`economia/${targetUser.id}/saldo`);
      const snap = await saldoRef.once('value');
      const saldoAtual = snap.val() || { carteira: 0, banco: 0 };

      const updates = {};
      let descModificacoes = '';

      if (tipo === 'carteira') {
        updates.carteira = valor;
        descModificacoes = `💵 **Carteira:** definida para \`${Format(valor)}\``;
      } else if (tipo === 'banco') {
        updates.banco = valor;
        descModificacoes = `🏛️ **Banco:** definido para \`${Format(valor)}\``;
      } else {
        updates.carteira = valor;
        updates.banco = valor;
        descModificacoes = `💵 **Carteira:** definida para \`${Format(valor)}\`\n🏛️ **Banco:** definido para \`${Format(valor)}\``;
      }

      await saldoRef.update(updates);
      await TransactionUpdate(message, { type: 'admin_definir', amount: valor, item: tipo }, targetUser);

      const embed = new EmbedBuilder()
        .setColor('#10b981')
        .setTitle('💰 Saldo Redefinido com Sucesso!')
        .setDescription(
          `O saldo de <@${targetUser.id}> foi ajustado diretamente pela administração:\n\n` +
          `${descModificacoes}\n\n` +
          `👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
          `🛡️ **Administrador:** <@${message.author.id}>`
        )
        .setFooter({ text: 'Sistine Auditoria Financeira' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('[Command setmoney error]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao definir o saldo do usuário.`
      });
    }
  }
};
