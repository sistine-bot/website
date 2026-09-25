const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { UpdateMoneyWallet, Format } = require('../../utils/functions.js');
const itensAPI = require('../../utils/itens.json');

// ============================================================================
// HELPER: COTAÇÃO E METADADOS DOS ITENS
// ============================================================================

function getItemSellInfo(key, rawVal) {
  if (key.startsWith('semente_')) {
    const info = itensAPI[key];
    const nome = Array.isArray(info?.nome) ? info.nome[0] : (info?.nome || key);
    const unitPrice = Math.floor((info?.valor || 0) / 2);
    return {
      name: nome,
      category: 'semente',
      emoji: '🌱',
      unitPrice,
      isEquipment: false
    };
  }

  // Colheitas de qualidade: ex Trigo_excelente, Milho_bom, etc.
  if (key.includes('_excelente') || key.includes('_bom') || key.includes('_ruim')) {
    const info = itensAPI[key];
    const nome = Array.isArray(info?.nome) ? info.nome[0] : (info?.nome || key);
    const unitPrice = info?.valor || 0;
    let emoji = '🌾';
    if (key.startsWith('Trigo')) emoji = '🌾';
    else if (key.startsWith('Milho')) emoji = '🌽';
    else if (key.startsWith('Feijão')) emoji = '🫘';
    else if (key.startsWith('CanaDeAçucar')) emoji = '🎋';
    else if (key.startsWith('Cenoura')) emoji = '🥕';
    else if (key.startsWith('Abóbora')) emoji = '🎃';

    return {
      name: nome,
      category: 'recurso',
      emoji,
      unitPrice,
      isEquipment: false
    };
  }

  // Itens de produção básica (pesca, rancho, caça, colheita base)
  const producerItems = {
    peixe: { emoji: '🐟', name: 'Peixe' },
    carne: { emoji: '🥩', name: 'Carne' },
    Ovo: { emoji: '🥚', name: 'Ovo' },
    Leite: { emoji: '🥛', name: 'Leite' },
    Bacon: { emoji: '🥓', name: 'Bacon' },
    planta_podre: { emoji: '🥀', name: 'Planta Podre' },
    Trigo: { emoji: '🌾', name: 'Trigo' },
    Milho: { emoji: '🌽', name: 'Milho' },
    Feijão: { emoji: '🫘', name: 'Feijão' },
    CanaDeAçucar: { emoji: '🎋', name: 'Cana-de-açúcar' },
    Cenoura: { emoji: '🥕', name: 'Cenoura' },
    Abóbora: { emoji: '🎃', name: 'Abóbora' }
  };

  if (producerItems[key]) {
    const info = itensAPI[key];
    const nome = Array.isArray(info?.nome) ? info.nome[0] : (info?.nome || producerItems[key].name);
    const unitPrice = info?.valor || 0;
    return {
      name: nome,
      category: 'recurso',
      emoji: producerItems[key].emoji,
      unitPrice,
      isEquipment: false
    };
  }

  // Demais consumíveis registrados
  const info = itensAPI[key];
  if (info && info.valor) {
    const nome = Array.isArray(info.nome) ? info.nome[0] : (info.nome || key);
    return {
      name: nome,
      category: 'consumivel',
      emoji: '📦',
      unitPrice: Math.floor(info.valor / 2),
      isEquipment: false
    };
  }

  return null;
}

