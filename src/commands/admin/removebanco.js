const { EmbedBuilder } = require('discord.js');
const { NumberConvert, UpdateMoneyBank, Format, getUser, isStaff, getUserMoney } = require('../../utils/functions.js');

module.exports = {
  name: "removebanco",
  aliases: ["removerbanco", "delbanco"],
  description: "Remove uma quantia do saldo bancário de um usuário.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      if (!args[0]) {
        return message.reply({
          content: `📖 **Uso Correto:**\n> \`${prefixo}removebanco <quantia> [@usuário/ID]\` ou \`${prefixo}removebanco <@usuário/ID> <quantia>\`\n\n💡 **Exemplo:** \`${prefixo}removebanco 50000 @user\` ou \`${prefixo}removebanco 25k\``
        });
      }

      let quantiaRaw;
      let targetUser;

      // Suporta ambas as ordens: <quantia> <user> ou <user> <quantia>
      const parsedFirst = NumberConvert(args[0]);
      if (!isNaN(parsedFirst) && parsedFirst > 0) {
        quantiaRaw = parsedFirst;
        targetUser = args[1] ? getUser(message, args[1]) : message.author;
      } else {
        targetUser = getUser(message, args[0]);
        quantiaRaw = args[1] ? NumberConvert(args[1]) : null;
      }

      if (!quantiaRaw || isNaN(quantiaRaw) || quantiaRaw <= 0) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Por favor, especifique uma quantia válida maior que 0 para remover. Ex: \`5000\`, \`50k\`, \`1m\`.`
        });
      }

      if (!targetUser || !targetUser.id) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Usuário não encontrado ou inválido.`
        });
      }

      const userMoney = await getUserMoney(targetUser);
      const atualBanco = userMoney.banco || 0;
      const quantiaRemover = Math.min(atualBanco, quantiaRaw);

      if (quantiaRemover <= 0) {
        return message.reply({
          content: `${emoji.aviso || '⚠️'} **|** O usuário <@${targetUser.id}> já possui saldo bancário zerado.`
        });
      }

      await UpdateMoneyBank(
        message,
        targetUser,
        '-',
        quantiaRemover,
        { type: 'admin_remocao', amount: quantiaRemover }
      );

      const embed = new EmbedBuilder()
        .setColor(color.embed || '#831396')
        .setTitle('🏛️ Saldo Bancário Removido')
        .setDescription(
          `${emoji.negativo || '❌'} **|** Foram removidos **${Format(quantiaRemover)}** do banco de <@${targetUser.id}>!\n\n` +
          `👤 **Usuário afetado:** \`${targetUser.username || targetUser.tag || targetUser.id}\` (\`${targetUser.id}\`)\n` +
          `💰 **Saldo restante no banco:** \`${Format(atualBanco - quantiaRemover)}\`\n` +
          `🛡️ **Administrador:** <@${message.author.id}>`
        )
        .setFooter({ text: 'Sistine Administração' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('[Command removebanco]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao remover dinheiro do banco.`
      });
    }
  }
};
