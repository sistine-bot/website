const {
  ApplicationCommandType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
} = require('discord.js');

const { Format, XpUpdate, CheckUserCooldowns } = require('../../utils/functions.js');
const {
  getActiveShift,
  startShift,
  startOccurrence,
  canTriggerOcorrencia,
  recordOccurrenceResult,
  endShift,
  MAX_SHIFT_DURATION_MS,
  OCORRENCIA_COOLDOWN_MS,
  MAX_OCORRENCIAS_PER_SHIFT,
  SHIFT_COOLDOWN_MS
} = require('../../utils/shiftEngine.js');

const {
  generateRouteMinigame,
  generateReceiptMinigame,
  generateMechanicMinigame,
  generateTrashMinigame
} = require('../../utils/satoriMinigames.js');

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

function buildProgressBar(current, max, totalBars = 10) {
  const percentage = Math.min(Math.max(current / max, 0), 1);
  const filledBars = Math.round(percentage * totalBars);
  const emptyBars = totalBars - filledBars;
  return `[${'█'.repeat(filledBars)}${'░'.repeat(emptyBars)}] ${current}/${max} XP (${Math.round(percentage * 100)}%)`;
}

/**
 * Constrói o Painel Principal de Expediente (Embed)
 */
function buildWorkDashboardEmbed(shift, color) {
  const now = Date.now();
  const timeSinceLast = now - (shift.lastOcorrenciaTime || 0);
  const totalOccurrences = (shift.occurrencesSuccess || 0) + (shift.occurrencesFailed || 0);
  const maxMins = Math.floor(MAX_SHIFT_DURATION_MS / 60000);

  let statusOcorrencia = '🟢 **Disponível Agora!** (Clique em "Trabalhar")';

  if (totalOccurrences >= MAX_OCORRENCIAS_PER_SHIFT) {
    statusOcorrencia = `🛑 **Limite atingido (${MAX_OCORRENCIAS_PER_SHIFT}/${MAX_OCORRENCIAS_PER_SHIFT})! Encerre o turno para resgatar.**`;
  } else if (shift.pendingOccurrence && timeSinceLast < 45000) {
    const nextSec = Math.floor((shift.lastOcorrenciaTime + 45000) / 1000);
    statusOcorrencia = `⚠️ **Ocorrência em andamento!** Responda o minigame na mensagem anterior ou aguarde expirar (<t:${nextSec}:R>).`;
  } else if (timeSinceLast < OCORRENCIA_COOLDOWN_MS) {
    const nextSec = Math.floor((shift.lastOcorrenciaTime + OCORRENCIA_COOLDOWN_MS) / 1000);
    statusOcorrencia = `⏳ Em intervalo de 1 min (<t:${nextSec}:R>)`;
  } else if (shift.isExpired) {
    statusOcorrencia = `🛑 **Turno Esgotado (${maxMins}m atingidos)**`;
  }

  return new EmbedBuilder()
    .setColor(color.embed || '#38bdf8')
    .setTitle(`${shift.jobEmote} Turno de Trabalho Ativo ・ ${shift.jobName}`)
    .setDescription(
      `Seu expediente está em andamento! Acompanhe o status do turno, acumule salário passivo e conclua ocorrências para receber gorjetas extras.\n\n` +
      `⏱️ **Tempo de Expediente:** \`${formatDuration(shift.elapsedMs)} / ${maxMins}m\`\n` +
      `🎯 **Trabalhos Realizados:** \`${totalOccurrences}/${MAX_OCORRENCIAS_PER_SHIFT}\` (\`${shift.occurrencesSuccess || 0} acertos\`)\n` +
      `💵 **Salário Base Acumulado:** **${Format(shift.baseSalary)}**\n` +
      `🎁 **Gorjetas de Ocorrências:** **${Format(shift.tips || 0)}**\n` +
      `💰 **Saldo Total Estimado:** **${Format(shift.totalEarned || (shift.baseSalary + (shift.tips || 0)))}**\n\n` +
      `🔍 **Status de Trabalho:** ${statusOcorrencia}`
    )
    .setFooter({ text: 'Sistine Economia ・ Turno de até 10 min | Máx. 15 trabalhos | 30m de descanso pós-turno' })
    .setTimestamp();
}