function getEquipSellInfo(key, rawVal) {
  if (!rawVal) return null;
  const count = typeof rawVal === 'object' ? (rawVal.item || 0) : rawVal;
  if (count <= 0) return null;

  // 1. ARMAS DE FOGO (Glock, MP5, M4-A1, Ak-47)
  if (key === 'arma') {
    const tier = typeof rawVal === 'object' ? (rawVal.item || 1) : rawVal;
    const armaConfig = itensAPI.arma?.[tier] || {};
    const nome = Array.isArray(armaConfig.nome) ? armaConfig.nome[0] : (armaConfig.nome || `Arma Tier ${tier}`);
    const valorOriginal = armaConfig.valor || 0;
    const baseSellPrice = Math.floor(valorOriginal / 2);

    const maxXp = 100;
    const currentXp = typeof rawVal.Xp === 'number' ? rawVal.Xp : 100;
    const durabilityRatio = Math.max(0, Math.min(maxXp, currentXp)) / maxXp;
    const unitPrice = Math.floor(baseSellPrice * durabilityRatio);

    return {
      name: `Arma (${nome})`,
      category: 'equipamento',
      emoji: '🔫',
      unitPrice,
      baseSellPrice,
      quantity: 1,
      isEquipment: true,
      isDurable: true,
      isStarter: false,
      toolType: 'arma',
      currentXp,
      maxXp,
      durabilityPercent: Math.round(durabilityRatio * 100),
      durabilityText: `${currentXp}% durabilidade`
    };
  }

  // 2. ARMA DE CAÇA
  if (key === 'armacaça') {
    const nome = Array.isArray(itensAPI.armacaça?.nome) ? itensAPI.armacaça.nome[0] : 'Arma de Caça';
    const valorOriginal = itensAPI.armacaça?.valor || 8000;
    const baseSellPrice = Math.floor(valorOriginal / 2);

    const maxXp = 100;
    const currentXp = typeof rawVal.Xp === 'number' ? rawVal.Xp : 100;
    const durabilityRatio = Math.max(0, Math.min(maxXp, currentXp)) / maxXp;
    const unitPrice = Math.floor(baseSellPrice * durabilityRatio);

    return {
      name: nome,
      category: 'equipamento',
      emoji: '🏹',
      unitPrice,
      baseSellPrice,
      quantity: 1,
      isEquipment: true,
      isDurable: true,
      isStarter: false,
      toolType: 'armacaça',
      currentXp,
      maxXp,
      durabilityPercent: Math.round(durabilityRatio * 100),
      durabilityText: `${currentXp}% durabilidade`
    };
  }

  // 3. VARA DE PESCA (Bambu vs Ferro)
  if (key === 'vara') {
    const isBambu = (typeof rawVal === 'object' && (rawVal.tipo === 'bambu' || String(rawVal.nome).toLowerCase().includes('bambu') || rawVal.reparavel === false));
    const nome = isBambu ? 'Vara de Bambu' : (Array.isArray(itensAPI.vara?.nome) ? itensAPI.vara.nome[0] : 'Vara de Pescar');

    let baseSellPrice, maxXp, currentXp;
    if (isBambu) {
      baseSellPrice = 100; // Itens do kit inicial vendidos por 100
      maxXp = 8;
      currentXp = typeof rawVal.Xp === 'number' ? rawVal.Xp : 8;
    } else {
      baseSellPrice = Math.floor((itensAPI.vara?.valor || 2000) / 2); // 1.000
      maxXp = 100;
      currentXp = typeof rawVal.Xp === 'number' ? rawVal.Xp : 100;
    }

    const durabilityRatio = Math.max(0, Math.min(maxXp, currentXp)) / maxXp;
    const unitPrice = Math.floor(baseSellPrice * durabilityRatio);

    return {
      name: nome,
      category: 'equipamento',
      emoji: isBambu ? '🎋' : '🎣',
      unitPrice,
      baseSellPrice,
      quantity: 1,
      isEquipment: true,
      isDurable: true,
      isStarter: isBambu,
      toolType: 'vara',
      currentXp,
      maxXp,
      durabilityPercent: Math.round(durabilityRatio * 100),
      durabilityText: isBambu ? `${currentXp}/${maxXp} usos` : `${currentXp}% durabilidade`
    };
  }

  // 4. ENXADA (Madeira vs Ferro)
  if (key === 'enxada') {
    const isMadeira = (typeof rawVal === 'object' && (rawVal.tipo === 'madeira' || String(rawVal.nome).toLowerCase().includes('madeira') || rawVal.reparavel === false));
    const nome = isMadeira ? 'Enxada de Madeira' : (Array.isArray(itensAPI.enxada?.nome) ? itensAPI.enxada.nome[0] : 'Enxada de Ferro');

    let baseSellPrice, maxXp, currentXp;
    if (isMadeira) {
      baseSellPrice = 100; // Itens do kit inicial vendidos por 100
      maxXp = 12;
      currentXp = typeof rawVal.Xp === 'number' ? rawVal.Xp : 12;
    } else {
      baseSellPrice = Math.floor((itensAPI.enxada?.valor || 3000) / 2); // 1.500
      maxXp = 100;
      currentXp = typeof rawVal.Xp === 'number' ? rawVal.Xp : 100;
    }

    const durabilityRatio = Math.max(0, Math.min(maxXp, currentXp)) / maxXp;
    const unitPrice = Math.floor(baseSellPrice * durabilityRatio);

    return {
      name: nome,
      category: 'equipamento',
      emoji: '⛏️',
      unitPrice,
      baseSellPrice,
      quantity: 1,
      isEquipment: true,
      isDurable: true,
      isStarter: isMadeira,
      toolType: 'enxada',
      currentXp,
      maxXp,
      durabilityPercent: Math.round(durabilityRatio * 100),
      durabilityText: isMadeira ? `${currentXp}/${maxXp} usos` : `${currentXp}% durabilidade`
    };
  }

  // 5. REGADOR (Plástico vs Ferro)
  if (key === 'regador') {
    const isPlastico = (typeof rawVal === 'object' && (rawVal.tipo === 'plastico' || String(rawVal.nome).toLowerCase().includes('plástico') || rawVal.reparavel === false));
    const nome = isPlastico ? 'Regador de Plástico' : (Array.isArray(itensAPI.regador?.nome) ? itensAPI.regador.nome[0] : 'Regador de Ferro');

    let baseSellPrice, maxXp, currentXp;
    if (isPlastico) {
      baseSellPrice = 100; // Itens do kit inicial vendidos por 100
      maxXp = 15;
      currentXp = typeof rawVal.Xp === 'number' ? rawVal.Xp : 15;
    } else {
      baseSellPrice = Math.floor((itensAPI.regador?.valor || 3500) / 2); // 1.750
      maxXp = 100;
      currentXp = typeof rawVal.Xp === 'number' ? rawVal.Xp : 100;
    }

    const durabilityRatio = Math.max(0, Math.min(maxXp, currentXp)) / maxXp;
    const unitPrice = Math.floor(baseSellPrice * durabilityRatio);

    return {
      name: nome,
      category: 'equipamento',
      emoji: '🚿',
      unitPrice,
      baseSellPrice,
      quantity: 1,
      isEquipment: true,
      isDurable: true,
      isStarter: isPlastico,
      toolType: 'regador',
      currentXp,
      maxXp,
      durabilityPercent: Math.round(durabilityRatio * 100),
      durabilityText: isPlastico ? `${currentXp}/${maxXp} usos` : `${currentXp}% durabilidade`
    };
  }

  // 6. ANEL DE CASAMENTO (Item Permanente sem durabilidade)
  if (key === 'anelcasamento') {
    const nome = Array.isArray(itensAPI.anelcasamento?.nome) ? itensAPI.anelcasamento.nome[0] : 'Anel de Casamento';
    const unitPrice = Math.floor((itensAPI.anelcasamento?.valor || 2500) / 2);
    return {
      name: nome,
      category: 'equipamento',
      emoji: '💍',
      unitPrice,
      baseSellPrice: unitPrice,
      quantity: 1,
      isEquipment: true,
      isDurable: false,
      isStarter: false
    };
  }

  // 7. PORTE DE ARMAS (Item Permanente sem durabilidade)
  if (key === 'porte') {
    const nome = Array.isArray(itensAPI.porte?.nome) ? itensAPI.porte.nome[0] : 'Porte de Armas';
    const unitPrice = Math.floor((itensAPI.porte?.valor || 15000) / 2);
    return {
      name: nome,
      category: 'equipamento',
      emoji: '📜',
      unitPrice,
      baseSellPrice: unitPrice,
      quantity: 1,
      isEquipment: true,
      isDurable: false,
      isStarter: false
    };
  }

  return null;
}

