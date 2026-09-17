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
        {
          "name": "⛏️ Enxada",
          "value": "enxada"
        },
        {
          "name": "🚿 Regador",
          "value": "regador"
        },
      ]
    },
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try { 

      const vipInfo = await CheckUserVip(interaction.user);
      const VIP = vipInfo.isVip;
      
      return database.ref(`economia/${interaction.user.id}/nível/`).once('value').then(async function(snapshot) {
        let nível = (snapshot.val() && snapshot.val().nível);
        if (nível === undefined || nível === null) nível = 0;
        
        const item = interaction.options.getString('item');
        const { armacaça, arma, vara, enxada, regador } = await getUserInventory(interaction.user);
        const { carteira } = await require('../../utils/functions.js').getUserMoney(interaction.user);

        let minLevel = 1;
        if (item === 'arma') {
          const armaTier = Number(arma?.item || 1);
          if (armaTier === 1) minLevel = 1;
          else if (armaTier === 2) minLevel = 15;
          else if (armaTier === 3) minLevel = 25;
          else if (armaTier >= 4) minLevel = 40;
        } else if (item === 'armacaça') {
          minLevel = 1;
        } else {
          // Ferramentas de trabalho de ferro (vara, enxada, regador)
          minLevel = 1;
        }

        const isCreator = client.config?.cargos?.criador?.includes(interaction.user.id);
        if (!isCreator && !VIP && nível < minLevel) {
          return interaction.error({ content: `Você precisa ser **nível ${minLevel}** para recuperar a durabilidade deste item (Assinantes VIP possuem acesso antecipado!).` });
        }
        
        if (item === 'arma' && (!arma || arma.item < 1)) {
          return interaction.error({ content: `Você não possui uma **Arma** equipada para consertar.` });
        }
        if (item === 'armacaça' && (!armacaça || armacaça.item < 1)) {
          return interaction.error({ content: `Você não possui uma **Arma de Caça** para consertar.` });
        }
        if (item === 'vara' && (!vara || vara.item < 1)) {
          return interaction.error({ content: `Você não possui uma **Vara de Pescar** para consertar.` });
        }
        if (item === 'vara' && (vara.reparavel === false || vara.tipo === 'bambu')) {
          return interaction.error({ content: `A sua **${Array.isArray(vara.nome) ? vara.nome[0] : (vara.nome || 'Vara de Bambu')}** é um item inicial e **não pode ser consertada**! Adquira uma vara permanente na \`/loja itens\`.` });
        }
        if (item === 'enxada' && (!enxada || enxada.item < 1)) {
          return interaction.error({ content: `Você não possui uma **Enxada** para consertar.` });
        }
        if (item === 'enxada' && (enxada.reparavel === false || enxada.tipo === 'madeira')) {
          return interaction.error({ content: `A sua **${Array.isArray(enxada.nome) ? enxada.nome[0] : (enxada.nome || 'Enxada de Madeira')}** é feita de madeira rústica e **não pode ser consertada**! Adquira uma enxada de ferro na \`/loja itens\`.` });
        }
        if (item === 'regador' && (!regador || regador.item < 1)) {
          return interaction.error({ content: `Você não possui um **Regador** para consertar.` });
        }
        if (item === 'regador' && (regador.reparavel === false || regador.tipo === 'plastico')) {
          return interaction.error({ content: `O seu **${Array.isArray(regador.nome) ? regador.nome[0] : (regador.nome || 'Regador de Plástico')}** é descartável e **não pode ser consertado**! Adquira um Regador de Ferro permanente na \`/loja itens\`.` });
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

            case 'enxada': {
              XP = enxada.Xp || 0;
              const missing = Math.max(0, 100 - XP);
              valor = missing * 12;
              NomeItem = Array.isArray(enxada.nome) ? enxada.nome[0] : (enxada.nome || 'Enxada');
              break;
            }

            case 'regador': {
              XP = regador.Xp || 0;
              const missing = Math.max(0, 100 - XP);
              valor = missing * 15;
              NomeItem = Array.isArray(regador.nome) ? regador.nome[0] : (regador.nome || 'Regador');
              break;
            }
          }
          
          if (XP >= 100) return interaction.error({ content: `Sua **${NomeItem}** não precisa ser reparada, ela já está com **100%** de durabilidade.` });

          const valorOriginal = valor;
          let vipDiscountMsg = '';
          if (vipInfo.isVip && vipInfo.repairDiscount > 0) {
            valor = Math.round(valor * (1 - vipInfo.repairDiscount));
            vipDiscountMsg = `\n> 👑 **Desconto ${vipInfo.levelName} (-${Math.round(vipInfo.repairDiscount * 100)}%):** De ~~${Format(valorOriginal)}~~ por **${Format(valor)}**`;
          }

          if (carteira < valor) return interaction.error({ content: `Você não possui moedas suficientes na carteira. Custo do reparo: **${Format(valor)}**.` });

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("sim").setStyle(ButtonStyle.Success).setEmoji(emoji.positivo || '✅').setLabel('Confirmar Reparo').setDisabled(false),
            new ButtonBuilder().setCustomId("não").setStyle(ButtonStyle.Danger).setEmoji(emoji.negativo || '❌').setLabel('Cancelar').setDisabled(false),
          );

          let descText = `🛠️ **|** ${interaction.user}, Você deseja reparar sua **${NomeItem}** (Durabilidade atual: **${XP}%**) por: **${Format(valor)}**?${vipDiscountMsg}`;
          if (item === 'regador') {
            descText += `\n\n> 💧 **Água:** ${regador.agua || 0}%\n> ⚠️ *Atenção: O reparo restaura apenas a durabilidade do regador. O nível de água não é consertado no reparar e deve ser abastecido na plantação.*`;
          }

          const embed = new EmbedBuilder()
            .setColor(color.embed || "#00ff00")
            .setDescription(descText);

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