/**
 * Constrói os botões da Action Row com botão de Atualizar
 */
function buildWorkButtons(shift) {
  const check = canTriggerOcorrencia(shift);

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_trabalhar_ocorrencia')
      .setLabel('Trabalhar')
      .setEmoji('🔍')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!check.canTrigger),
    new ButtonBuilder()
      .setCustomId('btn_encerrar_turno')
      .setLabel('Encerrar Turno')
      .setEmoji('🛑')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
        .setCustomId('btn_atualizar_painel')
        .setLabel('Atualizar')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Secondary),
  );
}

module.exports = {
  name: 'trabalhar',
  description: '⌊⚙️ Módulos⌉ Inicie seu turno de trabalho híbrido ou resolva ocorrências visuais.',
  type: ApplicationCommandType.ChatInput,

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const userId = interaction.user.id;

      // 1. Verificação de Emprego
      const empSnap = await database.ref(`economia/${userId}/emprego`).once('value');
      const empId = empSnap.val()?.emprego || 0;

      if (!empId || empId < 1) {
        return interaction.followUp({
          content: `${emoji.negativo || '❌'} **|** Você está atualmente **Desempregado**! Use \`/emprego\` para escolher sua profissão antes de iniciar seu turno.`,
          ephemeral: true
        });
      }

      // 2. Se já tem turno ativo em andamento, permite visualizar e continuar normalmente
      const activeShift = await getActiveShift(database, userId);
      if (activeShift && !activeShift.isExpired) {
        const resumeEmbed = buildWorkDashboardEmbed(activeShift, color);
        const resumeRow = buildWorkButtons(activeShift);

        const resumeMsg = await interaction.followUp({
          content: `⚠️ **|** Você já possui um turno de trabalho em andamento! Aqui está seu painel:`,
          embeds: [resumeEmbed],
          components: [resumeRow],
          fetchReply: true
        });

        return attachWorkCollector(client, interaction, resumeMsg, database, color, userId, empId, emoji);
      }

      // 3. Verificação do Timer de 30 minutos entre um trabalho (turno) e outro
      const { status: cooldownStatus } = await CheckUserCooldowns(interaction.user, SHIFT_COOLDOWN_MS, 'trabalho');
      if (cooldownStatus) {
        const cooldownEmbed = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle('⏰ Intervalo de Descanso')
          .setDescription(
            `Você trabalhou recentemente e precisa aguardar o descanso obrigatório entre expedientes!\n\n` +
            `⏳ Você poderá iniciar outro trabalho: **<t:${~~(cooldownStatus / 1000)}:R>** (<t:${~~(cooldownStatus / 1000)}:t>).\n\n` +
            `💡 *O intervalo entre um trabalho e outro é de 30 minutos.*`
          )
          .setFooter({ text: 'Sistine Economia ・ Descanso Obrigatório' })
          .setTimestamp();

        return interaction.followUp({ embeds: [cooldownEmbed] });
      }

      // 4. Inicia um novo turno no Firebase (10 min de duração máxima)
      const { shift } = await startShift(database, userId, empId);

      // 5. Envia o Painel Principal Inicial
      const embed = buildWorkDashboardEmbed(shift, color);
      const row = buildWorkButtons(shift);

      const msg = await interaction.followUp({
        embeds: [embed],
        components: [row],
        fetchReply: true
      });

      // 6. Inicia o Collector de Interações
      return attachWorkCollector(client, interaction, msg, database, color, userId, empId, emoji);

    } catch (error) {
      console.error('[Command /trabalhar]', error);
      return interaction.followUp({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao processar o seu turno de trabalho.`,
        ephemeral: true
      });
    }
  }
};

/**
 * Gerenciador de Eventos e Transições do Turno
 */
function attachWorkCollector(client, interaction, msg, database, color, userId, empId, emoji) {
  const collector = msg.createMessageComponentCollector({
    filter: (i) => i.user.id === userId,
    time: MAX_SHIFT_DURATION_MS
  });

  collector.on('collect', async (i) => {
    try {
      // -------------------------------------------------------------
      // 1. ATUALIZAR O PAINEL MANUALMENTE
      // -------------------------------------------------------------
      if (i.customId === 'btn_atualizar_painel') {
        await i.deferUpdate();
        const updatedShift = await getActiveShift(database, userId);

        if (!updatedShift) {
          return await msg.edit({
            content: '⚠️ Seu turno já foi encerrado.',
            embeds: [],
            components: []
          });
        }

        const freshEmbed = buildWorkDashboardEmbed(updatedShift, color);
        const freshRow = buildWorkButtons(updatedShift);

        return await msg.edit({
          embeds: [freshEmbed],
          components: [freshRow],
          files: []
        });
      }

      const currentShift = await getActiveShift(database, userId);
      if (!currentShift) return;

      // -------------------------------------------------------------
      // 2. ENCERRAR TURNO (Relatório Detalhado com Timer de 30m)
      // -------------------------------------------------------------
      if (i.customId === 'btn_encerrar_turno') {
        await i.deferUpdate();
        collector.stop('encerrado_manual');

        const result = await endShift(database, userId, interaction);
        if (!result.success) {
          return interaction.followUp({ content: `❌ ${result.message}`, ephemeral: true });
        }

        const { summary } = result;
        const progressXpBar = buildProgressBar(summary.currentXp, summary.nextLevelXp, 10);
        const nextShiftSec = Math.floor(summary.nextShiftAt / 1000);

        const endEmbed = new EmbedBuilder()
          .setColor('#10b981')
          .setTitle(`${summary.jobEmote} Expediente Encerrado ・ Relatório do Turno`)
          .setDescription(
            `Você finalizou seu expediente de trabalho com sucesso!\n\n` +
            `⏱️ **Tempo Trabalhado:** \`${summary.workedMinutes} minutos e ${summary.workedSeconds} segundos\`\n` +
            `🎯 **Trabalhos Concluídos:** \`${summary.occurrencesSuccess} acertos\` (de ${summary.occurrencesSuccess + summary.occurrencesFailed} tentativas)\n` +
            `💵 **Salário Base Acumulado:** **${Format(summary.baseSalary)}**\n` +
            `🎁 **Gorjetas Recebidas:** **${Format(summary.tips)}**\n` +
            `───────────────\n` +
            `💰 **Total Depositado na Carteira:** **${Format(summary.totalPayout)}**\n` +
            `✨ **XP Adquirido:** **+${summary.xpGained} XP**\n\n` +
            `⭐ **Progresso Atual:** \`Nível ${summary.currentLevel}\`\n` +
            `\`${progressXpBar}\`\n\n` +
            `⏰ **Próximo Trabalho Liberado:** <t:${nextShiftSec}:R> (<t:${nextShiftSec}:t>)`
          )
          .setFooter({ text: 'Sistine Economia ・ Descanse 30 minutos antes do próximo turno!' })
          .setTimestamp();

        return await msg.edit({
          embeds: [endEmbed],
          components: [],
          files: []
        });
      }

      // -------------------------------------------------------------
      // 3. DISPARAR TRABALHO / OCORRÊNCIA (SATORI PUZZLE)
      // -------------------------------------------------------------
      if (i.customId === 'btn_trabalhar_ocorrencia') {
        const check = canTriggerOcorrencia(currentShift);
        if (!check.canTrigger) {
          return await i.reply({
            content: `⏳ **|** ${check.reason} ${check.remainingMs > 0 ? `(Restam: ${formatDuration(check.remainingMs)})` : ''}`,
            ephemeral: true
          });
        }

        const started = await startOccurrence(database, userId);
        if (!started) {
          return await i.reply({
            content: `⏳ **|** Você precisa aguardar o intervalo entre os trabalhos ou concluir a ocorrência já em andamento!`,
            ephemeral: true
          });
        }

        await i.deferUpdate();

        // Sorteio do Minigame correspondente
        let minigameData;
        let answerRow = new ActionRowBuilder();

        if (empId === 2 || empId === 4 || empId === 1) {
          // Logística (Caminhoneiro / Entregador / Taxista)
          minigameData = await generateRouteMinigame();
          answerRow.addComponents(
            new ButtonBuilder().setCustomId('mg_rota_vermelho').setLabel('Rota Vermelha').setEmoji('🔴').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('mg_rota_azul').setLabel('Rota Azul').setEmoji('🔵').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('mg_rota_verde').setLabel('Rota Verde').setEmoji('🟢').setStyle(ButtonStyle.Success)
          );
        } else if (empId === 5) {
          // Matemática (Frentista / Caixa)
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
          // Mecânico
          minigameData = await generateMechanicMinigame();
          answerRow.addComponents(
            new ButtonBuilder().setCustomId('mg_mec_1').setLabel('1 - Bateria').setEmoji('🔋').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('mg_mec_2').setLabel('2 - Radiador').setEmoji('💧').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('mg_mec_3').setLabel('3 - Pneu').setEmoji('🛞').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('mg_mec_4').setLabel('4 - Motor').setEmoji('⚙️').setStyle(ButtonStyle.Secondary)
          );
        } else if (empId === 3) {
          // Gari
          minigameData = await generateTrashMinigame();
          answerRow.addComponents(
            new ButtonBuilder().setCustomId('mg_lixo_azul').setLabel('Azul (Papel)').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('mg_lixo_vermelha').setLabel('Vermelha (Plástico)').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('mg_lixo_verde').setLabel('Verde (Vidro)').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('mg_lixo_amarela').setLabel('Amarela (Metal)').setStyle(ButtonStyle.Secondary)
          );
        } else {
          minigameData = await generateRouteMinigame();
          answerRow.addComponents(
            new ButtonBuilder().setCustomId('mg_rota_vermelho').setLabel('Rota Vermelha').setEmoji('🔴').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('mg_rota_azul').setLabel('Rota Azul').setEmoji('🔵').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('mg_rota_verde').setLabel('Rota Verde').setEmoji('🟢').setStyle(ButtonStyle.Success)
          );
        }

        const attachment = new AttachmentBuilder(minigameData.buffer, { name: 'ocorrencia.png' });

        // Substitui o Embed pela Imagem Satori e Botões de Resposta
        await msg.edit({
          content: null,
          embeds: [],
          files: [attachment],
          components: [answerRow]
        });

        // Coletor de resposta da ocorrência (45 segundos)
        let answered = false;
        const answerCollector = msg.createMessageComponentCollector({
          filter: (ansI) => ansI.user.id === userId,
          max: 1,
          time: 45000
        });

        answerCollector.on('collect', async (ansI) => {
          answered = true;
          await ansI.deferUpdate();

          // Garante que o turno ainda está ativo
          const liveShift = await getActiveShift(database, userId);
          if (!liveShift) return;

          let acertou = false;
          let respostaEsperada = '';

          if (empId === 2 || empId === 4 || empId === 1 || (![3, 5, 6].includes(empId))) {
            const corEscolhida = ansI.customId.replace('mg_rota_', '');
            acertou = (corEscolhida === minigameData.freeRoute);
            respostaEsperada = `Rota ${minigameData.freeRoute.toUpperCase()}`;
          } else if (empId === 5) {
            const valEscolhido = parseInt(ansI.customId.replace('mg_troco_', ''), 10);
            acertou = (valEscolhido === minigameData.correctChange);
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

          let tipGain = 0;
          let xpGain = 5; // XP de esforço

          if (acertou) {
            tipGain = Math.floor(Math.random() * 201) + 200; // 200 a 400 moedas
            xpGain = Math.floor(Math.random() * 16) + 35;   // 35 a 50 XP
          }

          // Salva gorjeta no turno e XP imediato no perfil
          await recordOccurrenceResult(database, userId, acertou, tipGain);
          await XpUpdate(interaction, interaction.user, xpGain);

          const feedbackEmbed = new EmbedBuilder()
            .setColor(acertou ? '#10b981' : '#ef4444')
            .setTitle(acertou ? '🎉 Trabalho Concluído com Sucesso!' : '❌ Ops! Ocorrência Falhou')
            .setDescription(
              acertou
                ? `Você analisou a situação com precisão!\n` +
                  `💰 **Gorjeta Recebida:** **+${Format(tipGain)}**\n` +
                  `✨ **Bônus de XP:** **+${xpGain} XP**\n\n` +
                  `*Retornando ao painel em 3 segundos...*`
                : `Sua resposta não foi a correta!\n` +
                  `Opção esperada: **${respostaEsperada}**.\n` +
                  `✨ **XP de Esforço:** **+${xpGain} XP** (Sem gorjeta desta vez)\n\n` +
                  `*Retornando ao painel em 3 segundos...*`
            );

          await msg.edit({
            embeds: [feedbackEmbed],
            components: [],
            files: []
          }).catch(() => {});

          // Retorna fluidamente para o Painel Principal após 3 segundos
          setTimeout(async () => {
            const freshShift = await getActiveShift(database, userId);
            if (!freshShift) return;

            const refreshEmbed = buildWorkDashboardEmbed(freshShift, color);
            const refreshRow = buildWorkButtons(freshShift);

            await msg.edit({
              embeds: [refreshEmbed],
              components: [refreshRow],
              files: []
            }).catch(() => {});
          }, 3000);
        });

        answerCollector.on('end', async (collected, reason) => {
          if (!answered && reason === 'time') {
            const liveShift = await getActiveShift(database, userId);
            if (!liveShift) return;

            await recordOccurrenceResult(database, userId, false, 0);

            const timeoutEmbed = new EmbedBuilder()
              .setColor('#ef4444')
              .setTitle('⏰ Tempo Esgotado!')
              .setDescription(
                'Você não respondeu o minigame a tempo (limite de 45 segundos)!\n' +
                'A ocorrência foi considerada **falha** e o intervalo de descanso foi iniciado.\n\n' +
                '*Retornando ao painel em 3 segundos...*'
              );

            await msg.edit({
              embeds: [timeoutEmbed],
              components: [],
              files: []
            }).catch(() => {});

            setTimeout(async () => {
              const freshShift = await getActiveShift(database, userId);
              if (!freshShift) return;

              const refreshEmbed = buildWorkDashboardEmbed(freshShift, color);
              const refreshRow = buildWorkButtons(freshShift);

              await msg.edit({
                embeds: [refreshEmbed],
                components: [refreshRow],
                files: []
              }).catch(() => {});
            }, 3000);
          }
        });
      }
    } catch (err) {
      console.error('[trabalhar collector error]', err);
    }
  });

  collector.on('end', async (collected, reason) => {
    if (reason === 'time') {
      const finalShift = await getActiveShift(database, userId);
      if (finalShift) {
        const result = await endShift(database, userId, interaction);
        const nextShiftSec = Math.floor((Date.now() + SHIFT_COOLDOWN_MS) / 1000);
        const expiredEmbed = new EmbedBuilder()
          .setColor('#64748b')
          .setTitle('⏰ Expediente Finalizado por Tempo (10 min)')
          .setDescription(
            `Seu turno atingiu o limite de 10 minutos e seus ganhos foram liquidados diretamente na sua carteira!\n\n` +
            `⏰ **Próximo Trabalho Liberado:** <t:${nextShiftSec}:R> (<t:${nextShiftSec}:t>)`
          )
          .setFooter({ text: 'Sistine Economia ・ Descanse 30 minutos antes do próximo turno!' });

        await msg.edit({ embeds: [expiredEmbed], components: [], files: [] }).catch(() => {});
      }
    }
  });
}
