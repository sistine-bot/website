const firebase = require('firebase');

function getDatabase() {
  try {
    return firebase.database();
  } catch (e) {
    return null;
  }
}

/**
 * Catálogo modular central de todas as mensagens e tipos de transações financeiras do Sistine.
 * Para adicionar ou alterar uma transação no bot inteiro, basta modificar ou registrar aqui!
 */
const TRANSACTION_TYPES = {
  // --- Economia Passiva & Recompensas ---
  daily: {
    key: '{mensagem.daily}',
    configKey: 'mensagem_daily',
    flow: 'entrada',
    defaultText: 'Recebeu: `{quantia}` em sua recompensa diária.',
    category: 'Economia Diária'
  },
  weekly: {
    key: '{mensagem.weekly}',
    configKey: 'mensagem_weekly',
    flow: 'entrada',
    defaultText: 'Recebeu: `{quantia}` em sua recompensa semanal.',
    category: 'Economia Semanal'
  },
  start: {
    key: '{mensagem.start}',
    configKey: 'mensagem_start',
    flow: 'entrada',
    defaultText: 'Recebeu: `{quantia}` de bônus inicial de boas-vindas.',
    category: 'Boas-vindas'
  },

  // --- Banco & Transferências ---
  saque: {
    key: '{mensagem.saque}',
    configKey: 'mensagem_saque',
    flow: 'saida', // Saída do banco / Entrada na carteira
    defaultText: 'Saque bancário no valor de: `{quantia}`',
    category: 'Banco'
  },
  deposito: {
    key: '{mensagem.deposito}',
    configKey: 'mensagem_deposito',
    flow: 'entrada', // Entrada no banco / Saída da carteira
    defaultText: 'Depósito bancário no valor de: `{quantia}`',
    category: 'Banco'
  },
  transferencia_enviou: {
    key: '{mensagem.transferencia.enviou}',
    configKey: 'mensagem_transferencia_enviou',
    flow: 'saida',
    defaultText: 'Transferência bancária no valor de: `{quantia}` para o usuário: `{usuário.username} ({usuário.id})`',
    category: 'Transferências'
  },
  transferencia_recebeu: {
    key: '{mensagem.transferencia.recebeu}',
    configKey: 'mensagem_transferencia_recebeu',
    flow: 'entrada',
    defaultText: 'Recebeu uma transferência bancária no valor de: `{quantia}` do usuário: `{usuário.username} ({usuário.id})`',
    category: 'Transferências'
  },

  // --- Comércio (Loja e Mercado) ---
  market_buy: {
    key: '{mensagem.market.buy}',
    configKey: 'mensagem_market_buy',
    flow: 'saida',
    defaultText: 'Perdeu: `{quantia}` ao comprar um: **{item}** no market',
    category: 'Mercado'
  },
  market_sell: {
    key: '{mensagem.market.sell}',
    configKey: 'mensagem_market_sell',
    flow: 'entrada',
    defaultText: 'Recebeu: `{quantia}` da venda de: **{item}** no market',
    category: 'Mercado'
  },
  loja_compra: {
    key: '{mensagem.loja.compra}',
    configKey: 'mensagem_loja_buy',
    flow: 'saida',
    defaultText: 'Perdeu: `{quantia}` ao comprar um: **{item}** na loja',
    category: 'Loja'
  },
  loja_vendas: {
    key: '{mensagem.loja.vendas}',
    configKey: 'mensagem_loja_vendas',
    flow: 'entrada',
    defaultText: 'Recebeu: `{quantia}` de uma venda de um: **{item}** na loja',
    category: 'Loja'
  },

  // --- Submundo, Crimes e Assaltos ---
  crime_vitoria: {
    key: '{mensagem.crime.vitoria}',
    configKey: 'mensagem_crime_vitoria',
    flow: 'entrada',
    defaultText: 'Recebeu: `{quantia}` ao cometer um crime.',
    category: 'Submundo'
  },
  crime_derrota: {
    key: '{mensagem.crime.derrota}',
    configKey: 'mensagem_crime_derrota',
    flow: 'saida',
    defaultText: 'Perdeu: `{quantia}` ao cometer um crime.',
    category: 'Submundo'
  },
  assalto_vitoria: {
    key: '{mensagem.assalto.vitoria}',
    configKey: 'mensagem_assalto_vitoria',
    flow: 'entrada',
    defaultText: 'Recebeu: `{quantia}` ao assaltar a carteira do usuário: `{usuário.username} ({usuário.id})`',
    category: 'Submundo'
  },
  assalto_derrota: {
    key: '{mensagem.assalto.derrota}',
    configKey: 'mensagem_assalto_derrota',
    flow: 'saida',
    defaultText: 'Foi assaltado por: `{usuário.username} ({usuário.id})` e perdeu: `{quantia}` da carteira',
    category: 'Submundo'
  },
  assalto_multa: {
    key: '{mensagem.assalto.multa}',
    configKey: 'mensagem_assalto_multa',
    flow: 'saida',
    defaultText: 'Multa policial por tentativa de assalto no valor de: `{quantia}`',
    category: 'Submundo'
  },

  // --- Trabalho e Manutenção ---
  emprego: {
    key: '{mensagem.emprego}',
    configKey: 'mensagem_emprego',
    flow: 'entrada',
    defaultText: 'Trabalhou de: **{emprego}** e recebeu: `{quantia}` no final de seu expediente.',
    category: 'Trabalho'
  },
  recuperar: {
    key: '{mensagem.recuperar}',
    configKey: 'mensagem_recuperar',
    flow: 'saida',
    defaultText: 'Perdeu `{quantia}` recuperando a durabilidade de sua: **{item}**',
    category: 'Oficina'
  },

  // --- Relacionamentos e Eventos ---
  namoro: {
    key: '{mensagem.namoro}',
    configKey: 'mensagem_namoro',
    flow: 'entrada',
    defaultText: 'Namorou com `{usuário.username} ({usuário.id})` e recebeu: `{quantia}`',
    category: 'Social'
  },
  airdrop: {
    key: '{mensagem.airdrop}',
    configKey: 'mensagem_airdrop',
    flow: 'entrada',
    defaultText: 'Recebeu `{quantia}` em um airdrop',
    category: 'Eventos'
  },
  imposto_casamento: {
    key: '{mensagem.imposto.casamento}',
    configKey: 'mensagem_imposto_casamento',
    flow: 'saida',
    defaultText: 'Imposto matrimonial semanal (Cartório) no valor de: `{quantia}`',
    category: 'Taxas'
  },

  // --- Cassino & Jogos de Aposta ---
  bj_vitoria: {
    key: '{mensagem.bj.vitoria}',
    configKey: 'mensagem_bj_vitoria',
    flow: 'entrada',
    defaultText: 'Recebeu: `{quantia}` apostando em um blackjack',
    category: 'Cassino'
  },
  bj_derrota: {
    key: '{mensagem.bj.derrota}',
    configKey: 'mensagem_bj_derrota',
    flow: 'saida',
    defaultText: 'Perdeu: `{quantia}` apostando em um blackjack',
    category: 'Cassino'
  },
  mines_vitoria: {
    key: '{mensagem.mines.vitoria}',
    configKey: 'mensagem_mines_vitoria',
    flow: 'entrada',
    defaultText: 'Recebeu: `{quantia}` ao desviar de todas as minas.',
    category: 'Cassino'
  },
  mines_derrota: {
    key: '{mensagem.mines.derrota}',
    configKey: 'mensagem_mines_derrota',
    flow: 'saida',
    defaultText: 'Perdeu: `{quantia}` caindo em uma mina.',
    category: 'Cassino'
  },
  corrida_vitoria: {
    key: '{mensagem.corrida.vitoria}',
    configKey: 'mensagem_corrida_vitoria',
    flow: 'entrada',
    defaultText: 'Recebeu: `{quantia}` ao vencer uma corrida ilegal.',
    category: 'Cassino'
  },
  corrida_derrota: {
    key: '{mensagem.corrida.derrota}',
    configKey: 'mensagem_corrida_derrota',
    flow: 'saida',
    defaultText: 'Perdeu: `{quantia}` em uma corrida ilegal.',
    category: 'Cassino'
  },
  corrida_reembolso: {
    key: '{mensagem.corrida.reembolso}',
    configKey: 'mensagem_corrida_reembolso',
    flow: 'entrada',
    defaultText: 'Reembolso de aposta de corrida ilegal no valor de: `{quantia}`',
    category: 'Cassino'
  },
  aposta_vitoria: {
    key: '{mensagem.aposta.vitoria}',
    configKey: 'mensagem_bet_win',
    flow: 'entrada',
    defaultText: 'Recebeu: `{quantia}` de uma aposta com: `{usuário.username} ({usuário.id})`',
    category: 'Apostas'
  },
  aposta_derrota: {
    key: '{mensagem.aposta.derrota}',
    configKey: 'mensagem_bet_lose',
    flow: 'saida',
    defaultText: 'Perdeu: `{quantia}` de uma aposta com: `{usuário.username} ({usuário.id})`',
    category: 'Apostas'
  },
  jokenpo_vitoria: {
    key: '{mensagem.jokenpo.vitoria}',
    configKey: 'mensagem_jokenpo_win',
    flow: 'entrada',
    defaultText: 'Ganhou `{quantia}` em uma aposta de pedra, papel ou tesoura',
    category: 'Apostas'
  },
  jokenpo_derrota: {
    key: '{mensagem.jokenpo.derrota}',
    configKey: 'mensagem_jokenpo_lose',
    flow: 'saida',
    defaultText: 'Perdeu `{quantia}` em uma aposta de pedra, papel ou tesoura',
    category: 'Apostas'
  },
  slotmachine_vitoria: {
    key: '{mensagem.slotmachine.vitoria}',
    configKey: 'mensagem_slotmachine_win',
    flow: 'entrada',
    defaultText: 'Ganhou `{quantia}` em uma aposta no caça níquel',
    category: 'Cassino'
  },
  slotmachine_derrota: {
    key: '{mensagem.slotmachine.derrota}',
    configKey: 'mensagem_slotmachine_lose',
    flow: 'saida',
    defaultText: 'Perdeu `{quantia}` em uma aposta no caça níquel',
    category: 'Cassino'
  },
  scratchcard_vitoria: {
    key: '{mensagem.scratchcard.vitoria}',
    configKey: 'mensagem_scratchcard_win',
    flow: 'entrada',
    defaultText: 'Ganhou `{quantia}` em uma raspadinha',
    category: 'Cassino'
  },
  scratchcard_derrota: {
    key: '{mensagem.scratchcard.derrota}',
    configKey: 'mensagem_scratchcard_lose',
    flow: 'saida',
    defaultText: 'Perdeu `{quantia}` comprando raspadinha',
    category: 'Cassino'
  },

  // --- Fazenda & Plantação ---
  fazenda_compra: {
    key: '{mensagem.fazenda.compra}',
    configKey: 'mensagem_fazenda_compra',
    flow: 'saida',
    defaultText: 'Comprou: **{item}** para sua fazenda por: `{quantia}`',
    category: 'Fazenda'
  },
  fazenda_venda: {
    key: '{mensagem.fazenda.venda}',
    configKey: 'mensagem_fazenda_venda',
    flow: 'entrada',
    defaultText: 'Vendeu: **{item}** de sua fazenda por: `{quantia}`',
    category: 'Fazenda'
  },
  plantacao_expansao: {
    key: '{mensagem.plantacao.expansao}',
    configKey: 'mensagem_plantacao_expansao',
    flow: 'saida',
    defaultText: 'Expandiu sua plantação liberando o **{item}** por: `{quantia}`',
    category: 'Plantação'
  },

  // --- Ações Administrativas ---
  admin_adicao: {
    key: '{mensagem.admin.adicao}',
    configKey: 'mensagem_admin_adicao',
    flow: 'entrada',
    defaultText: 'Adição administrativa no valor de: `{quantia}`',
    category: 'Administração'
  },
  admin_remocao: {
    key: '{mensagem.admin.remocao}',
    configKey: 'mensagem_admin_remocao',
    flow: 'saida',
    defaultText: 'Remoção administrativa no valor de: `{quantia}`',
    category: 'Administração'
  },
  admin_definir: {
    key: '{mensagem.admin.definir}',
    configKey: 'mensagem_admin_definir',
    flow: 'entrada',
    defaultText: 'Saldo definido administrativamente ({item}) para: `{quantia}`',
    category: 'Administração'
  }
};

