const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const ms = require('ms');
const parseMs = require('parse-ms');
const { getUserInventory, XpUpdate, getUserMoney, UpdateMoneyWallet, TransactionUpdate, Format, CheckUserVip } = require('../../utils/functions.js');
const itensAPI = require('../../utils/itens.json');

const PRECOS_LOTES = {
  1: 0,
  2: 5000,
  3: 10000,
  4: 20000,
  5: 35000,
  6: 50000
};

const CROP_CONFIG = {
  3: {
    id: 3,
    name: 'Trigo',
    displayName: 'Trigo',
    seedKey: 'semente_trigo',
    time: ms('2m'),
    emoji: '🌾',
    xp: 12,
    needsWater: false,
  },
  4: {
    id: 4,
    name: 'Milho',
    displayName: 'Milho',
    seedKey: 'semente_milho',
    time: ms('5m'),
    emoji: '🌽',
    xp: 18,
    needsWater: true,
    dryInterval: ms('2.5m'),
  },
  5: {
    id: 5,
    name: 'Feijão',
    displayName: 'Feijão',
    seedKey: 'semente_feijao',
    time: ms('15m'),
    emoji: '🫘',
    xp: 25,
    needsWater: true,
    dryInterval: ms('7.5m'),
  },
  6: {
    id: 6,
    name: 'CanaDeAçucar',
    displayName: 'Cana-de-açúcar',
    seedKey: 'semente_cana',
    time: ms('30m'),
    emoji: '🎋',
    xp: 35,
    needsWater: true,
    dryInterval: ms('15m'),
  },
  7: {
    id: 7,
    name: 'Cenoura',
    displayName: 'Cenoura',
    seedKey: 'semente_cenoura',
    time: ms('45m'),
    emoji: '🥕',
    xp: 45,
    needsWater: true,
    dryInterval: ms('22.5m'),
  },
  8: {
    id: 8,
    name: 'Abóbora',
    displayName: 'Abóbora',
    seedKey: 'semente_abobora',
    time: ms('90m'),
    emoji: '🎃',
    xp: 60,
    needsWater: true,
    dryInterval: ms('45m'),
  }
};