// ============================================================================
// CARREGAMENTO EM TEMPO REAL DO INVENTÁRIO DO USUÁRIO
// ============================================================================

async function loadSellableInventory(userId, database) {
  const DB_BASE = `economia/${userId}`;
  const [snapConsum, snapEquip, snapSaldo] = await Promise.all([
    database.ref(`${DB_BASE}/inventario/itens/Consumíveis`).once('value'),
    database.ref(`${DB_BASE}/inventario/itens/Equipamentos`).once('value'),
    database.ref(`${DB_BASE}/saldo`).once('value')
  ]);

  const consum = snapConsum.val() || {};
  const equip = snapEquip.val() || {};
  const saldo = snapSaldo.val() || {};
  const carteira = saldo.carteira || 0;

  const items = [];

  // 1. Processa consumíveis
  for (const [key, val] of Object.entries(consum)) {
    if (typeof val === 'number' && val > 0) {
      const info = getItemSellInfo(key, val);
      if (info && info.unitPrice > 0) {
        items.push({
          id: `consum_${key}`,
          dbPath: `${DB_BASE}/inventario/itens/Consumíveis`,
          dbKey: key,
          quantity: val,
          totalPrice: info.unitPrice * val,
          ...info
        });
      }
    }
  }

  // 2. Processa equipamentos (inclui ferramentas mesmo com 0% para exibir aviso de reparo)
  for (const key of Object.keys(equip)) {
    const val = equip[key];
    const info = getEquipSellInfo(key, val);
    if (info && info.unitPrice >= 0) {
      items.push({
        id: `equip_${key}`,
        dbPath: `${DB_BASE}/inventario/itens/Equipamentos`,
        dbKey: key,
        totalPrice: info.unitPrice * info.quantity,
        ...info
      });
    }
  }

  // Ordenação: Recursos (colheitas/peixes) -> Sementes -> Consumíveis -> Equipamentos
  const categoryOrder = { recurso: 1, semente: 2, consumivel: 3, equipamento: 4 };
  items.sort((a, b) => {
    if (categoryOrder[a.category] !== categoryOrder[b.category]) {
      return (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
    }
    return b.totalPrice - a.totalPrice;
  });

  return { items, carteira };
}

// ============================================================================
// EXECUÇÃO DE VENDA ATÔMICA
// ============================================================================

async function executeSale(item, qtyToSell, userId, interaction, database) {
  const totalEarned = item.unitPrice * qtyToSell;

  if (item.isEquipment) {
    await database.ref(item.dbPath).update({ [item.dbKey]: null });
  } else {
    const snap = await database.ref(item.dbPath).child(item.dbKey).once('value');
    const currentQty = snap.val() || 0;
    const newQty = currentQty - qtyToSell;
    if (newQty <= 0) {
      await database.ref(item.dbPath).update({ [item.dbKey]: null });
    } else {
      await database.ref(item.dbPath).update({ [item.dbKey]: newQty });
    }
  }

  if (totalEarned > 0) {
    await UpdateMoneyWallet(
      interaction,
      interaction.user,
      '+',
      totalEarned,
      {
        type: 'loja_vendas',
        amount: totalEarned,
        item: `${qtyToSell > 1 ? `${qtyToSell}x ` : ''}${item.name}`
      }
    );
  }

  return totalEarned;
}

async function executeMassResourceSale(resourceItems, userId, interaction, database) {
  let totalEarned = 0;
  let totalCount = 0;
  const updates = {};

  for (const res of resourceItems) {
    totalEarned += res.totalPrice;
    totalCount += res.quantity;
    updates[res.dbKey] = null;
  }

  await database.ref(`economia/${userId}/inventario/itens/Consumíveis`).update(updates);

  await UpdateMoneyWallet(
    interaction,
    interaction.user,
    '+',
    totalEarned,
    {
      type: 'loja_vendas',
      amount: totalEarned,
      item: `Liquidação de Recursos (${totalCount}x)`
    }
  );

  return { totalEarned, totalCount };
}

// ============================================================================
// CONSTRUTORES DE INTERFACE GRÁFICA (EMBEDS E COMPONENTES)
// ============================================================================

function buildMainEmbed(client, interaction, items, carteira, lastSaleAlert, color, page, maxPages) {
  const totalValue = items.reduce((acc, it) => acc + it.totalPrice, 0);
  const totalUnits = items.reduce((acc, it) => acc + it.quantity, 0);

  let desc = '';

  if (lastSaleAlert) {
    desc += `🔔 **Última Venda Realizada:**\n` +
            `> ✅ Você vendeu **${lastSaleAlert.qty}x ${lastSaleAlert.name}** e recebeu **+${lastSaleAlert.payout}**!\n\n`;
  }

  if (items.length === 0) {
    desc += `📦 **Seu inventário não possui itens disponíveis para venda no momento.**\n\n` +
            `• 🌾 Cultive e colha produtos agrícolas no comando \`/plantação\`\n` +
            `• 🐄 Crie animais e colete leite/ovos/bacon no comando \`/fazenda\`\n` +
            `• 🎣 Desbrave as profundezas e pesque peixes no comando \`/pescar\`\n\n` +
            `*Assim que colher ou adquirir novos recursos, use \`/vender\` para lucrar!*`;
  } else {
    desc += `Escolha qualquer item abaixo no menu para vender com cotação imediata do servidor.\n` +
            `*Você pode vender múltiplos itens seguidos sem fechar esta janela!*\n\n` +
            `💰 **Sua Carteira:** **${Format(carteira)}**\n` +
            `📦 **Itens em Estoque:** **${totalUnits} unidades** (${items.length} tipos)\n` +
            `💵 **Valor Total Estimado:** **${Format(totalValue)}**` +
            (maxPages > 1 ? `\n📄 **Página:** \`${page}/${maxPages}\`` : '');
  }

  return new EmbedBuilder()
    .setColor(color.embed || '#10b981')
    .setAuthor({
      name: `${client.user.username} • Balcão de Vendas`,
      iconURL: client.user.displayAvatarURL({ size: 1024 })
    })
    .setTitle('🛒 Balcão de Vendas do Inventário')
    .setDescription(desc)
    .setFooter({
      text: `Sistine Economia • Escolha um item para vender imediatamente`,
      iconURL: interaction.guild?.iconURL() || undefined
    })
    .setTimestamp();
}

function buildSelectMenu(items, page = 1) {
  const startIndex = (page - 1) * 25;
  const pageItems = items.slice(startIndex, startIndex + 25);

  const menu = new StringSelectMenuBuilder()
    .setCustomId('vender_select_item')
    .setPlaceholder('📦 Selecione um item do inventário para vender...');

  for (const it of pageItems) {
    let label = `${it.quantity}x ${it.name}`;
    let desc = '';

    if (it.isEquipment) {
      if (it.isDurable) {
        label = `${it.name} (${it.durabilityText})`;
        if (it.unitPrice > 0) {
          desc = `Receba ${Format(it.unitPrice)} (${it.durabilityPercent}% durabilidade)`;
        } else {
          desc = `0 Moedas (⚠️ Quebrado • Conserte no /recuperar)`;
        }
      } else {
        label = `${it.name}`;
        desc = `Receba ${Format(it.unitPrice)} (Equipamento Permanente)`;
      }
    } else {
      desc = `Receba ${Format(it.totalPrice)} (${Format(it.unitPrice)} un.)`;
    }

    menu.addOptions({
      label: label.slice(0, 100),
      description: desc.slice(0, 100),
      emoji: it.emoji,
      value: it.id
    });
  }

  return new ActionRowBuilder().addComponents(menu);
}

function buildMainButtons(items, page, maxPages) {
  const rows = [];
  const buttons = [];

  const recursos = items.filter(i => i.category === 'recurso' && i.totalPrice > 0);
  if (recursos.length > 0) {
    const totalRecursosVal = recursos.reduce((sum, r) => sum + r.totalPrice, 0);
    buttons.push(
      new ButtonBuilder()
        .setCustomId('vender_mass_resources')
        .setLabel(`Vender Todos Recursos (+${Format(totalRecursosVal)})`)
        .setEmoji('⚡')
        .setStyle(ButtonStyle.Success)
    );
  }

  if (maxPages > 1) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId('vender_page_prev')
        .setLabel('Anterior')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 1)
    );
    buttons.push(
      new ButtonBuilder()
        .setCustomId('vender_page_next')
        .setLabel('Próxima')
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= maxPages)
    );
  }

  buttons.push(
    new ButtonBuilder()
      .setCustomId('vender_close')
      .setLabel('Fechar')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Secondary)
  );

  rows.push(new ActionRowBuilder().addComponents(buttons));
  return rows;
}