/**
 * Normaliza e constrói a string de transação padrão:
 * "{emoji.entrada/saida} {mensagem.chave} | {quantia} | {idOuItem}"
 */
function buildTransactionString(input, fallbackAmount = 0, fallbackAddOrSub = '+') {
  if (!input) return null;

  // Se já for uma string pré-formatada legado (ex: "{emoji.entrada} {mensagem.daily} | 5000")
  if (typeof input === 'string') {
    const trimmed = input.trim();
    // Se a string for o identificador direto de um tipo cadastrado (ex: "daily" ou "crime_vitoria")
    const typeDef = TRANSACTION_TYPES[trimmed.toLowerCase()];
    if (typeDef) {
      const flowEmoji = typeDef.flow === 'entrada' ? '{emoji.entrada}' : '{emoji.saida}';
      return `${flowEmoji} ${typeDef.key} | ${fallbackAmount}`;
    }
    return trimmed;
  }

  // Se for um objeto com parâmetros estruturados
  if (typeof input === 'object') {
    const typeName = input.type ? String(input.type).toLowerCase() : null;
    const typeDef = typeName ? TRANSACTION_TYPES[typeName] : null;

    const amount = (input.amount !== undefined) ? input.amount : (input.quantia !== undefined ? input.quantia : fallbackAmount);
    // Limpa valor formatado caso venha com formatação de milhar prévia
    const cleanAmount = String(amount).replace(/[^\d.-]/g, '');

    const flowEmoji = (input.flow === 'saida' || (typeDef && typeDef.flow === 'saida') || fallbackAddOrSub === '-')
      ? '{emoji.saida}'
      : '{emoji.entrada}';

    const msgTemplate = typeDef ? typeDef.key : (input.message || input.customText || '{mensagem.transacao}');
    const itemOrUser = input.targetUser?.id || input.targetUser || input.userId || input.item || input.jobName || input.extra || '';

    if (itemOrUser) {
      return `${flowEmoji} ${msgTemplate} | ${cleanAmount} | ${itemOrUser}`;
    }
    return `${flowEmoji} ${msgTemplate} | ${cleanAmount}`;
  }

  return String(input);
}

