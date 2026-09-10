const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Format } = require('../../utils/functions.js');

module.exports =  {
  "name": "top",
  "description": `⌊💸 Economia⌉ Veja o ranking de algo.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "assaltos",
      "description": `⌊💸 Economia⌉ Veja o ranking dos usuários que mais assaltam.`,
      "type": ApplicationCommandType.ChatInput,
      "options": [
        {
          "name": "página",
          "type": ApplicationCommandOptionType.Number,
          "description": "Qual página deseja ver.",
          "required": false,
        }
      ]
    },
    {
      "name": "dinheiro",
      "description": `⌊💸 Economia⌉ Veja o ranking dos mais ricos em dinheiro.`,
      "type": ApplicationCommandType.ChatInput,
      "options": [
        {
          "name": "página",
          "type": ApplicationCommandOptionType.Number,
          "description": "Qual página deseja ver.",
          "required": false,
        }
      ]
    },
    {
      "name": "reputações",
      "description": `⌊💸 Economia⌉ Veja o ranking dos que mais tem reputações.`,
      "type": ApplicationCommandType.ChatInput,
      "options": [
        {
          "name": "reputação",
          "type": ApplicationCommandOptionType.String,
          "description": "Qual tipo de top deseja ver.",
          "required": true,
          "choices": [
            {
              "name": "Enviadas",
              "value": "enviadas"
            },
            {
              "name": "Recebidas",
              "value": "recebidas"
            },
          ],
        },
        {
          "name": "página",
          "type": ApplicationCommandOptionType.Number,
          "description": "Qual página deseja ver.",
          "required": false,
        }
      ],
    },
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      
      const page = interaction.options.getNumber('página')
      
      const comando = interaction.options.getSubcommand();
      const ArrayRanking = [];

      // Função utilitária interna para puxar e ordenar o Leaderboard do Firebase
      async function getLeaderboard(child, min = 1) {
        const snapshot = await database.ref('economia').orderByChild(child).once('value');
        const leaderboard = [];

        snapshot.forEach((childSnapshot) => {
          const userId = childSnapshot.key;
          if (child !== 'assaltos' && userId === 'assaltos') return;
          const count = childSnapshot.child(child).val();
          if (count < min) return;
          leaderboard.push({ userId, count });
        });

        return leaderboard.sort((a, b) => b.count - a.count);
      }

      let NomeRank = 'Nome não definido';

      // Execução e formatação com base no subcomando escolhido
      switch (comando) {
        case 'dinheiro': {
          const array = await getLeaderboard('saldo/banco', 100);
          NomeRank = 'Dinheiro';
          
          array.forEach((u, index) => {
            ArrayRanking.push(`**\`${index + 1}.\`** <@${u.userId}>\n> 🪙 **${Format(u.count, 'R$')}**`);
          });
          break;
        }

        case 'reputações': {
          const escolha = interaction.options.getString('reputação');
          const isEnviadas = escolha === 'enviadas';
          
          const DB = isEnviadas ? 'reputações_enviadas' : 'reputações_recebidas';
          NomeRank = isEnviadas ? 'Reputações Enviadas' : 'Reputações Recebidas';

          const array = await getLeaderboard(`Reputações/${DB}`);
          
          array.forEach((u, index) => {
            ArrayRanking.push(`**\`${index + 1}.\`** <@${u.userId}>\n> <:reputacao:1070900556262015026> **${Format(u.count, '')}**`);
          });
          break;
        }

        case 'assaltos': {
          const array = await getLeaderboard('assaltos', 1);
          NomeRank = 'Assaltos';

          array.forEach((u, index) => {
            ArrayRanking.push(`**\`${index + 1}.\`** <@${u.userId}>\n> 🔫 **${Format(u.count, '')}**`);
          });
          break;
        }
      }

      // Configuração de Paginação Limpa
      const itensPorPagina = 5;
      const totalPages = Math.ceil(ArrayRanking.length / itensPorPagina) || 1;
      
      // Valida para garantir que a página solicitada não ultrapasse o limite real
      let pagina = page ?? 1;
      if (pagina > totalPages) pagina = totalPages;
      if (pagina < 1) pagina = 1;

      // DRY: Centralização da Embed para evitar repetições desnecessárias
      const gerarEmbed = (pag) => {
        const inicio = (pag - 1) * itensPorPagina;
        const fim = pag * itensPorPagina;
        const dadosExibidos = ArrayRanking.slice(inicio, fim).join('\n');

        return new EmbedBuilder()
          .setAuthor({ 
            name: client.user.username, 
            iconURL: client.user.displayAvatarURL({ size: 256 }) 
          })
          .setDescription(`**Ranking ${NomeRank}**\n\n${dadosExibidos || 'Nenhum registro encontrado.'}`)
          .setColor(color.embed || "#00ff00")
          .setFooter({ 
            text: `Página ${pag} de ${totalPages} ・ ${interaction.guild.name}`, 
            iconURL: interaction.guild.iconURL() || undefined 
          });
      };

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("VoltarT").setStyle(ButtonStyle.Secondary).setEmoji('⏪'),
        new ButtonBuilder().setCustomId("voltar").setStyle(ButtonStyle.Secondary).setEmoji(emoji.seta_esquerda || '⬅️'),
        new ButtonBuilder().setCustomId("passar").setStyle(ButtonStyle.Secondary).setEmoji(emoji.seta_direita || '➡️'),
        new ButtonBuilder().setCustomId("PassarT").setStyle(ButtonStyle.Secondary).setEmoji('⏩'),
      );

      const msg = await interaction.followUp({ 
        embeds: [gerarEmbed(pagina)], 
        components: [row], 
        fetchReply: true 
      });

      const collector = msg.createMessageComponentCollector({ 
        filter: i => i.user.id === interaction.user.id,
        time: 90000 // Desativa após 1 minuto e meio de inatividade
      });

      collector.on('collect', async (i) => {
        await i.deferUpdate();

        switch (i.customId) {
          case 'VoltarT':
            pagina = 1;
            break;
          case 'PassarT':
            pagina = totalPages;
            break;
          case 'voltar':
            pagina = pagina > 1 ? pagina - 1 : totalPages;
            break;
          case 'passar':
            pagina = pagina < totalPages ? pagina + 1 : 1;
            break;
        }

        await msg.edit({ embeds: [gerarEmbed(pagina)] });
      });

      // Evento disparado quando o coletor expirar (Tratamento visual excelente)
      collector.on('end', () => {
        const rowDesativada = ActionRowBuilder.from(row);
        rowDesativada.components.forEach(btn => btn.setDisabled(true));
        msg.edit({ components: [rowDesativada] }).catch(() => {});
      });

    } catch (error) {
      console.error("Erro no comando top:", error);
      // Fallback para interações que falham mas precisam de feedback amigável
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp({ content: `Ocorreu um erro inesperado ao carregar o ranking.`, ephemeral: true }).catch(() => {});
      } else {
        return interaction.reply({ content: `Ocorreu um erro inesperado ao carregar o ranking.`, ephemeral: true }).catch(() => {});
      }
    }
  }
};