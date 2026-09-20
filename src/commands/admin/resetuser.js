const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const { getUser, isStaff } = require('../../utils/functions.js');

module.exports = {
  name: "resetuser",
  aliases: ["zerarconta", "wipeuser", "resetconta"],
  description: "Reseta completamente os dados de economia, inventário e histórico de um usuário.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      if (!args[0]) {
        return message.reply({
          content: `📖 **Uso Correto:** \`${prefixo}resetuser <@usuário/ID>\`\n💡 **Atenção:** Esta ação apaga saldo, inventário, fazenda e estatísticas do usuário permanentemente.`
        });
      }

      const targetUser = getUser(message, args[0]);
      if (!targetUser || !targetUser.id) {
        return message.reply({ content: `${emoji.negativo || '❌'} **|** Usuário não encontrado ou inválido.` });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_wipe')
          .setLabel('Confirmar Reset Total')
          .setEmoji('⚠️')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_wipe')
          .setLabel('Cancelar')
          .setStyle(ButtonStyle.Secondary)
      );

      const confirmEmbed = new EmbedBuilder()
        .setColor('#ef4444')
        .setTitle('⚠️ Confirmação de Reset de Conta')
        .setDescription(
          `Você está prestes a **zerar completamente** todos os dados de <@${targetUser.id}>!\n\n` +
          `• **Serão apagados:** Saldo (carteira e banco), inventário de itens e armas, fazenda, cooldowns e transações.\n\n` +
          `⚠️ **Esta ação é irreversível!** Deseja realmente prosseguir?`
        )
        .setFooter({ text: 'A confirmação expira em 30 segundos.' });

      const replyMsg = await message.reply({
        embeds: [confirmEmbed],
        components: [row]
      });

      const collector = replyMsg.createMessageComponentCollector({
        filter: i => i.user.id === message.author.id,
        time: 30 * 1000,
        max: 1
      });

      collector.on('collect', async (interaction) => {
        if (interaction.customId === 'cancel_wipe') {
          return interaction.update({
            content: '❌ **|** Operação de reset cancelada com sucesso.',
            embeds: [],
            components: []
          });
        }

        if (interaction.customId === 'confirm_wipe') {
          await interaction.deferUpdate();

          // Remove nó da economia
          await database.ref(`economia/${targetUser.id}`).remove();

          // Inicializa saldo zerado padrão
          await database.ref(`economia/${targetUser.id}/saldo`).set({
            carteira: 0,
            banco: 0
          });

          const wipedEmbed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('💥 Conta Zerada com Sucesso!')
            .setDescription(
              `Todos os dados de progresso e economia de <@${targetUser.id}> foram totalmente limpos do banco de dados!\n\n` +
              `👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\` (\`${targetUser.id}\`)\n` +
              `🛡️ **Operado por:** <@${message.author.id}>`
            )
            .setFooter({ text: 'Sistine Administração' })
            .setTimestamp();

          return replyMsg.edit({
            embeds: [wipedEmbed],
            components: []
          });
        }
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          const timeoutRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('confirm_wipe')
              .setLabel('Expirado')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );
          await replyMsg.edit({ components: [timeoutRow] }).catch(() => {});
        }
      });

    } catch (error) {
      console.error('[Command resetuser error]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao resetar a conta do usuário.`
      });
    }
  }
};
