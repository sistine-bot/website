// market/index.js
const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const cc = require('coupon-code');

const choices = require('../../../src/utils/market/choices');
const { CANVAS, LIMITS } = require('../../../src/utils/market/constants');
const { getRandomItems } = require('../../../src/utils/market/utils');
const { createMarketNavigationButtons, createConfirmationRow } = require('../../../src/utils/market/buttons');
const { generateMarketCanvas } = require('../../../src/utils/market/canvas');
const dbLayer = require('../../../src/utils/market/database');

const { Format, getUserMoney, getUserInventory, NumberConvert, UpdateMoneyWallet } = require('../../../src/utils/functions.js');
const itemsApi = require('../../utils/itens.json');

module.exports = {
  "name": "market",
  "description": `⌊💸 Economia⌉ Veja informações sobre seu casamento.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "local",
      "description": "⌊💸 Economia⌉ Veja itens a venda no servidor.",
      "type": ApplicationCommandType.ChatInput,
    },
    {
      "name": "global",
      "description": "⌊💸 Economia⌉ Veja todos os itens a venda.",
      "type": ApplicationCommandType.ChatInput,
    },
    {
      "name": "vender",
      "description": "⌊💸 Economia⌉ Venda itens que você possui no inventário.",
      "type": ApplicationCommandType.ChatInput,
      "options": [
        {
          "name": "escolha",
          "description": "Selecione o item que deseja vender.",
          "type": ApplicationCommandOptionType.String,
          "required": true,
          "choices": choices
        },
        {
          "name": "preço",
          "type": ApplicationCommandOptionType.String,
          "description": "Por quanto deseja vender este item",
          "required": true,
        },
        {
          "name": "quantia",
          "type": ApplicationCommandOptionType.String,
          "description": "quantos itens por a venda",
          "required": true,
        },
      ],
    },
    {
      "name": "inventário",
      "description": "⌊💸 Economia⌉ Veja os itens que você possui a venda.",
      "type": ApplicationCommandType.ChatInput,
    },
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'global':
        case 'local':
          await handleViewMarket(interaction, database, subcommand, emoji);
          break;
        case 'inventário':
          await handleUserInventory(interaction, database, color, emoji);
          break;
        case 'vender':
          await handleSellItem(interaction, database, color);
          break;
        default:
          return interaction.error({ content: 'Subcomando inválido ou não reconhecido.' });
      }
    } catch (error) {
      console.error('Erro crítico na execução do comando Market:', error);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.error({ content: 'Ocorreu um erro inesperado ao executar este comando.' });
      }
    }
  }
};

// ==========================================
// SUBMANIPULADORES (HANDLERS)
// ==========================================

async function handleViewMarket(interaction, database, mode, emojiMap) {
  try {
    const isLocal = (mode === 'local');
    const allItems = await dbLayer.getMarketItems(database);
    
    const filteredItems = isLocal 
      ? allItems.filter(item => item.servidor === interaction.guild.id) 
      : allItems;

    const selectedItems = getRandomItems(filteredItems, Math.min(filteredItems.length, CANVAS.MAX_DISPLAY_ITEMS));
    const actionRows = createMarketNavigationButtons(selectedItems, emojiMap);

    const attachment = await generateMarketCanvas(selectedItems, isLocal);

    const marketMessage = await interaction.followUp({ files: [attachment], components: actionRows });
    const collector = marketMessage.createMessageComponentCollector({ 
      filter: click => click.user.id === interaction.user.id,
      time: 60000 
    });

    collector.on('collect', async (componentInteraction) => {
      try {
        await componentInteraction.deferUpdate();
        const itemIndex = Number(componentInteraction.customId) - 1;
        if (isNaN(itemIndex) || !selectedItems[itemIndex]) return;

        const selectedItem = selectedItems[itemIndex];
        const itemInfo = itemsApi[selectedItem.db];

        // Re-checagem de segurança no banco de dados para evitar Race Conditions (Duplo clique)
        const currentItems = await dbLayer.getMarketItems(database);
        const itemInDb = currentItems.find(i => i.id === selectedItem.id);

        if (itemInDb.dono == interaction.user.id) {
          return interaction.error({ content: "Você não pode comprar seu proprio item" })
        }

        if (!itemInDb) {
          return interaction.error({ content: 'Este item foi removido da loja ou já foi adquirido!' });
        }

        const { carteira } = await getUserMoney(interaction.user);
        if (carteira < Number(itemInDb.preço)) {
          return interaction.error({ content: 'Você não possui dinheiro o suficiente para comprar este item.' });
        }

        const confirmationRow = createConfirmationRow(emojiMap);
        const sellerUser = interaction.client.users.cache.get(selectedItem.dono);

        const buyEmbed = new EmbedBuilder()
          .setColor(interaction.color?.embed || '#0099ff')
          .setDescription(`Você deseja comprar **${(itemInfo.tipo == 2) ? `${selectedItem.quantia} ${selectedItem.nome}'s` : `${selectedItem.nome}`}** por: **${Format(selectedItem.preço, 'R$')}** de: ${sellerUser ? `${sellerUser.username}` : 'Usuário não encontrado'}`);

        const confirmationMessage = await interaction.followUp({ embeds: [buyEmbed], components: [confirmationRow] });
        const confirmationCollector = confirmationMessage.createMessageComponentCollector({ 
          filter: c => c.user.id === interaction.user.id, 
          max: 1, 
          time: 30000 
        });

        confirmationCollector.on('collect', async (confirmInteraction) => {
          try {
            await confirmInteraction.deferUpdate();
            if (confirmInteraction.customId === 'confirmar') {
              await confirmationMessage.delete().catch(() => {});

              // Transação Atômica Re-executada na Confirmação
              const freshItemsList = await dbLayer.getMarketItems(database);
              const freshItemDb = freshItemsList.find(i => i.id === selectedItem.id);

              if (freshItemDb.dono == interaction.user.id) {
                return interaction.error({ content: "Você não pode comprar seu proprio item" })
              }

              if (!freshItemDb) return interaction.error({ content: 'Este item não está mais disponível.' });

              const { carteira: freshWallet } = await getUserMoney(interaction.user);
              if (freshWallet < Number(freshItemDb.preço)) return interaction.error({ content: 'Saldo insuficiente.' });

              // Remove o item da lista global do mercado
              const updatedMarketList = freshItemsList.filter(i => i.id !== freshItemDb.id);
              await dbLayer.updateMarketItems(database, updatedMarketList);

              // Atualiza Finanças do Comprador
              await UpdateMoneyWallet(interaction, interaction.user, '-', freshItemDb.preço, `{emoji.saida} {mensagem.market.buy} | ${selectedItem.preço} | ${(selectedItem.tipo > 1) ? `${freshItemDb.quantia} ${freshItemDb.nome[0]}'s` : `${freshItemDb.nome[0]}`}`);

              // Atualiza a finanças de quem vendeu o item
              await UpdateMoneyWallet(interaction, client.users.cache.get(freshItemDb.dono), '+', freshItemDb.preço, `{emoji.saida} {mensagem.market.sell} | ${selectedItem.preço} | ${(selectedItem.tipo > 1) ? `${freshItemDb.quantia} ${freshItemDb.nome[0]}'s` : `${freshItemDb.nome[0]}`}`)

              // Incrementa item no inventário do Comprador
              const currentInventoryCount = await dbLayer.getUserInventoryItem(database, interaction.user.id, selectedItem.db, itemInfo.db);
              await dbLayer.updateUserInventoryItem(database, interaction.user.id, selectedItem.db, itemInfo.db, currentInventoryCount + Number(freshItemDb.quantia));

              return interaction.positivo({ content: `Você comprou: **${(selectedItem.quantia > 1) ? `${selectedItem.quantia} ${selectedItem.nome}'s` : `${selectedItem.nome}`}** por: **${Format(freshItemDb.preço, 'R$')}**` });
            } else {
              await confirmationMessage.delete().catch(() => {});
              return interaction.positivo({ content: 'Compra cancelada com sucesso.' });
            }
          } catch (err) {
            console.error('Erro na confirmação da compra:', err);
          }
        });

      } catch (collectError) {
        console.error('Erro ao processar clique no item do mercado:', collectError);
      }
    });

  } catch (err) {
    console.error('Erro no fluxo de visualização do mercado:', err);
    return interaction.error({ content: `Ocorreu um erro ao carregar o marketplace\n${err.message}` });
  }
}

async function handleUserInventory(interaction, database, color, emojiMap) {
  try {
    const marketItems = await dbLayer.getMarketItems(database);
    const userMarketItems = marketItems.filter(item => item.dono === interaction.user.id);

    const actionRows = createMarketNavigationButtons(userMarketItems, emojiMap);
    let displayCounter = 1;

    const inventoryEmbed = new EmbedBuilder()
      .setColor(color.embed)
      .setDescription(`**Seus itens a venda:**\n> Clique em um item para remove-lo do market\n\n${userMarketItems.map(item => `${emojiMap[displayCounter++]} <@${item.dono}> ${item.quantia} ${item.nome} - **${Format(item.preço, 'R$')}**`).join('\n')}`);

    const inventoryMessage = await interaction.followUp({ embeds: [inventoryEmbed], components: actionRows });
    const collector = inventoryMessage.createMessageComponentCollector({ 
      filter: x => x.user.id === interaction.user.id,
      time: 60000
    });

    collector.on('collect', async (componentInteraction) => {
      try {
        await componentInteraction.deferUpdate();
        const selectedIndex = Number(componentInteraction.customId) - 1;
        if (isNaN(selectedIndex) || !userMarketItems[selectedIndex]) return;

        const selectedItem = userMarketItems[selectedIndex];

        const currentMarketItems = await dbLayer.getMarketItems(database);
        const itemTarget = currentMarketItems.find(i => i.id === selectedItem.id);
        if (!itemTarget) return;

        const cleanMarketList = currentMarketItems.filter(i => i.id !== itemTarget.id);
        await dbLayer.updateMarketItems(database, cleanMarketList);

        const fullInventory = await getUserInventory(interaction.user);
        if (selectedItem.db === 'arma' && fullInventory[selectedItem.db].item > 1) {
          return interaction.error({ content: 'Você já possui uma arma no inventário.' });
        }

        const itemInfo = itemsApi[selectedItem.db];
        const fallbackQuantity = (selectedItem.db === 'arma' && fullInventory[selectedItem.db].item) ? fullInventory[selectedItem.db].item : fullInventory[selectedItem.db];

        await dbLayer.updateUserInventoryItem(database, interaction.user.id, selectedItem.db, itemInfo.db, Number(fallbackQuantity) + Number(selectedItem.quantia));

        return interaction.positivo({ content: `Você removeu **${selectedItem.quantia} ${selectedItem.nome}** do seu inventário do market.` });
      } catch (err) {
        console.error('Erro ao remover item do inventário do market:', err);
      }
    });

  } catch (error) {
    console.error('Erro no subset handleUserInventory:', error);
  }
}

async function handleSellItem(interaction, database, color) {
  try {
    const itemDbKey = interaction.options.getString('escolha');
    const inputQuantity = interaction.options.getString('quantia');
    const inputPriceRaw = interaction.options.getString('preço');

    // Validação estrita de tipos e sanidade numérica
    const parsedPrice = await NumberConvert(inputPriceRaw);
    const parsedQuantity = Number(inputQuantity);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return interaction.error({ content: `\`${inputPriceRaw}\` não é um preço/número de moedas válido.` });
    }
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return interaction.error({ content: `\`${inputQuantity}\` não é uma quantidade válida.` });
    }
    
    const itemConfig = itemsApi[itemDbKey];
    if (parsedPrice < itemConfig.valor) {
      return interaction.error({ content: `O valor mínimo para vender ${itemDbKey} é **${Format(itemConfig.valor, 'R$')}**` });
    }

    const userInventory = await getUserInventory(interaction.user);

    // Validação de Posse de Inventário
    if (itemDbKey === 'arma') {
      if (!userInventory.arma || userInventory.arma.item !== parsedQuantity) {
        return interaction.error({ content: `Para vender sua arma, a quantia deve ser exatamente: **${userInventory.arma?.item || 0}**` });
      }
    } else {
      if (!userInventory[itemDbKey] || parsedQuantity > userInventory[itemDbKey]) {
        return interaction.error({ content: 'Você não possui este item ou a quantidade solicitada para poder vender.' });
      }
      if (itemConfig.tipo == 1 && parsedQuantity > 1) {
        return interaction.error({ content: 'Este item é único, a quantidade máxima deve ser **1**.' });
      }
    }

    const marketItems = await dbLayer.getMarketItems(database);
    const userActiveListings = marketItems.filter(i => i.dono === interaction.user.id);
    
    if (userActiveListings.length >= LIMITS.MAX_MARKET_ITEMS_PER_USER) {
      return interaction.error({ content: `Você já atingiu o limite máximo de ${LIMITS.MAX_MARKET_ITEMS_PER_USER} itens ativos no mercado.` });
    }

    const generatedUid = cc.generate({ parts: 3 });
    const itemDisplayName = (itemDbKey === 'arma') 
      ? itemConfig[userInventory.arma.item].nome 
      : (parsedQuantity > 1 ? itemConfig.nome[1] : itemConfig.nome[0]);

    // Registro do item no snapshot local e envio sincronizado
    marketItems.push({
      nome: itemDisplayName,
      dono: interaction.user.id,
      preço: parsedPrice,
      quantia: parsedQuantity,
      servidor: interaction.guild.id,
      db: itemDbKey,
      id: generatedUid,
    });

    await dbLayer.updateMarketItems(database, marketItems);

    // Dedução de itens do Inventário do Usuário
    const rawCount = (userInventory[itemDbKey].item > 0) ? userInventory[itemDbKey].item : userInventory[itemDbKey];
    const computedNewInventoryAmount = Number(rawCount) - parsedQuantity;

    await dbLayer.updateUserInventoryItem(database, interaction.user.id, itemDbKey, itemConfig.db, computedNewInventoryAmount);

    const formattedMessageString = (parsedQuantity > 1) ? `${parsedQuantity} ${itemDisplayName}` : `um(a) ${itemDisplayName}`;
    const outputEmbed = new EmbedBuilder()
      .setColor(color.embed)
      .setDescription(`Você colocou **${formattedMessageString}** no valor de: **${Format(parsedPrice, 'R$')}** para vender.`);

    return interaction.followUp({ embeds: [outputEmbed] });

  } catch (error) {
    console.error('Erro no fluxo de venda do item:', error);
    return interaction.error({ content: 'Ocorreu um erro inesperado ao tentar processar a listagem de venda.' });
  }
}