function buildConfirmEmbed(item, color) {
  let details = `• **Item:** ${item.emoji} **${item.name}**\n` +
                `• **Quantidade em estoque:** \`${item.quantity} unidade(s)\`\n`;

  if (item.isEquipment) {
    if (item.isDurable) {
      details += `• **Durabilidade Atual:** \`${item.durabilityText}\` (${item.durabilityPercent}%)\n` +
                 `• **Cotação Base (100%):** **${Format(item.baseSellPrice)}**\n` +
                 `• **Valor Atual com Desgaste:** **${item.unitPrice > 0 ? Format(item.unitPrice) : '0 Moedas (⚠️ Sem valor comercial)'}**\n`;

      if (item.isStarter) {
        details += `\n🎁 *Item do Kit Inicial com cotação base de 100 moedas, reduzida proporcionalmente aos usos restantes.*`;
      } else if (item.durabilityPercent < 100) {
        const lossAmount = item.baseSellPrice - item.unitPrice;
        details += `\n⚠️ **Desvalorização por Desgaste:** Este equipamento perdeu **-${Format(lossAmount)}** do valor de venda por estar com **${item.durabilityPercent}%** de durabilidade!\n` +
                   `🛠️ **Dica Econômica:** Em vez de vender desvalorizado, use o comando \`/recuperar\` para restaurar sua durabilidade para 100% e recuperar o valor total de **${Format(item.baseSellPrice)}**!`;
      }
    } else {
      details += `• **Preço de Venda:** **${Format(item.unitPrice)}**\n`;
    }
  } else {
    details += `• **Preço Unitário:** **${Format(item.unitPrice)}**\n` +
               `• **Valor Total (Tudo):** **${Format(item.totalPrice)}**\n`;
  }

  const isEquipWarning = item.isEquipment && !item.isStarter
    ? `\n\n⚠️ **Atenção:** Equipamentos vendidos deverão ser recomprados pelo preço integral na \`/loja itens\` caso deseje utilizá-los novamente.`
    : '';

  const embedColor = item.isEquipment && item.durabilityPercent <= 15 ? '#ef4444' : (color.embed || '#10b981');

  return new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(`💰 Confirmar Venda: ${item.name}`)
    .setDescription(
      `Confira os dados da cotação antes de confirmar a venda:\n\n` +
      details +
      isEquipWarning +
      `\n\n*Clique no botão abaixo para concluir a operação:*`
    );
}

