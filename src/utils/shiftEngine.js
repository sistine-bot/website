const { UpdateMoneyWallet, XpUpdate, Format } = require('./functions.js');

/**
 * ============================================================================
 * SISTEMA DE TURNOS HÍBRIDOS & PROGRESSÃO (FIREBASE REALTIME DATABASE)
 * ============================================================================
 */

const MAX_SHIFT_DURATION_MS = 10 * 60 * 1000; // 10 Minutos no total por turno
const OCORRENCIA_COOLDOWN_MS = 1 * 60 * 1000;  // 1 Minuto entre trabalhos
const MAX_OCORRENCIAS_PER_SHIFT = 15;         // Limite de 15 trabalhos no máximo no turno
const SHIFT_COOLDOWN_MS = 30 * 60 * 1000;      // 30 Minutos de intervalo entre um turno e outro

// Tabela de remuneração base por minuto das profissões (calibrada para turnos de 10 min)
const JOB_PAY_RATES = {
  1: { nome: 'Taxista', emote: '🚕', ratePerMinute: 25, nivelMin: 0 },
  2: { nome: 'Caminhoneiro', emote: '🚚', ratePerMinute: 40, nivelMin: 5 },
  3: { nome: 'Gari', emote: '🗑️', ratePerMinute: 50, nivelMin: 10 },
  4: { nome: 'Entregador', emote: '🛵', ratePerMinute: 65, nivelMin: 15 },
  5: { nome: 'Frentista', emote: '⛽', ratePerMinute: 80, nivelMin: 20 },
  6: { nome: 'Mecânico', emote: '👨‍🔧', ratePerMinute: 100, nivelMin: 25 },
  7: { nome: 'Médico', emote: '👨‍⚕️', ratePerMinute: 135, nivelMin: 30 },
  8: { nome: 'Policial', emote: '👮', ratePerMinute: 160, nivelMin: 50 },
};

/**
 * Busca a sessão de turno ativa do usuário no Firebase
 * @param {any} database Instância do Firebase Realtime Database
 * @param {string} userId ID do usuário no Discord
 */
async function getActiveShift(database, userId) {
  if (!database || !userId) return null;
  const snap = await database.ref(`turnos/${userId}`).once('value');
  let shift = snap.val();
  if (!shift || !shift.isWorking) return null;

  const now = Date.now();

  // Limpeza automática de ocorrência abandonada que passou de 45 segundos
  if (shift.pendingOccurrence && (now - (shift.lastOcorrenciaTime || 0)) >= 45000) {
    await database.ref(`turnos/${userId}`).transaction((curr) => {
      if (!curr) return curr;
      if (curr.pendingOccurrence && (Date.now() - (curr.lastOcorrenciaTime || 0)) >= 45000) {
        curr.pendingOccurrence = false;
        curr.occurrencesFailed = (curr.occurrencesFailed || 0) + 1;
      }
      return curr;
    });
    shift.pendingOccurrence = false;
    shift.occurrencesFailed = (shift.occurrencesFailed || 0) + 1;
  }

  const elapsedMs = Math.min(now - shift.startTime, MAX_SHIFT_DURATION_MS);
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  
  // Salário base calculado passivamente por minuto decorrido
  const baseSalary = Math.max(1, elapsedMinutes) * (shift.baseRatePerMinute || 20);
  const isExpired = (now - shift.startTime) >= MAX_SHIFT_DURATION_MS;
  const totalOccurrences = (shift.occurrencesSuccess || 0) + (shift.occurrencesFailed || 0);

  return {
    ...shift,
    elapsedMs,
    elapsedMinutes,
    baseSalary,
    isExpired,
    totalOccurrences,
    maxOccurrences: MAX_OCORRENCIAS_PER_SHIFT,
    maxDurationMs: MAX_SHIFT_DURATION_MS,
    totalEarned: baseSalary + (shift.tips || 0)
  };
}

/**
 * Inicia um novo turno de trabalho no Firebase com trava atômica
 * @param {any} database
 * @param {string} userId
 * @param {number} jobId
 */
