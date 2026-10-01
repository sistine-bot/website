const { database } = require('./database.js');
const { sendError } = require('./formatters.js');

let transactionManager;
try {
  transactionManager = require('../managers/transactionManager.js');
} catch (e) {
  transactionManager = require('../transactionManager.js');
}

const {
  TRANSACTION_TYPES,
  buildTransactionString,
  recordTransaction,
  resolveTransactionList
} = transactionManager;

async function getUserMoney(user) {
  try {
    if (!user) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (getUserMoney): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      throw new Error(errorMessage);
    }

    const snapshot = await database.ref(`/economia/${user.id}/saldo`).once('value');
    const data = snapshot.val() || {};

    return {
      carteira: data.carteira || 0,
      banco: data.banco || 0
    };
  } catch (error) {
    console.error('Erro ao obter saldo do usuário:', error);
    throw error;
  }
}

async function getUserInventory(user) {
  try {
    if (!user) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (getUserInventory): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      throw new Error(errorMessage);
    }

    const ConsumíveisSnap = await database.ref(`economia/${user.id}/inventario/itens/Consumíveis`).once('value');
    const cVal = ConsumíveisSnap.val() || {};

    const EquipamentosSnap = await database.ref(`economia/${user.id}/inventario/itens/Equipamentos`).once('value');
    const eVal = EquipamentosSnap.val() || {}; 

    return {
      ...cVal,
      ...eVal,
      Trigo: cVal.Trigo || 0,
      Milho: cVal.Milho || 0,
      Feijão: cVal.Feijão || 0,
      Cenoura: cVal.Cenoura || 0,
      Abóbora: cVal.Abóbora || 0,
      Ovo: cVal.Ovo || 0,
      Leite: cVal.Leite || 0,
      Bacon: cVal.Bacon || 0,
      ração_animal: cVal.ração_animal || 0,
      isca: cVal.isca || 0,
      peixe: cVal.peixe || 0,
      carne: cVal.carne || 0,
      CanaDeAçucar: cVal.CanaDeAçucar || 0,
      munição: cVal.munição || 0,
      backgroundticket: cVal.backgroundticket || 0,
      baús: cVal.baús || 0,
      chave: cVal.chave || 0,
      semente_trigo: cVal.semente_trigo || 0,
      semente_milho: cVal.semente_milho || 0,
      semente_feijao: cVal.semente_feijao || 0,
      semente_cana: cVal.semente_cana || 0,
      semente_cenoura: cVal.semente_cenoura || 0,
      semente_abobora: cVal.semente_abobora || 0,
      planta_podre: cVal.planta_podre || 0,
      armacaça: eVal.armacaça || 0,
      arma: eVal.arma || 0,
      porte: eVal.porte || 0,
      anelcasamento: eVal.anelcasamento || 0,
      vara: eVal.vara || 0,
      enxada: eVal.enxada || 0,
      regador: eVal.regador || 0
    };
  } catch (error) {
    console.error('Erro ao obter o inventário do usuário:', error.message);
  }
}

async function TransactionUpdate(ctx, mensagem, user) {
  try {
    const targetUser = user || ctx?.user || ctx?.author;
    if (!targetUser || !mensagem) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (TransactionUpdate): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      if (ctx && typeof sendError === 'function') await sendError(ctx, "Ocorreu um erro ao registrar a transação.");
      return;
    }

    if (targetUser.bot) {
      return;
    }

    await recordTransaction(ctx, targetUser, mensagem);
  } catch (error) {
    console.error('[FUNCTIONS - TransactionUpdate]', error);
  }
}

async function UpdateMoneyWallet(ctx, user, AddOrSub, quantia, transação) {
  try {
    if (!user || !AddOrSub) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (UpdateMoneyWallet): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      if (ctx && typeof sendError === 'function') await sendError(ctx, "Ocorreu um erro ao atualizar o dinheiro da sua carteira.");
      throw new Error(errorMessage);
    }
    if (user.bot) {
      return;
    }

    const snapshot = await database.ref(`/economia/${user.id}/saldo`).once('value');
    const saldo = snapshot.val() || {};
    const { carteira = 0 } = saldo;

    const numQuantia = Number(quantia) || 0;
    let newCarteira;
    if (AddOrSub === '+') newCarteira = carteira + numQuantia;
    else if (AddOrSub === '-') newCarteira = Math.max(0, carteira - numQuantia);
    else throw new Error("[LOGS] - [DETAILS_NOT_PROVIDED] (UpdateMoneyWallet): O objeto 'AddOrSub' foi definido diferente de: '+' ou '-' ");

    await database.ref(`/economia/${user.id}/saldo`).update({ carteira: newCarteira });

    if (transação) {
      await recordTransaction(ctx, user, transação, numQuantia, AddOrSub);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function UpdateMoneyBank(ctx, user, AddOrSub, quantia, transação) {
  try {
    if (!user || !AddOrSub) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (UpdateMoneyBank): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      if (ctx && typeof sendError === 'function') await sendError(ctx, "Ocorreu um erro ao atualizar o dinheiro do seu banco.");
      throw new Error(errorMessage);
    }
    if (user.bot) {
      return;
    }

    const snapshot = await database.ref(`/economia/${user.id}/saldo`).once('value');
    const saldo = snapshot.val() || {};
    const { banco = 0 } = saldo;

    const numQuantia = Number(quantia) || 0;
    let newBank;
    if (AddOrSub === '+') newBank = banco + numQuantia;
    else if (AddOrSub === '-') newBank = Math.max(0, banco - numQuantia);
    else throw new Error("[LOGS] - [DETAILS_NOT_PROVIDED] (UpdateMoneyBank): O objeto 'AddOrSub' foi definido diferente de: '+' ou '-' ");

    await database.ref(`/economia/${user.id}/saldo/`).update({ banco: newBank });

    if (transação) {
      await recordTransaction(ctx, user, transação, numQuantia, AddOrSub);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = {
  getUserMoney,
  getUserInventory,
  TransactionUpdate,
  UpdateMoneyWallet,
  UpdateMoneyBank,
  recordTransaction,
  buildTransactionString,
  resolveTransactionList,
  TRANSACTION_TYPES
};
