const { ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserMoney, CheckUserVip, UpdateMoneyWallet, NumberConvert, Format } = require('../../utils/functions.js');

const timer = 60;
const rifa = new Set();

module.exports =  {
  "name": "corrida",
  "description": `⌊🎰 Apostas⌉ Crie uma corrida e aposte quem irá vencer.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "quantidade",
      "type": ApplicationCommandOptionType.String,
      "description": "Qual a quantia que você deseja apostar.",
      "required": true,
    },
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    
    try {

      const emotes = ['🚗', '🚙', '🛺', '🚌', '🚕', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚛'];

      const { carteira } = await getUserMoney(interaction.user)

      const quantia = await interaction.options.getString('quantidade');
      const number = NumberConvert(`${quantia}`);

      if (quantia == 'all' || quantia == 'tudo') number = carteira;

      if (isNaN(number) || number <= 0) return interaction.error({ content: `\`${quantia}\` não me parece um número válido.` });
      if (carteira < number) return interaction.error({ content: `Você não possui o valor suficiente na carteira.` });
      if (number < 200) return interaction.error({ content: `O valor mínimo para aposta é de **${Format(200)}**` });
      if (number > 20000) return interaction.error({ content: `O valor máximo para aposta é de **${Format(20000)}**` });

      if (rifa.has(interaction.user.id)) {
        return interaction.error({ content: `Você já possui uma corrida em andamento!` });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("Participar").setStyle(ButtonStyle.Primary).setEmoji('🎟️').setLabel("Participar").setDisabled(false),
        new ButtonBuilder().setCustomId("Finalizar").setStyle(ButtonStyle.Success).setEmoji(emoji.positivo || '✅').setLabel("Finalizar").setDisabled(false),
      );
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("Participar").setStyle(ButtonStyle.Primary).setEmoji('🎟️').setLabel("Participar").setDisabled(true),
        new ButtonBuilder().setCustomId("Finalizar").setStyle(ButtonStyle.Success).setEmoji(emoji.positivo || '✅').setLabel("Finalizar").setDisabled(false),
      );
      const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("Participar").setStyle(ButtonStyle.Primary).setEmoji('🎟️').setLabel("Participar").setDisabled(true),
        new ButtonBuilder().setCustomId("Finalizar").setStyle(ButtonStyle.Success).setEmoji(emoji.positivo || '✅').setLabel("Finalizar").setDisabled(true),
      );

      async function editMSG(msg, Row, money) {
        const embed3 = new EmbedBuilder()
          .setAuthor({ name: `${client.user.username} - Corrida Ilegal` })
          .setDescription(`
<:user:925955074222608505> Corrida ilegal criada por: **${interaction.user.username}**
<a:takemoney:931723236650123284> **|** Temos um total de: **${Format(money)}** acumulado
*Você precisa de: **${Format(number)}** para participar desta corrida*

Clique em: \`🎟️\` para participar.

*Teremos um ganhador quando **${interaction.user.username}** clicar em: \`Finalizar\` ou o tempo de: ${timer}s acabar*

**🏁 - Corredores (${Row.length}/10):**\n${Row.map(u => u.user).join('\n')}`)
          .setColor(color.embed || '#00ff00')
          .setTimestamp();

        return msg.edit({ embeds: [embed3] }).catch(() => {});
      }

      // Função para terminar a corrida
      async function final(msg, Row) {
        Row.forEach(p => rifa.delete(p.id));

        if (Row.length < 2) {
          await msg.edit({ components: [row3] }).catch(() => {});
          for (const participant of Row) {
            const pUser = client.users.cache.get(participant.id) || { id: participant.id };
            await UpdateMoneyWallet(interaction, pUser, '+', number);
          }
          return interaction.followUp({ 
            content: `${emoji.negativo || '❌'} **|** <@${interaction.user.id}>, a corrida foi cancelada por falta de participantes. O valor de **${Format(number)}** foi reembolsado.`, 
            ephemeral: true 
          });
        }

        const winner = Math.floor(Math.random() * Row.length);
        const ganhador = Row[winner].id;
        const emote = Row[winner].emote;
        
        const totalAcumulado = number * Row.length;
        
        await editMSG(msg, Row, totalAcumulado);
        await msg.edit({ components: [row3] }).catch(() => {});

        try {
          const ganhadorUser = client.users.cache.get(ganhador) || { id: ganhador };
          const { infoVIP, tempo, data } = await CheckUserVip(ganhadorUser);
          const taxaPercentual = VIP ? 0.03 : 0.075;
          const taxa = Math.floor(totalAcumulado * taxaPercentual);
          const valorLiquido = totalAcumulado - taxa;
          
          await UpdateMoneyWallet(interaction, ganhadorUser, '+', valorLiquido, `{emoji.entrada} {mensagem.corrida.vitoria} | ${valorLiquido}`);

          const winMSG = (ganhador !== interaction.user.id) ? ` *(corrida iniciada por: **${interaction.user.username}**)*` : '';
          return interaction.channel.send({ 
            content: `🎉 **|** O carro **${emote}** de <@${ganhador}> cruzou a linha de chegada em primeiro! Recebeu **${Format(valorLiquido)}** líquidos de prêmio!\n> 🏛️ **Taxa de Imposto (${VIP ? '3.0% VIP' : '7.5% Padrão'}):** **${Format(taxa)}** foram recolhidos pelo governo. ${winMSG}` 
          });
        } catch (error) {
          console.error('[CORRIDA ERROR]:', error);
          return interaction.error({ content: `Ocorreu um erro ao finalizar a corrida.` });
        }
      }

      const embed = new EmbedBuilder()
        .setAuthor({ name: `${client.user.username} - Corrida Ilegal` })
        .setDescription(`
<:user:925955074222608505> Corrida ilegal criada por: **${interaction.user.username}**
<a:takemoney:931723236650123284> **|** Temos um total de: **${Format(number)}** acumulado
*Você precisa de: **${Format(number)}** para participar desta corrida*

Clique em: \`🎟️\` para participar.

*Teremos um ganhador quando **${interaction.user.username}** clicar em: \`Finalizar\` ou o tempo de: ${timer}s acabar*`)
        .setColor(color.embed || '#00ff00')
        .setTimestamp();

      const msg = await interaction.followUp({ content: `${interaction.user}`, embeds: [embed], components: [row], fetchReply: true });

      const Row = [];
      
      function getRandomEmote() {
        const index = Math.floor(Math.random() * emotes.length);
        const randomEmote = emotes[index];
        emotes.splice(index, 1);
        if (emotes.length === 0) {
          emotes.push(...['🚗', '🚙', '🛺', '🚌', '🚕', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚛']);
        }
        return randomEmote;
      }

      const RandomEmote = getRandomEmote();
      Row.push({ user: `${RandomEmote} <@${interaction.user.id}>`, emote: RandomEmote, id: interaction.user.id });

      rifa.add(interaction.user.id);
      await UpdateMoneyWallet(interaction, interaction.user, '-', number);
      await editMSG(msg, Row, number);

      const coletor = msg.createMessageComponentCollector({ time: timer * 1000 });

      let finalizadoManualmente = false;

      coletor.on('collect', async (i) => {
        await i.deferUpdate();

        switch (i.customId) {
          case 'Participar': {
            if (Row.some(u => u.id === i.user.id)) return;
            if (Row.length >= 10) return;

            const user = i.user;
            const { blacklisted } = await CheckUserBlacklisted(user);
            if (blacklisted) return;
            
            const { carteira: carteiraP } = await getUserMoney(user);
            if (carteiraP < number) return;

            const rEmote = getRandomEmote();
            Row.push({ user: `${rEmote} <@${user.id}>`, emote: rEmote, id: user.id });
            rifa.add(user.id);

            await UpdateMoneyWallet(interaction, user, '-', number);
            await editMSG(msg, Row, number * Row.length);

            if (Row.length >= 10) {
              await msg.edit({ components: [row2] }).catch(() => {});
            }
            break;
          }

          case 'Finalizar': {
            if (i.user.id !== interaction.user.id) return;
            finalizadoManualmente = true;
            coletor.stop('finalizado');
            break;
          }
        }
      });

      coletor.on('end', async () => {
        await final(msg, Row);
      });
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }

    
  }
}