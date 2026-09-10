const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { XpUpdate, Format, UpdateMoneyWallet, getUserInventory, CheckUserVip } = require('../../utils/functions.js');

module.exports =  {
  "name": "recuperar",
  "description": `⌊⚙️ Modulos⌉ Recupere seu item quebrado para não o perder.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "item",
      "description": "⌊⚙️ Modulos⌉ Recupere seu item quebrado para não o perder.",
      "type": ApplicationCommandOptionType.String,
      "required": true,
      "choices": [
        {
          "name": "🔫 Arma",
          "value": "arma"
        },
        {
          "name": "🏹 Arma de caça",
          "value": "armacaça"
        },
        {
          "name": "🎣 Vara de pescar",
          "value": "vara"
        },
      ]
    },
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try { 

      const { infoVIP, tempo, data } = await CheckUserVip(interaction.user)
      const VIP = (data !== null && tempo - (Date.now() - data) < 0 || infoVIP == false) ? false : true
      
      return database.ref(`economia/${interaction.user.id}/nível/`).once('value').then(async function(snapshot) {
        let nível = (snapshot.val() && snapshot.val().nível);
        if (nível === undefined || nível === null) nível = 0;
        
        if (!client.config.cargos.criador.includes(interaction.user.id) && !VIP && nível < 13) return interaction.error({ content: `Você precisa ser **nível 13** para recuperar a durabilidade de seus itens.` });
        
        const { armacaça, arma, vara } = await getUserInventory(interaction.user);
        const { carteira } = await require('../../utils/functions.js').getUserMoney(interaction.user);
        
        const item = interaction.options.getString('item');
        
        if (item === 'arma' && (!arma || arma.item < 1)) {
          return interaction.error({ content: `Você não possui uma **Arma** equipada para consertar.` });
        }
        if (item === 'armacaça' && (!armacaça || armacaça.item < 1)) {
          return interaction.error({ content: `Você não possui uma **Arma de Caça** para consertar.` });
        }
        if (item === 'vara' && (!vara || vara.item < 1)) {
          return interaction.error({ content: `Você não possui uma **Vara de Pescar** para consertar.` });
        }

        if (item) {
          let valor = 0,
              XP = 0,
              NomeItem = '';

          switch (item) {
            case 'arma': {
              XP = arma.Xp || 0;
              const missing = Math.max(0, 100 - XP);
              if (arma.item == '1') valor = missing * 25;
              else if (arma.item == '2') valor = missing * 50;
              else if (arma.item == '3') valor = missing * 85;
              else if (arma.item == '4') valor = missing * 150;
              NomeItem = arma.nome || 'Arma';
              break;
            }

            case 'armacaça': {
              XP = armacaça.Xp || 0;
              const missing = Math.max(0, 100 - XP);
              valor = missing * 20;
              NomeItem = armacaça.nome || 'Arma de Caça';
              break;
            }

            case 'vara': {
              XP = vara.Xp || 0;
              const missing = Math.max(0, 100 - XP);
              valor = missing * 10;
              NomeItem = Array.isArray(vara.nome) ? vara.nome[0] : (vara.nome || 'Vara de Pescar');
              break;
            }
          }
          
          if (XP >= 100) return interaction.error({ content: `Sua **${NomeItem}** não precisa ser reparada, ela já está com **100%** de durabilidade.` });
          if (carteira < valor) return interaction.error({ content: `Você não possui moedas suficientes na carteira. Custo do reparo: **${Format(valor)}**.` });

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("sim").setStyle(ButtonStyle.Success).setEmoji(emoji.positivo || '✅').setLabel('Confirmar Reparo').setDisabled(false),
            new ButtonBuilder().setCustomId("não").setStyle(ButtonStyle.Danger).setEmoji(emoji.negativo || '❌').setLabel('Cancelar').setDisabled(false),
          );

          const embed = new EmbedBuilder()
            .setColor(color.embed || "#00ff00")
            .setDescription(`🛠️ **|** ${interaction.user}, Você deseja reparar sua **${NomeItem}** (Durabilidade atual: **${XP}%**) por: **${Format(valor)}**?`);

          const msg = await interaction.followUp({ content: `${interaction.user}`, embeds: [embed], components: [row] });

          const coletor = msg.createMessageComponentCollector({ filter: x => x.user.id === interaction.user.id, time: 60000 });

          coletor.on('collect', async (i) => {
            await i.deferUpdate();

            switch (i.customId) {
              case 'sim': {
                coletor.stop();

                const freshMoney = await require('../../utils/functions.js').getUserMoney(interaction.user);
                if (freshMoney.carteira < valor) {
                  return interaction.followUp({ content: `Saldo insuficiente para efetuar o reparo!`, ephemeral: true });
                }

                database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos/${item}`).update({
                  Xp: 100
                });

                await UpdateMoneyWallet(interaction, interaction.user, '-', valor, `{emoji.saida} {mensagem.recuperar} | ${Format(valor)} | ${NomeItem}`);

                const embed2 = new EmbedBuilder()
                  .setColor(color.embed || "#00ff00")
                  .setDescription(`<:martelo:925966095712665631> **|** ${interaction.user}, Sua **${NomeItem}** foi reparada com sucesso para **100%**!`);

                await XpUpdate(interaction, interaction.user, Math.floor(Math.random() * 10) + 20);
                return msg.edit({ embeds: [embed2], components: [] });
              }

              case 'não': {
                coletor.stop();

                const embed2 = new EmbedBuilder()
                  .setColor(color.embed || "#ff0000")
                  .setDescription(`❌ **|** Reparo cancelado com sucesso.`);

                return msg.edit({ embeds: [embed2], components: [] });
              }
            }
          });

        }
        else {
          return interaction.error({ content: `Você deve escolher um item para poder recuperar.` })
        }
      })
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }

    
  }
}