async function startShift(database, userId, jobId) {
  const existing = await getActiveShift(database, userId);
  if (existing) {
    return { created: false, shift: existing };
  }

  const jobInfo = JOB_PAY_RATES[jobId] || { nome: 'Trabalhador', emote: '💼', ratePerMinute: 25, nivelMin: 0 };
  const now = Date.now();

  const newShiftData = {
    isWorking: true,
    userId,
    jobId,
    jobName: jobInfo.nome,
    jobEmote: jobInfo.emote,
    startTime: now,
    baseRatePerMinute: jobInfo.ratePerMinute,
    baseSalary: 0,
    tips: 0,
    occurrencesSuccess: 0,
    occurrencesFailed: 0,
    lastOcorrenciaTime: 0,
    pendingOccurrence: false,
    maxDurationMs: MAX_SHIFT_DURATION_MS
  };

  // Trava atômica no Firebase
  await database.ref(`turnos/${userId}`).set(newShiftData);

  return {
    created: true,
    shift: {
      ...newShiftData,
      elapsedMs: 0,
      elapsedMinutes: 0,
      isExpired: false,
      totalOccurrences: 0,
      maxOccurrences: MAX_OCORRENCIAS_PER_SHIFT,
      totalEarned: 0
    }
  };
}

/**
 * Inicia uma ocorrência com trava atômica imediata no Firebase para impedir bypass do cooldown
 * @param {any} database
 * @param {string} userId
 */
async function startOccurrence(database, userId) {
  const now = Date.now();
  let started = false;

  await database.ref(`turnos/${userId}`).transaction((current) => {
    if (!current || !current.isWorking) return current;

    // Checagens de segurança atômicas
    if ((now - current.startTime) >= MAX_SHIFT_DURATION_MS) return current;
    const totalOccurrences = (current.occurrencesSuccess || 0) + (current.occurrencesFailed || 0);
    if (totalOccurrences >= MAX_OCORRENCIAS_PER_SHIFT) return current;

    // Se já existe minigame pendente ainda dentro dos 45s, bloqueia
    if (current.pendingOccurrence && (now - (current.lastOcorrenciaTime || 0)) < 45000) {
      return current;
    }

    // Se o intervalo de 1 minuto ainda não se esgotou, bloqueia
    if ((now - (current.lastOcorrenciaTime || 0)) < OCORRENCIA_COOLDOWN_MS) {
      return current;
    }

    // Ativa imediatamente o cooldown e marca ocorrência pendente
    current.lastOcorrenciaTime = now;
    current.pendingOccurrence = true;
    started = true;
    return current;
  });

  return started;
}

/**
 * Verifica se o usuário pode disparar um novo trabalho (1 min de cooldown e máx 15 trabalhos)
 * @param {any} shift
 */
function canTriggerOcorrencia(shift) {
  if (!shift || !shift.isWorking) {
    return { canTrigger: false, remainingMs: 0, reason: 'Nenhum turno ativo encontrado.' };
  }

  const now = Date.now();
  if ((now - shift.startTime) >= MAX_SHIFT_DURATION_MS) {
    return { canTrigger: false, remainingMs: 0, reason: 'O tempo limite máximo de 10 minutos do turno foi atingido.' };
  }

  const totalOccurrences = (shift.occurrencesSuccess || 0) + (shift.occurrencesFailed || 0);
  if (totalOccurrences >= MAX_OCORRENCIAS_PER_SHIFT) {
    return {
      canTrigger: false,
      remainingMs: 0,
      reason: `Você atingiu o limite de ${MAX_OCORRENCIAS_PER_SHIFT} trabalhos neste turno. Encerre o turno para resgatar seus ganhos!`
    };
  }

  if (shift.pendingOccurrence && (now - (shift.lastOcorrenciaTime || 0)) < 45000) {
    return {
      canTrigger: false,
      remainingMs: 45000 - (now - (shift.lastOcorrenciaTime || 0)),
      reason: 'Você já possui um trabalho em andamento! Conclua o minigame na mensagem anterior ou aguarde ele expirar.'
    };
  }

  const timeSinceLast = now - (shift.lastOcorrenciaTime || 0);
  if (timeSinceLast < OCORRENCIA_COOLDOWN_MS) {
    return {
      canTrigger: false,
      remainingMs: OCORRENCIA_COOLDOWN_MS - timeSinceLast,
      reason: 'Aguarde 1 minuto entre cada trabalho.'
    };
  }

  return { canTrigger: true, remainingMs: 0 };
}

/**
 * Registra o resultado da ocorrência com transação atômica
 * @param {any} database
 * @param {string} userId
 * @param {boolean} success
 * @param {number} tipAmount
 */
