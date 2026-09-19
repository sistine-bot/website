const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const {
  Format,
  UpdateMoneyWallet,
  CheckUserCooldowns,
  getUserInventory,
  CheckUserVip,
  getUserMoney,
  CheckUserAntiRoubo,
  XpUpdate
} = require('../../utils/functions.js');

const JOB_NAMES = {
  1: 'Taxista',
  2: 'Caminhoneiro',
  3: 'Gari',
  4: 'Entregador',
  5: 'Frentista',
  6: 'Mecânico',
  7: 'Médico',
  8: 'Policial'
};

function getProgressBar(current, max = 100, totalBars = 10) {
  const percentage = Math.max(0, Math.min(1, current / max));
  const filled = Math.round(percentage * totalBars);
  const empty = totalBars - filled;
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

function resolveGunDetails(arma) {
  const tier = Number(arma?.item || 1);
  let name = arma?.nome;
  if (Array.isArray(name)) name = name[0];
  if (!name) {
    if (tier === 1) name = 'Glock';
    else if (tier === 2) name = 'MP5';
    else if (tier === 3) name = 'M4-A1';
    else if (tier >= 4) name = 'AK-47';
    else name = 'Arma de Fogo';
  }

  // Estatísticas de combate balanceadas por categoria de armamento
  const stats = {
    1: { baseChance: 0.55, maxCap: 1800, minPercent: 0.10, maxPercent: 0.15, emoji: '🔫', minLevel: 1 },
    2: { baseChance: 0.62, maxCap: 3500, minPercent: 0.14, maxPercent: 0.18, emoji: '🔫', minLevel: 15 },
    3: { baseChance: 0.70, maxCap: 6000, minPercent: 0.18, maxPercent: 0.22, emoji: '🔫', minLevel: 25 },
    4: { baseChance: 0.78, maxCap: 10000, minPercent: 0.22, maxPercent: 0.26, emoji: '🔫', minLevel: 40 }
  };

  const selectedStats = stats[tier] || stats[1];

  return {
    tier,
    name,
    ...selectedStats
  };
}

module.exports = {
  name: 'assaltar',
  description: '⌊⚙️ Modulos⌉ Planeje e execute um assalto armado contra outro usuário.',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'usuário',
      type: ApplicationCommandOptionType.User,
      description: 'Mencione o usuário que você deseja assaltar',
      required: true
    }
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const targetUser = interaction.options.getUser('usuário');

      // 1. Validações Básicas de Alvo
      if (!targetUser) {
        return interaction.error({ content: 'Você precisa especificar um usuário válido para assaltar.' });
      }

      if (targetUser.id === interaction.user.id) {
        return interaction.error({ content: 'Você não pode assaltar a si mesmo!' });
      }

      if (targetUser.bot || targetUser.id === client.user.id) {
        return interaction.error({ content: 'Você não pode assaltar bots do Discord! Eles não carregam moedas na carteira.' });
      }

      if (client.config?.cargos?.criador?.includes(targetUser.id)) {
        return interaction.error({ content: 'Você não pode assaltar o criador do bot!' });
      }

      // 2. Checagem de Profissão do Assaltante (Condutas Ilegais)
      const snapEmp = await database.ref(`economia/${interaction.user.id}/emprego`).once('value');
      const emprego = (snapEmp.val() && snapEmp.val().emprego) || 0;

      if (emprego >= 5) {
        const jobName = JOB_NAMES[emprego] || 'Trabalhador Formal';
        return interaction.error({
          content: `Você atua como **${jobName}**! Essa profissão formal exige conduta exemplar e não permite atos criminosos. Caso queira entrar para o submundo, demita-se ou mude de profissão em </emprego:1>.`
        });
      }

      // 3. Cooldown Dinâmico do Assaltante (com vantagens VIP)
      const attackerVip = await CheckUserVip(interaction.user);
      let cooldownTime = 30 * 60 * 1000; // 30 minutos padrão
      if (attackerVip.isVip) {
        if (attackerVip.level >= 2) cooldownTime = 15 * 60 * 1000; // 15 minutos (VIP Ouro)
        else cooldownTime = 20 * 60 * 1000; // 20 minutos (VIP Prata)
      }

      const { status: cooldownStatus } = await CheckUserCooldowns(interaction.user, cooldownTime, 'roubar');
      if (cooldownStatus) {
        const embedCooldown = new EmbedBuilder()
          .setColor(color.embed || '#831396')
          .setAuthor({ name: 'Polícia em Alerta • Você Está Procurado', iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
          .setDescription(
            `🚔 **|** As viaturas estão em alerta após sua última ação criminosa!\n\n` +
            `> ⏳ Você poderá sair do esconderijo: **<t:${~~(cooldownStatus / 1000)}:R>**.\n` +
            `> 💡 *Assinantes VIP possuem tempo de espera reduzido entre assaltos.*`
          );
        return interaction.followUp({ embeds: [embedCooldown] });
      }

      // 4. Checagem de Armamento e Munição do Assaltante
      const attackerInv = await getUserInventory(interaction.user);
      const arma = attackerInv.arma;
      const municao = Number(attackerInv.munição || 0);

      if (!arma || (typeof arma === 'object' ? arma.item < 1 : arma < 1)) {
        return interaction.error({
          content: 'Você precisa ter uma **Arma de Fogo** equipada no inventário para cometer um assalto! Adquira uma na </loja:1>.'
        });
      }

      const currentArmaXp = typeof arma === 'object' ? Number(arma.Xp ?? 100) : 100;
      const gunDetails = resolveGunDetails(arma);

      if (currentArmaXp <= 0) {
        return interaction.error({
          content: `Sua **${gunDetails.name}** está completamente quebrada (**0% de integridade**)! Restaure-a na oficina com </recuperar:1> antes de utilizá-la.`
        });
      }

      if (municao < 1) {
        return interaction.error({
          content: 'Você não possui **munição** suficiente para disparar! Compre cartuchos na </loja:1>.'
        });
      }

      // 5. Proteções da Vítima: Anti-Roubo Permanente ou Temporário
      const antiRouboInfo = await CheckUserAntiRoubo(targetUser);
      if (antiRouboInfo.anti) {
        const timeStr = antiRouboInfo.tempo === 'indeterminado' || antiRouboInfo.tempo === 'permanente'
          ? 'Permanente'
          : (antiRouboInfo.data > 0 && antiRouboInfo.tempo > 0
              ? `<t:${~~((antiRouboInfo.data + antiRouboInfo.tempo) / 1000)}:R>`
              : 'Ativo');

        const embedAnti = new EmbedBuilder()
          .setColor('#3b82f6')
          .setAuthor({ name: 'Sistema de Segurança Particular', iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
          .setTitle('🛡️ Alvo Protegido por Anti-Roubo')
          .setDescription(
            `O usuário <@${targetUser.id}> possui um sistema de **Proteção Anti-Roubo** ativo (${timeStr})!\n\n` +
            `> 🔒 Seus alarmes e seguranças patrimoniais impedem qualquer tentativa de furto ou assalto.\n` +
            `> 💡 Adquira proteção anti-roubo para você no dashboard ou via benefícios da loja.`
          );
        return interaction.followUp({ embeds: [embedAnti] });
      }

      // 6. Proteções da Vítima: Imunidade Pós-Assalto (Anti-Griefing / Spawn-Camping)
      const VICTIM_IMMUNITY_MS = 15 * 60 * 1000; // 15 minutos de proteção após ser assaltado
      const { status: victimImmunity } = await CheckUserCooldowns(targetUser, VICTIM_IMMUNITY_MS, 'vitima_assalto');
      if (victimImmunity) {
        const embedImmunity = new EmbedBuilder()
          .setColor('#3b82f6')
          .setAuthor({ name: 'Patrulha Policial no Local', iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
          .setTitle('🛡️ Vítima sob Proteção Policial')
          .setDescription(
            `O usuário <@${targetUser.id}> sofreu um assalto recentemente e está sob **guarda policial temporária**!\n\n` +
            `> 🚔 A viatura terminará a ronda no local: **<t:${~~(victimImmunity / 1000)}:R>**.`
          );
        return interaction.followUp({ embeds: [embedImmunity] });
      }

      // 7. Checagem da Carteira da Vítima
      const { carteira: victimWallet } = await getUserMoney(targetUser);
      if (victimWallet < 200) {
        return interaction.error({
          content: `O usuário <@${targetUser.id}> possui apenas **R$ ${Format(victimWallet)}** na carteira. O saldo mínimo para valer o risco de um assalto é de **R$ 200**!`
        });
      }

      // 8. Cálculo de Desgaste da Arma do Assaltante
      let durabilityLoss = Math.floor(Math.random() * 3) + 2; // 2 a 4 pontos
      if (attackerVip.isVip) {
        durabilityLoss = attackerVip.level >= 2 ? 1 : Math.floor(Math.random() * 2) + 1; // 1 ponto (Ouro) ou 1-2 pontos (Prata)
      }
      const newArmaXP = Math.max(0, currentArmaXp - durabilityLoss);

      // 9. Aplicação do Cooldown e Consumo de Recursos (Consumíveis + Equipamentos corrigidos)
      await database.ref(`economia/${interaction.user.id}/cooldowns`).update({
        roubar: Date.now(),
        crime: Date.now()
      });

      await database.ref(`economia/${targetUser.id}/cooldowns`).update({
        vitima_assalto: Date.now()
      });

      // Decrementa munição em Consumíveis
      await database.ref(`economia/${interaction.user.id}/inventario/itens/Consumíveis`).update({
        munição: Math.max(0, municao - 1)
      });

      // Atualiza durabilidade da arma em Equipamentos
      await database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos/arma`).update({
        Xp: newArmaXP
      });

      // 10. Sistema de Defesa e Resistência da Vítima
      const victimInv = await getUserInventory(targetUser);
      let victimDefenseModifier = 0;
      let victimDefenseReason = '';

      const victimArma = victimInv.arma;
      const victimMunicao = Number(victimInv.munição || 0);
      const isVictimArmed = Boolean(
        victimArma &&
        (typeof victimArma === 'object' ? victimArma.item > 0 : victimArma > 0) &&
        (typeof victimArma === 'object' ? (victimArma.Xp ?? 100) > 0 : true) &&
        victimMunicao > 0
      );

      if (isVictimArmed) {
        const victimGun = resolveGunDetails(victimArma);
        victimDefenseModifier += (victimGun.tier * 0.04); // -4% a -16%
        victimDefenseReason = `A vítima estava armada com uma **${victimGun.name}** e revidou!`;
      }

      const hasPorte = Boolean(
        victimInv.porte &&
        (typeof victimInv.porte === 'object' ? victimInv.porte.item > 0 : victimInv.porte > 0)
      );
      if (hasPorte) {
        victimDefenseModifier += 0.03; // -3% adicional por porte de armas legal
      }

      // 11. Motor Probabilístico de Sucesso
      let finalSuccessChance = gunDetails.baseChance;
      if (attackerVip.isVip) {
        finalSuccessChance += (attackerVip.level >= 2 ? 0.10 : 0.05); // +5% ou +10% de precisão VIP
      }
      finalSuccessChance -= victimDefenseModifier;
      finalSuccessChance = Math.max(0.25, Math.min(0.90, finalSuccessChance)); // Trava entre 25% e 90%

      const roll = Math.random();
      const isSuccess = roll <= finalSuccessChance;

      // Alerta de quebra de arma se a integridade zerou neste disparo
      let breakNotice = '';
      if (newArmaXP <= 0) {
        breakNotice = `\n\n⚠️ **ATENÇÃO:** Sua **${gunDetails.name}** acabou de quebrar completamente (**0% de integridade**)! Restaure-a na oficina em </recuperar:1> antes de utilizá-la novamente.`;
      }

      // --- CENÁRIO: DERROTA NO ASSALTO ---
      if (!isSuccess) {
        const multaFuga = Math.floor(Math.random() * 301) + 250; // R$ 250 a R$ 550
        await UpdateMoneyWallet(
          interaction,
          interaction.user,
          '-',
          multaFuga,
          `{emoji.saida} Multa policial por tentativa de assalto | ${multaFuga} | ${targetUser.id}`
        );

        const defeatNarratives = [
          `🚨 **Sirenes no Local:** Uma viatura da polícia ouviu o tumulto e efetuou disparos de contenção! Você precisou fugir pelos becos, gastando 1 munição e pagando uma multa de fuga de **R$ ${Format(multaFuga)}**.`,
          `🏃 **Reação da Vítima:** Ao dar voz de assalto, <@${targetUser.id}> percebeu sua hesitação, desferiu um contra-golpe e correu pedindo socorro! As autoridades chegaram e você pagou **R$ ${Format(multaFuga)}** de fiança/fuga.`,
          `🚓 **Cerco Policial:** Um patrulhamento ostensivo interceptou a fuga do seu veículo! Você disparou para despistá-los, gastando munição e sofrendo uma multa de **R$ ${Format(multaFuga)}** nos registros policiais.`
        ];

        let chosenNarrative = defeatNarratives[Math.floor(Math.random() * defeatNarratives.length)];
        if (isVictimArmed) {
          const vGun = resolveGunDetails(victimArma);
          chosenNarrative = `💥 **Reação Armada:** Ao tentar assaltar <@${targetUser.id}>, a vítima sacou uma **${vGun.name}** registrada e revidou os disparos! Sob fogo cruzado, você precisou recuar às pressas, perdendo 1 munição e pagando **R$ ${Format(multaFuga)}** de despesas de fuga.`;
        }

        const freshAttackerMoney = await getUserMoney(interaction.user);
        const durabilityBar = getProgressBar(newArmaXP, 100, 10);

        const embedFail = new EmbedBuilder()
          .setColor('#ef4444')
          .setAuthor({ name: 'Assalto Frustrado • Central Policial', iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
          .setTitle('🚨 Tentativa de Assalto Falhou!')
          .setDescription(
            `${chosenNarrative}\n\n` +
            `> 🔫 **Armamento:** ${gunDetails.emoji} ${gunDetails.name} • \`[${durabilityBar}]\` **${newArmaXP}%**\n` +
            `> 🍬 **Munição:** Gasto **1 cartucho** (Restante: ${Math.max(0, municao - 1)})\n` +
            `> 💸 **Prejuízo (Multa):** -R$ ${Format(multaFuga)}\n` +
            `> 💼 **Saldo Atual:** R$ ${Format(freshAttackerMoney.carteira)}\n` +
            `> ⏳ **Próximo Assalto:** <t:${~~((Date.now() + cooldownTime) / 1000)}:R>${breakNotice}`
          )
          .setFooter({ text: 'Sistine • Submundo & Crimes', iconURL: client.user.displayAvatarURL() });

        return interaction.followUp({ embeds: [embedFail] });
      }

      // --- CENÁRIO: VITÓRIA NO ASSALTO ---
      // Cálculo proporcional e travado da quantia roubada
      const percentStolen = gunDetails.minPercent + (Math.random() * (gunDetails.maxPercent - gunDetails.minPercent));
      let stolenAmount = Math.floor(victimWallet * percentStolen);
      stolenAmount = Math.min(gunDetails.maxCap, stolenAmount);
      stolenAmount = Math.max(80, stolenAmount);
      if (stolenAmount > victimWallet) stolenAmount = victimWallet;

      // Transferência de fundos com histórico de transação
      await UpdateMoneyWallet(
        interaction,
        interaction.user,
        '+',
        stolenAmount,
        `{emoji.entrada} {mensagem.assalto.vitoria} | ${stolenAmount} | ${targetUser.id}`
      );

      await UpdateMoneyWallet(
        interaction,
        targetUser,
        '-',
        stolenAmount,
        `{emoji.saida} {mensagem.assalto.derrota} | ${stolenAmount} | ${interaction.user.id}`
      );

      // Atualização atômica das estatísticas de crimes (/top assaltos)
      database.ref(`economia/${interaction.user.id}/assaltos/assaltos`).transaction(c => (c || 0) + 1);
      database.ref(`economia/${interaction.user.id}/assaltos/total_roubado`).transaction(c => (c || 0) + stolenAmount);

      // Concede XP de comando ao assaltante
      const xpReward = Math.floor(Math.random() * 16) + 20; // 20 a 35 XP
      await XpUpdate(interaction, interaction.user, xpReward);

      // Notificação gentil por DM para a vítima (caso tenha DMs abertas)
      targetUser.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#ef4444')
            .setTitle('🚨 Alerta de Segurança • Você Foi Assaltado!')
            .setDescription(
              `Você foi abordado por **${interaction.user.tag}** no servidor **${interaction.guild?.name || 'Sistine'}**!\n\n` +
              `> 💸 **Quantia Subtraída:** -R$ ${Format(stolenAmount)}\n` +
              `> 🛡️ Você recebeu **15 minutos de proteção policial** contra novos assaltos.\n` +
              `> 💡 *Guarde suas economias com segurança utilizando o </banco:1>!*`
            )
        ]
      }).catch(() => {});

      const successNarratives = [
        `🎯 **Execução Precisa:** Você surpreendeu <@${targetUser.id}> em um momento de distração empunhando sua **${gunDetails.name}**. Sem chances de reagir, a vítima entregou o dinheiro sem alarde!`,
        `⚡ **Abordagem Relâmpago:** Com movimentos rápidos e arma em punho, você rendeu <@${targetUser.id}> e esvaziou seus pertences em segundos antes de desaparecer na multidão!`,
        `🚗 **Ação Coordenada:** Você encurralou <@${targetUser.id}> perto de uma saída estratégica e exigiu suas moedas. A fuga foi limpa e sem rastros para a polícia!`
      ];

      const chosenSuccessNarrative = successNarratives[Math.floor(Math.random() * successNarratives.length)];
      const freshAttackerMoney = await getUserMoney(interaction.user);
      const durabilityBar = getProgressBar(newArmaXP, 100, 10);

      const embedSuccess = new EmbedBuilder()
        .setColor('#10b981')
        .setAuthor({ name: 'Assalto Bem-Sucedido • Submundo', iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTitle('🔫 Assalto Concluído com Sucesso!')
        .setDescription(
          `${chosenSuccessNarrative}\n\n` +
          `> 👤 **Vítima:** <@${targetUser.id}>\n` +
          `> 💰 **Valor Roubado:** **+R$ ${Format(stolenAmount)}**\n` +
          `> 🔫 **Arma Utilizada:** ${gunDetails.emoji} ${gunDetails.name} • \`[${durabilityBar}]\` **${newArmaXP}%**\n` +
          `> 🍬 **Munição:** Gasto **1 cartucho** (Restante: ${Math.max(0, municao - 1)})\n` +
          `> 💼 **Seu Saldo em Carteira:** R$ ${Format(freshAttackerMoney.carteira)}\n` +
          `> ⭐ **Progresso:** +${xpReward} XP de experiência\n` +
          `> ⏳ **Próximo Assalto:** <t:${~~((Date.now() + cooldownTime) / 1000)}:R>${breakNotice}`
        )
        .setFooter({ text: 'Sistine • Submundo & Crimes', iconURL: client.user.displayAvatarURL() });

      return interaction.followUp({ embeds: [embedSuccess] });

    } catch (error) {
      console.error('[SlashCommand /assaltar]', error);
      return interaction.error({ content: 'Ocorreu um erro inesperado na utilização deste comando.' });
    }
  }
};