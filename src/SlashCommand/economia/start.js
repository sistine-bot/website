const { ApplicationCommandType, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { UpdateMoneyWallet, Format } = require('../../utils/functions.js');
const { generateStarterKitImage } = require('../../utils/satoriItemTemplates.js');

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
        const dateSnap = await userRef.child('starterKitDate').once('value');
        const claimedDate = dateSnap.val();
        const dateText = claimedDate ? ` em <t:${Math.floor(claimedDate / 1000)}:f>` : '';

        const errorEmbed = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle('🛡️ Kit Iniciante Já Resgatado')
          .setDescription(
            `Você já resgatou seu Kit de Boas-Vindas${dateText}!\n\n` +
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

      // 3. Injeção das 1.000 Moedas na Carteira com Padronização de Transações
      const coinsGranted = 1000;
      await UpdateMoneyWallet(
        interaction,
        interaction.user,
        '+',
        coinsGranted,
        `{emoji.entrada} Recebeu: \`{quantia}\` no Kit Iniciante. | ${coinsGranted}`
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
          `Parabéns, **${interaction.user.username}**! Você acaba de tirar seu personagem do Vale da Morte e recebeu seus primeiros suprimentos essenciais:\n\n` +
          `🪙 **Moedas na Carteira:** **+${Format(coinsGranted)}** (Já creditadas)\n` +
          `🎋 **Vara de Bambu:** 1x (Durabilidade: \`8 usos\` • 🔒 *Não consertável*)\n` +
          `🪱 **Iscas de Pesca:** 3x unidades (Pronto para fisgar peixes no \`/pescar\`)\n` +
          `🚿 **Regador de Plástico:** 1x (Capacidade: \`15 usos\` • 🚫 *Não enchível / Não consertável*)\n` +
          `⛏️ **Enxada de Madeira:** 1x (Durabilidade: \`12 usos\` • 🔒 *Não consertável*)\n` +
          `🌾 **Sementes de Trigo:** 5x unidades prontas para o cultivo\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🧭 **COMO JOGAR E PROGREDIR AGORA:**\n` +
          `• \`/pescar\`: Equipe sua **Vara de Bambu** com suas **3 Iscas** para fisgar peixes e lucrar no mercado!\n` +
          `• \`/plantação\`: Use sua **Enxada de Madeira** para arar o solo, plante o trigo e regue para colher!\n` +
          `• \`/trabalhar\`: Inicie seu turno em um emprego para ganhar salário passivo e gorjetas extras.\n` +
          `• \`/inventário\`: Acompanhe suas ferramentas e consumíveis a qualquer momento.\n` +
          `• \`/loja\`: Quando suas ferramentas quebrarem, adquira versões permanentes de ferro.`
        )
        .setFooter({ text: 'Sistine Economia ・ Dica: Use /saldo para conferir sua carteira!' })
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