module.exports = {
  name: "plantação",
  description: `⌊⚙️ Módulos⌉ Cuide de sua plantação, plante, regue e colha seus frutos.`,
  type: ApplicationCommandType.ChatInput,

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const msg = await interaction.followUp({ content: `<a:loading:929931026589954128> **|** Carregando plantação...` });

      // Garante que o Lote 1 esteja desbloqueado por padrão
      const snapInit = await database.ref(`economia/${interaction.user.id}/Plantação`).once('value');
      const valInit = snapInit.val() || {};
      if (valInit.lote1 === undefined || valInit.lote1 === 0) {
        await database.ref(`economia/${interaction.user.id}/Plantação/lote1`).set(1);
      }

      await renderPlantacao(msg);

      let currentPlantingLote = null;

      const coletor = msg.createMessageComponentCollector({
        filter: (x) => {
          if (x.user.id !== interaction.user.id) {
            x.reply({ content: `❌ **|** Você não pode interagir com a plantação de outro usuário.`, ephemeral: true }).catch(() => {});
            return false;
          }
          return true;
        },
        time: 180000
      });

      coletor.on('collect', async (int) => {
        try {
          await int.deferUpdate();
        } catch (e) {}

        try {
          const action = int.customId;

          // 1. Voltar aos Terrenos
          if (action === 'voltar_lotes') {
            currentPlantingLote = null;
            await renderPlantacao(msg);
            return;
          }

          // 2. Expandir Terreno
          if (action === 'expandir_terreno') {
            await handleExpandirTerreno(int);
            return;
          }

          // 3. Encher Regador
          if (action === 'encher_regador') {
            await handleEncherRegador(int);
            if (currentPlantingLote) {
              await renderPlantingMenu(currentPlantingLote);
            } else {
              await renderPlantacao(msg);
            }
            return;
          }

          // 4. Atualizar
          if (action === 'atualizar') {
            currentPlantingLote = null;
            await renderPlantacao(msg);
            return;
          }

          // 5. Seleção de Semente via StringSelectMenu
          if (int.isStringSelectMenu() && action.startsWith('select_plantar_')) {
            const loteNum = parseInt(action.replace('select_plantar_', ''));
            const cropId = parseInt(int.values[0]);
            await handlePlant(loteNum, cropId, int);
            return;
          }

          // 6. Seleção de Semente via Botão Direto
          if (action.startsWith('plantar_')) {
            const parts = action.split('_');
            const loteNum = parseInt(parts[1]);
            const cropId = parseInt(parts[2]);
            await handlePlant(loteNum, cropId, int);
            return;
          }

          // 7. Ações de Lote (Lote_1 até Lote_6)
          if (action.startsWith('Lote_')) {
            const loteNum = parseInt(action.split('_')[1]);
            const plantData = await getPlantacaoData();
            const loteInfo = evaluateLote(loteNum, plantData);

            if (loteInfo.status === 'locked') {
              return int.followUp({ content: `🔒 **|** Este lote está bloqueado. Use o botão **Expandir Terreno** abaixo para desbloqueá-lo!`, ephemeral: true });
            }

            if (loteInfo.status === 'empty') {
              const inv = await getUserInventory(interaction.user);
              const hasEnxada = inv.enxada && (typeof inv.enxada === 'object' ? inv.enxada.item > 0 : inv.enxada > 0);
              const enxadaXp = typeof inv.enxada === 'object' ? (inv.enxada.Xp ?? 100) : 100;

              if (!hasEnxada) {
                return int.followUp({
                  content: `⛏️ **|** Você precisa de uma **Enxada** (Enxada de Madeira ou superior) para arar e preparar a terra antes de plantar!\n💡 *Se você é novo por aqui, resgate seu kit com \`/start\` para ganhar suas primeiras ferramentas gratuitas, ou adquira uma enxada na \`/loja itens\`.*`,
                  ephemeral: true
                });
              }

              if (enxadaXp <= 0) {
                const isMadeira = (typeof inv.enxada === 'object' && (inv.enxada.tipo === 'madeira' || inv.enxada.reparavel === false));
                return int.followUp({
                  content: isMadeira
                    ? `⛏️ **|** Sua **Enxada de Madeira** quebrou completamente (0% de durabilidade)! Como ela é feita de madeira rústica, não pode ser consertada. Adquira uma nova na \`/loja itens\`.`
                    : `⛏️ **|** Sua **Enxada** está quebrada (0% de durabilidade)! Conserte-a em \`/recuperar\` ou adquira uma nova na \`/loja itens\`.`,
                  ephemeral: true
                });
              }

              currentPlantingLote = loteNum;
              await renderPlantingMenu(loteNum);
              return;
            }

            if (loteInfo.status === 'thirsty') {
              return handleWatering(loteNum, int);
            }

            if (loteInfo.status === 'ready' || loteInfo.status === 'rotten') {
              return handleHarvest(loteNum, int);
            }

            if (loteInfo.status === 'growing') {
              return int.followUp({ content: `⏳ **|** O Lote ${loteNum} ainda está crescendo! Tempo restante: **${loteInfo.tempoRestanteTxt}**.`, ephemeral: true });
            }
          }

        } catch (err) {
          console.error('[Plantação Action Error]:', err);
        }
      });

      coletor.on('end', async () => {
        try {
          const disableRows = (await buildComponents()).map(row => {
            const r = ActionRowBuilder.from(row);
            r.components.forEach(c => c.setDisabled(true));
            return r;
          });
          msg.edit({ components: disableRows }).catch(() => {});
        } catch (e) {}
      });

      // ==========================================
      // FUNÇÕES DE DADOS & AVALIAÇÃO
      // ==========================================
      async function getPlantacaoData() {
        const snap = await database.ref(`economia/${interaction.user.id}/Plantação`).once('value');
        return snap.val() || {};
      }

      function evaluateLote(loteNum, data) {
        let val = data['lote' + loteNum];
        if (loteNum === 1 && (val === undefined || val === 0)) val = 1;

        if (!val || val === 0) {
          return {
            loteNum,
            status: 'locked',
            name: 'Bloqueado',
            label: `Lote ${loteNum}`,
            emoji: '🔒',
            style: ButtonStyle.Secondary,
            disabled: true,
            preco: PRECOS_LOTES[loteNum],
            desc: `🔒 **Lote ${loteNum}** - Bloqueado (${Format(PRECOS_LOTES[loteNum])})`
          };
        }

        if (val === 1) {
          return {
            loteNum,
            status: 'empty',
            name: 'Vazio',
            label: `Lote ${loteNum}`,
            emoji: '🌱',
            style: ButtonStyle.Secondary,
            disabled: false,
            desc: `🌱 **Lote ${loteNum}** - Solo Arado (Vazio) • Pronto para plantar`
          };
        }

        const crop = CROP_CONFIG[val];
        if (!crop) {
          return {
            loteNum,
            status: 'empty',
            name: 'Vazio',
            label: `Lote ${loteNum}`,
            emoji: '🌱',
            style: ButtonStyle.Secondary,
            disabled: false,
            desc: `🌱 **Lote ${loteNum}** - Pronto para plantar`
          };
        }

        const tempoPlantio = data['tempolote' + loteNum] || 0;
        const tempoRegado = data['regadolote' + loteNum] || tempoPlantio;
        const prontoEm = tempoPlantio + crop.time;
        const now = Date.now();

        // 1. Checagem de Planta Pronta / Apodrecimento
        if (now >= prontoEm) {
          const tempoPronta = now - prontoEm;
          let qualidade = 'bom';
          let qualLabel = '✨ Bom';
          let qualEmoji = '✨';

          // Janelas de qualidade
          if (tempoPronta <= Math.max(crop.time * 1.2, ms('6m'))) {
            qualidade = 'excelente';
            qualLabel = '⭐ Excelente';
            qualEmoji = '⭐';
          } else if (tempoPronta <= Math.max(crop.time * 3.5, ms('20m'))) {
            qualidade = 'bom';
            qualLabel = '✨ Bom';
            qualEmoji = '✨';
          } else if (tempoPronta <= Math.max(crop.time * 6.0, ms('45m'))) {
            qualidade = 'ruim';
            qualLabel = '📉 Ruim';
            qualEmoji = '📉';
          } else {
            qualidade = 'podre';
            qualLabel = '🥀 Apodrecida';
            qualEmoji = '🥀';
          }

          if (qualidade === 'podre') {
            return {
              loteNum,
              status: 'rotten',
              crop,
              qualidade,
              label: `Lote ${loteNum} (Limpar)`,
              emoji: '🥀',
              style: ButtonStyle.Danger,
              disabled: false,
              desc: `🥀 **Lote ${loteNum}** - **${crop.displayName}** • **Apodreceu!** (Tempo esgotado)`
            };
          }

          return {
            loteNum,
            status: 'ready',
            crop,
            qualidade,
            label: `Lote ${loteNum} (Colher)`,
            emoji: '🌾',
            style: ButtonStyle.Success,
            disabled: false,
            desc: `🌾 **Lote ${loteNum}** - **${crop.displayName}** • **Pronto para Colher!** (${qualLabel})`
          };
        }

        // 2. Checagem de Necessidade de Água durante crescimento
        if (crop.needsWater && (now - tempoRegado > crop.dryInterval)) {
          return {
            loteNum,
            status: 'thirsty',
            crop,
            label: `Lote ${loteNum} (Regar)`,
            emoji: '💧',
            style: ButtonStyle.Primary,
            disabled: false,
            desc: `⚠️ **Lote ${loteNum}** - **${crop.displayName}** • **Precisa de Água!** (Clique para regar)`
          };
        }

        // 3. Planta Crescendo Normalmente
        const tempoRestanteMs = Math.max(0, prontoEm - now);
        const parsed = parseMs(tempoRestanteMs);
        const tempoRestanteTxt = `${parsed.hours ? `${parsed.hours}h ` : ''}${parsed.minutes}m ${parsed.seconds}s`;

        return {
          loteNum,
          status: 'growing',
          crop,
          tempoRestanteTxt,
          label: `Lote ${loteNum}`,
          emoji: '⏳',
          style: ButtonStyle.Secondary,
          disabled: false,
          desc: `${crop.emoji} **Lote ${loteNum}** - **${crop.displayName}** • Crescendo (<t:${~~(prontoEm / 1000)}:R>) • 💧 Regado`
        };
      }

      // ==========================================
      // CONSTRUÇÃO DE EMBED & COMPONENTES
      // ==========================================
      async function buildComponents() {
        const plantData = await getPlantacaoData();
        const lotes = [1, 2, 3, 4, 5, 6].map(n => evaluateLote(n, plantData));

        const row1 = new ActionRowBuilder();
        lotes.slice(0, 3).forEach(l => {
          row1.addComponents(
            new ButtonBuilder()
              .setCustomId(`Lote_${l.loteNum}`)
              .setLabel(l.label)
              .setEmoji(l.emoji)
              .setStyle(l.style)
          );
        });

        const row2 = new ActionRowBuilder();
        lotes.slice(3, 6).forEach(l => {
          row2.addComponents(
            new ButtonBuilder()
              .setCustomId(`Lote_${l.loteNum}`)
              .setLabel(l.label)
              .setEmoji(l.emoji)
              .setStyle(l.style)
          );
        });

        const row3 = new ActionRowBuilder();

        // Checa próximo lote para expansão
        const proximoLote = lotes.find(l => l.status === 'locked');
        const { carteira } = await getUserMoney(interaction.user);

        if (proximoLote) {
          const preco = proximoLote.preco;
          const temDinheiro = carteira >= preco;

          row3.addComponents(
            new ButtonBuilder()
              .setCustomId("expandir_terreno")
              .setLabel(`Expandir Terreno (${Format(preco)})`)
              .setEmoji('🌱')
              .setStyle(temDinheiro ? ButtonStyle.Success : ButtonStyle.Secondary)
              .setDisabled(!temDinheiro)
          );
        } else {
          row3.addComponents(
            new ButtonBuilder()
              .setCustomId("terreno_maximo")
              .setLabel("Fazenda no Nível Máximo (6/6)")
              .setEmoji('⭐')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );
        }

        row3.addComponents(
          new ButtonBuilder()
            .setCustomId("encher_regador")
            .setLabel("Encher Regador")
            .setEmoji('💧')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("atualizar")
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Secondary)
        );

        return [row1, row2, row3];
      }

      async function renderPlantacao(targetMsg) {
        const plantData = await getPlantacaoData();
        const lotes = [1, 2, 3, 4, 5, 6].map(n => evaluateLote(n, plantData));
        const inv = await getUserInventory(interaction.user);
        const { carteira } = await getUserMoney(interaction.user);

        // Status das Ferramentas
        const hasEnxada = inv.enxada && (typeof inv.enxada === 'object' ? inv.enxada.item > 0 : inv.enxada > 0);
        const enxadaObj = typeof inv.enxada === 'object' ? inv.enxada : {};
        const enxadaNome = enxadaObj.nome || (enxadaObj.tipo === 'madeira' ? 'Enxada de Madeira' : 'Enxada');
        const enxadaXp = enxadaObj.Xp ?? 100;
        const enxadaTxt = hasEnxada
          ? (enxadaXp > 0 ? `⛏️ ${enxadaNome}: **${enxadaXp}%** durabilidade` : `⛏️ ${enxadaNome}: ⚠️ **Quebrada (0%)**`)
          : `⛏️ Enxada: ❌ **Não possui** (Use /start ou /loja)`;

        const hasRegador = inv.regador && (typeof inv.regador === 'object' ? inv.regador.item > 0 : inv.regador > 0);
        const regadorObj = typeof inv.regador === 'object' ? inv.regador : {};
        const regadorNome = regadorObj.nome || (regadorObj.tipo === 'plastico' ? 'Regador de Plástico' : 'Regador de Ferro');
        const regadorXp = regadorObj.Xp ?? 100;
        const regadorAgua = regadorObj.agua ?? 100;
        const regadorTxt = hasRegador
          ? (regadorXp > 0 
              ? `🚿 ${regadorNome}: **${regadorXp}%** durabilidade • 💧 Água: **${regadorAgua}%**`
              : `🚿 ${regadorNome}: ⚠️ **Quebrado (0%)** • 💧 Água: **${regadorAgua}%**`)
          : `🚿 Regador: ❌ **Não possui** (Use /start ou /loja)`;

        // Descrição dos Lotes
        const lotesDesc = lotes.map(l => l.desc).join('\n');

        const embed = new EmbedBuilder()
          .setColor(color.embed || "#10b981")
          .setAuthor({ name: `🌾 Plantação de ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ extension: 'png' }) })
          .setDescription(`> Cuide de seus terrenos, mantenha suas ferramentas prontas e colha produtos de alta qualidade.\n\n**🛠️ Ferramentas & Equipamentos:**\n${enxadaTxt}\n${regadorTxt}\n💰 Carteira: **${Format(carteira)}**\n\n**🌱 Seus Terrenos:**\n${lotesDesc}`)
          .setFooter({ text: `Clique nos botões abaixo para gerenciar seus lotes | Expansão fluida ativa` })
          .setTimestamp();

        const components = await buildComponents();
        await targetMsg.edit({ content: `${interaction.user}`, embeds: [embed], components }).catch(() => {});
      }

      // ==========================================
      // AÇÕES DO USUÁRIO
      // ==========================================

      // 1. EXPANDIR TERRENO DIRETO
      // 1. EXPANDIR TERRENO DIRETO
      async function handleExpandirTerreno(int) {
        const plantData = await getPlantacaoData();
        const lotes = [1, 2, 3, 4, 5, 6].map(n => evaluateLote(n, plantData));
        const proximo = lotes.find(l => l.status === 'locked');

        if (!proximo) {
          return int.followUp({ content: `Você já expandiu todos os terrenos disponíveis!`, ephemeral: true });
        }

        const LOTES_REQUISITOS = {
          2: { nivel: 3, preco: 5000 },
          3: { nivel: 10, preco: 10000 },
          4: { nivel: 15, preco: 20000 },
          5: { nivel: 20, preco: 35000 },
          6: { nivel: 25, preco: 50000 }
        };

        const req = LOTES_REQUISITOS[proximo.loteNum];
        const lvlSnap = await database.ref(`economia/${interaction.user.id}/nível`).once('value');
        const userLevel = lvlSnap.val()?.nível || 0;

        if (req && userLevel < req.nivel) {
          return int.followUp({
            content: `🔒 **|** Você precisa atingir o **Nível ${req.nivel}** para expandir o seu terreno para o **Lote ${proximo.loteNum}**! (Seu nível atual: **${userLevel}**).\n💡 *Dica: Continue ativo no servidor, colhendo culturas e trabalhando para subir de nível!*`,
            ephemeral: true
          });
        }

        const preco = proximo.preco;
        const { carteira } = await getUserMoney(interaction.user);

        if (carteira < preco) {
          return int.followUp({ content: `❌ **|** Saldo insuficiente! Você precisa de **${Format(preco)}** na mão para expandir para o Lote ${proximo.loteNum}.`, ephemeral: true });
        }

        await UpdateMoneyWallet(interaction, interaction.user, '-', preco, `{emoji.saida} Expansão de Terreno Lote ${proximo.loteNum} | ${Format(preco)}`);
        TransactionUpdate(interaction, `{emoji.saida} Compra de Lote ${proximo.loteNum} | ${Format(preco)}`, interaction.user);
        
        await database.ref(`economia/${interaction.user.id}/Plantação/lote${proximo.loteNum}`).set(1);

        await renderPlantacao(msg);
        const reply = await int.followUp({ content: `🎉 **|** Parabéns <@${interaction.user.id}>! Você expandiu seu terreno com sucesso e liberou o **Lote ${proximo.loteNum}**!` });
        setTimeout(() => reply.delete().catch(() => {}), 10000);
      }

      // 2. ENCHER REGADOR
      async function handleEncherRegador(int) {
        const inv = await getUserInventory(interaction.user);
        const hasRegador = inv.regador && (typeof inv.regador === 'object' ? inv.regador.item > 0 : inv.regador > 0);
        if (!hasRegador) {
          return int.followUp({ content: `❌ **|** Você não possui um **Regador**! Adquira um na loja (\`/loja itens\`) ou no \`/start\`.`, ephemeral: true });
        }

        // Bloqueio do Regador de Plástico: Não pode ser enchido!
        const isRegadorPlastico = (typeof inv.regador === 'object' && (inv.regador.tipo === 'plastico' || inv.regador.enchivel === false || String(inv.regador.nome).toLowerCase().includes('plástico')));
        if (isRegadorPlastico) {
          return int.followUp({
            content: `🚫 **|** O seu **Regador de Plástico** é descartável e **não pode ser reabastecido** com água! Use a água restante com cuidado ou adquira um **Regador de Ferro** permanente na \`/loja itens\` para poder enchê-lo livremente.`,
            ephemeral: true
          });
        }

        const currentAgua = typeof inv.regador === 'object' ? (inv.regador.agua ?? 100) : 100;
        if (currentAgua >= 100) {
          return int.followUp({ content: `💧 **|** Seu regador já está completamente cheio (100% de água)!`, ephemeral: true });
        }

        await database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos/regador`).update({
          item: 1,
          nome: typeof inv.regador === 'object' && inv.regador.nome ? inv.regador.nome : 'Regador de Ferro',
          Xp: typeof inv.regador === 'object' ? (inv.regador.Xp ?? 100) : 100,
          agua: 100
        });

        const reply = await int.followUp({ content: `💧 **|** <@${interaction.user.id}>, você encheu o seu **Regador** com sucesso! (Nível de Água: **100%**).` });
        setTimeout(() => reply.delete().catch(() => {}), 10000);
      }

      // 3. MENU DE PLANTIO FLUIDO NA MESMA MENSAGEM
      async function renderPlantingMenu(loteNum) {
        const inv = await getUserInventory(interaction.user);

        const hasEnxada = inv.enxada && (typeof inv.enxada === 'object' ? inv.enxada.item > 0 : inv.enxada > 0);
        const enxadaObj = typeof inv.enxada === 'object' ? inv.enxada : {};
        const enxadaNome = enxadaObj.nome || (enxadaObj.tipo === 'madeira' ? 'Enxada de Madeira' : 'Enxada');
        const enxadaXp = enxadaObj.Xp ?? 100;
        const isEnxadaMadeira = (enxadaObj.tipo === 'madeira' || enxadaObj.reparavel === false);
        const enxadaTxt = hasEnxada
          ? (enxadaXp > 0
              ? `⛏️ ${enxadaNome}: **${enxadaXp}%** durabilidade`
              : (isEnxadaMadeira ? `⛏️ ${enxadaNome}: ⚠️ **Quebrada (0%)** • Não consertável` : `⛏️ ${enxadaNome}: ⚠️ **Quebrada (0%)** • Repare em \`/recuperar\``))
          : `⛏️ Enxada: ❌ **Não possui** • Use \`/start\` ou compre em \`/loja itens\``;

        const hasRegador = inv.regador && (typeof inv.regador === 'object' ? inv.regador.item > 0 : inv.regador > 0);
        const regadorObj = typeof inv.regador === 'object' ? inv.regador : {};
        const regadorNome = regadorObj.nome || (regadorObj.tipo === 'plastico' ? 'Regador de Plástico' : 'Regador de Ferro');
        const regadorXp = regadorObj.Xp ?? 100;
        const regadorAgua = regadorObj.agua ?? 100;
        const isRegadorPlastico = (regadorObj.tipo === 'plastico' || regadorObj.enchivel === false);
        const regadorTxt = hasRegador
          ? (regadorXp > 0
              ? `🚿 ${regadorNome}: **${regadorXp}%** durabilidade • 💧 Água: **${regadorAgua}%**`
              : (isRegadorPlastico ? `🚿 ${regadorNome}: ⚠️ **Quebrado (0%)** • Não consertável` : `🚿 ${regadorNome}: ⚠️ **Quebrado (0%)** • Repare em \`/recuperar\``))
          : `🚿 Regador: ❌ **Não possui** • Use \`/start\` ou compre em \`/loja itens\``;

        const availableSeeds = [
          { cropId: 3, key: 'semente_trigo', name: 'Trigo', time: '2m', emoji: '🌾', xp: 12 },
          { cropId: 4, key: 'semente_milho', name: 'Milho', time: '5m', emoji: '🌽', xp: 18 },
          { cropId: 5, key: 'semente_feijao', name: 'Feijão', time: '15m', emoji: '🫘', xp: 25 },
          { cropId: 6, key: 'semente_cana', name: 'Cana-de-açúcar', time: '30m', emoji: '🎋', xp: 35 },
          { cropId: 7, key: 'semente_cenoura', name: 'Cenoura', time: '45m', emoji: '🥕', xp: 45 },
          { cropId: 8, key: 'semente_abobora', name: 'Abóbora', time: '1h 30m', emoji: '🎃', xp: 60 },
        ];

        const totalSementes = availableSeeds.reduce((acc, s) => acc + (inv[s.key] || 0), 0);

        const embed = new EmbedBuilder()
          .setColor(color.embed || "#10b981")
          .setAuthor({ name: `🌾 Plantação de ${interaction.user.username} • Semear Lote ${loteNum}`, iconURL: interaction.user.displayAvatarURL({ extension: 'png' }) })
          .setTitle(`🌱 Selecione a Semente para o Lote ${loteNum}`)
          .setDescription(
            `> Escolha a cultura que deseja plantar neste lote.\n> O plantio consome **1 semente**, **3% da enxada**, **2% do regador** e **10% de água**.\n\n` +
            `**🛠️ Status das Ferramentas:**\n` +
            `${enxadaTxt}\n${regadorTxt}\n\n` +
            `**🌾 Suas Sementes no Inventário:**\n` +
            availableSeeds.map(s => {
              const count = inv[s.key] || 0;
              return `${s.emoji} **${s.name}**: **${count}** un. • Cresce em: **${s.time}** • XP: **+${s.xp}**`;
            }).join('\n') +
            (totalSementes === 0 ? `\n\n⚠️ *Você não possui nenhuma semente no momento! Compre sementes com \`/loja sementes\`.*` : '')
          )
          .setFooter({ text: `Selecione no menu suspenso ou clique nos botões rápidos abaixo` });

        // Select Menu
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`select_plantar_${loteNum}`)
          .setPlaceholder('🌱 Escolha a semente no menu suspenso...')
          .addOptions(
            availableSeeds.map(s => {
              const count = inv[s.key] || 0;
              return {
                label: `${s.name} (${count} disponíveis)`,
                description: `Tempo: ${s.time} | Recompensa: +${s.xp} XP${count <= 0 ? ' [SEM SEMENTES]' : ''}`,
                value: `${s.cropId}`,
                emoji: s.emoji
              };
            })
          );
        const rowSelect = new ActionRowBuilder().addComponents(selectMenu);

        // Botões rápidos 1 a 3
        const rowBtn1 = new ActionRowBuilder();
        availableSeeds.slice(0, 3).forEach(s => {
          const count = inv[s.key] || 0;
          rowBtn1.addComponents(
            new ButtonBuilder()
              .setCustomId(`plantar_${loteNum}_${s.cropId}`)
              .setLabel(`${s.name} (${count})`)
              .setEmoji(s.emoji)
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(count <= 0)
          );
        });

        // Botões rápidos 4 a 6
        const rowBtn2 = new ActionRowBuilder();
        availableSeeds.slice(3, 6).forEach(s => {
          const count = inv[s.key] || 0;
          rowBtn2.addComponents(
            new ButtonBuilder()
              .setCustomId(`plantar_${loteNum}_${s.cropId}`)
              .setLabel(`${s.name} (${count})`)
              .setEmoji(s.emoji)
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(count <= 0)
          );
        });

        // Botões de navegação e encher água
        const rowControls = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('voltar_lotes')
            .setLabel('Voltar aos Terrenos')
            .setEmoji('🔙')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('encher_regador')
            .setLabel('Encher Regador')
            .setEmoji('💧')
            .setStyle(ButtonStyle.Primary)
        );

        await msg.edit({ content: `${interaction.user}`, embeds: [embed], components: [rowSelect, rowBtn1, rowBtn2, rowControls] }).catch(console.error);
      }

      // 4. PROCESSAR PLANTIO
      async function handlePlant(loteNum, cropId, int) {
        const crop = CROP_CONFIG[cropId];
        if (!crop) return;

        const inv = await getUserInventory(interaction.user);

        // Validação de sementes
        const seedCount = inv[crop.seedKey] || 0;
        if (seedCount < 1) {
          return int.followUp({ content: `❌ **|** Você não possui sementes de **${crop.displayName}** no seu inventário! Adquira na loja (\`/loja sementes\`).`, ephemeral: true });
        }

        // Validação de Nível Mínimo para Cultivo da Semente
        const SEED_LEVELS = {
          3: 0,   // Trigo
          4: 0,   // Milho
          5: 5,   // Feijão
          6: 10,  // Cana-de-açúcar
          7: 15,  // Cenoura
          8: 20   // Abóbora
        };
        const requiredLevel = SEED_LEVELS[cropId] || 0;
        const lvlSnap = await database.ref(`economia/${interaction.user.id}/nível`).once('value');
        const userLevel = lvlSnap.val()?.nível || 0;

        if (userLevel < requiredLevel) {
          return int.followUp({
            content: `🔒 **|** Você precisa atingir o **Nível ${requiredLevel}** para cultivar sementes de **${crop.displayName}**! (Seu nível atual: **${userLevel}**).\n💡 *Dica: Suba de nível colhendo culturas liberadas ou interagindo no servidor!*`,
            ephemeral: true
          });
        }

        // Validação da Enxada (Enxada de Madeira ou superior para preparar a terra)
        const hasEnxada = inv.enxada && (typeof inv.enxada === 'object' ? inv.enxada.item > 0 : inv.enxada > 0);
        if (!hasEnxada) {
          return int.followUp({
            content: `⛏️ **|** Você não pode plantar sem antes preparar a terra! Você precisa de uma **Enxada** (Enxada de Madeira ou superior) para arar o solo.\n💡 *Se você é novato na Sistine, utilize o comando \`/start\` para resgatar seu Kit Iniciante gratuito, ou compre uma enxada na \`/loja itens\`.*`,
            ephemeral: true
          });
        }

        const enxadaXp = typeof inv.enxada === 'object' ? (inv.enxada.Xp ?? 100) : 100;
        if (enxadaXp <= 0) {
          const isMadeira = (typeof inv.enxada === 'object' && (inv.enxada.tipo === 'madeira' || inv.enxada.reparavel === false));
          return int.followUp({
            content: isMadeira
              ? `⛏️ **|** Sua **Enxada de Madeira** quebrou completamente (0% de durabilidade)! Por ser rústica, ela não pode ser consertada. Compre uma enxada de ferro na \`/loja itens\`.`
              : `⛏️ **|** Sua **Enxada** quebrou (0% de durabilidade)! Repare-a no comando \`/recuperar\` ou adquira outra na \`/loja itens\`.`,
            ephemeral: true
          });
        }

        // Validação do Regador
        const hasRegador = inv.regador && (typeof inv.regador === 'object' ? inv.regador.item > 0 : inv.regador > 0);
        if (!hasRegador) {
          return int.followUp({
            content: `🚿 **|** Você precisa de um **Regador** para hidratar o solo! Resgate seu kit em \`/start\` ou compre um na loja (\`/loja itens\`).`,
            ephemeral: true
          });
        }

        const regadorXp = typeof inv.regador === 'object' ? (inv.regador.Xp ?? 100) : 100;
        if (regadorXp <= 0) {
          const isPlastico = (typeof inv.regador === 'object' && (inv.regador.tipo === 'plastico' || inv.regador.reparavel === false));
          return int.followUp({
            content: isPlastico
              ? `🚿 **|** Seu **Regador de Plástico** quebrou completamente (0% de durabilidade)! Por ser descartável, não pode ser consertado. Adquira um Regador de Ferro permanente na \`/loja itens\`.`
              : `🚿 **|** Seu **Regador** está quebrado (0% de durabilidade)! Repare-o no comando \`/recuperar\` ou adquira outro na \`/loja itens\`.`,
            ephemeral: true
          });
        }

        const regadorAgua = typeof inv.regador === 'object' ? (inv.regador.agua ?? 100) : 100;
        if (regadorAgua < 1) {
          const isPlastico = (typeof inv.regador === 'object' && (inv.regador.tipo === 'plastico' || inv.regador.enchivel === false));
          return int.followUp({
            content: isPlastico
              ? `💧 **|** Seu **Regador de Plástico** está sem água! Como ele é descartável e não pode ser enchido, adquira um **Regador de Ferro** na \`/loja itens\` para continuar regando suas plantações.`
              : `💧 **|** Seu Regador está sem água! Clique em **💧 Encher Regador** antes de semear.`,
            ephemeral: true
          });
        }

        // Checa se já tem algo plantado
        const plantData = await getPlantacaoData();
        if (plantData['lote' + loteNum] > 1) {
          return int.followUp({ content: `⚠️ **|** O Lote ${loteNum} já possui uma cultura plantada!`, ephemeral: true });
        }

        // Desgaste inteligente conforme o tier
        const enxadaObj = typeof inv.enxada === 'object' ? inv.enxada : {};
        const regadorObj = typeof inv.regador === 'object' ? inv.regador : {};

        const desgasteEnxada = enxadaObj.tipo === 'madeira' ? 1 : 2;
        const desgasteRegador = regadorObj.tipo === 'plastico' ? 1 : 2;
        const consumoAgua = regadorObj.tipo === 'plastico' ? 1 : 10;

        const newEnxadaXp = Math.max(0, enxadaXp - desgasteEnxada);
        const newRegadorXp = Math.max(0, regadorXp - desgasteRegador);
        const newRegadorAgua = Math.max(0, regadorAgua - consumoAgua);

        // Atualiza consumíveis
        await database.ref(`economia/${interaction.user.id}/inventario/itens/Consumíveis`).update({
          [crop.seedKey]: seedCount - 1
        });

        // Atualiza ferramentas no Firebase preservando metadados
        await database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos/enxada`).update({
          item: 1,
          nome: enxadaObj.nome || (enxadaObj.tipo === 'madeira' ? 'Enxada de Madeira' : 'Enxada de Ferro'),
          tipo: enxadaObj.tipo || 'ferro',
          reparavel: enxadaObj.reparavel !== undefined ? enxadaObj.reparavel : true,
          Xp: newEnxadaXp
        });

        await database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos/regador`).update({
          item: 1,
          nome: regadorObj.nome || (regadorObj.tipo === 'plastico' ? 'Regador de Plástico' : 'Regador de Ferro'),
          tipo: regadorObj.tipo || 'ferro',
          enchivel: regadorObj.enchivel !== undefined ? regadorObj.enchivel : true,
          reparavel: regadorObj.reparavel !== undefined ? regadorObj.reparavel : true,
          Xp: newRegadorXp,
          agua: newRegadorAgua
        });

        // Atualiza Lote na Plantação
        await database.ref(`economia/${interaction.user.id}/Plantação`).update({
          ['lote' + loteNum]: cropId,
          ['tempolote' + loteNum]: Date.now(),
          ['regadolote' + loteNum]: Date.now()
        });

        currentPlantingLote = null;
        await renderPlantacao(msg);

        let warnText = '';
        if (newEnxadaXp <= 0) warnText += `\n⚠️ *Atenção: Sua Enxada quebrou! Conserte-a em /recuperar.*`;
        if (newRegadorXp <= 0) warnText += `\n⚠️ *Atenção: Seu Regador quebrou! Conserte-o em /recuperar.*`;
        if (newRegadorAgua < 10) warnText += `\n💧 *Aviso: Seu Regador ficou sem água! Encha-o na plantação.*`;

        const reply = await int.followUp({
          content: `🌱 **|** <@${interaction.user.id}>, você plantou **1 Semente de ${crop.displayName}** no **Lote ${loteNum}**! (💧 Água restante: **${newRegadorAgua}%**)${warnText}`
        });
        setTimeout(() => reply.delete().catch(() => {}), 12000);
      }

      // 5. PROCESSAR REGA (QUANDO COM SEDE)
      async function handleWatering(loteNum, int) {
        const inv = await getUserInventory(interaction.user);
        const hasRegador = inv.regador && (typeof inv.regador === 'object' ? inv.regador.item > 0 : inv.regador > 0);

        if (!hasRegador) {
          return int.followUp({ content: `Você precisa de um Regador para regar suas plantas! Compre na loja (\`/loja itens\`).`, ephemeral: true });
        }
        const regadorXp = typeof inv.regador === 'object' ? (inv.regador.Xp ?? 100) : 100;
        if (regadorXp <= 0) {
          return int.followUp({ content: `Seu Regador está quebrado! Repare-o em \`/recuperar\`.`, ephemeral: true });
        }
        const regadorAgua = typeof inv.regador === 'object' ? (inv.regador.agua ?? 100) : 100;
        if (regadorAgua < 10) {
          return int.followUp({ content: `💧 Seu Regador está sem água suficiente! Clique em **💧 Encher Regador** na plantação.`, ephemeral: true });
        }

        const plantData = await getPlantacaoData();
        const cropId = plantData['lote' + loteNum];
        const crop = CROP_CONFIG[cropId];

        const newRegadorXp = Math.max(0, regadorXp - 2);
        const newRegadorAgua = Math.max(0, regadorAgua - 10);

        await database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos/regador`).update({
          item: 1,
          nome: 'Regador',
          Xp: newRegadorXp,
          agua: newRegadorAgua
        });

        await database.ref(`economia/${interaction.user.id}/Plantação`).update({
          ['regadolote' + loteNum]: Date.now()
        });

        await renderPlantacao(msg);

        const reply = await int.followUp({
          content: `💧 **|** <@${interaction.user.id}>, você regou seu **${crop ? crop.displayName : 'plantio'}** no **Lote ${loteNum}**! A planta continua crescendo forte e saudável. (💧 Água restante: **${newRegadorAgua}%**)`
        });
        setTimeout(() => reply.delete().catch(() => {}), 10000);
      }

      // 6. PROCESSAR COLHEITA & APODRECIMENTO
      async function handleHarvest(loteNum, int) {
        const plantData = await getPlantacaoData();
        const loteInfo = evaluateLote(loteNum, plantData);
        const inv = await getUserInventory(interaction.user);

        // Desgaste da Enxada para colher/limpar
        const hasEnxada = inv.enxada && (typeof inv.enxada === 'object' ? inv.enxada.item > 0 : inv.enxada > 0);
        if (hasEnxada) {
          const enxadaXp = typeof inv.enxada === 'object' ? (inv.enxada.Xp ?? 100) : 100;
          if (enxadaXp > 0) {
            await database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos/enxada`).update({
              item: 1,
              nome: 'Enxada',
              Xp: Math.max(0, enxadaXp - 2)
            });
          }
        }

        // Reseta o lote para arado (1)
        await database.ref(`economia/${interaction.user.id}/Plantação`).update({
          ['lote' + loteNum]: 1,
          ['tempolote' + loteNum]: 0,
          ['regadolote' + loteNum]: 0
        });

        // Caso tenha apodrecido
        if (loteInfo.status === 'rotten') {
          const currentPodre = inv.planta_podre || 0;
          await database.ref(`economia/${interaction.user.id}/inventario/itens/Consumíveis`).update({
            planta_podre: currentPodre + 1
          });
          await XpUpdate(interaction, interaction.user, 3);

          await renderPlantacao(msg);
          const reply = await int.followUp({
            content: `🥀 **|** <@${interaction.user.id}>, a sua plantação de **${loteInfo.crop.displayName}** passou muito tempo na terra e **apodreceu**! Você limpou o terreno e obteve **1x Planta Podre** (*+3 XP*).`
          });
          setTimeout(() => reply.delete().catch(() => {}), 15000);
          return;
        }

        // Colheita com Qualidades (Excelente, Bom, Ruim)
        const crop = loteInfo.crop;
        const qualidade = loteInfo.qualidade;

        let quantia = 2;
        let xpGained = crop.xp;
        let qualTexto = '';

        if (qualidade === 'excelente') {
          quantia = Math.floor(Math.random() * 4) + 3; // 3 a 6
          xpGained = Math.round(crop.xp * 1.5);
          qualTexto = `⭐ **EXCELENTE**! (+50% valor e XP)`;
        } else if (qualidade === 'bom') {
          quantia = Math.floor(Math.random() * 3) + 2; // 2 a 4
          xpGained = crop.xp;
          qualTexto = `✨ **Boa**`;
        } else {
          quantia = Math.floor(Math.random() * 2) + 1; // 1 a 2
          xpGained = Math.max(5, Math.round(crop.xp * 0.5));
          qualTexto = `📉 **Ruim** (Demorou a ser colhida)`;
        }

        // Bônus VIP de Colheita
        const vipInfo = await CheckUserVip(interaction.user);
        let vipBonusTxt = '';
        if (vipInfo.isVip) {
          const bonusItems = vipInfo.level >= 2 ? 2 : 1;
          quantia += bonusItems;
          xpGained = Math.round(xpGained * (vipInfo.level >= 2 ? 1.5 : 1.25));
          vipBonusTxt = `\n> ${vipInfo.emojiVip} **Bônus ${vipInfo.levelName}:** +${bonusItems}x ${crop.displayName} bônus!`;
        }

        // Chaves de armazenamento
        const qualKey = `${crop.name}_${qualidade}`;
        const currentQualCount = inv[qualKey] || 0;
        const currentBaseCount = inv[crop.name] || 0;

        await database.ref(`economia/${interaction.user.id}/inventario/itens/Consumíveis`).update({
          [qualKey]: currentQualCount + quantia,
          [crop.name]: currentBaseCount + quantia
        });

        await XpUpdate(interaction, interaction.user, xpGained);

        await renderPlantacao(msg);

        const reply = await int.followUp({
          content: `${crop.emoji} **|** <@${interaction.user.id}>, você colheu o **Lote ${loteNum}**!\n> Qualidade: ${qualTexto}\n> Recebido: **${quantia}x ${crop.displayName}** e *${xpGained} XP*!${vipBonusTxt}`
        });
        setTimeout(() => reply.delete().catch(() => {}), 15000);
      }

    } catch (error) {
      console.error('[Plantação Error]:', error);
      return interaction.followUp({ content: `Ocorreu um erro inesperado na utilização do comando de plantação.` });
    }
  }
};