function buildConfirmButtons(item) {
  const buttons = [];

  const sellAllLabel = item.unitPrice > 0
    ? `Vender Tudo (${item.quantity}x) — ${Format(item.totalPrice)}`
    : `Descartar sem valor (0 Moedas)`;

  buttons.push(
    new ButtonBuilder()
      .setCustomId(`vender_exec_all:${item.id}`)
      .setLabel(sellAllLabel.slice(0, 80))
      .setEmoji(item.unitPrice > 0 ? '💰' : '🗑️')
      .setStyle(item.unitPrice > 0 ? ButtonStyle.Success : ButtonStyle.Danger)
  );

  if (!item.isEquipment && item.quantity > 1) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`vender_exec_one:${item.id}`)
        .setLabel(`Vender 1x — ${Format(item.unitPrice)}`)
        .setEmoji('🪙')
        .setStyle(ButtonStyle.Primary)
    );
  }

  buttons.push(
    new ButtonBuilder()
      .setCustomId('vender_back')
      .setLabel('Voltar')
      .setEmoji('↩️')
      .setStyle(ButtonStyle.Secondary)
  );

  return [new ActionRowBuilder().addComponents(buttons)];
}

function buildMassConfirmEmbed(recursos, totalVal, totalCount, color) {
  const preview = recursos.slice(0, 10).map(r => `• ${r.emoji} **${r.name}:** ${r.quantity}x (*+${Format(r.totalPrice)}*)`).join('\n');
  const remaining = recursos.length > 10 ? `\n*...e mais ${recursos.length - 10} outros tipos de itens.*` : '';

  return new EmbedBuilder()
    .setColor('#f59e0b')
    .setTitle('⚡ Confirmação de Venda Geral de Recursos')
    .setDescription(
      `Você está prestes a vender **todos os seus produtos de agricultura, pesca e animais** de uma única vez!\n\n` +
      `📋 **Resumo dos Itens:**\n` +
      preview + remaining +
      `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 **Total de Unidades:** \`${totalCount} itens\`\n` +
      `💰 **Total a Receber:** **+${Format(totalVal)}**\n\n` +
      `🛡️ *Equipamentos e sementes não serão vendidos neste modo em massa.*\n` +
      `Deseja confirmar a venda de tudo agora?`
    );
}

