const { ApplicationCommandType, ApplicationCommandOptionType, ButtonStyle, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const ms = require('ms');
const cc = require('coupon-code');

// Função utilitária para traduzir o tempo digitado pelo usuário para o inglês (padrão do pacote 'ms')
const traduzirTempo = (str) => {
  return str.toLowerCase()
    .replace(/dias|dia/g, 'd')
    .replace(/minutos|minuto|min/g, 'm')
    .replace(/segundos|segundo|seg/g, 's')
    .replace(/horas|hora/g, 'h')
    .replace(/semanas|semana/g, 'w')
    .replace(/anos|ano/g, 'y');
};

module.exports = {
  "name": "lembrete",
  "description": `⌊⚙️ Módulos⌉ Configure seus lembretes.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "criar",
      "aliases": ["add", "novo", "set", "create", "lembrar"],
      "description": "⌊⚙️ Módulos⌉ Crie um lembrete.",
      "type": ApplicationCommandOptionType.Subcommand, // CORREÇÃO: Tipo correto para subcomando
      "options": [
        {
          "name": "tempo",
          "type": ApplicationCommandOptionType.String,
          "description": "Ex: 10m, 2h, 1 dia",
          "required": true,
        },
        {
          "name": "mensagem",
          "type": ApplicationCommandOptionType.String,
          "description": "Nome ou motivo do seu lembrete",
          "required": false,
        },
      ]
    },
    {
      "name": "lista",
      "aliases": ["list", "ver", "listar", "meus", "todos"],
      "description": "⌊⚙️ Módulos⌉ Veja seus lembretes criados.",
      "type": ApplicationCommandOptionType.Subcommand, // CORREÇÃO: Tipo correto para subcomando
    },
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    try { 
      let rawCommand = interaction.options?.getSubcommand?.(false) || args?.[0] || 'lista';
      let command = String(rawCommand).toLowerCase();
      if (['criar', 'add', 'novo', 'set', 'create', 'lembrar'].includes(command)) {
        command = 'criar';
      } else {
        command = 'lista';
      }
      const DB_PATH = `servidores/${interaction.user.id}/Lembretes`; // CORREÇÃO: Padronizado minúsculo para evitar bypass de limites

      switch (command) {
        case 'criar': {
          const mensagem = interaction.options.getString('mensagem') || 'Nenhuma mensagem definida';
          const tempoRaw = interaction.options.getString('tempo');
          const tempoTraduzido = traduzirTempo(tempoRaw);
          const tempoMs = ms(tempoTraduzido);

          if (!tempoMs || tempoMs < 5000) {
            return interaction.error({ content: `\`${tempoRaw}\` não me parece um tempo válido ou é curto demais (mínimo 5 segundos).` });
          }

          const snapshot = await database.ref(DB_PATH).once('value');
          const lembretesAtuais = [];
          
          snapshot.forEach(child => {
            lembretesAtuais.push(child.val());
          });

          // CORREÇÃO: Verificação real baseada na mesma rota de gravação
          if (lembretesAtuais.length >= 5) {
            return interaction.error({ content: `<@${interaction.user.id}>, seu limite de 5 lembretes ativos já foi atingido.` });
          }

          const idLembrete = cc.generate({ parts: 2 }); // Gera um ID menor e único para a chave

          // Salva na DB. O index.js cuidará do envio mesmo se o bot cair!
          await database.ref(`${DB_PATH}/${idLembrete}`).set({
            RowID: idLembrete,
            mensagem: mensagem,
            tempo: tempoMs,
            data: Date.now(),
            canal: interaction.channel.id,
          });

          return interaction.positivo({ 
            content: `Eu vou lembrar você de: \`${mensagem}\` <t:${~~((Date.now() + tempoMs)/1000)}:R> (<t:${~~((Date.now() + tempoMs)/1000)}:f>)`
          });
        }

        case 'lista': {
          const msgLoading = await interaction.followUp({ content: "Carregando seus lembretes..." });
          const snapshot = await database.ref(DB_PATH).once('value');

          if (!snapshot.exists()) {
            const embedVazia = new EmbedBuilder()
              .setColor(color.embed || "#ff0000")
              .setTitle(`Lista de lembretes:`)
              .setDescription(`Você não possui nenhum lembrete ativo. Crie um usando \`/lembrete criar\``);
            return await msgLoading.edit({ content: null, embeds: [embedVazia] });
          }

          const listaLembretes = [];
          snapshot.forEach(child => {
            listaLembretes.push(child.val());
          });

          const embedLista = new EmbedBuilder()
            .setColor(color.embed || "#00ff00")
            .setTitle(`Lista de Lembretes Ativos:`)
            .setDescription(listaLembretes.slice(0, 5).map((u, i) => `${emoji[i + 1] || '🔹'} \`${u.mensagem}\``).join('\n'));
                
          const rowBotoes = new ActionRowBuilder();
          listaLembretes.slice(0, 5).forEach((u, i) => {
            const index = i + 1;
            rowBotoes.addComponents(
              new ButtonBuilder()
                .setCustomId(index.toString())
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emoji[index] || '🔍')
            );
          });
                
          await msgLoading.edit({ content: null, embeds: [embedLista], components: [rowBotoes] });
                
          const coletor = msgLoading.createMessageComponentCollector({ 
            filter: x => x.user.id === interaction.user.id, 
            time: 60000 
          });
                
          coletor.on('collect', async (i) => {
            await i.deferUpdate();
            coletor.stop(); // Para o coletor principal para abrir o menu do lembrete específico
            
            const indexSelecionado = parseInt(i.customId) - 1;
            const lembreteEscolhido = listaLembretes[indexSelecionado];

            if (!lembreteEscolhido) return;

            const canalOriginal = client.channels.cache.get(lembreteEscolhido.canal);
            const nomeServidor = canalOriginal ? canalOriginal.guild.name : 'Servidor Desconhecido';
                      
            const rowAcoes = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("Voltar").setStyle(ButtonStyle.Secondary).setEmoji('⬅️'),
              new ButtonBuilder().setCustomId("Apagar").setStyle(ButtonStyle.Danger).setEmoji('🗑️'),
            );
                      
            const embedDetalhes = new EmbedBuilder()
              .setColor(color.embed || "#00ff00")
              .setAuthor({ name: lembreteEscolhido.mensagem })
              .setDescription(`
⏰ **| Irei te lembrar:** <t:${~~((lembreteEscolhido.data + lembreteEscolhido.tempo)/1000)}:R>
🌐 **| Servidor:** \`${nomeServidor}\`
📺 **| Canal de Origem:** <#${lembreteEscolhido.canal}>
              `);

            const msgDetalhes = await interaction.followUp({ embeds: [embedDetalhes], components: [rowAcoes] });
            await msgLoading.delete().catch(() => {});
                      
            const coletorAcoes = msgDetalhes.createMessageComponentCollector({ 
              filter: x => x.user.id === interaction.user.id, 
              time: 60000 
            });

            coletorAcoes.on('collect', async (i2) => {
              await i2.deferUpdate();
              coletorAcoes.stop();

              if (i2.customId === 'Apagar') {
                await database.ref(`${DB_PATH}/${lembreteEscolhido.RowID}`).remove();
                await msgDetalhes.edit({ content: `${emoji.positivo || '✅'} **|** Lembrete apagado com sucesso.`, embeds: [], components: [] });
              }
                        
              if (i2.customId === 'Voltar') {
                await msgDetalhes.delete().catch(() => {});
                // Reinicia o comando no modo lista reaproveitando a instância atual
                const cmd = client.slashCommands.get('lembrete');
                if (cmd) cmd.run(client, interaction, args, color, database, emoji);
              }
            });

            coletorAcoes.on('end', (c, motivo) => {
              if (motivo === 'time') msgDetalhes.edit({ components: [] }).catch(() => {});
            });
          });

          coletor.on('end', (c, motivo) => {
            if (motivo === 'time') msgLoading.edit({ components: [] }).catch(() => {});
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