const { ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Format } = require('../../utils/functions.js');

// Função de escape local em vez de poluir o objeto global RegExp
const escapeRegExp = (str) => str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

module.exports =  {
  "name": "transações",
  "description": `⌊💸 Economia⌉ Veja seu histórico de transações.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "usuário",
      "type": ApplicationCommandOptionType.User,
      "description": "Mencione alguém para ver as transações dela",
      "required": false,
    },
    {
      "name": "transações",
      "description": "Escolha se você quer ver as transações enviadas ou recebidas",
      "required": false,
      "type": ApplicationCommandOptionType.String,
      "choices": [
          {
            "name": "📥 Transações recebidas",
            "value": "recebidas"
          },
          {
            "name": "📤 Transações enviadas",
            "value": "enviadas"
          },
      ]
    },
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const user = interaction.options.getUser("usuário") || interaction.user;

      if (user.id !== client.user.id && user.bot) {
        return interaction.reply({ content: `Bots não recebem transações.`, ephemeral: true });
      }

      // 1. OTIMIZAÇÃO: Busca os dados do usuário e as configurações globais em paralelo
      const [userSnapshot, configSnapshot] = await Promise.all([
        database.ref(`economia/${user.id}/Transações/`).once('value'),
        database.ref('config/transações').once('value')
      ]);

      const transData = userSnapshot.val();
      const trans = transData && transData.transações ? transData.transações : [];

      if (!trans.length) {
        return interaction.reply({ content: `${user.username} não possui nenhuma transação registrada.`, ephemeral: true });
      }

      const config = configSnapshot.val() || {};
      const msgConfig = config.mensagens || {};

      // 2. Mapeamento das mensagens vindas do banco (com fallback local caso não existam)
      const mensagens = {
        "{mensagem.daily}": msgConfig.mensagem_daily || "Recebeu: `{quantia}` em sua recompensa diária.",
        "{mensagem.weekly}": msgConfig.mensagem_weekly || "Recebeu: `{quantia}` em sua recompensa semanal.",
        "{mensagem.saque}": msgConfig.mensagem_saque || "Saque bancário no valor de: `{quantia}` ",
        "{mensagem.deposito}": msgConfig.mensagem_deposito || "Deposito bancário no valor de: `{quantia}` ",
        "{mensagem.transferencia.enviou}": msgConfig.mensagem_transferencia_enviou || "Transferência bancária no valor de: `{quantia}` para o usuário: `{usuário.username} ({usuário.id})`",
        "{mensagem.transferencia.recebeu}": msgConfig.mensagem_transferencia_recebeu || "Recebeu uma transferência bancária no valor de: `{quantia}` do usuário: `{usuário.username} ({usuário.id})`",
        "{mensagem.market.buy}": msgConfig.mensagem_market_buy || "Perdeu: `{quantia}` ao comprar um: **{item}** no market",
        "{mensagem.loja.compra}": msgConfig.mensagem_loja_buy || "Perdeu: `{quantia}` ao comprar um: **{item}** na loja",
        "{mensagem.loja.vendas}": msgConfig.mensagem_loja_vendas || "Recebeu: `{quantia}` de uma venda de um: **{item}** na loja",
        "{mensagem.crime.vitoria}": msgConfig.mensagem_crime_vitoria || "Recebeu: `{quantia}` ao cometer um crime.",
        "{mensagem.crime.derrota}": msgConfig.mensagem_crime_derrota || "Perdeu: `{quantia}` ao cometer um crime.",
        "{mensagem.emprego}": msgConfig.mensagem_emprego || "Trabalhou de: **{emprego}** e recebeu: `{quantia}` no final de seu expediente.",
        "{mensagem.assalto.vitoria}": msgConfig.mensagem_assalto_vitoria || "Recebeu: `{quantia}` ao assaltar a carteira do usuário: `{usuário.username} ({usuário.id})`",
        "{mensagem.assalto.derrota}": msgConfig.mensagem_assalto_derrota || "Foi assaltado por: `{usuário.username} ({usuário.id})` e perdeu: `{quantia}` da carteira",
        "{mensagem.recuperar}": msgConfig.mensagem_recuperar || "Perdeu `{quantia}` recuperando a durabilidade de sua: **{item}**",
        "{mensagem.namoro}": msgConfig.mensagem_namoro || "Namorou com `{usuário.username} ({usuário.id})` e recebeu: `{quantia}`",
        "{mensagem.airdrop}": msgConfig.mensagem_airdrop || "Recebeu `{quantia}` em um airdrop",
        "{mensagem.bj.vitoria}": msgConfig.mensagem_bj_vitoria || "Recebeu: `{quantia}` apostando em um blackjack",
        "{mensagem.bj.derrota}": msgConfig.mensagem_bj_derrota || "Perdeu: `{quantia}` apostando em um blackjack",
        "{mensagem.mines.vitoria}": msgConfig.mensagem_mines_vitoria || "Recebeu: `{quantia}` ao desviar de todas as minas.",
        "{mensagem.mines.derrota}": msgConfig.mensagem_mines_derrota || "Perdeu: `{quantia}` caindo em uma mina.",
        "{mensagem.corrida.vitoria}": msgConfig.mensagem_corrida_vitoria || "Recebeu: `{quantia}` ao vencer uma corrida ilegal.",
        "{mensagem.corrida.derrota}": msgConfig.mensagem_corrida_vitoria || "Perdeu: `{quantia}` em uma corrida ilegal.",
        "{mensagem.aposta.vitoria}": msgConfig.mensagem_bet_win || "Recebeu: `{quantia}` de uma aposta com: `{usuário.username} ({usuário.id})`",
        "{mensagem.aposta.derrota}": msgConfig.mensagem_bet_lose || "Perdeu: `{quantia}` de uma aposta com: `{usuário.username} ({usuário.id})`",
        "{mensagem.jokenpo.vitoria}": msgConfig.mensagem_jokenpo_win || "Ganhou `{quantia}` em uma aposta de pedra, papel ou tesoura",
        "{mensagem.jokenpo.derrota}": msgConfig.mensagem_jokenpo_lose || "Perdeu `{quantia}` em uma aposta de pedra, papel ou tesoura",
        "{mensagem.slotmachine.vitoria}": msgConfig.mensagem_slotmachine_win || "Ganhou `{quantia}` em um aposta no caça níquel",
        "{mensagem.slotmachine.derrota}": msgConfig.mensagem_slotmachine_lose || "Perdeu `{quantia}` em um aposta no caça níquel",
        "{mensagem.scratchcard.vitoria}": msgConfig.mensagem_scratchcard_win || "Ganhou `{quantia}` em uma raspadinha",
      };

      const emojis = {
        "{emoji.entrada}": msgConfig.emoji_enviou || "📥",
        "{emoji.saida}": msgConfig.emoji_recebeu || "📤",
      };

      const escolha = interaction.options.getString('transações');
      const transacoesFiltradas = [];

      // 3. Processamento assíncrono e corrigido da Array
      for (const itemRaw of trans) {
        let textoCompleto = itemRaw;

        // PRIMEIRO: Substitui os placeholders gigantes pelas mensagens do banco
        Object.keys(mensagens).forEach(key => {
          textoCompleto = textoCompleto.replace(new RegExp(escapeRegExp(key), 'g'), mensagens[key]);
        });
        Object.keys(emojis).forEach(key => {
          textoCompleto = textoCompleto.replace(new RegExp(escapeRegExp(key), 'g'), emojis[key]);
        });

        const emojiFiltro = (escolha === 'recebidas') ? emojis['{emoji.saida}'] : emojis['{emoji.entrada}'];
        
        // Se escolheu um filtro e a transação não condiz, ignora
        if (escolha && !textoCompleto.includes(emojiFiltro)) continue; // Em for...of usamos 'continue' em vez de 'return'

        // Com a mensagem montada, fazemos o split nos canos (|)
        let partes = textoCompleto.split('|');
        let icone = partes[0] || '';
        let textoBase = partes[1] || '';
        let valorRaw = partes[2] ? partes[2].trim() : '0';
        let idOuItem = partes[3] ? partes[3].trim() : '';

        // Formata o valor usando a sua função utilitária
        let valorFormatado = Format(valorRaw);

        // SEGUNDO: Faz os replaces das variáveis internas da mensagem
        if (idOuItem) {
          // 1. Tenta pegar do cache (Super rápido, sem lag)
          let member = client.users.cache.get(idOuItem);

          // 2. Se não estiver no cache E parecer um ID do Discord (apenas números e tamanho de ID)
          // Isso evita que o bot tente buscar na API do Discord strings como "Picareta" ou "Policial"
          if (!member && /^\d{17,19}$/.test(idOuItem)) {
            member = await client.users.fetch(idOuItem).catch(() => null);
          }

          if (member) {
            textoBase = textoBase
              .replace(/{usuário\.username}/g, member.username)
              .replace(/{usuário\.id}/g, member.id);
          } else {
            // Se falhar na API (usuário deletado ou ID inválido) ou se for um Item/Emprego
            textoBase = textoBase
              .replace(/{usuário\.username}/g, "Usuário Desconhecido")
              .replace(/{usuário\.id}/g, idOuItem);
          }

          // Aplica as demais substituições de contexto
          textoBase = textoBase
            .replace(/{quantia}/g, valorFormatado)
            .replace(/{item}/g, idOuItem)
            .replace(/{emprego}/g, idOuItem);
            
        } else {
          // Se não houver quarta parte (ID/Item), apenas substitui a quantia
          textoBase = textoBase.replace(/{quantia}/g, valorFormatado);
        }

        // Junta o ícone com o texto final formatado
        transacoesFiltradas.push(`${icone}${textoBase}`);
      }


      // Configuração da paginação
      let pagina = 1;
      const itensPorPagina = 10;
      const totalPages = Math.ceil(transacoesFiltradas.length / itensPorPagina) || 1;
      const tituloAutor = user.id === interaction.user.id ? 'Suas transações' : `Transações de: ${user.username}`;

      // 4. DRY: Função geradora de Embed para evitar repetição de código
      const gerarEmbed = (pag) => {
        const inicio = (pag - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const dadosExibidos = transacoesFiltradas.slice(inicio, fim).join('\n');

        return new EmbedBuilder()
          .setAuthor({ 
            name: `${tituloAutor} ・ ${transacoesFiltradas.length} Registros`, 
            iconURL: client.user.displayAvatarURL({ size: 256 }) 
          })
          .setDescription(dadosExibidos || "Nenhuma transação encontrada nesta categoria.")
          .setColor(color.embed || "#00ff00")
          .setFooter({ 
            text: `Página ${pag} de ${totalPages} ・ ${interaction.guild.name}`, 
            iconURL: interaction.guild.iconURL() || undefined 
          });
      };

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("voltarT").setStyle(ButtonStyle.Secondary).setEmoji('⏪'),
        new ButtonBuilder().setCustomId("voltar").setStyle(ButtonStyle.Secondary).setEmoji(emoji.seta_esquerda || '⬅️'),
        new ButtonBuilder().setCustomId("passar").setStyle(ButtonStyle.Secondary).setEmoji(emoji.seta_direita || '➡️'),
        new ButtonBuilder().setCustomId("passarT").setStyle(ButtonStyle.Secondary).setEmoji('⏩'),
      );

      const msg = await interaction.followUp({ 
        embeds: [gerarEmbed(pagina)], 
        components: [row], 
        fetchReply: true 
      });

      // Coletor de interações dos botões
      const coletor = msg.createMessageComponentCollector({ 
        filter: x => x.user.id === interaction.user.id, 
        time: 120000 // Boa prática: definir um tempo limite pro coletor (2 min)
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

      // Desativar botões quando o tempo do coletor expirar
      coletor.on('end', () => {
        const rowDesativada = ActionRowBuilder.from(row);
        rowDesativada.components.forEach(btn => btn.setDisabled(true));
        msg.edit({ components: [rowDesativada] }).catch(() => {});
      });

    } catch (error) {
      console.error("Erro no comando transações:", error);
      return interaction.reply({ content: `Ocorreu um erro inesperado na utilização deste comando.`, ephemeral: true });
    }
  }
};