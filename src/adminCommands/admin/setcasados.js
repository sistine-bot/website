const { EmbedBuilder } = require('discord.js');
const { getUser, isStaff } = require('../../utils/functions.js');
const moment = require('moment');

module.exports = {
  name: "setcasados",
  aliases: ["casaradmin", "forcarcasamento"],
  description: "Força o casamento administrativo entre dois usuários no banco de dados.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      if (!args[0] || !args[1]) {
        return message.reply({
          content: `📖 **Uso Correto:** \`${prefixo}setcasados <@usuário1/ID> <@usuário2/ID>\`\n\n💡 **Exemplo:** \`${prefixo}setcasados @user1 @user2\``
        });
      }

      const user1 = getUser(message, args[0]);
      const user2 = getUser(message, args[1]);

      if (!user1 || !user2 || !user1.id || !user2.id) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Um ou ambos os usuários informados são inválidos.`
        });
      }

      if (user1.id === user2.id) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Você não pode casar um usuário com ele mesmo.`
        });
      }

      // Limpeza preventiva de casamentos antigos de ambos para evitar registros fantasmas
      const snapU1 = await database.ref(`economia/${user1.id}/Casamento`).once('value');
      const u1Data = snapU1.val();
      if (u1Data?.casado && u1Data.casado !== user2.id) {
        await database.ref(`economia/${u1Data.casado}/Casamento`).remove();
      }

      const snapU2 = await database.ref(`economia/${user2.id}/Casamento`).once('value');
      const u2Data = snapU2.val();
      if (u2Data?.casado && u2Data.casado !== user1.id) {
        await database.ref(`economia/${u2Data.casado}/Casamento`).remove();
      }

      const now = Date.now();
      const dataFormatada = moment(now).format("DD/MM/YYYY");

      await database.ref(`economia/${user1.id}/Casamento`).set({
        casado: user2.id,
        dataCasamento: dataFormatada,
        datanow: now
      });

      await database.ref(`economia/${user2.id}/Casamento`).set({
        casado: user1.id,
        dataCasamento: dataFormatada,
        datanow: now
      });

      const embed = new EmbedBuilder()
        .setColor('#ec4899')
        .setTitle('💍 Casamento Administrativo Celebrado!')
        .setDescription(
          `O cartório oficial de Sistine uniu em matrimônio:\n\n` +
          `👰🤵 **Casal:** <@${user1.id}> ❤️ <@${user2.id}>\n` +
          `📅 **Data do Enlace:** \`${dataFormatada}\`\n\n` +
          `🛡️ **Celebrante (Staff):** <@${message.author.id}>`
        )
        .setFooter({ text: 'Sistine Cartório & Administração' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('[Command setcasados]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao registrar o casamento.`
      });
    }
  }
};
