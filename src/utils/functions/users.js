const { database } = require('./database.js');
const { sendError } = require('./formatters.js');

let experienceManager;
try {
  experienceManager = require('../managers/experienceManager.js');
} catch (e) {
  experienceManager = require('../experienceManager.js');
}

function getUser(message, toFind = '') {
  try {
    if (!message) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (getUser): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      throw new Error(errorMessage);
    }

    let { client } = message;
    toFind = toFind.toLowerCase();
    let target = client.users.cache.get(toFind);

    if (!target && message.mentions?.members) target = message.mentions.users.first();

    if (!target && toFind) {
      target = client.users.cache.find(member => {
        return member.username.toLowerCase().includes(toFind) || member.tag?.toLowerCase().includes(toFind);
      }) || client.users.cache.find(member => member.id.toLowerCase().includes(toFind));
    }

    return target || message.author;
  } catch (e) {
    if (message?.channel?.error) message.channel.error(`Um erro interno aconteceu ao utilizar uma função, tente novamente mais tarde.`);
    return console.error(e);
  }
}

function isStaff(client, userId) {
  if (!userId) return false;
  const isCreator = client?.config?.cargos?.criador?.includes(userId);
  const isDev = client?.config?.cargos?.developer?.includes(userId);
  return Boolean(isCreator || isDev);
}

async function getUserReps(user) {
  try {
    if (!user) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (getUserReps): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      throw new Error(errorMessage);
    }

    const snapshot = await database.ref(`/economia/${user.id}/Reputações/`).once('value');
    const dataVal = snapshot.val() || {};

    let reputações_enviadas = dataVal.reputações_enviadas || 0;
    let reputações_recebidas = dataVal.reputações_recebidas || 0;
    let reps = dataVal.reputações || [`${user} **não possui nenhuma reputação.**`];

    return { enviadas: reputações_enviadas, recebidas: reputações_recebidas, lista: reps };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function ReputationUpdate(ctx, user, mensagem, Dadas, Recebidas) {
  try {
    if (!ctx || !user || !mensagem) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (ReputationUpdate): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      if (ctx) return await sendError(ctx, "Ocorreu um erro ao atualizar a reputação do usuário.");
      throw new Error(errorMessage);
    }

    const snapshot = await database.ref(`/economia/${user.id}/Reputações`).once('value');
    const dataVal = snapshot.val() || {};

    let reputações_enviadas = dataVal.reputações_enviadas || 0;
    let reputações_recebidas = dataVal.reputações_recebidas || 0;
    let reputações = dataVal.reputações || [];

    let Mensagem = `[<t:${~~(Date.now() / 1000)}:d> <t:${~~(Date.now() / 1000)}:t>] | <t:${~~(Date.now() / 1000)}:R> ${mensagem}`;
    reputações.unshift(Mensagem);

    return database.ref(`/economia/${user.id}/Reputações`).set({
      reputações_enviadas: reputações_enviadas + Dadas,
      reputações_recebidas: reputações_recebidas + Recebidas,
      reputações: reputações,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function CheckUserCooldowns(user, Cooldowns, variável) {
  const Tempo = Cooldowns;
  const snapshotDaily = await database.ref(`economia/${user.id}/cooldowns/`).once('value');
  let Bonus = snapshotDaily.val()?.[variável] || 0;

  const DailyStats = (Bonus !== null && Tempo - (Date.now() - Bonus) > 0) ? (Bonus + Tempo) : false;
  return { status: DailyStats, tempo: Bonus };
}

async function CheckUserAntiRoubo(user) {
  const snapshot = await database.ref(`/economia/${user.id}/AntiRoubo/`).once('value');
  const dataVal = snapshot.val() || {};

  const tempo = dataVal.tempo || 0;
  const data = dataVal.data || 0;
  const isPermanent = tempo === 'indeterminado' || tempo === 'permanente';
  const isActive = isPermanent || (data > 0 && typeof tempo === 'number' && tempo > 0 && (tempo - (Date.now() - data) > 0));

  return { anti: isActive, tempo, data };
}

async function getCasamento(user) {
  try {
    if (!user) {
      const errorMessage = "[LOGS] - [DETAILS_NOT_PROVIDED] (getCasamento): Um ou mais parâmetros não foram definidos.";
      console.warn(errorMessage);
      throw new Error(errorMessage);
    }

    const snapshot = await database.ref(`economia/${user.id}/Casamento`).once('value');
    const dataVal = snapshot.val() || {};

    let CasamentoID = dataVal.casado || 0;
    let datanow = dataVal.datanow || 0;

    const Casado = (CasamentoID > 0);
    return { casado: Casado, conjunge: CasamentoID, durante: datanow, tempo: `<t:${~~(datanow / 1000)}:D> (<t:${~~(datanow / 1000)}:R>)` };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function XpUpdate(ctx, user, quantia = null) {
  try {
    return await experienceManager.XpUpdate(ctx, user, quantia);
  } catch (error) {
    console.error('[FUNCTIONS - XpUpdate]', error);
    throw error;
  }
}

module.exports = {
  getUser,
  isStaff,
  getUserReps,
  ReputationUpdate,
  CheckUserCooldowns,
  CheckUserAntiRoubo,
  getCasamento,
  XpUpdate,
  getXpForNextLevel: experienceManager.getXpForNextLevel,
  checkUserStarted: experienceManager.checkUserStarted,
  markUserStarted: experienceManager.markUserStarted
};
