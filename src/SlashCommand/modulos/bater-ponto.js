const {
  ApplicationCommandType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
} = require('discord.js');

const { Format } = require('../../utils/functions.js');
const {
  getActiveShift,
  startShift,
  canTriggerOcorrencia,
  addShiftTip,
  endShift,
  MAX_SHIFT_DURATION_MS,
  OCORRENCIA_COOLDOWN_MS
} = require('../../utils/shiftEngine.js');

const {
  generateRouteMinigame,
  generateReceiptMinigame,
  generateMechanicMinigame,
  generateTrashMinigame
} = require('../../utils/satoriMinigames.js');

/**
 * Formata milissegundos em mm:ss
 */
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

/**
 * Cria o Embed do Painel de Turno Principal
 */
function buildDashboardEmbed(shift, color) {
  const maxMins = Math.floor(MAX_SHIFT_DURATION_MS / 60000);
  const percent = Math.min(100, Math.floor((shift.elapsedMs / MAX_SHIFT_DURATION_MS) * 100));
  
  // Status da ocorrência
  const now = Date.now();
  const timeSinceLast = now - (shift.lastOcorrenciaTime || 0);
  let statusOcorrencia = '🟢 **Disponível Agora!**';
  if (timeSinceLast < OCORRENCIA_COOLDOWN_MS) {
    const nextTimeSec = Math.floor((shift.lastOcorrenciaTime + OCORRENCIA_COOLDOWN_MS) / 1000);
    statusOcorrencia = `⏳ Em cooldown (<t:${nextTimeSec}:R>)`;
  }
  if (shift.isExpired) {
    statusOcorrencia = '🛑 **Turno Esgotado (45 min atingidos)**';
  }

  return new EmbedBuilder()
    .setColor(color.embed || '#38bdf8')
    .setTitle(`${shift.jobEmote} Painel de Expediente ・ ${shift.jobName}`)
    .setDescription(
      `Você está em turno de trabalho ativo! Execute suas tarefas de rotina e resolva ocorrências para faturar gorjetas adicionais.\n\n` +
      `⏱️ **Tempo de Expediente:** \`${formatDuration(shift.elapsedMs)} / ${maxMins}m\` (${percent}%)\n` +
      `💵 **Salário Base Acumulado:** **${Format(shift.baseSalary)}**\n` +
      `🎁 **Gorjetas de Ocorrências:** **${Format(shift.tips || 0)}**\n` +
      `💰 **Saldo Total Estimado:** **${Format(shift.totalEarned || (shift.baseSalary + (shift.tips || 0)))}**\n\n` +
      `🔍 **Status de Ocorrência:** ${statusOcorrencia}`
    )
    .setFooter({ text: 'Sistine ・ Sistema de Turno Híbrido | Máx. 45 minutos' })
    .setTimestamp();
}

/**
 * Cria a ActionRow com os botões principais do Painel
 */
function buildDashboardRow(shift) {
  const canOcorrencia = canTriggerOcorrencia(shift).canTrigger;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('turno_ocorrencia')
      .setLabel('Procurar Ocorrência')
      .setEmoji('🔍')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!canOcorrencia),
    new ButtonBuilder()
      .setCustomId('turno_encerrar')
      .setLabel('Encerrar Turno')
      .setEmoji('🛑')
      .setStyle(ButtonStyle.Danger)
  );
}

