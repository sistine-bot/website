const { EmbedBuilder } = require('discord.js');
const { NumberConvert, UpdateMoneyBank, Format, getUser, isStaff } = require('../../utils/functions.js');

module.exports = {
  name: "addbanco",
  aliases: ["adicionarbanco", "darbanco"],
  description: "Adiciona uma quantia ao saldo bancário de um usuário.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      if (!args[0]) {
        return message.reply({
          content: `📖 **Uso Correto:**\n> \`${prefixo}addbanco <quantia> [@usuário/ID]\` ou \`${prefixo}addbanco <@usuário/ID> <quantia>\`\n\n💡 **Exemplo:** \`${prefixo}addbanco 50000 @user\` ou \`${prefixo}addbanco 50k\``
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
          content: `${emoji.negativo || '❌'} **|** Por favor, especifique uma quantia válida maior que 0. Ex: \`5000\`, \`50k\`, \`1m\`.`
        });
      }

      if (!targetUser || !targetUser.id) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Usuário não encontrado ou inválido.`
        });
      }

      await UpdateMoneyBank(
        message,
        targetUser,
        '+',
        quantiaRaw,
        { type: 'admin_adicao', amount: quantiaRaw }
      );

      const embed = new EmbedBuilder()
        .setColor(color.embed || '#831396')
        .setTitle('🏛️ Saldo Bancário Adicionado')
        .setDescription(
          `${emoji.positivo || '✅'} **|** Foram adicionados **${Format(quantiaRaw)}** no banco de <@${targetUser.id}>!\n\n` +
          `👤 **Destinatário:** \`${targetUser.username || targetUser.tag || targetUser.id}\` (\`${targetUser.id}\`)\n` +
          `🛡️ **Administrador:** <@${message.author.id}>`
        )
        .setFooter({ text: 'Sistine Administração' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('[Command addbanco]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao adicionar dinheiro no banco.`
      });
    }
  }
};