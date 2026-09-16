const {
  ApplicationCommandType,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');

const LISTA_EMPREGOS = [
  { id: 1, nome: 'Taxista', emote: '🚕', salario: '150 - 280', nivel: 0, ilegal: true },
  { id: 2, nome: 'Caminhoneiro', emote: '🚚', salario: '250 - 420', nivel: 5, ilegal: true },
  { id: 3, nome: 'Gari', emote: '🗑️', salario: '350 - 550', nivel: 10, ilegal: true },
  { id: 4, nome: 'Entregador', emote: '🛵', salario: '450 - 700', nivel: 15, ilegal: true },
  { id: 5, nome: 'Frentista', emote: '⛽', salario: '600 - 900', nivel: 20, ilegal: false },
  { id: 6, nome: 'Mecânico', emote: '👨‍🔧', salario: '750 - 1.150', nivel: 25, ilegal: false },
  { id: 7, nome: 'Médico', emote: '👨‍⚕️', salario: '950 - 1.450', nivel: 30, ilegal: false },
  { id: 8, nome: 'Policial', emote: '👮', salario: '1.250 - 1.750', nivel: 50, ilegal: false },
];

/**
 * Gera uma barra visual de progresso de XP
 * Ex: [██████░░░░] 60/100 XP (60%)
 */
function buildProgressBar(current, max, totalBars = 10) {
  const percentage = Math.min(Math.max(current / max, 0), 1);
  const filledBars = Math.round(percentage * totalBars);
  const emptyBars = totalBars - filledBars;
  return `[${'█'.repeat(filledBars)}${'░'.repeat(emptyBars)}] ${current}/${max} XP (${Math.round(percentage * 100)}%)`;
}

/**
 * Cria o Embed do Hub Informativo de Empregos
 */
function buildEmpregoHubEmbed(client, interaction, userLevel, userXp, currentJobId, color) {
  const nextLevelXp = (userLevel > 0) ? (userLevel * 1000) : 1000;
  const progressBar = buildProgressBar(userXp, nextLevelXp, 10);
  const currentJob = LISTA_EMPREGOS.find(j => j.id === currentJobId) || {
    id: 0,
    nome: 'Desempregado',
    emote: '🤷‍♂️',
    salario: '0',
    nivel: 0,
    ilegal: true
  };

  // Monta a lista visual de profissões com status de bloqueio
  const listaFormatada = LISTA_EMPREGOS.map(job => {
    const isCurrent = job.id === currentJobId;
    const isUnlocked = userLevel >= job.nivel;

    let tagStatus = '';
    if (isCurrent) tagStatus = ' `✨ ATUAL`';
    else if (isUnlocked) tagStatus = ' `🔓 Desbloqueado`';
    else tagStatus = ` \`🔒 Nível ${job.nivel}\``;

    const tagIlegal = job.ilegal ? '' : ' *(🚫 Ilegal)*';
    return `${job.emote} **${job.nome}** ≈ ${job.salario} moedas${tagIlegal}${tagStatus}`;
  }).join('\n');

  return new EmbedBuilder()
    .setColor(color.embed || '#38bdf8')
    .setAuthor({
      name: `Central de Carreiras & Empregos ・ ${interaction.user.username}`,
      iconURL: interaction.user.displayAvatarURL({ dynamic: true })
    })
    .setDescription(
      `Bem-vindo(a) ao Hub de Empregos! Aumente seu nível para desbloquear carreiras com maiores salários e benefícios.\n\n` +
      `💼 **Profissão Atual:** ${currentJob.emote} **${currentJob.nome}**\n` +
      `💸 **Faixa Salarial:** \`≈ ${currentJob.salario} Moedas por turno\`\n` +
      `🔫 **Permite Atividades Ilegais:** \`${currentJob.ilegal ? 'Sim' : 'Não'}\`\n\n` +
      `⭐ **Nível Atual:** \`Nível ${userLevel}\`\n` +
      `📊 **Progresso para o Nível ${userLevel + 1}:**\n` +
      `\`${progressBar}\`\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 **CARREIRAS DISPONÍVEIS NO SERVIDOR:**\n` +
      `${listaFormatada}\n\n` +
      `💡 *Para iniciar o seu expediente de trabalho interativo, utilize o comando \`/trabalhar\`!*`
    )
    .setFooter({ text: 'Selecione abaixo uma das profissões já desbloqueadas para trocar de carreira.' })
    .setTimestamp();
}

/**
 * Cria o Select Menu apenas com as profissões desbloqueadas
 */
function buildUnlockedJobMenu(userLevel, currentJobId) {
  const unlockedJobs = LISTA_EMPREGOS.filter(j => userLevel >= j.nivel);

  const options = unlockedJobs.map(job => ({
    label: `${job.nome} (Lvl ${job.nivel}+)`,
    value: String(job.id),
    emoji: job.emote,
    description: `Salário: ≈${job.salario} moedas | ${job.ilegal ? 'Permite ilegal' : 'Proíbe ilegal'}`,
    default: job.id === currentJobId
  }));

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('menu_selecionar_emprego')
      .setPlaceholder('Selecione uma profissão desbloqueada...')
      .addOptions(options)
  );
}