module.exports = {
  name: 'bater-ponto',
  description: '⌊💼 Empregos⌉ Inicie ou gerencie seu turno de trabalho com ocorrências e minigames.',
  type: ApplicationCommandType.ChatInput,

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const userId = interaction.user.id;

      // 1. Verifica se o usuário tem emprego definido
      const empSnap = await database.ref(`economia/${userId}/emprego`).once('value');
      const empId = empSnap.val()?.emprego || 0;

      if (!empId || empId < 1) {
        return interaction.followUp({
          content: `${emoji.negativo || '❌'} **|** Você está atualmente desempregado! Use o comando \`/emprego escolha: escolher\` para escolher uma profissão antes de bater ponto.`,
          ephemeral: true
        });
      }

      // 2. Inicia ou recupera o turno ativo
      const { shift } = await startShift(database, userId, empId);

      // 3. Renderiza o Painel Principal Inicial
      const embed = buildDashboardEmbed(shift, color);
      const row = buildDashboardRow(shift);

      const msg = await interaction.followUp({
        embeds: [embed],
        components: [row],
        fetchReply: true
      });

      // 4. Cria o Collector da Sessão (dura até o encerramento ou limite de inatividade)
      const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === userId,
        time: MAX_SHIFT_DURATION_MS
      });

      collector.on('collect', async (i) => {
        try {
          // Atualiza dados frescos do turno
          const currentShift = await getActiveShift(database, userId);

          // -------------------------------------------------------------
          // CASO A: ENCERRAR TURNO
          // -------------------------------------------------------------
          if (i.customId === 'turno_encerrar') {
            await i.deferUpdate();
            collector.stop('encerrado_manual');

            const result = await endShift(database, userId, interaction);
            if (!result.success) {
              return interaction.followUp({ content: `❌ ${result.message}`, ephemeral: true });
            }

            const { summary } = result;
            const endEmbed = new EmbedBuilder()
              .setColor('#10b981')
              .setTitle(`${summary.jobEmote} Expediente Encerrado ・ ${summary.jobName}`)
              .setDescription(
                `Você finalizou seu turno de trabalho com sucesso!\n\n` +
                `⏱️ **Tempo Trabalhado:** \`${summary.workedMinutes} minutos\`\n` +
                `💵 **Salário Base:** **${Format(summary.baseSalary)}**\n` +
                `🎁 **Gorjetas Acumuladas:** **${Format(summary.tips)}**\n` +
                `───────────────\n` +
                `💰 **Total Depositado na Carteira:** **${Format(summary.totalPayout)}**`
              )
              .setFooter({ text: 'Sistine Economia ・ Saldo atualizado com sucesso!' })
              .setTimestamp();

            return await msg.edit({
              embeds: [endEmbed],
              components: [],
              files: []
            });
          }

          // -------------------------------------------------------------
          // CASO B: PROCURAR OCORRÊNCIA
          // -------------------------------------------------------------
          if (i.customId === 'turno_ocorrencia') {
            const check = canTriggerOcorrencia(currentShift);
            if (!check.canTrigger) {
              return await i.reply({
                content: `⏳ **|** ${check.reason} (Restam: ${formatDuration(check.remainingMs)})`,
                ephemeral: true
              });
            }

            await i.deferUpdate();

            // Sorteia o minigame adequado conforme o jobId
            let minigameData;
            let answerRow = new ActionRowBuilder();

            if (empId === 2 || empId === 4) {
              // Caminhoneiro ou Entregador -> Minigame 1 (Rota GPS)
              minigameData = await generateRouteMinigame();
              answerRow.addComponents(
                new ButtonBuilder().setCustomId('mg_rota_vermelho').setLabel('Rota Vermelha').setEmoji('🔴').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('mg_rota_azul').setLabel('Rota Azul').setEmoji('🔵').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('mg_rota_verde').setLabel('Rota Verde').setEmoji('🟢').setStyle(ButtonStyle.Success)
              );
            } else if (empId === 1 || empId === 5) {
              // Taxista ou Frentista -> Minigame 2 (Matemática / Troco)
              minigameData = await generateReceiptMinigame();
              minigameData.options.forEach((optVal) => {
                answerRow.addComponents(
                  new ButtonBuilder()
                    .setCustomId(`mg_troco_${optVal}`)
                    .setLabel(`${optVal} Moedas`)
                    .setEmoji('🪙')
                    .setStyle(ButtonStyle.Secondary)
                );
              });
            } else if (empId === 6) {
              // Mecânico -> Minigame 3 (Diagnóstico em 4 Quadrantes)
              minigameData = await generateMechanicMinigame();
              answerRow.addComponents(
                new ButtonBuilder().setCustomId('mg_mec_1').setLabel('1 - Bateria').setEmoji('🔋').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('mg_mec_2').setLabel('2 - Radiador').setEmoji('💧').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('mg_mec_3').setLabel('3 - Pneu').setEmoji('🛞').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('mg_mec_4').setLabel('4 - Motor').setEmoji('⚙️').setStyle(ButtonStyle.Secondary)
              );
            } else if (empId === 3) {
              // Gari -> Minigame 4 (Coleta Seletiva)
              minigameData = await generateTrashMinigame();
              answerRow.addComponents(
                new ButtonBuilder().setCustomId('mg_lixo_azul').setLabel('Azul (Papel)').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('mg_lixo_vermelha').setLabel('Vermelha (Plástico)').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('mg_lixo_verde').setLabel('Verde (Vidro)').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('mg_lixo_amarela').setLabel('Amarela (Metal)').setStyle(ButtonStyle.Secondary)
              );
            } else {
              // Fallback para outras profissões: Sorteia Rota GPS
              minigameData = await generateRouteMinigame();
              answerRow.addComponents(
                new ButtonBuilder().setCustomId('mg_rota_vermelho').setLabel('Rota Vermelha').setEmoji('🔴').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('mg_rota_azul').setLabel('Rota Azul').setEmoji('🔵').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('mg_rota_verde').setLabel('Rota Verde').setEmoji('🟢').setStyle(ButtonStyle.Success)
              );
            }

            // Cria o anexo de imagem Satori
            const attachment = new AttachmentBuilder(minigameData.buffer, { name: 'ocorrencia.png' });

            // Substitui a mensagem atual pela imagem e novos botões
            await msg.edit({
              content: null,
              embeds: [],
              files: [attachment],
              components: [answerRow]
            });

            // Cria collector para a resposta do minigame (sem limite estrito de tempo)
            const answerCollector = msg.createMessageComponentCollector({
              filter: (ansI) => ansI.user.id === userId,
              max: 1,
              time: 300000 // 5 min para responder tranquilamente
            });

            answerCollector.on('collect', async (ansI) => {
              await ansI.deferUpdate();

              let acertou = false;
              let respostaEsperada = '';

              if (empId === 2 || empId === 4 || (![1, 3, 5, 6].includes(empId))) {
                const corEscolhida = ansI.customId.replace('mg_rota_', '');
                acertou = (corEscolhida === minigameData.freeRoute);
                respostaEsperada = `Rota ${minigameData.freeRoute.toUpperCase()}`;
              } else if (empId === 1 || empId === 5) {
                const valorEscolhido = parseInt(ansI.customId.replace('mg_troco_', ''), 10);
                acertou = (valorEscolhido === minigameData.correctChange);
                respostaEsperada = `${minigameData.correctChange} Moedas`;
              } else if (empId === 6) {
                const quadEscolhido = parseInt(ansI.customId.replace('mg_mec_', ''), 10);
                acertou = (quadEscolhido === minigameData.correctQuadrant);
                respostaEsperada = `Quadrante ${minigameData.correctQuadrant} (${minigameData.correctPart})`;
              } else if (empId === 3) {
                const lixeiraEscolhida = ansI.customId.replace('mg_lixo_', '');
                acertou = (lixeiraEscolhida === minigameData.correctBin);
                respostaEsperada = minigameData.correctBinLabel;
              }

              // Computa bônus/gorjeta
              let tipGain = 0;
              if (acertou) {
                tipGain = Math.floor(Math.random() * 201) + 200; // 200 a 400 moedas
                await addShiftTip(database, userId, tipGain);
              } else {
                // Registra ocorrência mesmo errando para resetar cooldown
                await addShiftTip(database, userId, 0);
              }

              // Feedback transitório
              const feedbackEmbed = new EmbedBuilder()
                .setColor(acertou ? '#10b981' : '#ef4444')
                .setTitle(acertou ? '🎉 Excelente Trabalho!' : '❌ Ops! Ocorrência Falhou')
                .setDescription(
                  acertou
                    ? `Você analisou a situação perfeitamente!\nO cliente ficou satisfeito e te deu uma gorjeta de **+${Format(tipGain)}**!`
                    : `Você errou o diagnóstico!\nResposta correta: **${respostaEsperada}**.\nVocê não recebeu gorjeta nesta corrida.`
                );

              await msg.edit({
                embeds: [feedbackEmbed],
                components: [],
                files: []
              });

              // Retorna ao Painel Principal após 3 segundos
              setTimeout(async () => {
                const updatedShift = await getActiveShift(database, userId);
                if (!updatedShift) return;

                const refreshEmbed = buildDashboardEmbed(updatedShift, color);
                const refreshRow = buildDashboardRow(updatedShift);

                await msg.edit({
                  embeds: [refreshEmbed],
                  components: [refreshRow],
                  files: []
                }).catch(() => {});
              }, 3000);
            });
          }
        } catch (err) {
          console.error('[bater-ponto collector error]', err);
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
          // Finalização automática por expiração de tempo (45 minutos)
          const finalShift = await getActiveShift(database, userId);
          if (finalShift) {
            await endShift(database, userId, interaction);
          }
          const expiredEmbed = new EmbedBuilder()
            .setColor('#64748b')
            .setTitle('⏰ Expediente Finalizado por Tempo')
            .setDescription('Seu turno de 45 minutos atingiu o tempo limite e foi liquidado automaticamente na sua carteira.');
          
          await msg.edit({
            embeds: [expiredEmbed],
            components: [],
            files: []
          }).catch(() => {});
        }
      });

    } catch (error) {
      console.error('[bater-ponto]', error);
      return interaction.followUp({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao processar o comando de ponto.`,
        ephemeral: true
      });
    }
  }
};
