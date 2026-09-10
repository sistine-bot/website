const { StringSelectMenuBuilder, ApplicationCommandType, ButtonStyle, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ApplicationCommandOptionType } = require('discord.js');
const { getUserMoney, UpdateMoneyWallet, TransactionUpdate, Format } = require(`../../../src/utils/functions.js`); //[cite: 2]
const itensAPI = require(`../../utils/itens.json`); //[cite: 2]
const ms = require('ms'); //[cite: 2]

const TimeToClose = 70 * 1e3; //[cite: 2]

module.exports = {
  "name": "loja",
  "description": "⌊💸 Economia⌉ Compre e venda seus itens.",
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "loja",
      "description": "Qual loja deseja abrir",
      "type": ApplicationCommandOptionType.String,
      "required": true,
      "choices": [
        { "name": "🌳 Lotes", "value": "lotes" },
        { "name": "🌱 Sementes", "value": "sementes" },
        { "name": "🚜 Fazenda", "value": "fazenda" },
        { "name": "🛠️ Itens", "value": "itens" },
        { "name": "🔫 Armas", "value": "armas" },
        // { "name": "🖼️ Perfil", "value": "perfil" },
        { "name": "🛒 Vendas", "value": "vendas" }
      ],
    },
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    try {
      // Padronização dos caminhos do banco de dados para evitar bugs de digitação
      const DB_BASE = `economia/${interaction.user.id}`;
      const DB_EQUIP = `${DB_BASE}/inventario/itens/Equipamentos`;
      const DB_CONSUM = `${DB_BASE}/inventario/itens/Consumíveis`;

      async function Store(Diretório, Variável, ItemType, isBuying, Amount, ItemName, Money, Mínimo, Transação) {
        try {
          const snapItem = await database.ref(Diretório).once('value');
          let Item = (snapItem.val() && snapItem.val()[Variável]);
          if (Item === undefined || Item === null) Item = 0;
            
          if (Amount === 'all') Amount = Item;
          
          if (!isBuying && Item < Mínimo) {
            return interaction.error({ content: `<@${interaction.user.id}>, Você deve possuir no mínimo: **${Mínimo}Kg** de: **${ItemName || 'Nome não definido'}** para vender.` });
          }
          
          if (isBuying && ItemType === 1 && (Mínimo < Item || (Item.item && Item.item > 0))) {
            return interaction.error({ content: `<@${interaction.user.id}>, Você já possui um: **${ItemName || 'Nome não definido'}**.` });
          }
          
          switch (ItemType) {
            case 1:
              if (isBuying && Mínimo < Item) {
                return interaction.error({ content: `<@${interaction.user.id}>, Você já possui um: **${ItemName || 'Nome não definido'}**` });
              } else if (!isBuying && Item < 1) {
                return interaction.error({ content: `<@${interaction.user.id}>, Você não possui nenhum: **${ItemName || 'Nome não definido'}** para ser vendido.` });
              }
              break;
            case 2:
              if (!isBuying && Item < Amount) {
                return interaction.error({ content: `<@${interaction.user.id}>, Você precisa de no mínimo: **${ItemName || 'Nome não definido'}** para poder vender.` });
              }
              break;
            default:
              console.error(`[BUY FUNCTION] - Tipo inválido.`);
              return interaction.error({ content: `<@${interaction.user.id}>, Ocorreu um erro ao processar seu item.` });
          }
          
          const { carteira } = await getUserMoney(interaction.user);
          if (Money && isBuying && carteira < Money) {
            return interaction.error({ content: `<@${interaction.user.id}>, Você não possui **dinheiro** o suficiente para concluir esta transação.` });
          }
          
          let BuyOrSellSing = isBuying ? '-' : '+';
          let MensagemReply = '';
          
          if (ItemType === 1) {
            if (!isBuying) {
              await database.ref(Diretório).update({ [Variável]: null });
            } else {
              if (['arma', 'armacaça', 'vara'].includes(Variável.toLowerCase())) {
                await database.ref(Diretório).update({ [Variável]: { Xp: 100, item: Amount, nome: ItemName } });
              } else {
                await database.ref(Diretório).update({ [Variável]: Amount });
              }
            }
            MensagemReply = !isBuying 
              ? `${emoji.positivo} **|** <@${interaction.user.id}>, Você vendeu seu item: **{Item}** ${Money ? `por: **{dinheiro}**` : ''}`
              : `${emoji.positivo} **|** <@${interaction.user.id}>, Você comprou: **{Item}** ${Money ? `por: **{dinheiro}**` : ''}`;
          } else {
            if (!isBuying) {
              await database.ref(Diretório).update({ [Variável]: Item - Amount });
            } else {
              await database.ref(Diretório).update({ [Variável]: Item + Amount });
            }
            MensagemReply = !isBuying
              ? `${emoji.positivo} **|** <@${interaction.user.id}>, Você vendeu: **{quantia}** de: **{Item}** ${Money ? `por: **{dinheiro}**` : ''}`
              : `${emoji.positivo} **|** <@${interaction.user.id}>, Você comprou: **{Item}** ${Money ? `por: **{dinheiro}**` : ''}`;
          }
          
          if (Money) UpdateMoneyWallet(interaction, interaction.user, BuyOrSellSing, Money);
          if (Transação) TransactionUpdate(interaction, Transação, interaction.user);
          
          return await interaction.followUp({ 
            content: MensagemReply.replace('{quantia}', Format(Amount, '')).replace('{Item}', ItemName).replace('{dinheiro}', Format(Money))
          });

        } catch (error) {
          console.error('Erro na função Store: ', error);
          return interaction.error({ content: `Ocorreu um erro ao comprar/vender um item.` });
        }
      }

      function LojaFechada(loja) {
        interaction.followUp({ content: `${emoji.relogio} **|** A loja: **${loja}** foi fechada.`, ephemeral: true });
      }
      
      function RequiredNível(Nível) {
        return interaction.error({ content: `Você precisa ser **nível ${Nível}** para comprar este item.` });
      }

      const escolha = interaction.options.getString('loja');
      const filtro = X => X.user.id === interaction.user.id;
      
      switch (escolha) {
        case 'fazenda': {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("ração_animal").setStyle(ButtonStyle.Secondary).setEmoji(emoji[1]),
            new ButtonBuilder().setCustomId("Galinha").setStyle(ButtonStyle.Secondary).setEmoji(emoji[2]),
            new ButtonBuilder().setCustomId("Vaca").setStyle(ButtonStyle.Secondary).setEmoji(emoji[3]),
            new ButtonBuilder().setCustomId("Porco").setStyle(ButtonStyle.Secondary).setEmoji(emoji[4]),
          );
          
          const embed = new EmbedBuilder()
            .setColor(color.embed)
            .setAuthor({ name: `${client.user.username} • Loja`, iconURL: client.user.displayAvatarURL({ size: 1024 }) })
            .setDescription(`
${emoji[1]} **|** ${emoji.ração_animal} - (3) ${itensAPI.ração_animal.nome[0]} **|** ${Format(itensAPI.ração_animal.valor * 3)}
${emoji[2]} **|** ${emoji.galinha} - ${itensAPI.Galinha.nome[0]} **|** ${Format(itensAPI.Galinha.valor)}
${emoji[3]} **|** ${emoji.vaca} - ${itensAPI.Vaca.nome[0]} **|** ${Format(itensAPI.Vaca.valor)}
${emoji[4]} **|** ${emoji.porco} - ${itensAPI.Porco.nome[0]} **|** ${Format(itensAPI.Porco.valor)}`)
            .setFooter({ text: `Você possui ${ms(TimeToClose)} • ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() || undefined });
          
          const msg = await interaction.followUp({ embeds: [embed], components: [row] });
          const coletor = msg.createMessageComponentCollector({ filter: filtro, time: TimeToClose });
          
          coletor.on('collect', async (i) => {
            await i.deferUpdate();
            
            if (i.customId === 'ração_animal') {
              const Valor = itensAPI.ração_animal.valor * 3;
              const NomeDoItem = itensAPI.ração_animal.nome[0];

              await Store(DB_CONSUM, 'ração_animal', 2, true, 3, NomeDoItem, Valor, 6, `{emoji.saida} {mensagem.loja.compra} | ${Valor} | 3 ${NomeDoItem}`);
            } else {
              const AnimalDB = await database.ref(`${DB_BASE}/Fazenda/Animal`).once('value');
              const animal1 = AnimalDB.val()?.animal_1 || 0;
              const animal2 = AnimalDB.val()?.animal_2 || 0;
              const animal3 = AnimalDB.val()?.animal_3 || 0;

              const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("animal_1").setStyle(ButtonStyle.Secondary).setEmoji(emoji[1]).setDisabled(!!animal1),
                new ButtonBuilder().setCustomId("animal_2").setStyle(ButtonStyle.Secondary).setEmoji(emoji[2]).setDisabled(!!animal2),
                new ButtonBuilder().setCustomId("animal_3").setStyle(ButtonStyle.Secondary).setEmoji(emoji[3]).setDisabled(!!animal3),
              );
              
              const embed2 = new EmbedBuilder()
                .setColor(color.embed)
                .setDescription(`**Selecione o espaço de seu novo animal:**\n${emoji[1]} **|** Rancho 1 - **${animal1 ? 'Ocupado' : 'Selecionar'}**\n${emoji[2]} **|** Rancho 2 - **${animal2 ? 'Ocupado' : 'Selecionar'}**\n${emoji[3]} **|** Rancho 3 - **${animal3 ? 'Ocupado' : 'Selecionar'}**`);
              
              const msg2 = await interaction.followUp({ embeds: [embed2], components: [row2], ephemeral: true });
              const coletor2 = msg2.createMessageComponentCollector({ filter: filtro, time: TimeToClose });
              
              coletor2.on('collect', async (X) => {
                await X.deferUpdate();
                const rancho = X.customId;
                if (rancho) {
                  coletor2.stop();
                  let Quantia = i.customId === 'Galinha' ? 1 : i.customId === 'Vaca' ? 2 : 3;
                  const Valor = itensAPI[i.customId].valor;
                  const NomeDoItem = itensAPI[i.customId].nome[0];

                  await Store(`${DB_BASE}/Fazenda/Animal`, rancho, 2, true, Quantia, NomeDoItem, Valor, 2, `{emoji.saida} {mensagem.loja.compra} | ${Valor} | ${NomeDoItem}`);
                }
              });
            }
          });
          
          coletor.on('end', () => { LojaFechada('Fazenda'); msg.delete().catch(() => {}); });
          break;
        }

        case 'sementes': {
          const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("Trigo").setStyle(ButtonStyle.Secondary).setEmoji(emoji[1]),
            new ButtonBuilder().setCustomId("Milho").setStyle(ButtonStyle.Secondary).setEmoji(emoji[2]),
            new ButtonBuilder().setCustomId("Feijão").setStyle(ButtonStyle.Secondary).setEmoji(emoji[3]),
          );
          const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("CanaDeAçucar").setStyle(ButtonStyle.Secondary).setEmoji(emoji[4]),
            new ButtonBuilder().setCustomId("Cenoura").setStyle(ButtonStyle.Secondary).setEmoji(emoji[5]),
            new ButtonBuilder().setCustomId("Abóbora").setStyle(ButtonStyle.Secondary).setEmoji(emoji[6]),
          );
          
          const embed = new EmbedBuilder()
            .setColor(color.embed)
            .setAuthor({ name: `${client.user.username} • Loja`, iconURL: client.user.displayAvatarURL({ size: 1024 }) })
            .setDescription(`
${emoji[1]} **|** ${emoji.trigo} - ${itensAPI.Trigo.nome[0]} **|** ${Format(itensAPI.Trigo.valor)}
${emoji[2]} **|** ${emoji.milho} - ${itensAPI.Milho.nome[0]} **|** ${Format(itensAPI.Milho.valor)}
${emoji[3]} **|** ${emoji.feijão} - ${itensAPI.Feijão.nome[0]} **|** ${Format(itensAPI.Feijão.valor)}
${emoji[4]} **|** ${emoji.canadeaçucar} - ${itensAPI.CanaDeAçucar.nome[0]} **|** ${Format(itensAPI.CanaDeAçucar.valor)}
${emoji[5]} **|** ${emoji.cenoura} - ${itensAPI.Cenoura.nome[0]} **|** ${Format(itensAPI.Cenoura.valor)}
${emoji[6]} **|** ${emoji.abóbora} - ${itensAPI.Abóbora.nome[0]} **|** ${Format(itensAPI.Abóbora.valor)}`)
            .setFooter({ text: `Você possui ${ms(TimeToClose)} • ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() || undefined });
          
          const msg = await interaction.followUp({ embeds: [embed], components: [row2, row3] });
          const coletor = msg.createMessageComponentCollector({ filter: filtro, time: TimeToClose });
          
          coletor.on('collect', async (i) => {
            await i.deferUpdate();
            const Valor = itensAPI[i.customId].valor;
            const NomeDoItem = itensAPI[i.customId].nome[0];
            
            const snapshot = await database.ref(`${DB_BASE}/nível/`).once('value');
            let nível = snapshot.val()?.nível || 0;
            
            if (NomeDoItem === 'Feijão' && nível < 5) return RequiredNível(5);
            if (NomeDoItem === 'CanaDeAçucar' && nível < 10) return RequiredNível(10);
            if (NomeDoItem === 'Cenoura' && nível < 15) return RequiredNível(15);
            if (NomeDoItem === 'Abóbora' && nível < 20) return RequiredNível(20);
            
            await Store(DB_CONSUM, NomeDoItem, 2, true, 1, NomeDoItem, Valor, 999, `{emoji.saida} {mensagem.loja.compra} | ${Valor} | ${i.customId}`);
          });

          coletor.on('end', () => { LojaFechada('Sementes'); msg.delete().catch(() => {}); });
          break;
        }
          
        case 'lotes': {
          const ItemsPrices = { lote1: 0, lote2: 5000, lote3: 10000, lote4: 20000, lote5: 35000, lote6: 50000 };
          const snapshot = await database.ref(`${DB_BASE}/Plantação`).once('value');
          const plantacao = snapshot.val() || {};
          
          const l1 = plantacao.lote1 || 0; const l2 = plantacao.lote2 || 0; const l3 = plantacao.lote3 || 0;
          const l4 = plantacao.lote4 || 0; const l5 = plantacao.lote5 || 0; const l6 = plantacao.lote6 || 0;
          
          const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("1").setStyle(ButtonStyle.Secondary).setEmoji(l1 < 1 ? emoji[1] : emoji.cadeado).setDisabled(l1 >= 1),
            new ButtonBuilder().setCustomId("2").setStyle(ButtonStyle.Secondary).setEmoji(l2 < 1 ? emoji[2] : emoji.cadeado).setDisabled(l2 >= 1),
            new ButtonBuilder().setCustomId("3").setStyle(ButtonStyle.Secondary).setEmoji(l3 < 1 ? emoji[3] : emoji.cadeado).setDisabled(l3 >= 1),
          );
          const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("4").setStyle(ButtonStyle.Secondary).setEmoji(l4 < 1 ? emoji[4] : emoji.cadeado).setDisabled(l4 >= 1),
            new ButtonBuilder().setCustomId("5").setStyle(ButtonStyle.Secondary).setEmoji(l5 < 1 ? emoji[5] : emoji.cadeado).setDisabled(l5 >= 1),
            new ButtonBuilder().setCustomId("6").setStyle(ButtonStyle.Secondary).setEmoji(l6 < 1 ? emoji[6] : emoji.cadeado).setDisabled(l6 >= 1),
          );
  
          const embed = new EmbedBuilder()
            .setColor(color.embed)
            .setAuthor({ name: `${client.user.username} • Loja`, iconURL: client.user.displayAvatarURL({ size: 1024 }) })
            .setDescription(`
${l1 < 1 ? emoji[1] : emoji.cadeado} **|** Lote 1 **|** ${Format(0)}
${l2 < 1 ? emoji[2] : emoji.cadeado} **|** Lote 2 **|** ${Format(5000)}
${l3 < 1 ? emoji[3] : emoji.cadeado} **|** Lote 3 **|** ${Format(10000)}
${l4 < 1 ? emoji[4] : emoji.cadeado} **|** Lote 4 **|** ${Format(20000)}
${l5 < 1 ? emoji[5] : emoji.cadeado} **|** Lote 5 **|** ${Format(35000)}
${l6 < 1 ? emoji[6] : emoji.cadeado} **|** Lote 6 **|** ${Format(50000)}`)
            .setFooter({ text: `Você possui ${ms(TimeToClose)} • ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() || undefined });
  
          const msg = await interaction.followUp({ embeds: [embed], components: [row1, row2] });
          const coletor = msg.createMessageComponentCollector({ filter: filtro, time: TimeToClose });
  
          coletor.on('collect', async (i) => {
            await i.deferUpdate();
            const Quanti = i.customId;
            const NomeItem = 'Lote ' + Quanti;
            const Valor = ItemsPrices[`lote` + Quanti];
                
            const lvlSnap = await database.ref(`${DB_BASE}/nível/`).once('value');
            let nível = lvlSnap.val()?.nível || 0;
  
            if (Quanti === '2' && nível < 3) return RequiredNível(3);
            if (Quanti === '3' && nível < 10) return RequiredNível(10);
            if (Quanti === '4' && nível < 15) return RequiredNível(15);
            if (Quanti === '5' && nível < 20) return RequiredNível(20);
            if (Quanti === '6' && nível < 25) return RequiredNível(25);
                  
            await Store(`${DB_BASE}/Plantação/`, 'lote' + Quanti, 1, true, 1, NomeItem, Valor, 0, `{emoji.saida} {mensagem.loja.compra} | ${Valor} | ${NomeItem}`);
          });
          
          coletor.on('end', () => { LojaFechada('Lotes'); msg.delete().catch(() => {}); });
          break;
        }
              
        case 'itens': {
          const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("1").setStyle(ButtonStyle.Secondary).setEmoji(emoji[1]),
            new ButtonBuilder().setCustomId("2").setStyle(ButtonStyle.Secondary).setEmoji(emoji[2]),
            new ButtonBuilder().setCustomId("3").setStyle(ButtonStyle.Secondary).setEmoji(emoji[3]),
            new ButtonBuilder().setCustomId("4").setStyle(ButtonStyle.Secondary).setEmoji(emoji[4]),
          );
          
          const embed = new EmbedBuilder()
            .setColor(color.embed)
            .setAuthor({ name: `${client.user.username} • Loja`, iconURL: client.user.displayAvatarURL({ size: 1024 }) })
            .setDescription(`
${emoji[1]} **|** ${itensAPI.porte.nome[0]} **|** ${Format(itensAPI.porte.valor)}
${emoji[2]} **|** ${itensAPI.anelcasamento.nome[0]} **|** ${Format(itensAPI.anelcasamento.valor)}
${emoji[3]} **|** ${itensAPI.vara.nome[0]} **|** ${Format(itensAPI.vara.valor)}
${emoji[4]} **|** 7 ${itensAPI.isca.nome[1]} **|** ${Format(itensAPI.isca.valor * 7)}`)
// ${emoji[5]} **|** ${itensAPI.backgroundticket.nome[0]} **|** ${Format(itensAPI.backgroundticket.valor)}`)
            .setFooter({ text: `Você possui ${ms(TimeToClose)} • ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() || undefined });
          
          const msg = await interaction.followUp({ embeds: [embed], components: [row1] });
          const coletor = msg.createMessageComponentCollector({ filter: filtro, time: TimeToClose });
          
          coletor.on('collect', async (i) => {
            await i.deferUpdate();
            let Diretório, Variável, ItemType, Amount, NomeItem, Money, Quanti;
            
            switch (i.customId) {
              case '1':
                ItemType = 1; Amount = 1; NomeItem = itensAPI.porte.nome[0]; Money = itensAPI.porte.valor; Variável = 'porte'; Diretório = DB_EQUIP; Quanti = 0;
                break;
              case '2':
                ItemType = 1; Amount = 1; NomeItem = itensAPI.anelcasamento.nome[0]; Money = itensAPI.anelcasamento.valor; Variável = 'anelcasamento'; Diretório = DB_EQUIP; Quanti = 0;
                break;
              case '3':
                ItemType = 1; Amount = 1; NomeItem = itensAPI.vara.nome[0]; Money = itensAPI.vara.valor; Variável = 'vara'; Diretório = DB_EQUIP; Quanti = 0;
                break;
              case '4':
                ItemType = 2; Amount = 7; NomeItem = itensAPI.isca.nome[1]; Money = itensAPI.isca.valor * 7; Variável = 'isca'; Diretório = DB_CONSUM; Quanti = 14;
                break;
            }
            
            const snapshot = await database.ref(`${DB_BASE}/nível/`).once('value');
            let nível = snapshot.val()?.nível || 0;
              
            if (NomeItem === itensAPI.backgroundticket.nome[0] && nível < 23) return RequiredNível(23);
              
            await Store(Diretório, Variável, ItemType, true, Amount, NomeItem, Money, Quanti, `{emoji.saida} {mensagem.loja.compra} | ${Money} | ${Amount} ${NomeItem}`);
          });

          coletor.on('end', () => { LojaFechada('Itens'); msg.delete().catch(() => {}); });
          break;
        }
          
        case 'armas': {
          const equipSnap = await database.ref(DB_EQUIP).once('value');
          const equipData = equipSnap.val() || {};
          let Arma = equipData.arma || 0;
          let Armacaça = equipData.armacaça || 0;
            
          const verifyArmaCaça = !!(Armacaça.item > 0);
          const verifyArma = !!(Arma.item > 0);
            
          const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("1").setStyle(ButtonStyle.Secondary).setEmoji(emoji[1]),
            new ButtonBuilder().setCustomId("2").setStyle(ButtonStyle.Secondary).setEmoji(verifyArmaCaça ? emoji.cadeado : emoji[2]).setDisabled(verifyArmaCaça),
            new ButtonBuilder().setCustomId("3").setStyle(ButtonStyle.Secondary).setEmoji(verifyArma ? emoji.cadeado : emoji[3]).setDisabled(verifyArma),
          );
          const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("4").setStyle(ButtonStyle.Secondary).setEmoji(verifyArma ? emoji.cadeado : emoji[4]).setDisabled(verifyArma),
            new ButtonBuilder().setCustomId("5").setStyle(ButtonStyle.Secondary).setEmoji(verifyArma ? emoji.cadeado : emoji[5]).setDisabled(verifyArma),
            new ButtonBuilder().setCustomId("6").setStyle(ButtonStyle.Secondary).setEmoji(verifyArma ? emoji.cadeado : emoji[6]).setDisabled(verifyArma),
          );
  
          const embed = new EmbedBuilder()
            .setColor(color.embed)
            .setAuthor({ name: `${client.user.username} • Loja`, iconURL: client.user.displayAvatarURL({ size: 1024 }) })
            .setDescription(`
${emoji[1]} **|** 25 Munições **|** ${Format(itensAPI.munição.valor * 25)}
${verifyArmaCaça ? emoji.cadeado : emoji[2]} **|** Arma de caça **|** ${Format(itensAPI.armacaça.valor)}
${verifyArma ? emoji.cadeado : emoji[3]} **|** ${itensAPI.arma[1].nome} **|** ${Format(itensAPI.arma[1].valor)}
${verifyArma ? emoji.cadeado : emoji[4]} **|** ${itensAPI.arma[2].nome} **|** ${Format(itensAPI.arma[2].valor)}
${verifyArma ? emoji.cadeado : emoji[5]} **|** ${itensAPI.arma[3].nome} **|** ${Format(itensAPI.arma[3].valor)}
${verifyArma ? emoji.cadeado : emoji[6]} **|** ${itensAPI.arma[4].nome} **|** ${Format(itensAPI.arma[4].valor)}`)
            .setFooter({ text: `Você possui ${ms(TimeToClose)} • ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() || undefined });
            
          const msg = await interaction.followUp({ embeds: [embed], components: [row1, row2] });
          const coletor = msg.createMessageComponentCollector({ filter: filtro, time: TimeToClose });
  
          coletor.on('collect', async (i) => {
            await i.deferUpdate();
            let Diretório, Variável, ItemType, Amount, NomeItem, Money, Quanti;
              
            let porte = equipData.porte || 0;
                
            switch (i.customId) {
              case '1':
                ItemType = 2; Amount = 25; NomeItem = '25 ' + itensAPI.munição.nome[1]; Money = itensAPI.munição.valor * 25; Variável = 'munição'; Diretório = DB_CONSUM; Quanti = 50;
                break;
              case '2':
                Diretório = DB_EQUIP; Variável = 'armacaça'; ItemType = 1; Amount = 1; NomeItem = itensAPI.armacaça.nome[0]; Money = itensAPI.armacaça.valor; Quanti = 0;
                break;
              case '3':
                Diretório = DB_EQUIP; Variável = 'arma'; ItemType = 1; Money = itensAPI.arma[1].valor; NomeItem = itensAPI.arma[1].nome; Quanti = 0; Amount = 1;
                break;
              case '4':
                Diretório = DB_EQUIP; Variável = 'arma'; ItemType = 1; NomeItem = itensAPI.arma[2].nome; Money = itensAPI.arma[2].valor; Quanti = 0; Amount = 2;
                break;
              case '5':
                Diretório = DB_EQUIP; Variável = 'arma'; ItemType = 1; NomeItem = itensAPI.arma[3].nome; Money = itensAPI.arma[3].valor; Quanti = 0; Amount = 3;
                break;
              case '6':
                Diretório = DB_EQUIP; Variável = 'arma'; ItemType = 1; NomeItem = itensAPI.arma[4].nome; Money = itensAPI.arma[4].valor; Quanti = 0; Amount = 4;
                break;
            }
                
            if (parseInt(i.customId) > 1 && (!porte || porte.item < 1)) {
              return interaction.error({ content: `Você precisa de um **${itensAPI.porte.nome[0]}** para comprar uma arma.` });
            }
                
            await Store(Diretório, Variável, ItemType, true, Amount, NomeItem, Money, Quanti, `{emoji.saida} {mensagem.loja.compra} | ${Money} | ${NomeItem}`);
          });

          coletor.on('end', () => { LojaFechada('Armas'); msg.delete().catch(() => {}); });
          break;
        }
        
        case 'vendas': {
          // Buscando inventários direto do banco para evitar funções globais soltas
          const [snapConsum, snapEquip] = await Promise.all([
            database.ref(DB_CONSUM).once('value'),
            database.ref(DB_EQUIP).once('value')
          ]);
          
          const consum = snapConsum.val() || {};
          const equip = snapEquip.val() || {};

          let comp = new StringSelectMenuBuilder().setCustomId('menu').setPlaceholder('Selecione algum item de seu inventário:');
          let ROW = [];

          function getItemSellPrice(key, tier = null) {
            if (key === 'arma') {
              return Math.floor((itensAPI.arma[tier]?.valor || 0) / 2);
            }
            if (['Trigo', 'Milho', 'Feijão', 'CanaDeAçucar', 'Cenoura', 'Abóbora', 'armacaça', 'vara', 'porte', 'anelcasamento'].includes(key)) {
              return Math.floor((itensAPI[key]?.valor || 0) / 2);
            }
            if (['peixe', 'carne', 'Ovo', 'Leite', 'Bacon'].includes(key)) {
              return itensAPI[key]?.valor || 0;
            }
            return Math.floor((itensAPI[key]?.valor || 0) / 2);
          }
  
          function RowADD(Item, NomeItem, Emoji, Valorr, Quantia = 0) {
            comp.addOptions([{ label: NomeItem, description: `Você irá receber ${Format(Quantia)} na venda`, emoji: Emoji, value: Valorr }]);
            ROW.push(Valorr);
          }
  
          if (consum.peixe > 0) RowADD(consum.peixe, `${consum.peixe}x Peixe`, '🐟', 'peixe', getItemSellPrice('peixe') * consum.peixe);
          if (consum.carne > 0) RowADD(consum.carne, `${consum.carne}x Carne`, '🥩', 'carne', getItemSellPrice('carne') * consum.carne);
          if (consum.Trigo > 0) RowADD(consum.Trigo, `${consum.Trigo}x Trigo`, '🌾', 'Trigo', getItemSellPrice('Trigo') * consum.Trigo);
          if (consum.Milho > 0) RowADD(consum.Milho, `${consum.Milho}x Milho`, '🌽', 'Milho', getItemSellPrice('Milho') * consum.Milho);
          if (consum.Feijão > 0) RowADD(consum.Feijão, `${consum.Feijão}x Feijão`, '🫘', 'Feijão', getItemSellPrice('Feijão') * consum.Feijão);
          if (consum.CanaDeAçucar > 0) RowADD(consum.CanaDeAçucar, `${consum.CanaDeAçucar}x Cana-de-açúcar`, '🎋', 'CanaDeAçucar', getItemSellPrice('CanaDeAçucar') * consum.CanaDeAçucar);
          if (consum.Cenoura > 0) RowADD(consum.Cenoura, `${consum.Cenoura}x Cenoura`, '🥕', 'Cenoura', getItemSellPrice('Cenoura') * consum.Cenoura);
          if (consum.Abóbora > 0) RowADD(consum.Abóbora, `${consum.Abóbora}x Abóbora`, '🎃', 'Abóbora', getItemSellPrice('Abóbora') * consum.Abóbora);
          if (consum.Ovo > 0) RowADD(consum.Ovo, `${consum.Ovo}x Ovo`, '🥚', 'Ovo', getItemSellPrice('Ovo') * consum.Ovo);
          if (consum.Leite > 0) RowADD(consum.Leite, `${consum.Leite}x Leite`, '🥛', 'Leite', getItemSellPrice('Leite') * consum.Leite);
          if (consum.Bacon > 0) RowADD(consum.Bacon, `${consum.Bacon}x Bacon`, '🥓', 'Bacon', getItemSellPrice('Bacon') * consum.Bacon);
          
          if (equip.armacaça?.item > 0) RowADD(equip.armacaça.item, `Arma de Caça`, '🏹', 'armacaça', getItemSellPrice('armacaça'));
          if (equip.arma?.item > 0) {
            const tierArma = equip.arma.item;
            const nomeArma = Array.isArray(itensAPI.arma[tierArma]?.nome) ? itensAPI.arma[tierArma].nome[0] : (itensAPI.arma[tierArma]?.nome || `Tier ${tierArma}`);
            RowADD(tierArma, `Arma (${nomeArma})`, '🔫', 'arma', getItemSellPrice('arma', tierArma));
          }
  
          const embedfazenda = new EmbedBuilder()
            .setColor(color.embed)
            .setAuthor({ name: `${client.user.username} • Loja`, iconURL: client.user.displayAvatarURL({ size: 1024 }) })
            .setDescription(ROW.length > 0 ? `ℹ️ **|** Selecione um item para vender` : `ℹ️ **|** Você não possui nenhum item para vender.`)
            .setFooter({ text: `Você possui 30s • ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() || undefined });
          
          const msg = await interaction.followUp({ embeds: [embedfazenda], components: ROW.length > 0 ? [new ActionRowBuilder().addComponents(comp)] : [] });
          if (ROW.length === 0) return;

          const collector = msg.createMessageComponentCollector({ filter: filtro, time: TimeToClose });
          
          collector.on('collect', async (collected) => {
            await collected.deferUpdate();
            let valor = collected.values[0];
            collector.stop();
            
            let NomedoItem = '', Diretório = '', Variável = valor, Quantt = 1, DinheiroQuant = 0;
  
            if (['vara', 'anelcasamento', 'porte', 'arma', 'armacaça'].includes(valor)) {
              Diretório = DB_EQUIP;
              if (valor === 'arma') {
                const tierArma = equip.arma.item;
                NomedoItem = Array.isArray(itensAPI.arma[tierArma]?.nome) ? itensAPI.arma[tierArma].nome[0] : (itensAPI.arma[tierArma]?.nome || 'Arma');
                DinheiroQuant = getItemSellPrice('arma', tierArma);
                Quantt = tierArma;
              } else {
                NomedoItem = Array.isArray(itensAPI[valor]?.nome) ? itensAPI[valor].nome[0] : (itensAPI[valor]?.nome || valor);
                DinheiroQuant = getItemSellPrice(valor);
              }
            } else {
              Diretório = DB_CONSUM;
              Quantt = consum[valor];
              NomedoItem = Array.isArray(itensAPI[valor]?.nome) ? itensAPI[valor].nome[0] : (itensAPI[valor]?.nome || valor);
              DinheiroQuant = getItemSellPrice(valor) * Quantt;
            }
  
            let Transação = `{emoji.entrada} {mensagem.loja.vendas} | ${DinheiroQuant} | ${NomedoItem}`;
  
            const EmbedVenda = new EmbedBuilder()
              .setColor(color.embed)
              .setDescription(`Confirma a venda de seu item: **${NomedoItem}** por: **${Format(DinheiroQuant)}**?`);
  
            const RowVendas = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("sim").setStyle(ButtonStyle.Success).setEmoji(emoji.positivo || '✅'),
              new ButtonBuilder().setCustomId("nao").setStyle(ButtonStyle.Danger).setEmoji(emoji.negativo || '❌'),
            );
  
            let msg2 = await interaction.followUp({ embeds: [EmbedVenda], components: [RowVendas] });
            const Colletor1 = msg2.createMessageComponentCollector({ filter: filtro, time: 30000 });
  
            Colletor1.on('collect', async (i) => {
              await i.deferUpdate();
              if (i.customId === 'sim') {
                await Store(Diretório, Variável, Diretório === DB_EQUIP ? 1 : 2, false, Quantt, NomedoItem, DinheiroQuant, 0, Transação);
                msg2.delete().catch(() => {});
              } else {
                msg2.delete().catch(() => {});
                await interaction.followUp({ content: `Venda cancelada com sucesso.`, ephemeral: true });
              }
            });
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