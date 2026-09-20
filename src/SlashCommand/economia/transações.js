const { ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { resolveTransactionList } = require('../../utils/functions.js');

module.exports = {
  name: "transações",
  description: "⌊💸 Economia⌉ Veja seu histórico de transações.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "usuário",
      type: ApplicationCommandOptionType.User,
      description: "Mencione alguém para ver as transações dela",
      required: false,
    },
    {
      name: "transações",
      description: "Escolha se você quer ver as transações enviadas ou recebidas",
      required: false,
      type: ApplicationCommandOptionType.String,
      choices: [
        {
          name: "📥 Transações recebidas (Entradas)",
          value: "recebidas"
        },
        {
          name: "📤 Transações enviadas (Saídas)",
          value: "enviadas"
        },
      ]
    },
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const user = interaction.options.getUser("usuário") || interaction.user;

      if (user.id !== client.user.id && user.bot) {
        return interaction.editReply({ content: `Bots não recebem transações.` });
      }

      const [userSnapshot, configSnapshot] = await Promise.all([
        database.ref(`economia/${user.id}/Transações`).once('value'),
        database.ref('config/transações').once('value')
      ]);

      const transData = userSnapshot.val();

      let rawTrans = [];
      if (transData && Array.isArray(transData.transações)) {
        rawTrans = transData.transações;
      } else if (transData && typeof transData === 'object') {
        for (const [k, v] of Object.entries(transData)) {
          if (k !== 'transações' && typeof v === 'string') rawTrans.push(v);
        }
      }

      if (!rawTrans.length) {
        return interaction.editReply({
          content: `${user.id === interaction.user.id ? 'Você' : user.username} não possui nenhuma transação registrada.`
        });
      }

      // Resolve a lista modularmente utilizando a engine central
      const resolvedList = await resolveTransactionList(rawTrans, client, configSnapshot);

      const escolha = interaction.options.getString('transações');
      const transacoesFiltradas = resolvedList
        .filter(item => {
          if (!escolha) return true;
          return escolha === 'recebidas' ? item.flow === 'entrada' : item.flow === 'saida';
        })
        .map(item => item.fullDisplay);

      if (!transacoesFiltradas.length) {
        return interaction.editReply({
          content: `Nenhuma transação do tipo **${escolha === 'recebidas' ? 'recebida' : 'enviada'}** foi encontrada para este usuário.`
        });
      }

      // Configuração de paginação interativa
      let pagina = 1;
      const itensPorPagina = 10;
      const totalPages = Math.ceil(transacoesFiltradas.length / itensPorPagina) || 1;
      const tituloAutor = user.id === interaction.user.id ? 'Suas transações' : `Transações de: ${user.username}`;

      const gerarEmbed = (pag) => {
        const inicio = (pag - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const dadosExibidos = transacoesFiltradas.slice(inicio, fim).join('\n');

        return new EmbedBuilder()
          .setAuthor({
            name: `${tituloAutor} • ${transacoesFiltradas.length} Registros`,
            iconURL: client.user.displayAvatarURL({ size: 256 })
          })
          .setDescription(dadosExibidos || "Nenhuma transação encontrada.")
          .setColor(color.embed || "#831396")
          .setFooter({
            text: `Página ${pag} de ${totalPages} • ${interaction.guild?.name || 'Sistine'}`,
            iconURL: interaction.guild?.iconURL() || undefined
          });
      };

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("voltarT").setStyle(ButtonStyle.Secondary).setEmoji('⏪'),
        new ButtonBuilder().setCustomId("voltar").setStyle(ButtonStyle.Secondary).setEmoji(emoji?.seta_esquerda || '⬅️'),
        new ButtonBuilder().setCustomId("passar").setStyle(ButtonStyle.Secondary).setEmoji(emoji?.seta_direita || '➡️'),
        new ButtonBuilder().setCustomId("passarT").setStyle(ButtonStyle.Secondary).setEmoji('⏩'),
      );

      const msg = await interaction.editReply({
        embeds: [gerarEmbed(pagina)],
        components: totalPages > 1 ? [row] : []
      });

      if (totalPages <= 1) return;

      const coletor = msg.createMessageComponentCollector({
        filter: x => x.user.id === interaction.user.id,
        time: 120000
      });

      coletor.on('collect', async (int) => {
        await int.deferUpdate();

        switch (int.customId) {
          case 'voltarT':
            pagina = 1;
            break;
          case 'voltar':
            pagina = pagina > 1 ? pagina - 1 : totalPages;
            break;
          case 'passar':
            pagina = pagina < totalPages ? pagina + 1 : 1;
            break;
          case 'passarT':
            pagina = totalPages;
            break;
        }

        await msg.edit({ embeds: [gerarEmbed(pagina)] });
      });

      coletor.on('end', () => {
        const rowDesativada = ActionRowBuilder.from(row);
        rowDesativada.components.forEach(btn => btn.setDisabled(true));
        msg.edit({ components: [rowDesativada] }).catch(() => {});
      });

    } catch (error) {
      console.error("Erro no comando transações:", error);
      if (interaction.deferred || interaction.replied) {
        return interaction.editReply({
          content: `Ocorreu um erro inesperado ao consultar as transações.`
        }).catch(() => {});
      } else {
        return interaction.reply({
          content: `Ocorreu um erro inesperado ao consultar as transações.`,
          ephemeral: true
        }).catch(() => {});
      }
    }
  }
};