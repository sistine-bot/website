const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const { CheckUserBlacklisted, Format, getUserInventory, UpdateMoneyWallet, isStaff, NumberConvert } = require('../../utils/functions.js');

module.exports = {
  name: "drop",
  aliases: ["airdrop", "caixa"],
  description: "Inicia um evento de drop/airdrop no canal para os membros participarem.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      // Se o admin passou uma quantia personalizada de moedas (ex: !drop 50000)
      const customMoney = args[0] ? NumberConvert(args[0]) : null;
      const isCustomMoney = typeof customMoney === 'number' && !isNaN(customMoney) && customMoney > 0;

      const ImagemDrop = 'https://i.redd.it/sesjas1u9pz41.jpg';
      const participantes = [];

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('participar_drop')
          .setLabel('Coletar Recompensa')
          .setEmoji('📦')
          .setStyle(ButtonStyle.Success)
      );

      const embedInicial = new EmbedBuilder()
        .setColor(color.embed || '#831396')
        .setTitle('📦 Um Airdrop Misterioso Caiu na Área!')
        .setDescription(
          `Um suprimento valioso acabou de cair dos céus!\n\n` +
          `${isCustomMoney ? `💰 **Recompensa Garantida:** \`${Format(customMoney)}\` moedas!\n` : `🎁 **Recompensa:** Dinheiro ou recursos raros de sobrevivência!\n`}` +
          `⏱️ **Tempo para Coletar:** \`20 segundos\`\n\n` +
          `Clique no botão abaixo para tentar a sorte!`
        )
        .setImage(ImagemDrop)
        .setFooter({ text: `Iniciado por ${message.author.username}` })
        .setTimestamp();

      const msg = await message.channel.send({
        embeds: [embedInicial],
        components: [row]
      });

      const coletor = msg.createMessageComponentCollector({
        time: 20 * 1000
      });

      coletor.on('collect', async (interaction) => {
        if (interaction.customId !== 'participar_drop') return;

        const blacklist = await CheckUserBlacklisted(interaction.user);
        if (blacklist?.blacklisted) {
          return interaction.reply({
            content: `${emoji.negativo || '❌'} **|** Você está na Blacklist e não pode participar de eventos.`,
            ephemeral: true
          });
        }

        if (participantes.includes(interaction.user.id)) {
          return interaction.reply({
            content: `${emoji.aviso || '⚠️'} **|** Você já está participando deste airdrop! Aguarde o sorteio.`,
            ephemeral: true
          });
        }

        participantes.push(interaction.user.id);

        await interaction.reply({
          content: `${emoji.positivo || '✅'} **|** Você entrou na disputa pelo airdrop!`,
          ephemeral: true
        });

        // Atualiza a embed com o número de inscritos
        const embedAtualizada = EmbedBuilder.from(embedInicial)
          .setFields({
            name: `👥 Participantes (${participantes.length})`,
            value: participantes.slice(0, 15).map(id => `<@${id}>`).join(', ') + (participantes.length > 15 ? ` e mais ${participantes.length - 15}...` : '')
          });

        await msg.edit({ embeds: [embedAtualizada] }).catch(() => {});
      });

      coletor.on('end', async () => {
        try {
          const rowDisabled = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('participar_drop')
              .setLabel('Encerrado')
              .setEmoji('🔒')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );

          await msg.edit({ components: [rowDisabled] }).catch(() => {});

          if (participantes.length < 1) {
            const embedCancelada = new EmbedBuilder()
              .setColor('#ef4444')
              .setTitle('📦 Airdrop Expirado')
              .setDescription('😢 **|** O baú foi ignorado! Ninguém tentou abrir a caixa a tempo e os suprimentos foram perdidos.')
              .setTimestamp();

            return message.channel.send({ embeds: [embedCancelada] });
          }

          const ganhadorID = participantes[Math.floor(Math.random() * participantes.length)];
          const ganhadorUser = await client.users.fetch(ganhadorID).catch(() => null) || { id: ganhadorID, username: `ID ${ganhadorID}` };

          let mensagemPremio = '';

          if (isCustomMoney) {
            await UpdateMoneyWallet(
              message,
              ganhadorUser,
              '+',
              customMoney,
              { type: 'airdrop', amount: customMoney }
            );
            mensagemPremio = `💵 **${Format(customMoney)}** moedas direto na carteira!`;
          } else {
            // Tabela balanceada de prêmios aleatórios
            const sorteioTipo = Math.floor(Math.random() * 8) + 1;

            if (sorteioTipo === 1) {
              const quantiaDinheiro = Math.floor(Math.random() * 15000) + 1500;
              await UpdateMoneyWallet(
                message,
                ganhadorUser,
                '+',
                quantiaDinheiro,
                { type: 'airdrop', amount: quantiaDinheiro }
              );
              mensagemPremio = `💵 **${Format(quantiaDinheiro)}** moedas!`;
            } else {
              const premiosConfig = {
                2: { item: "carne", nome: "Carne(s)", quantia: Math.floor(Math.random() * 6) + 3 },
                3: { item: "peixe", nome: "Peixe(s)", quantia: Math.floor(Math.random() * 8) + 4 },
                4: { item: "munição", nome: "Munições", quantia: Math.floor(Math.random() * 25) + 10 },
                5: { item: "Trigo", nome: "Trigos", quantia: Math.floor(Math.random() * 30) + 15 },
                6: { item: "Milho", nome: "Milhos", quantia: Math.floor(Math.random() * 20) + 10 },
                7: { item: "Feijão", nome: "Feijões", quantia: Math.floor(Math.random() * 15) + 5 },
                8: { item: "baús", nome: "Baú de Suprimentos", quantia: 1 }
              };

              const selecionado = premiosConfig[sorteioTipo] || premiosConfig[2];
              const inventario = await getUserInventory(ganhadorUser);
              const atual = inventario[selecionado.item] || 0;

              await database
                .ref(`/economia/${ganhadorID}/inventario/itens/Consumíveis`)
                .update({
                  [selecionado.item]: atual + selecionado.quantia
                });

              mensagemPremio = `📦 **${selecionado.quantia}x ${selecionado.nome}**`;
            }
          }

          const embedVencedor = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('🎉 Airdrop Coletado com Sucesso!')
            .setDescription(
              `🏆 **Ganhador:** <@${ganhadorID}>\n\n` +
              `🎁 **Recompensa Recebida:**\n> ${mensagemPremio}\n\n` +
              `👥 **Total de Participantes:** \`${participantes.length}\``
            )
            .setFooter({ text: 'Sistine Eventos Globais' })
            .setTimestamp();

          return message.channel.send({
            content: `🎉 Parabéns <@${ganhadorID}>!`,
            embeds: [embedVencedor]
          });

        } catch (err) {
          console.error('[Drop collector end error]', err);
        }
      });

    } catch (error) {
      console.error('[Command drop]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao iniciar o airdrop.`
      });
    }
  }
};