const { ApplicationCommandType, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { UpdateMoneyBank, Format } = require('../../utils/functions.js');
const { generateStarterKitImage } = require('../../utils/satoriItemTemplates.js');
const { markUserStarted } = require('../../utils/experienceManager.js');

module.exports = {
  name: 'start',
  description: '⌊🎁 Economia⌉ Resgate o Kit Iniciante para iniciar sua jornada na Sistine.',
  type: ApplicationCommandType.ChatInput,

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const userId = interaction.user.id;
      const userRef = database.ref(`economia/${userId}`);

      // 1. Verificação de Segurança (Resgate Único / Anti-Alt)
      const kitSnap = await userRef.child('starterKitClaimed').once('value');
      const alreadyClaimed = kitSnap.val();

      if (alreadyClaimed === true) {
        // Assegura que o usuário está ativo no cache em memória e com Nível 1 garantido
        markUserStarted(userId);
        const lvlSnap = await database.ref(`economia/${userId}/nível/nível`).once('value');
        if (!lvlSnap.val() || lvlSnap.val() < 1) {
          await database.ref(`economia/${userId}/nível`).update({ nível: 1, xp: 0 });
        }

        const dateSnap = await userRef.child('starterKitDate').once('value');
        const claimedDate = dateSnap.val();
        const dateText = claimedDate ? ` em <t:${Math.floor(claimedDate / 1000)}:f>` : '';

        const errorEmbed = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle('🛡️ Kit Iniciante Já Resgatado')
          .setDescription(
            `Você já resgatou seu Kit de Boas-Vindas${dateText}!\n\n` +
            `⭐ **Seu status:** Nível 1 ativado e progressão habilitada!\n` +
            `⚠️ **Aviso de Segurança:** O Kit Iniciante é intransferível e limitado a **1 resgate único por usuário** para proteger o equilíbrio econômico do servidor.`
          )
          .setFooter({ text: 'Sistine Economia ・ Segurança & Proteção de Saldo' });

        return interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      }

      // 2. Trava Atômica de Segurança no Firebase (Prevenção de Race Condition)
      let claimedSuccessfully = false;
      await userRef.child('starterKitClaimed').transaction((current) => {
        if (current === true) {
          return undefined; // Aborta transação se já foi marcado
        }
        claimedSuccessfully = true;
        return true;
      });

      if (!claimedSuccessfully) {
        return interaction.followUp({
          content: `${emoji.negativo || '❌'} **|** Tentativa de resgate simultâneo bloqueada pelo sistema.`,
          ephemeral: true
        });
      }

      const now = Date.now();
      await userRef.child('starterKitDate').set(now);

      // 3. Injeção das 1.000 Moedas no Banco com Padronização de Transações
      const coinsGranted = 1000;
      await UpdateMoneyBank(
        interaction,
        interaction.user,
        '+',
        coinsGranted,
        { type: 'start', amount: coinsGranted }
      );

      // 4. Injeção de Equipamentos no Inventário (Baixa durabilidade, não reparáveis, não enchíveis)
      // A) Vara de Bambu: 8 usos, baixa durabilidade, não reparável
      await database.ref(`economia/${userId}/inventario/itens/Equipamentos/vara`).set({
        item: 1,
        Xp: 8,
        nome: 'Vara de Bambu',
        tipo: 'bambu',
        reparavel: false,
        transferivel: false,
        descricao: 'Vara leve de bambu para os primeiros passos na pesca. Baixa durabilidade e não pode ser consertada.'
      });

      // B) Regador de Plástico: 15 usos, baixa durabilidade, não pode ser enchido nem reparado
      await database.ref(`economia/${userId}/inventario/itens/Equipamentos/regador`).set({
        item: 1,
        Xp: 15,
        agua: 15,
        nome: 'Regador de Plástico',
        tipo: 'plastico',
        enchivel: false,
        reparavel: false,
        transferivel: false,
        descricao: 'Regador descartável de plástico. Não pode ser reabastecido com água nem consertado.'
      });

      // C) Enxada de Madeira: 12 usos, baixa durabilidade, não reparável
      await database.ref(`economia/${userId}/inventario/itens/Equipamentos/enxada`).set({
        item: 1,
        Xp: 12,
        nome: 'Enxada de Madeira',
        tipo: 'madeira',
        reparavel: false,
        transferivel: false,
        descricao: 'Enxada rústica entalhada em madeira para arar seus primeiros lotes. Baixa durabilidade e não pode ser consertada.'
      });

      // 5. Injeção de Consumíveis: 5x Sementes de Trigo e 3x Iscas de Pesca
      await database.ref(`economia/${userId}/inventario/itens/Consumíveis/semente_trigo`).transaction(
        (curr) => (curr || 0) + 5
      );
      await database.ref(`economia/${userId}/inventario/itens/Consumíveis/isca`).transaction(
        (curr) => (curr || 0) + 3
      );

      // 5.1 Inicialização e Desbloqueio Oficial do Nível 1 & Ativação de XP
      await database.ref(`economia/${userId}/nível`).transaction((current) => {
        const curLvl = (current && typeof current.nível === 'number') ? current.nível : 0;
        const curXp = (current && typeof current.xp === 'number') ? current.xp : 0;
        return {
          ...(current || {}),
          nível: Math.max(1, curLvl),
          xp: curXp,
          notifyNível: (current && typeof current.notifyNível === 'number') ? current.notifyNível : 1
        };
      });

      // Ativa alertas em users/{id}/settings caso ainda não configurado
      const alertSnap = await database.ref(`users/${userId}/settings/levelUpAlert`).once('value');
      if (alertSnap.val() === null || alertSnap.val() === undefined) {
        await database.ref(`users/${userId}/settings`).update({ levelUpAlert: true });
      }

      // Registra instantaneamente no cache de usuários iniciados
      markUserStarted(userId);

      // 6. Geração Dinâmica da Imagem do Kit Aberto via Satori (Sem imagens PNG/JPG externas)
      let kitBuffer = null;
      try {
        kitBuffer = await generateStarterKitImage({
          username: interaction.user.username,
          coins: coinsGranted
        });
      } catch (renderError) {
        console.error('[Command /start] Erro ao renderizar imagem Satori:', renderError);
      }

      // 7. Feedback Visual com Embed e Anexo Satori
      const welcomeEmbed = new EmbedBuilder()
        .setColor(color.embed || '#10b981')
        .setTitle('🎉 Kit Iniciante Resgatado com Sucesso!')
        .setDescription(
          `Parabéns, **${interaction.user.username}**!\n\n` +
          `⭐ **Nível 1 Desbloqueado** (\`0 / 100 XP\` • Progressão & Níveis Ativados!)\n` +
          `🪙 **R$ +${Format(coinsGranted)}** no banco (\`/sacar\` para usar, cuidado com assaltos)\n` +
          `🎋 **Vara de Bambu:** 1x (Durabilidade: \`8 usos\` • 🔒 *Não consertável*)\n` +
          `🪱 **Iscas de Pesca:** 3x unidades (Pronto para fisgar peixes no \`/pescar\`)\n` +
          `🚿 **Regador de Plástico:** 1x (Capacidade: \`15 usos\` • 🚫 *Não enchível / Não consertável*)\n` +
          `⛏️ **Enxada de Madeira:** 1x (Durabilidade: \`12 usos\` • 🔒 *Não consertável*)\n` +
          `🌾 **Sementes de Trigo:** 5x unidades prontas para o cultivo\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🎁 **VANTAGENS DO NÍVEL 1 LIBERADAS:**\n` +
          `> 🚕 **Taxista:** Primeira profissão liberada no \`/emprego\`!\n` +
          `> 🌱 **Lote 1 de Cultivo:** Cultive e colha trigo no \`/plantação\`!\n` +
          `> 🐣 **Rancho & Galinhas:** Adote galinhas e produza ovos na \`/fazenda\`!\n` +
          `> 🔫 **Glock:** Disponível na \`/loja\`!\n` +
          `> 🛠️ **Oficina de Reparos:** Restaure ferramentas no \`/recuperar\`!\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🧭 **COMO JOGAR E PROGREDIR AGORA:**\n` +
          `• \`/nível\`: Acompanhe seu XP acumulado, barra de progresso e próximos desbloqueios!\n` +
          `• \`/emprego\`: Escolha a carreira de **Taxista** para começar a ganhar salário.\n` +
          `• \`/pescar\`: Equipe sua **Vara de Bambu** com suas **3 Iscas** para fisgar peixes e lucrar no mercado!\n` +
          `• \`/plantação\`: Use sua **Enxada de Madeira** para arar o solo, plante o trigo e regue para colher!\n` +
          `• \`/trabalhar\`: Inicie seu turno para ganhar salário passivo e bônus de XP.\n` +
          `• \`/inventário\`: Acompanhe suas ferramentas e consumíveis a qualquer momento.\n` +
          `• \`/loja\`: Quando suas ferramentas quebrarem, adquira versões permanentes de ferro.`
        )
        .setFooter({ text: 'Sistine Economia ・ Dica: Converse no chat e trabalhe para subir ao Nível 2!' })
        .setTimestamp();

      const replyPayload = { embeds: [welcomeEmbed] };

      if (kitBuffer) {
        const attachment = new AttachmentBuilder(kitBuffer, { name: 'kit_iniciante.png' });
        welcomeEmbed.setImage('attachment://kit_iniciante.png');
        replyPayload.files = [attachment];
      }

      return interaction.followUp(replyPayload);

    } catch (error) {
      console.error('[Command /start]', error);
      return interaction.followUp({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao processar o seu Kit Iniciante.`,
        ephemeral: true
      });
    }
  }
};