/**
 * Registra a transação de forma totalmente modular e segura no Firebase.
 * Trata idempotência, evita duplicatas rápidas, normaliza histórico legado e limita a 100 itens.
 */
async function recordTransaction(ctx, user, transactionInput, fallbackAmount = 0, fallbackAddOrSub = '+') {
  try {
    const targetUserId = user?.id || (typeof user === 'string' ? user : null);
    if (!targetUserId) {
      console.warn('[transactionManager] recordTransaction: targetUserId não definido.');
      return;
    }

    if (user?.bot) {
      return; // Bots não possuem extrato de transações
    }

    const transactionString = buildTransactionString(transactionInput, fallbackAmount, fallbackAddOrSub);
    if (!transactionString) return;

    const tempo1 = `<t:${~~(Date.now() / 1000)}:d>`;
    const tempo2 = `<t:${~~(Date.now() / 1000)}:t>`;
    const tempo3 = `<t:${~~(Date.now() / 1000)}:R>`;
    const finalFormattedEntry = `[${tempo1} ${tempo2}] | ${tempo3} ${transactionString}`;

    const db = getDatabase();
    if (!db) {
      console.warn('[transactionManager] Banco de dados não conectado ou não inicializado.');
      return;
    }

    const snap = await db.ref(`economia/${targetUserId}/Transações`).once('value');
    const rawVal = snap.val();

    let transacoesList = [];

    // Compatibilidade com estruturas antigas: se houver array sob `transações`, usa ele
    if (rawVal && Array.isArray(rawVal.transações)) {
      transacoesList = rawVal.transações;
    } else if (rawVal && typeof rawVal === 'object') {
      // Se tiver registros órfãos criados via .push(), achata todos para o padrão unificado
      for (const [k, v] of Object.entries(rawVal)) {
        if (k !== 'transações' && typeof v === 'string') {
          // Se não tiver prefixo de data, adiciona
          transacoesList.push(v.startsWith('[<t:') ? v : `[${tempo1} ${tempo2}] | ${tempo3} ${v}`);
        }
      }
    }

    // Prevenção de duplicatas idênticas num curto intervalo (ex: duplo clique ou double call)
    if (transacoesList.length > 0) {
      const lastEntry = transacoesList[0];
      const lastPayload = lastEntry.split('|').slice(2).join('|').trim();
      const currentPayload = finalFormattedEntry.split('|').slice(2).join('|').trim();
      if (lastPayload && currentPayload && lastPayload === currentPayload) {
        const lastTimestampMatch = lastEntry.match(/<t:(\d+):R>/);
        const currentTimestampMatch = finalFormattedEntry.match(/<t:(\d+):R>/);
        if (lastTimestampMatch && currentTimestampMatch) {
          const diffSec = Math.abs(Number(currentTimestampMatch[1]) - Number(lastTimestampMatch[1]));
          if (diffSec < 2) {
            // Ignora gravação duplicada no mesmo segundo
            return;
          }
        }
      }
    }

    transacoesList.unshift(finalFormattedEntry);

    // Limite de segurança: mantém as últimas 100 transações para performance do Firebase
    // if (transacoesList.length > 100) {
    //   transacoesList = transacoesList.slice(0, 100);
    // }

    await db.ref(`economia/${targetUserId}/Transações`).set({
      transações: transacoesList
    });

  } catch (error) {
    console.error('[transactionManager] Erro ao gravar transação:', error);
  }
}