module.exports = {
  name: 'emprego',
  description: '⌊💼 Empregos⌉ Central de carreiras: veja seu status, barra de XP e troque de profissão.',
  type: ApplicationCommandType.ChatInput,

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const userId = interaction.user.id;

      // 1. Busca nível e XP do usuário
      const nivelSnap = await database.ref(`economia/${userId}/nível`).once('value');
      const nivelData = nivelSnap.val() || {};
      const userLevel = nivelData.nível || 0;
      const userXp = nivelData.xp || 0;

      // 2. Busca o emprego atual
      const empSnap = await database.ref(`economia/${userId}/emprego`).once('value');
      let currentJobId = empSnap.val()?.emprego || 0;

      // 3. Constrói Embed e Select Menu
      let embed = buildEmpregoHubEmbed(client, interaction, userLevel, userXp, currentJobId, color);
      let menuRow = buildUnlockedJobMenu(userLevel, currentJobId);

      const msg = await interaction.followUp({
        embeds: [embed],
        components: [menuRow],
        fetchReply: true
      });

      // 4. Collector para o Select Menu
      const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === userId,
        time: 90000 // 90 segundos de interação
      });

      collector.on('collect', async (i) => {
        if (i.customId === 'menu_selecionar_emprego') {
          const selectedJobId = parseInt(i.values[0], 10);
          const targetJob = LISTA_EMPREGOS.find(j => j.id === selectedJobId);

          if (!targetJob) return;

          // Validação de segurança de nível
          if (userLevel < targetJob.nivel) {
            return i.reply({
              content: `${emoji.negativo || '❌'} **|** Você precisa atingir o nível **${targetJob.nivel}** para exercer a profissão de ${targetJob.nome}.`,
              ephemeral: true
            });
          }

          // Atualiza o emprego no Firebase
          await database.ref(`economia/${userId}/emprego`).update({
            emprego: selectedJobId,
            alteradoEm: Date.now()
          });

          currentJobId = selectedJobId;

          // Atualiza o Hub visualmente
          const updatedEmbed = buildEmpregoHubEmbed(client, interaction, userLevel, userXp, currentJobId, color);
          const updatedRow = buildUnlockedJobMenu(userLevel, currentJobId);

          await i.update({
            embeds: [updatedEmbed],
            components: [updatedRow]
          });

          await interaction.followUp({
            content: `✅ **|** Profissão alterada com sucesso para **${targetJob.emote} ${targetJob.nome}**! Digite \`/trabalhar\` para iniciar seu expediente.`,
            ephemeral: true
          });
        }
      });

      collector.on('end', () => {
        // Desativa o Select Menu após timeout
        const disabledRow = new ActionRowBuilder().addComponents(
          menuRow.components[0].setDisabled(true)
        );
        msg.edit({ components: [disabledRow] }).catch(() => {});
      });

    } catch (error) {
      console.error('[SlashCommand /emprego]', error);
      return interaction.followUp({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao abrir a central de empregos.`,
        ephemeral: true
      });
    }
  }
};