function buildMassConfirmButtons(totalVal) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('vender_mass_confirm_exec')
        .setLabel(`Confirmar e Receber +${Format(totalVal)}`)
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('vender_back')
        .setLabel('Cancelar / Voltar')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

// ============================================================================
// COMANDO SLASH /vender
// ============================================================================

module.exports = {
  name: 'vender',
  description: '⌊💸 Economia⌉ Venda itens, colheitas e recursos do seu inventário.',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'item',
      description: 'Nome aproximado do item que deseja vender diretamente (opcional)',
      type: ApplicationCommandOptionType.String,
      required: false
    }
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const userId = interaction.user.id;
      let { items, carteira } = await loadSellableInventory(userId, database);

      let currentPage = 1;
      let maxPages = Math.ceil(items.length / 25) || 1;
      let selectedItem = null;
      let lastSaleAlert = null;

      // Se o usuário passou um argumento opcional direto (/vender item:peixe)
      const directItemQuery = interaction.options.getString('item');
      if (directItemQuery) {
        const queryNorm = directItemQuery.toLowerCase().trim();
        const matched = items.find(it =>
          it.name.toLowerCase().includes(queryNorm) ||
          it.dbKey.toLowerCase().includes(queryNorm)
        );
        if (matched) {
          selectedItem = matched;
        }
      }

      // Renderização inicial
      let initialEmbed;
      let initialComponents;

      if (selectedItem) {
        initialEmbed = buildConfirmEmbed(selectedItem, color);
        initialComponents = buildConfirmButtons(selectedItem);
      } else {
        initialEmbed = buildMainEmbed(client, interaction, items, carteira, null, color, currentPage, maxPages);
        initialComponents = items.length > 0
          ? [buildSelectMenu(items, currentPage), ...buildMainButtons(items, currentPage, maxPages)]
          : [];
      }

      const msg = await interaction.followUp({
        embeds: [initialEmbed],
        components: initialComponents,
        fetchReply: true
      });

      if (items.length === 0 && !selectedItem) return;

      // Collector ativo por 3 minutos de inatividade, resetado a cada clique
      const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 180000
      });

      collector.on('collect', async (i) => {
        try {
          collector.resetTimer();

          // 1. SELEÇÃO NO MENU
          if (i.isStringSelectMenu() && i.customId === 'vender_select_item') {
            const selectedId = i.values[0];
            const { items: freshItems } = await loadSellableInventory(userId, database);
            const found = freshItems.find(x => x.id === selectedId);

            if (!found) {
              lastSaleAlert = { name: 'Item', qty: 0, payout: '0 (Item já esgotado)' };
              const { carteira: freshCart } = await loadSellableInventory(userId, database);
              const maxP = Math.ceil(freshItems.length / 25) || 1;
              if (currentPage > maxP) currentPage = maxP;
              return await i.update({
                embeds: [buildMainEmbed(client, interaction, freshItems, freshCart, lastSaleAlert, color, currentPage, maxP)],
                components: freshItems.length > 0
                  ? [buildSelectMenu(freshItems, currentPage), ...buildMainButtons(freshItems, currentPage, maxP)]
                  : []
              });
            }

            selectedItem = found;
            return await i.update({
              embeds: [buildConfirmEmbed(selectedItem, color)],
              components: buildConfirmButtons(selectedItem)
            });
          }

          // 2. BOTÃO VOLTAR
          if (i.customId === 'vender_back') {
            selectedItem = null;
            const { items: freshItems, carteira: freshCart } = await loadSellableInventory(userId, database);
            const maxP = Math.ceil(freshItems.length / 25) || 1;
            if (currentPage > maxP) currentPage = maxP;
            return await i.update({
              embeds: [buildMainEmbed(client, interaction, freshItems, freshCart, lastSaleAlert, color, currentPage, maxP)],
              components: freshItems.length > 0
                ? [buildSelectMenu(freshItems, currentPage), ...buildMainButtons(freshItems, currentPage, maxP)]
                : []
            });
          }

          // 3. BOTÃO FECHAR
          if (i.customId === 'vender_close') {
            collector.stop('closed_by_user');
            return await i.update({
              content: `${emoji.positivo || '✅'} **|** Balcão de vendas fechado com sucesso.`,
              embeds: [],
              components: []
            });
          }

          // 4. PAGINAÇÃO
          if (i.customId === 'vender_page_prev') {
            currentPage = Math.max(1, currentPage - 1);
            const { items: freshItems, carteira: freshCart } = await loadSellableInventory(userId, database);
            const maxP = Math.ceil(freshItems.length / 25) || 1;
            return await i.update({
              embeds: [buildMainEmbed(client, interaction, freshItems, freshCart, lastSaleAlert, color, currentPage, maxP)],
              components: freshItems.length > 0
                ? [buildSelectMenu(freshItems, currentPage), ...buildMainButtons(freshItems, currentPage, maxP)]
                : []
            });
          }
          if (i.customId === 'vender_page_next') {
            const { items: freshItems, carteira: freshCart } = await loadSellableInventory(userId, database);
            const maxP = Math.ceil(freshItems.length / 25) || 1;
            currentPage = Math.min(maxP, currentPage + 1);
            return await i.update({
              embeds: [buildMainEmbed(client, interaction, freshItems, freshCart, lastSaleAlert, color, currentPage, maxP)],
              components: freshItems.length > 0
                ? [buildSelectMenu(freshItems, currentPage), ...buildMainButtons(freshItems, currentPage, maxP)]
                : []
            });
          }

          // 5. EXECUTAR VENDA ESPECÍFICA (TUDO OU 1X)
          if (i.customId.startsWith('vender_exec_all:') || i.customId.startsWith('vender_exec_one:')) {
            const isAll = i.customId.startsWith('vender_exec_all:');
            const itemId = i.customId.split(':')[1];

            const { items: currentItems } = await loadSellableInventory(userId, database);
            const itemToSell = currentItems.find(x => x.id === itemId);

            if (!itemToSell || itemToSell.quantity <= 0) {
              const { items: freshItems, carteira: freshCart } = await loadSellableInventory(userId, database);
              const maxP = Math.ceil(freshItems.length / 25) || 1;
              selectedItem = null;
              return await i.update({
                embeds: [buildMainEmbed(client, interaction, freshItems, freshCart, null, color, 1, maxP)],
                components: freshItems.length > 0
                  ? [buildSelectMenu(freshItems, 1), ...buildMainButtons(freshItems, 1, maxP)]
                  : []
              });
            }

            const qtyToSell = isAll ? itemToSell.quantity : 1;
            const earned = await executeSale(itemToSell, qtyToSell, userId, interaction, database);

            lastSaleAlert = {
              name: itemToSell.name,
              qty: qtyToSell,
              payout: Format(earned)
            };

            // Recarrega inventário atualizado em tempo real
            const { items: freshItems, carteira: freshCart } = await loadSellableInventory(userId, database);
            const maxP = Math.ceil(freshItems.length / 25) || 1;
            if (currentPage > maxP) currentPage = maxP;

            // Retorna ao painel principal: a lista atualizou e o usuário pode vender outro item IMEDIATAMENTE!
            selectedItem = null;
            return await i.update({
              embeds: [buildMainEmbed(client, interaction, freshItems, freshCart, lastSaleAlert, color, currentPage, maxP)],
              components: freshItems.length > 0
                ? [buildSelectMenu(freshItems, currentPage), ...buildMainButtons(freshItems, currentPage, maxP)]
                : []
            });
          }

          // 6. ABRIR CONFIRMAÇÃO DE VENDA GERAL DE RECURSOS
          if (i.customId === 'vender_mass_resources') {
            const { items: freshItems } = await loadSellableInventory(userId, database);
            const recursos = freshItems.filter(x => x.category === 'recurso' && x.totalPrice > 0);

            if (recursos.length === 0) {
              const { carteira: freshCart } = await loadSellableInventory(userId, database);
              const maxP = Math.ceil(freshItems.length / 25) || 1;
              return await i.update({
                embeds: [buildMainEmbed(client, interaction, freshItems, freshCart, null, color, currentPage, maxP)],
                components: freshItems.length > 0
                  ? [buildSelectMenu(freshItems, currentPage), ...buildMainButtons(freshItems, currentPage, maxP)]
                  : []
              });
            }

            const totalVal = recursos.reduce((sum, r) => sum + r.totalPrice, 0);
            const totalCount = recursos.reduce((sum, r) => sum + r.quantity, 0);

            return await i.update({
              embeds: [buildMassConfirmEmbed(recursos, totalVal, totalCount, color)],
              components: buildMassConfirmButtons(totalVal)
            });
          }

          // 7. CONFIRMAR E EXECUTAR VENDA GERAL DE RECURSOS
          if (i.customId === 'vender_mass_confirm_exec') {
            const { items: freshItems } = await loadSellableInventory(userId, database);
            const recursos = freshItems.filter(x => x.category === 'recurso' && x.totalPrice > 0);

            if (recursos.length === 0) {
              const { carteira: freshCart } = await loadSellableInventory(userId, database);
              const maxP = Math.ceil(freshItems.length / 25) || 1;
              return await i.update({
                embeds: [buildMainEmbed(client, interaction, freshItems, freshCart, null, color, 1, maxP)],
                components: freshItems.length > 0
                  ? [buildSelectMenu(freshItems, 1), ...buildMainButtons(freshItems, 1, maxP)]
                  : []
              });
            }

            const { totalEarned, totalCount } = await executeMassResourceSale(recursos, userId, interaction, database);

            lastSaleAlert = {
              name: 'Lote de Recursos',
              qty: totalCount,
              payout: Format(totalEarned)
            };

            const { items: updatedItems, carteira: updatedCart } = await loadSellableInventory(userId, database);
            const maxP = Math.ceil(updatedItems.length / 25) || 1;
            currentPage = 1;
            selectedItem = null;

            return await i.update({
              embeds: [buildMainEmbed(client, interaction, updatedItems, updatedCart, lastSaleAlert, color, 1, maxP)],
              components: updatedItems.length > 0
                ? [buildSelectMenu(updatedItems, 1), ...buildMainButtons(updatedItems, 1, maxP)]
                : []
            });
          }

        } catch (err) {
          console.error('[SlashCommand /vender] Erro no collector:', err);
          if (!i.replied && !i.deferred) {
            await i.deferUpdate().catch(() => {});
          }
        }
      });

      collector.on('end', async (_, reason) => {
        if (reason !== 'closed_by_user') {
          msg.edit({ components: [] }).catch(() => {});
        }
      });

    } catch (error) {
      console.error('[SlashCommand /vender]', error);
      return interaction.error({ content: `Ocorreu um erro ao abrir o balcão de vendas.` });
    }
  }
};