/**
 * Resolve e formata uma lista bruta de transações substituindo templates, emojis e placeholders.
 */
async function resolveTransactionList(rawList, client, configSnapshot = null) {
  if (!Array.isArray(rawList) || rawList.length === 0) return [];

  // Puxa as configurações customizadas do Firebase se não fornecidas
  let configData = configSnapshot ? (configSnapshot.val?.() || configSnapshot) : null;
  if (!configData) {
    const db = getDatabase();
    const snap = db ? await db.ref('config/transações').once('value') : null;
    configData = snap ? (snap.val() || {}) : {};
  }

  const msgConfig = configData.mensagens || {};

  // Mapeamento dinâmico combinando TRANSACTION_TYPES + overrides do banco
  const dictionary = {};
  for (const [typeKey, def] of Object.entries(TRANSACTION_TYPES)) {
    dictionary[def.key] = msgConfig[def.configKey] || def.defaultText;
  }

  const emojis = {
    '{emoji.entrada}': msgConfig.emoji_enviou || '📥',
    '{emoji.saida}': msgConfig.emoji_recebeu || '📤',
  };

  const { Format } = require('./functions.js');

  const resolved = [];

  for (const rawItem of rawList) {
    if (typeof rawItem !== 'string') continue;

    let text = rawItem;

    // 1. Substitui os placeholders de mensagens cadastradas
    for (const [key, template] of Object.entries(dictionary)) {
      if (text.includes(key)) {
        text = text.split(key).join(template);
      }
    }

    // 2. Substitui emojis de fluxo
    for (const [key, emojiChar] of Object.entries(emojis)) {
      if (text.includes(key)) {
        text = text.split(key).join(emojiChar);
      }
    }

    // 3. Decompõe as partes da transação:
    // [0]: Timestamp 1 & 2  | [1]: Timestamp 3 + texto  | [2]: Quantia  | [3]: ID ou Item
    const parts = text.split('|');
    const timestampHeader = parts[0] ? parts[0].trim() : '';
    let mainBody = parts[1] ? parts[1].trim() : '';
    const rawAmount = parts[2] ? parts[2].trim() : '';
    const extraParam = parts[3] ? parts[3].trim() : '';

    // Formata a quantia com segurança
    const numOnly = rawAmount.replace(/[^\d.-]/g, '');
    const formattedAmount = (numOnly && !isNaN(Number(numOnly))) ? Format(Number(numOnly)) : rawAmount;

    if (extraParam) {
      // Se for um ID numérico de usuário do Discord
      if (/^\d{17,19}$/.test(extraParam) && client) {
        let cached = client.users.cache.get(extraParam);
        if (!cached) {
          cached = await client.users.fetch(extraParam).catch(() => null);
        }

        if (cached) {
          mainBody = mainBody
            .replace(/{usuário\.username}/g, cached.username)
            .replace(/{usuário\.id}/g, cached.id);
        } else {
          mainBody = mainBody
            .replace(/{usuário\.username}/g, 'Usuário Desconhecido')
            .replace(/{usuário\.id}/g, extraParam);
        }
      }

      mainBody = mainBody
        .replace(/{quantia}/g, formattedAmount)
        .replace(/{item}/g, extraParam)
        .replace(/{emprego}/g, extraParam)
        .replace(/{usuário\.id}/g, extraParam);
    } else {
      mainBody = mainBody.replace(/{quantia}/g, formattedAmount);
    }

    const flow = (text.includes(emojis['{emoji.saida}']) || text.includes('📤')) ? 'saida' : 'entrada';

    resolved.push({
      raw: text,
      fullDisplay: `${timestampHeader} | ${mainBody}`,
      flow,
      amount: numOnly ? Number(numOnly) : 0
    });
  }

  return resolved;
}

module.exports = {
  TRANSACTION_TYPES,
  buildTransactionString,
  recordTransaction,
  resolveTransactionList
};