async function recordOccurrenceResult(database, userId, success, tipAmount) {
  const now = Date.now();
  const shiftRef = database.ref(`turnos/${userId}`);

  let updatedTips = 0;
  await shiftRef.transaction((current) => {
    if (!current) return current;
    const wasPending = current.pendingOccurrence;
    current.lastOcorrenciaTime = now;
    current.pendingOccurrence = false;
    if (success) {
      current.tips = (current.tips || 0) + tipAmount;
      current.occurrencesSuccess = (current.occurrencesSuccess || 0) + 1;
      // Se havia sido previamente marcado como falha por timeout em getActiveShift, estorna a falha
      if (wasPending === false && (current.occurrencesFailed || 0) > 0) {
        current.occurrencesFailed -= 1;
      }
    } else {
      // Se a ocorrência ainda estava pendente (não foi limpa por timeout prévio), contabiliza falha
      if (wasPending !== false) {
        current.occurrencesFailed = (current.occurrencesFailed || 0) + 1;
      }
    }
    updatedTips = current.tips || 0;
    return current;
  });

  return updatedTips;
}

/**
 * Encerra o turno de trabalho, credita salários e XP, atualiza ranking, ativa o cooldown de 30m e limpa a sessão
 * @param {any} database
 * @param {string} userId
 * @param {any} interaction
 */
async function endShift(database, userId, interaction) {
  const shift = await getActiveShift(database, userId);
  if (!shift) {
    return { success: false, message: 'Você não possui nenhum turno ativo para encerrar.' };
  }

  const totalPayout = shift.baseSalary + (shift.tips || 0);

  // Calcula XP ganho pelo expediente (Bônus de ação +50 XP + 5 XP por minuto trabalhado)
  const baseShiftXp = 50 + Math.floor(shift.elapsedMinutes * 5);
  const now = Date.now();

  // 1. Remove a sessão ativa de trabalho no Firebase
  await database.ref(`turnos/${userId}`).remove();

  // 2. Grava o timer de cooldown de 30 minutos no Firebase para o próximo turno de trabalho
  await database.ref(`economia/${userId}/cooldowns`).update({
    trabalho: now
  });

  // 3. Credita o valor na carteira
  if (totalPayout > 0 && interaction) {
    await UpdateMoneyWallet(
      interaction,
      interaction.user,
      '+',
      totalPayout,
      {
        type: 'emprego',
        amount: totalPayout,
        jobName: shift.jobName
      }
    );
  }

  // 4. Credita o XP no perfil do jogador
  if (interaction) {
    await XpUpdate(interaction, interaction.user, baseShiftXp);
  }

  // 5. Atualiza o tracker de estatísticas para Ranking (/top empregos)
  const statsRef = database.ref(`economia/${userId}/stats_trabalho`);
  await statsRef.transaction((stats) => {
    if (!stats) {
      return {
        totalEarned: totalPayout,
        shiftsCompleted: 1,
        occurrencesSuccess: shift.occurrencesSuccess || 0,
        lastWorked: now
      };
    }
    stats.totalEarned = (stats.totalEarned || 0) + totalPayout;
    stats.shiftsCompleted = (stats.shiftsCompleted || 0) + 1;
    stats.occurrencesSuccess = (stats.occurrencesSuccess || 0) + (shift.occurrencesSuccess || 0);
    stats.lastWorked = now;
    return stats;
  });

  // Busca dados de nível e XP atualizados para o feedback do relatório
  const nivelSnap = await database.ref(`economia/${userId}/nível`).once('value');
  const nivelData = nivelSnap.val() || {};
  const currentLevel = nivelData.nível || 0;
  const currentXp = nivelData.xp || 0;
  const { getXpForNextLevel } = require('./experienceManager.js');
  const nextLevelXp = getXpForNextLevel(currentLevel);

  return {
    success: true,
    summary: {
      jobName: shift.jobName,
      jobEmote: shift.jobEmote,
      workedMinutes: shift.elapsedMinutes,
      workedSeconds: Math.floor((shift.elapsedMs % 60000) / 1000),
      baseSalary: shift.baseSalary,
      tips: shift.tips || 0,
      totalPayout,
      occurrencesSuccess: shift.occurrencesSuccess || 0,
      occurrencesFailed: shift.occurrencesFailed || 0,
      xpGained: baseShiftXp,
      currentLevel,
      currentXp,
      nextLevelXp,
      nextShiftAt: now + SHIFT_COOLDOWN_MS
    }
  };
}

module.exports = {
  MAX_SHIFT_DURATION_MS,
  OCORRENCIA_COOLDOWN_MS,
  MAX_OCORRENCIAS_PER_SHIFT,
  SHIFT_COOLDOWN_MS,
  JOB_PAY_RATES,
  getActiveShift,
  startShift,
  startOccurrence,
  canTriggerOcorrencia,
  recordOccurrenceResult,
  endShift
};
