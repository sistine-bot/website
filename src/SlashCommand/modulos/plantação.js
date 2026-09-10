const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ms = require('ms');
const { getUserInventory, XpUpdate } = require('../../utils/functions.js');

module.exports =  {
  "name": "plantação",
  "description": `⌊⚙️ Módulos⌉ Cuide de sua plantação.`,
  "type": ApplicationCommandType.ChatInput,
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {
      
      const msg = await interaction.followUp({ content: `<a:loading:929931026589954128> **|** Carregando plantação.` });

      await edit(msg); // const msg = await interaction.followUp({ embeds: [embed], components: [row, row2] });
      
      const coletor = await msg.createMessageComponentCollector({ filter: x => x.user.id === interaction.user.id })
      coletor.on('collect', async(int) => {
        int.deferUpdate();

        const plantação = int.customId
        if (plantação) {
          const lote = await getPlantação(plantação.split('_')[1])

          if (lote.about == 'colher') {
            return colher(plantação.split('_')[1])
          }
          if (lote.about == 'plantar') {
            return plantar(plantação.split('_')[1])
          }
        }   
      });

      async function edit(msg) {
        try {

          const lote1 = await getPlantação(1);
          const lote2 = await getPlantação(2);
          const lote3 = await getPlantação(3);
          const lote4 = await getPlantação(4);
          const lote5 = await getPlantação(5);
          const lote6 = await getPlantação(6);

          const embed = new EmbedBuilder()
          .setColor(color.embed)
          .setTitle("Plantação")
          .setDescription(`> Cuide de sua plantação, plante, colha e venda seus itens. 
${lote1.lote ? `${lote1.status ? `${lote1.emote} | Lote 1 - **${lote1.plantado}** - ` + `${lote1.timer ? "Status: **Colher**" : `**<t:${~~((lote1.tempo)/1000)}:R>**`}` : `${lote1.emote} | Lote 1 - **Plantar**`}` : "<:cadeado:994616942306537482> | Lote 1 - Comprar"}
${lote2.lote ? `${lote2.status ? `${lote2.emote} | Lote 2 - **${lote2.plantado}** - ` + `${lote2.timer ? "Status: **Colher**" : `**<t:${~~((lote2.tempo)/1000)}:R>**`}` : `${lote2.emote} | Lote 2 - **Plantar**`}` : "<:cadeado:994616942306537482> | Lote 2 - Comprar"}
${lote3.lote ? `${lote3.status ? `${lote3.emote} | Lote 3 - **${lote3.plantado}** - ` + `${lote3.timer ? "Status: **Colher**" : `**<t:${~~((lote3.tempo)/1000)}:R>**`}` : `${lote3.emote} | Lote 3 - **Plantar**`}` : "<:cadeado:994616942306537482> | Lote 3 - Comprar"}
${lote4.lote ? `${lote4.status ? `${lote4.emote} | Lote 4 - **${lote4.plantado}** - ` + `${lote4.timer ? "Status: **Colher**" : `**<t:${~~((lote4.tempo)/1000)}:R>**`}` : `${lote4.emote} | Lote 4 - **Plantar**`}` : "<:cadeado:994616942306537482> | Lote 4 - Comprar"}
${lote5.lote ? `${lote5.status ? `${lote5.emote} | Lote 5 - **${lote5.plantado}** - ` + `${lote5.timer ? "Status: **Colher**" : `**<t:${~~((lote5.tempo)/1000)}:R>**`}` : `${lote5.emote} | Lote 5 - **Plantar**`}` : "<:cadeado:994616942306537482> | Lote 5 - Comprar"}
${lote6.lote ? `${lote6.status ? `${lote6.emote} | Lote 6 - **${lote6.plantado}** - ` + `${lote6.timer ? "Status: **Colher**" : `**<t:${~~((lote6.tempo)/1000)}:R>**`}` : `${lote6.emote} | Lote 6 - **Plantar**`}` : "<:cadeado:994616942306537482> | Lote 6 - Comprar"}`)
          .addFields(
            {
              value: `${lote1.emote}${lote1.emote}${lote1.emote}`,
              name: "឵Lote 1",
              inline: true
            },
            {
              value: `${lote2.emote}${lote2.emote}${lote2.emote}`,
              name: "឵Lote 2",
              inline: true
            },
            {
              value: `${lote3.emote}${lote3.emote}${lote3.emote}`,
              name: "឵Lote 3",
              inline: true
            },
            {
              value: `${lote4.emote}${lote4.emote}${lote4.emote}`,
              name: "឵Lote 4",
              inline: true
            },
            {
              value: `${lote5.emote}${lote5.emote}${lote5.emote}`,
              name: "឵Lote 5",
              inline: true
            },
            {
              value: `${lote6.emote}${lote6.emote}${lote6.emote}`,
              name: "឵Lote 6",
              inline: true
            },
          );
          
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("Lote_1").setStyle(ButtonStyle.Secondary).setEmoji(lote1.emote).setDisabled(lote1.button),
            new ButtonBuilder().setCustomId("Lote_2").setStyle(ButtonStyle.Secondary).setEmoji(lote2.emote).setDisabled(lote2.button),
            new ButtonBuilder().setCustomId("Lote_3").setStyle(ButtonStyle.Secondary).setEmoji(lote3.emote).setDisabled(lote3.button),
          )
          const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("Lote_4").setStyle(ButtonStyle.Secondary).setEmoji(lote4.emote).setDisabled(lote4.button),
            new ButtonBuilder().setCustomId("Lote_5").setStyle(ButtonStyle.Secondary).setEmoji(lote5.emote).setDisabled(lote5.button),
            new ButtonBuilder().setCustomId("Lote_6").setStyle(ButtonStyle.Secondary).setEmoji(lote6.emote).setDisabled(lote6.button),
          )

          msg.edit({ content: `${interaction.user}`, embeds: [embed], components: [row, row2] })
          
        } catch (error) {
          console.error("Erro ao obter dados da planta:", error);
          // Tratar o erro de acordo com a necessidade do seu aplicativo
          return null;
        }

        
      }

      async function getPlantação(lote) {
        try {

          return database.ref(`economia/${interaction.user.id}/Plantação`).once('value').then(async function(snapshot) {
            let tempolote1 = (snapshot.val() && snapshot.val()['tempolote'+lote]);
            if (tempolote1 === undefined || tempolote1 === null) tempolote1 = 0;
            
            let lote1 = (snapshot.val() && snapshot.val()['lote'+lote]);
            if (lote1 === undefined || lote1 === null) lote1 = 0;
            
            let LOTEE1 = lote1;
            let emotePlantação1 = '',
                StatusButton1 = true;
            
            let LOTE1 = lote1;
            if (LOTE1 < 3) LOTE1 = 0;
            
            let Tempo1 = 0;
            let NomeItem1 = 'Nenhum nome definido',
                EmojiItem1 = 'Nenhum emote';
            
            switch (lote1) {
              case 3:
                Tempo1 = ms('2m');
                NomeItem1 = 'Trigo';
                EmojiItem1 = emoji.trigo;
                break;
              case 4:
                Tempo1 = ms('5m');
                NomeItem1 = 'Milho';
                EmojiItem1 = emoji.milho;
                break;
              case 5:
                Tempo1 = ms('20m');
                NomeItem1 = 'Feijão';
                EmojiItem1 = emoji.feijão;
                break;
              case 6:
                Tempo1 = ms('30m');
                NomeItem1 = 'CanaDeAçucar';
                EmojiItem1 = emoji.cana;
                break;
              case 7:
                Tempo1 = ms('45m');
                NomeItem1 = 'Cenoura';
                EmojiItem1 = emoji.cenoura;
                break;
              case 8:
                Tempo1 = ms('3h');
                NomeItem1 = 'Abóbora';
                EmojiItem1 = emoji.abobora;
                break;
              default:
                break;
            }

            const time1 = require("parse-ms")(Date.now() - tempolote1);
            const ttime1 = tempolote1 !== null && Tempo1 - (Date.now() - tempolote1) > 0;
            let temp1 = require("parse-ms")(Tempo1 - (Date.now() - tempolote1));
            
            let a = time1.hours;
            let aa = time1.seconds;
            
            if (aa > 1) lote1 = `${time1.hours}h ${time1.minutes}m ${time1.seconds}s`;
            
            const AAA = (ttime1 == true) ? 0 : 1;
            
            let StatusLote1 = ''
            if (LOTEE1) {
              
              if (LOTE1) {
                
                if (AAA) {
                  emotePlantação1 = emoji.foice, StatusLote1 = 'colher', StatusButton1 = false
                } else {
                  emotePlantação1 = emoji.relogio, StatusLote1 = 'relogio', StatusButton1 = true
                }
                
              } else {
                emotePlantação1 = emoji.plantar, StatusLote1 = 'plantar', StatusButton1 = false
              }
              
            } else {
              emotePlantação1 = emoji.cadeado, StatusLote1 = 'cadeado', StatusButton1 = true
            }
            
            return { emote: emotePlantação1, plantado: NomeItem1, lote: LOTEE1, status: LOTE1, about: StatusLote1, timer: AAA, button: StatusButton1, tempo: tempolote1 + Tempo1 };

          });
        } catch (error) {
          console.error("Erro ao obter dados da planta:", error);
          // Tratar o erro de acordo com a necessidade do seu aplicativo
          return null;
        }
      }

      async function plantar(Estufa) {
        try {

          const lote = await getPlantação(Estufa)

          const {
            Trigo, Milho, Feijão, Cenoura, Abóbora, CanaDeAçucar,
          } = await getUserInventory(interaction.user)
          
          const embed = new EmbedBuilder()
          .setColor(color.embed)
          .setDescription(`
**🌱 | Sementes**
${emoji.trigo} **|** Trigo: **${Trigo}**
${emoji.milho} **|** Milho: **${Milho}**
${emoji.feijão} **|** Feijão: **${Feijão}**
${emoji.cana} **|** Cana-de-açúcar **${CanaDeAçucar}**
${emoji.cenoura} **|** Cenoura: **${Cenoura}**
${emoji.abobora} **|** Abóbora: **${Abóbora}**

> *Você pode adquirir sementes na loja, upando de nível ou se tornando VIP*`)

          const Row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("Trigo").setStyle(ButtonStyle.Secondary).setEmoji(emoji.trigo).setDisabled(Trigo ? false : true),
            new ButtonBuilder().setCustomId("Milho").setStyle(ButtonStyle.Secondary).setEmoji(emoji.milho).setDisabled(Milho ? false : true),
            new ButtonBuilder().setCustomId("Feijão").setStyle(ButtonStyle.Secondary).setEmoji(emoji.feijão).setDisabled(Feijão ? false : true),
            new ButtonBuilder().setCustomId("CanaDeAçucar").setStyle(ButtonStyle.Secondary).setEmoji(emoji.cana).setDisabled(CanaDeAçucar ? false : true),
            new ButtonBuilder().setCustomId("Cenoura").setStyle(ButtonStyle.Secondary).setEmoji(emoji.cenoura).setDisabled(Cenoura ? false : true),
          ), Row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("Abóbora").setStyle(ButtonStyle.Secondary).setEmoji(emoji.abobora).setDisabled(Abóbora ? false : true),
          )

          const msg2 = await interaction.followUp({ embeds: [embed], components: [Row1, Row2], fetchReply: true, ephemeral: true });

          const coletor = await msg2.createMessageComponentCollector({ filter: x => x.user.id === interaction.user.id })

          coletor.on('collect', async(int) => {
            int.deferUpdate();

            if (int.customId) {
              coletor.stop();

              const lote = await getPlantação(Estufa)
              if (lote.lote > 1) return interaction.error({ content: `Você já possui algo plantado neste lote` })
              
              const Item = await getUserInventory(interaction.user)
              if (Item[int.customId] < 1) interaction.error({ content: `Você não possui ${i3.customId}\'s o suficiente para plantar.` });

              await database.ref(`economia/${interaction.user.id}/inventario/itens/Consumíveis`).update({
                [int.customId]: Item[int.customId] - 1
              });

              let ItemID = 0;
              switch (int.customId) {
                case 'Trigo':
                  ItemID = 3
                  break;
              
                  case 'Milho':
                    ItemID = 4
                    break;

                  case 'Feijão':
                    ItemID = 5
                    break;
                      
                  case 'CanaDeAçucar':
                    ItemID = 6
                    break;

                  case 'Cenoura':
                    ItemID = 7
                    break;

                  case 'Abóbora':
                    ItemID = 8
                    break;

                default:
                  ItemID = 0;
                  break;
              }
              
              await database.ref(`economia/${interaction.user.id}/Plantação`).update({ 
                ['tempolote'+Estufa.toString()]: Date.now(),
                ['lote'+Estufa.toString()]: ItemID
              });

              await edit(msg);
              return interaction.followUp({ content: `${emoji.plantar} **|** Você plantou **1 Semente de: ${int.customId}** na sua plantação (lote: ${Estufa.toString()}).` })
            }
          })
        } catch (error) {
          console.error("Erro ao plantar uma semente:", error);
          return null;
        }
      };

      async function colher(Estufa) {
        try {
          const lote = await getPlantação(Estufa)

          await database.ref(`economia/${interaction.user.id}/Plantação`).update({ 
            ['tempolote'+Estufa.toString()]: 0,
            ['lote'+Estufa.toString()]: 1
          });

          const Quantia = Math.floor(Math.random() * 4) + 2;
          let ItemName = 'Item não encontrado';
          let XpAmount = 0;
          
          switch (lote.status) {
            case 3:
              ItemName = 'Trigo';
              XpAmount = 10;
              break;
          
            case 4:
              ItemName = 'Milho';
              XpAmount = 12;
              break;

            case 5:
              ItemName = 'Feijão';
              XpAmount = 15;
              break;
                  
            case 6:
              ItemName = 'CanaDeAçucar';
              XpAmount = 20;
              break;

            case 7:
              ItemName = 'Cenoura';
              XpAmount = 25;
              break;

            case 8:
              ItemName = 'Abóbora';
              XpAmount = 28;
              break;

            default:
              break;
          }
          
          const Item = await getUserInventory(interaction.user);
          const currentCount = Item[ItemName] || 0;

          await database.ref(`economia/${interaction.user.id}/inventario/itens/Consumíveis`).update({
            [ItemName]: currentCount + Quantia,
          });
          
          await XpUpdate(interaction, interaction.user, XpAmount);

          await edit(msg);
          
          return interaction.followUp({ content: `${emoji.foice} **|** Você colheu sua plantação de: **${ItemName}** e recebeu **${Quantia}x** ${ItemName} e mais *${XpAmount} XP*.` });
          
        } catch (error) {
          console.error("Erro ao plantar uma semente:", error);
          // Tratar o erro de acordo com a necessidade do seu aplicativo
          return null;
        }
      }
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }

    
  }
}