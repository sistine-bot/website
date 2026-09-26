const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { CheckUserCooldowns, ReputationUpdate, XpUpdate } = require('../../utils/functions.js');

module.exports = {
  "name": "reputação",
  "description": `⌊⚙️ Módulos⌉ Veja informações sobre reputações.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "lista",
      "aliases": ["list", "ver", "historico", "histórico", "rank", "ranking"],
      "description": "⌊⚙️ Módulos⌉ Veja a lista de reputações enviadas ou recebidas.",
      "type": ApplicationCommandOptionType.Subcommand, // CORREÇÃO: Tipo correto para subcomando
      "options": [
        {
          "name": "usuário",
          "type": ApplicationCommandOptionType.User,
          "description": "Mencione um usuário",
          "required": false,
        },
        {
          "name": "escolha",
          "description": "Escolha se você quer ver as reputações enviadas ou recebidas",
          "required": false,
          "type": ApplicationCommandOptionType.String,
          "choices": [
            { "name": "📥 Reputações recebidas", "value": "recebidas" },
            { "name": "📤 Reputações enviadas", "value": "enviadas" },
            { "name": "✨ Reputações especiais", "value": "especiais" },
          ]
        },
      ],
    },
    {
      "name": "enviar",
      "aliases": ["dar", "send", "add", "doar", "give"],
      "description": "⌊⚙️ Módulos⌉ Envie uma reputação para um amigo.",
      "type": ApplicationCommandOptionType.Subcommand, // CORREÇÃO: Tipo correto para subcomando
      "options": [
        {
          "name": "usuário",
          "type": ApplicationCommandOptionType.User,
          "description": "Mencione um usuário",
          "required": true,
        },
        {
          "name": "mensagem",
          "type": ApplicationCommandOptionType.String,
          "description": "Digite uma mensagem para ser enviada ao usuário.",
          "required": false,
        }
      ],
    },
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      let rawSub = interaction.options?.getSubcommand?.(false) || args?.[0] || 'lista';
      let subcommand = String(rawSub).toLowerCase();
      if (['enviar', 'dar', 'send', 'add', 'doar', 'give'].includes(subcommand)) {
        subcommand = 'enviar';
      } else {
        subcommand = 'lista';
      }

      switch (subcommand) {
        case 'lista': {
          const user = interaction.options.getUser("usuário") || interaction.user;
          const msgLoading = await interaction.followUp({ content: `<a:loading:929931026589954128> **|** Carregando histórico de reputações...` });
          
          const snapshot = await database.ref(`economia/${user.id}/Reputações/`).once('value');
          const dataReps = snapshot.val() || {};
          
          let reputações_enviadas = dataReps.reputações_enviadas || 0;
          let reputações_recebidas = dataReps.reputações_recebidas || 0;
          let reps = dataReps.reputações || [];
          
          if (!reps.length) {
            return await msgLoading.edit({ content: `${user.id === interaction.user.id ? 'Você' : user.username} não possui nenhuma reputação registrada.` });
          }

          // Busca as configurações em paralelo para otimizar tempo
          const configSnapshot = await database.ref(`config/transações/mensagens`).once("value");
          const configValues = configSnapshot.val() || {};

          const mensagens = {
            "{mensagem.reputação.recebida}": configValues["mensagem_reputação_recebida"] || "📥 Reputação enviada para: `{usuário.username} ({usuário.id})`",
            "{mensagem.reputação.enviada}": configValues["mensagem_reputação_enviada"] || "📤 Você enviou uma reputação para: `{usuário.username} ({usuário.id})`",
            "{mensagem.reputação.especial}": configValues["mensagem_reputação_especial"] || "✨ Reputação especial recebida de: `{usuário.username} ({usuário.id})`",
          };

          const emojis = {
            "{emoji.entrada}": configValues["emoji_enviou"] || "📥",
            "{emoji.saida}": configValues["emoji_saida"] || "📤",
            "{emoji.especial}": configValues["emoji_especial"] || "✨",
          };
          
          const UserTransactions = (user.id === interaction.user.id) ? 'Suas Reputações' : `Reputações de: ${user.username}`;
          const RepsEscolha = interaction.options.getString('escolha');
          const ArrayReps = [];

          // CORREÇÃO: Loop assíncrono sequencial for...of para evitar promessas pendentes na Array
          for (let itemRaw of reps) {
            // Aplica os replaces dos placeholders principais
            Object.keys(mensagens).forEach(k => itemRaw = itemRaw.replace(new RegExp(k.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), mensagens[k]));
            Object.keys(emojis).forEach(k => itemRaw = itemRaw.replace(new RegExp(k.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), emojis[k]));

            let emojiFiltro = '';
            if (RepsEscolha === 'enviadas') emojiFiltro = emojis["{emoji.saida}"];
            if (RepsEscolha === 'recebidas') emojiFiltro = emojis["{emoji.entrada}"];
            if (RepsEscolha === 'especiais') emojiFiltro = emojis["{emoji.especial}"];
            
            if (RepsEscolha && !itemRaw.includes(emojiFiltro)) continue;

            let partes = itemRaw.split('|');
            let icone = partes[0] || '';
            let textoBase = partes[1] || '';
            let idAlvo = partes[2] ? partes[2].replace(/\s/g, '') : '';
            let msgAnexada = partes[3] ? partes[3].trim() : '';

            if (idAlvo) {
              // Tenta pegar do cache, se não der e for formato de ID, faz fetch assíncrono
              let member = client.users.cache.get(idAlvo);
              if (!member && /^\d{17,19}$/.test(idAlvo)) {
                member = await client.users.fetch(idAlvo).catch(() => null);
              }

              if (member) {
                textoBase = textoBase.replace(/{usuário\.username}/g, member.username).replace(/{usuário\.id}/g, member.id);
              } else {
                textoBase = textoBase.replace(/{usuário\.username}/g, "Usuário Desconhecido").replace(/{usuário\.id}/g, idAlvo);
              }
            }

            let formatacaoFinal = `${icone}${textoBase}${msgAnexada ? ` com a mensagem: \`${msgAnexada}\`` : ''}`;
            ArrayReps.push(formatacaoFinal);
          }

          if (!ArrayReps.length) {
            return await msgLoading.edit({ content: "Nenhuma reputação encontrada para os filtros selecionados." });
          }

          let pagina = 1;
          const itensPorPagina = 10;
          const totalPages = Math.ceil(ArrayReps.length / itensPorPagina) || 1;
          
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("voltarT").setStyle(ButtonStyle.Secondary).setEmoji('⏪'),
            new ButtonBuilder().setCustomId("voltar").setStyle(ButtonStyle.Secondary).setEmoji(emoji.seta_esquerda || '⬅️'),
            new ButtonBuilder().setCustomId("passar").setStyle(ButtonStyle.Secondary).setEmoji(emoji.seta_direita || '➡️'),
            new ButtonBuilder().setCustomId("passarT").setStyle(ButtonStyle.Secondary).setEmoji('⏩'),
          );
          
          const MensagemTransações = `> 💠 - Total de reputações: **${reputações_enviadas + reputações_recebidas}**\n> ${emojis["{emoji.saida}"]} - Enviadas: **${reputações_enviadas}**\n> ${emojis["{emoji.entrada}"]} - Recebidas: **${reputações_recebidas}**\n\n`;
          
          // Função DRY para gerar as Embeds sem duplicar código
          const gerarEmbed = (pag) => {
            const inicio = (pag - 1) * itensPorPagina;
            const fim = inicio + itensPorPagina;
            const dadosExibidos = ArrayReps.slice(inicio, fim).join('\n');

            return new EmbedBuilder()
              .setAuthor({ name: `${UserTransactions} ・ ${ArrayReps.length} Registros`, iconURL: client.user.displayAvatarURL({ size: 256 }) })
              .setDescription(`${MensagemTransações}${dadosExibidos || "Nenhum registro nesta página."}`)
              .setColor(color.embed || "#00ff00")
              .setFooter({ text: `Página ${pag} de ${totalPages} ・ ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() || undefined });
          };
          
          await msgLoading.edit({ content: null, embeds: [gerarEmbed(pagina)], components: [row] });
          
          const coletor = msgLoading.createMessageComponentCollector({ 
            filter: x => x.user.id === interaction.user.id, 
            time: 120000 // CORREÇÃO: Adicionado tempo limite de 2 min
          });
          
          coletor.on('collect', async (i) => {
            await i.deferUpdate();
  
            switch (i.customId) {
              case 'voltarT': pagina = 1; break;
              case 'voltar': pagina = pagina > 1 ? pagina - 1 : totalPages; break;
              case 'passar': pagina = pagina < totalPages ? pagina + 1 : 1; break;
              case 'passarT': pagina = totalPages; break;
            }

            await msgLoading.edit({ embeds: [gerarEmbed(pagina)] });
          });

          coletor.on('end', () => {
            const rowDesativada = ActionRowBuilder.from(row);
            rowDesativada.components.forEach(btn => btn.setDisabled(true));
            msgLoading.edit({ components: [rowDesativada] }).catch(() => {});
          });
          break;
        }

        case 'enviar': {
          const TempoCooldown = 60 * 60 * 1000; // 1 Hora em milissegundos
          const userAlvo = interaction.options.getUser("usuário");
          let mensagem = interaction.options.getString('mensagem');
          
          if (!userAlvo) return interaction.error({ content: `Você deve mencionar um usuário para enviar uma reputação.` });
          if (userAlvo.id !== client.user.id && userAlvo.bot) return interaction.error({ content: `Você não pode enviar uma reputação para um bot.` });
          if (userAlvo.id === interaction.user.id) return interaction.error({ content: `Você não pode enviar uma reputação para você mesmo.` });
          
          const { status } = await CheckUserCooldowns(interaction.user, TempoCooldown, 'reputacao');
        
          if (status) {
            const Embed = new EmbedBuilder()
              .setColor(color.embed || "#ff0000")
              .setDescription(`⏰ **|** Você poderá enviar outra reputação: **<t:${~~((status)/1000)}:R>**.`);
            return interaction.followUp({ embeds: [Embed] });
          }
    
          if (mensagem && mensagem.length > 100) {
            mensagem = mensagem.slice(0, 97) + '...';
          }
          
          const rowConfirmacao = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("confirmar").setStyle(ButtonStyle.Success).setEmoji(emoji.positivo || '✅').setLabel('Confirmar'),
            new ButtonBuilder().setCustomId("cancel").setStyle(ButtonStyle.Danger).setEmoji(emoji.negativo || '❌').setLabel('Cancelar'),
          );
          
          let msgConfirm = await interaction.followUp({ 
            content: `<:reputacao:1070900556262015026> **|** ${interaction.user.username}, clique em **confirmar** para enviar uma reputação para **${userAlvo.username}**.\n${mensagem ? `**Mensagem anexada:**\n\`${mensagem}\`` : ''}`, 
            components: [rowConfirmacao] 
          });
    
          const coletorEnvio = msgConfirm.createMessageComponentCollector({ 
            filter: x => x.user.id === interaction.user.id, 
            time: 60000 // Tempo limite de 1 min para confirmar
          });
    
          coletorEnvio.on('collect', async (i) => {
            await i.deferUpdate();

            try {
              if (i.customId === 'confirmar') {
                coletorEnvio.stop();
                
                const checagemDouble = await CheckUserCooldowns(i.user, TempoCooldown, 'reputacao');
                if (checagemDouble.status) {
                  const Embed = new EmbedBuilder()
                    .setColor(color.embed)
                    .setDescription(`⏰ **|** Você poderá dar outra reputação: **<t:${~~((checagemDouble.status)/1000)}:R>**.`);
                  return interaction.followUp({ embeds: [Embed] });
                }
                
                await database.ref(`/economia/${interaction.user.id}/cooldowns/`).update({ reputacao: Date.now() });
      
                const randomChance = Math.floor(Math.random() * 6) + 1; // 1 a 6
                
                // Se for enviada para o próprio bot, ele tem chance de retribuir
                if (userAlvo.id === client.user.id && randomChance >= 5) {
                  await ReputationUpdate(interaction, userAlvo, `{mensagem.reputação.recebida} | ${interaction.user.id}${mensagem ? `| ${mensagem}` : ''}`, 0, 1);
                  await ReputationUpdate(interaction, interaction.user, `{mensagem.reputação.especial} | ${client.user.id} | Toma aqui um presentinho <3`, 1, 0);
                  
                  await interaction.followUp({ content: `🫂 **|** ${interaction.user}, você enviou uma reputação para ${userAlvo}${mensagem ? ` com a mensagem: "${mensagem}"` : ''}!` });
                  return interaction.followUp({ content: `🫂 **|** ${client.user} retribuiu o carinho e te enviou uma reputação especial!`, ephemeral: true });
                }
      
                // Processamento padrão de envio de reputação
                await ReputationUpdate(interaction, userAlvo, `{mensagem.reputação.recebida} | ${interaction.user.id}${mensagem ? `| ${mensagem}` : ''}`, 0, 1);
                await ReputationUpdate(interaction, interaction.user, `{mensagem.reputação.enviada} | ${userAlvo.id}${mensagem ? `| ${mensagem}` : ''}`, 1, 0);
      
                await XpUpdate(interaction, interaction.user, Math.floor(Math.random() * 10) + 20);
                return interaction.followUp({ content: `🫂 **|** ${interaction.user}, você enviou uma reputação para **${userAlvo.username}**${mensagem ? ` com a mensagem: \`${mensagem}\`` : ''}!` });
              }
      
              if (i.customId === 'cancel') {
                coletorEnvio.stop();
                await msgConfirm.delete().catch(() => {});
                return interaction.followUp({ content: `Envio de reputação cancelado.`, ephemeral: true });
              }
            } catch (error) {
              console.error(error);
              return interaction.error({ content: `Ocorreu um erro ao processar o envio da reputação.` });
            }
          });

          coletorEnvio.on('end', () => {
            const rowDesabilitada = ActionRowBuilder.from(rowConfirmacao);
            rowDesabilitada.components.forEach(btn => btn.setDisabled(true));
            msgConfirm.edit({ components: [rowDesabilitada] }).catch(() => {});
          });
          break;
        }
      }
    } catch (error) {
      console.error(error);
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
};