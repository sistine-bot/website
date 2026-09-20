const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const ms = require('ms');
const parseMs = require('parse-ms');
const { getUserInventory, XpUpdate, getUserMoney, UpdateMoneyWallet, TransactionUpdate, Format, CheckUserVip } = require('../../utils/functions.js');
const itensAPI = require('../../utils/itens.json');

const PRECOS_ESPACOS = {
  1: 0,
  2: 5000,
  3: 12000,
  4: 25000,
  5: 45000,
  6: 70000
};

const ANIMAIS_CONFIG = {
  1: {
    id: 1,
    name: 'Galinha',
    displayName: 'Galinha',
    babyName: 'Pintinho',
    babyEmoji: '🐣',
    adultEmoji: '<:galinha:947544319261286432>',
    babyPrice: 2500,
    adultSellPrice: 2500,
    growthTime: ms('10m'),
    productionTime: ms('15m'),
    productKey: 'Ovo',
    productName: 'Ovo',
    productEmoji: '<:ovo:1002603609139187733>',
    minYield: 2,
    maxYield: 5,
    xpFeed: 15,
    xpCollect: 20,
    xpPet: 10,
    careCooldown: ms('3m'),
    sound: '🐥 Piu piu! O pintinho piou alegremente e se aninhou na sua mão!'
  },
  2: {
    id: 2,
    name: 'Vaca',
    displayName: 'Vaca',
    babyName: 'Bezerro',
    babyEmoji: '🐮',
    adultEmoji: '<:vaca:947544320637010010>',
    babyPrice: 7500,
    adultSellPrice: 7500,
    growthTime: ms('20m'),
    productionTime: ms('30m'),
    productKey: 'Leite',
    productName: 'Leite',
    productEmoji: '<:leite:1002603490536853595>',
    minYield: 2,
    maxYield: 5,
    xpFeed: 25,
    xpCollect: 35,
    xpPet: 15,
    careCooldown: ms('4m'),
    sound: '🐮 Muuuu! Lambeu sua mão com carinho e abanou o rabinho alegremente!'
  },
  3: {
    id: 3,
    name: 'Porco',
    displayName: 'Porco',
    babyName: 'Leitão',
    babyEmoji: '🐷',
    adultEmoji: '<:porco:947544319034794026>',
    babyPrice: 15000,
    adultSellPrice: 15000,
    growthTime: ms('35m'),
    productionTime: ms('50m'),
    productKey: 'Bacon',
    productName: 'Bacon',
    productEmoji: '<:bacon:1002603721227767848>',
    minYield: 2,
    maxYield: 4,
    xpFeed: 35,
    xpCollect: 50,
    xpPet: 20,
    careCooldown: ms('5m'),
    sound: '🐷 Oinc oinc! Deu pulinhos alegres ao receber carinho na barriguinha!'
  }
};

function renderProgressBar(percent, length = 7) {
  const filledCount = Math.min(length, Math.max(0, Math.round((percent / 100) * length)));
  const emptyCount = length - filledCount;
  return '█'.repeat(filledCount) + '░'.repeat(emptyCount);
}

function renderHeartBar(amor) {
  const hearts = Math.min(5, Math.max(1, Math.round((amor / 100) * 5)));
  return '❤️'.repeat(hearts) + '🤍'.repeat(5 - hearts);
}

module.exports = {
  name: "fazenda",
  description: "⌊⚙️ Módulos⌉ Gerencie seu rancho, crie filhotes, alimente seus animais e colha produtos frescos.",
  type: ApplicationCommandType.ChatInput,

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const msg = await interaction.followUp({ content: `<a:loading:929931026589954128> **|** Carregando sua fazenda...` });

      // Garante que o Espaço 1 esteja liberado por padrão
      const snapInit = await database.ref(`economia/${interaction.user.id}/Fazenda/Animal`).once('value');
      const valInit = snapInit.val() || {};
      if (valInit.espaco_1_desbloqueado === undefined) {
        await database.ref(`economia/${interaction.user.id}/Fazenda/Animal/espaco_1_desbloqueado`).set(1);
      }

      let currentView = 'main'; // 'main' | 'adoption' | 'details'
      let selectedSlot = null;

      await renderFazenda(msg);

      const coletor = msg.createMessageComponentCollector({
        filter: (x) => {
          if (x.user.id !== interaction.user.id) {
            x.reply({ content: `❌ **|** Você não pode interagir com o rancho de outro usuário.`, ephemeral: true }).catch(() => {});
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

          // 1. Voltar aos Espaços Principais
          if (action === 'voltar_espacos') {
            currentView = 'main';
            selectedSlot = null;
            await renderFazenda(msg);
            return;
          }

          // 2. Expandir Rancho
          if (action === 'expandir_rancho') {
            await handleExpandirRancho(int);
            return;
          }

          // 3. Comprar Ração Rápida
          if (action === 'comprar_racao') {
            await handleComprarRacao(int);
            if (currentView === 'adoption' && selectedSlot) {
              await renderAdoptionMenu(selectedSlot);
            } else if (currentView === 'details' && selectedSlot) {
              await renderAnimalDetailsMenu(selectedSlot);
            } else {
              await renderFazenda(msg);
            }
            return;
          }

          // 4. Atualizar Fazenda
          if (action === 'atualizar_fazenda') {
            currentView = 'main';
            selectedSlot = null;
            await renderFazenda(msg);
            return;
          }

          // 5. Seleção de Filhote via StringSelectMenu
          if (int.isStringSelectMenu() && action.startsWith('select_adotar_')) {
            const espacoNum = parseInt(action.replace('select_adotar_', ''));
            const animalId = parseInt(int.values[0]);
            await handleAdotar(espacoNum, animalId, int);
            return;
          }

          // 6. Seleção de Filhote via Botão Rápido
          if (action.startsWith('adotar_')) {
            const parts = action.split('_');
            const espacoNum = parseInt(parts[1]);
            const animalId = parseInt(parts[2]);
            await handleAdotar(espacoNum, animalId, int);
            return;
          }

          // 7. Ações de Detalhes: Dar Carinho
          if (action.startsWith('carinho_')) {
            const espacoNum = parseInt(action.split('_')[1]);
            await handleCarinho(espacoNum, int);
            return;
          }

          // 8. Ações de Detalhes: Alimentar
          if (action.startsWith('alimentar_')) {
            const espacoNum = parseInt(action.split('_')[1]);
            await handleAlimentar(espacoNum, int);
            return;
          }

          // 9. Ações de Detalhes: Coletar
          if (action.startsWith('coletar_')) {
            const espacoNum = parseInt(action.split('_')[1]);
            await handleColetar(espacoNum, int);
            return;
          }

          // 10. Ações de Detalhes: Vender Animal
          if (action.startsWith('vender_')) {
            const espacoNum = parseInt(action.split('_')[1]);
            await handleVender(espacoNum, int);
            return;
          }

          // 11. Cliques nos Espaços (espaco_1 a espaco_6)
          if (action.startsWith('espaco_')) {
            const espacoNum = parseInt(action.split('_')[1]);
            const fazendaData = await getFazendaData();
            const espacoInfo = evaluateEspaco(espacoNum, fazendaData);

            if (espacoInfo.status === 'locked') {
              return int.followUp({
                content: `🔒 **|** Este espaço está bloqueado. Use o botão **Expandir Rancho** abaixo para liberá-lo!`,
                ephemeral: true
              });
            }

            if (espacoInfo.status === 'empty') {
              currentView = 'adoption';
              selectedSlot = espacoNum;
              await renderAdoptionMenu(espacoNum);
              return;
            }

            if (espacoInfo.status === 'adult_ready') {
              await handleColetar(espacoNum, int);
              return;
            }

            if (espacoInfo.status === 'adult_hungry' || espacoInfo.status === 'baby_hungry') {
              const inv = await getUserInventory(interaction.user);
              if ((inv.ração_animal || 0) >= 1) {
                await handleAlimentar(espacoNum, int);
                return;
              } else {
                return int.followUp({
                  content: `🥫 **|** Seu animal está com fome, mas você não tem **Ração Animal**! Compre ração clicando no botão **Comprar Ração** abaixo.`,
                  ephemeral: true
                });
              }
            }

            // Caso esteja crescendo ou produzindo, abre a tela de detalhes e cuidados!
            currentView = 'details';
            selectedSlot = espacoNum;
            await renderAnimalDetailsMenu(espacoNum);
            return;
          }

        } catch (err) {
          console.error('[Fazenda Action Error]:', err);
        }
      });

      coletor.on('end', async () => {
        try {
          const disableRows = (await buildMainComponents()).map(row => {
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
      async function getFazendaData() {
        const snap = await database.ref(`economia/${interaction.user.id}/Fazenda/Animal`).once('value');
        return snap.val() || {};
      }

      function evaluateEspaco(num, data) {
        const isUnlocked = num === 1 || !!data[`espaco_${num}_desbloqueado`] || !!data[`animal_${num}`];

        if (!isUnlocked) {
          return {
            num,
            status: 'locked',
            name: 'Bloqueado',
            label: `Espaço ${num}`,
            emoji: '🔒',
            style: ButtonStyle.Secondary,
            disabled: true,
            price: PRECOS_ESPACOS[num],
            desc: `🔒 **Espaço ${num}** - Bloqueado (${Format(PRECOS_ESPACOS[num])})`
          };
        }

        const animalId = data[`animal_${num}`];
        if (!animalId || !ANIMAIS_CONFIG[animalId]) {
          return {
            num,
            status: 'empty',
            name: 'Vazio',
            label: `Espaço ${num} (Adotar)`,
            emoji: '🪹',
            style: ButtonStyle.Secondary,
            disabled: false,
            desc: `🪹 **Espaço ${num}** - Rancho Vazio • Pronto para abrigar um filhote`
          };
        }

        const animal = ANIMAIS_CONFIG[animalId];
        let fase = data[`animal_${num}_fase`] || 'adulto';
        const nascimento = data[`animal_${num}_nascimento`] || data[`animal_${num}_tempo`] || Date.now();
        const bonus = data[`animal_${num}_bonus_tempo`] || 0;
        const now = Date.now();
        const amor = Math.min(100, Math.max(0, data[`animal_${num}_amor`] !== undefined ? data[`animal_${num}_amor`] : 60));
        const alimento = data[`animal_${num}_alimento`] || 0;
        const tempoGravado = data[`animal_${num}_tempo`] || 0;

        // Checagem de crescimento de filhote
        if (fase === 'filhote') {
          const tempoDecorrido = (now - nascimento) + bonus;
          if (tempoDecorrido >= animal.growthTime) {
            fase = 'adulto';
          } else {
            const tempoRestante = Math.max(0, animal.growthTime - tempoDecorrido);
            const pct = Math.min(100, Math.max(0, Math.floor((tempoDecorrido / animal.growthTime) * 100)));
            const prontoEm = nascimento + animal.growthTime - bonus;
            const bar = renderProgressBar(pct, 7);

            if (alimento === 0) {
              return {
                num,
                status: 'baby_hungry',
                animal,
                fase: 'filhote',
                pct,
                amor,
                bar,
                tempoRestante,
                prontoEm,
                label: `Espaço ${num} (Alimentar)`,
                emoji: '🥫',
                style: ButtonStyle.Primary,
                disabled: false,
                desc: `${animal.babyEmoji} **Espaço ${num}** - **${animal.babyName}** (Filhote) • [${bar}] ${pct}% (<t:${~~(prontoEm / 1000)}:R>) • 🍽️ **Com Fome!**`
              };
            }

            return {
              num,
              status: 'baby_growing',
              animal,
              fase: 'filhote',
              pct,
              amor,
              bar,
              tempoRestante,
              prontoEm,
              label: `Espaço ${num} (${animal.babyName})`,
              emoji: animal.babyEmoji,
              style: ButtonStyle.Secondary,
              disabled: false,
              desc: `${animal.babyEmoji} **Espaço ${num}** - **${animal.babyName}** (Filhote) • [${bar}] ${pct}% (<t:${~~(prontoEm / 1000)}:R>) • 🍼 Alimentado • ❤️ ${amor}% Amor`
            };
          }
        }

        // Se for Adulto
        if (alimento === 0) {
          return {
            num,
            status: 'adult_hungry',
            animal,
            fase: 'adulto',
            amor,
            label: `Espaço ${num} (Alimentar)`,
            emoji: '🥫',
            style: ButtonStyle.Primary,
            disabled: false,
            desc: `${animal.adultEmoji} **Espaço ${num}** - **${animal.displayName}** (Adulto) • 🍽️ **Com Fome!** (Alimente para produzir) • ❤️ ${amor}% Amor`
          };
        }

        // Adulto alimentado: Checa tempo de produção
        const prontoEm = tempoGravado + animal.productionTime;
        if (now >= prontoEm) {
          return {
            num,
            status: 'adult_ready',
            animal,
            fase: 'adulto',
            amor,
            label: `Espaço ${num} (Coletar)`,
            emoji: '🧺',
            style: ButtonStyle.Success,
            disabled: false,
            desc: `🧺 **Espaço ${num}** - **${animal.displayName}** • ${animal.productEmoji} **${animal.productName}s Prontos para Coletar!** (⭐ Amor: ${amor}%)`
          };
        }

        const tempoRestante = Math.max(0, prontoEm - now);

        return {
          num,
          status: 'adult_producing',
          animal,
          fase: 'adulto',
          amor,
          tempoRestante,
          prontoEm,
          label: `Espaço ${num} (${animal.displayName})`,
          emoji: '⏳',
          style: ButtonStyle.Secondary,
          disabled: false,
          desc: `${animal.adultEmoji} **Espaço ${num}** - **${animal.displayName}** • ⏳ Produzindo ${animal.productName}s (<t:${~~(prontoEm / 1000)}:R>) • ❤️ ${amor}% Amor`
        };
      }

      // ==========================================
      // CONSTRUÇÃO DE EMBED & COMPONENTES PRINCIPAIS
      // ==========================================
      async function buildMainComponents() {
        const fazendaData = await getFazendaData();
        const espacos = [1, 2, 3, 4, 5, 6].map(n => evaluateEspaco(n, fazendaData));

        const row1 = new ActionRowBuilder();
        espacos.slice(0, 3).forEach(e => {
          row1.addComponents(
            new ButtonBuilder()
              .setCustomId(`espaco_${e.num}`)
              .setLabel(e.label)
              .setEmoji(e.emoji)
              .setStyle(e.style)
          );
        });

        const row2 = new ActionRowBuilder();
        espacos.slice(3, 6).forEach(e => {
          row2.addComponents(
            new ButtonBuilder()
              .setCustomId(`espaco_${e.num}`)
              .setLabel(e.label)
              .setEmoji(e.emoji)
              .setStyle(e.style)
          );
        });

        const row3 = new ActionRowBuilder();
        const nextLocked = espacos.find(e => e.status === 'locked');
        const { carteira } = await getUserMoney(interaction.user);

        if (nextLocked) {
          const preco = nextLocked.price;
          const canAfford = carteira >= preco;
          row3.addComponents(
            new ButtonBuilder()
              .setCustomId("expandir_rancho")
              .setLabel(`Expandir Rancho (${Format(preco)})`)
              .setEmoji('🏡')
              .setStyle(canAfford ? ButtonStyle.Success : ButtonStyle.Secondary)
              .setDisabled(!canAfford)
          );
        } else {
          row3.addComponents(
            new ButtonBuilder()
              .setCustomId("rancho_maximo")
              .setLabel("Rancho no Nível Máximo (6/6)")
              .setEmoji('⭐')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );
        }

        row3.addComponents(
          new ButtonBuilder()
            .setCustomId("comprar_racao")
            .setLabel("Comprar Ração (3x)")
            .setEmoji('🥫')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("atualizar_fazenda")
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Secondary)
        );

        return [row1, row2, row3];
      }

      async function renderFazenda(targetMsg) {
        const fazendaData = await getFazendaData();
        const espacos = [1, 2, 3, 4, 5, 6].map(n => evaluateEspaco(n, fazendaData));
        const inv = await getUserInventory(interaction.user);
        const { carteira } = await getUserMoney(interaction.user);

        const totalAnimais = espacos.filter(e => e.status !== 'locked' && e.status !== 'empty').length;
        const totalFilhotes = espacos.filter(e => e.fase === 'filhote').length;
        const totalAdultos = espacos.filter(e => e.fase === 'adulto').length;
        const totalDesbloqueados = espacos.filter(e => e.status !== 'locked').length;

        const racaoCount = inv.ração_animal || 0;
        const ovosCount = inv.Ovo || 0;
        const leiteCount = inv.Leite || 0;
        const baconCount = inv.Bacon || 0;

        const descEspacos = espacos.map(e => e.desc).join('\n');

        const embed = new EmbedBuilder()
          .setColor(color.embed || "#22c55e")
          .setAuthor({ name: `👨‍🌾 Fazenda de ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ extension: 'png' }) })
          .setDescription(
            `> Cuide dos seus animais alimentando, dando carinho e colhendo seus valiosos produtos.\n` +
            `> Adquira filhotes nos espaços vazios e ajude-os a crescerem fortes e produtivos!\n\n` +
            `**📦 Estoque & Recursos:**\n` +
            `🥫 Ração Animal: **${racaoCount}** un. • 💰 Carteira: **${Format(carteira)}**\n` +
            `🧺 Armazém de Produtos: 🥚 **${ovosCount}** Ovos • 🥛 **${leiteCount}** Leites • 🥓 **${baconCount}** Bacons\n` +
            `🐾 Ocupação do Rancho: **${totalAnimais}/${totalDesbloqueados}** (🐣 Filhotes: **${totalFilhotes}** | 🏆 Adultos: **${totalAdultos}**)\n\n` +
            `**🏡 Seus Espaços do Rancho:**\n${descEspacos}`
          )
          .setFooter({ text: `Clique nos espaços abaixo para gerenciar ou alimentar seus animais | 6 Espaços Modulares` })
          .setTimestamp();

        const components = await buildMainComponents();
        await targetMsg.edit({ content: `${interaction.user}`, embeds: [embed], components }).catch(console.error);
      }

      // ==========================================
      // MENU DE ADOÇÃO / COMPRA DE FILHOTES
      // ==========================================
      async function renderAdoptionMenu(espacoNum) {
        const { carteira } = await getUserMoney(interaction.user);
        const inv = await getUserInventory(interaction.user);

        const filhotes = Object.values(ANIMAIS_CONFIG);

        const embed = new EmbedBuilder()
          .setColor(color.embed || "#22c55e")
          .setAuthor({ name: `🏡 Fazenda de ${interaction.user.username} • Adotar Filhote`, iconURL: interaction.user.displayAvatarURL({ extension: 'png' }) })
          .setTitle(`🐣 Escolha um Filhote para o Espaço ${espacoNum}`)
          .setDescription(
            `> Compre um filhote para criar com amor e carinho no seu rancho.\n` +
            `> Ao alimentá-lo e cuidar dele, ele crescerá até se tornar um animal adulto produtivo!\n\n` +
            `💰 Saldo na Carteira: **${Format(carteira)}**\n` +
            `🥫 Rações em Estoque: **${inv.ração_animal || 0}** un.\n\n` +
            `**🐾 Filhotes Disponíveis:**\n` +
            filhotes.map(f => {
              const canAfford = carteira >= f.babyPrice;
              return `${f.babyEmoji} **${f.babyName}** (Filhote de ${f.displayName})\n` +
                     `> 💰 Preço: **${Format(f.babyPrice)}** ${canAfford ? '✅' : '❌'}\n` +
                     `> ⏳ Tempo para Crescer: **${ms(f.growthTime)}** *(acelera com ração e carinho!)*\n` +
                     `> 🏆 Produção Adulta: ${f.productEmoji} **${f.productName}** (${f.minYield} a ${f.maxYield} un. a cada ${ms(f.productionTime)})\n`;
            }).join('\n')
          )
          .setFooter({ text: `Selecione no menu suspenso ou clique nos botões rápidos abaixo` });

        // Menu suspenso
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`select_adotar_${espacoNum}`)
          .setPlaceholder('🐣 Escolha o filhote no menu suspenso...')
          .addOptions(
            filhotes.map(f => ({
              label: `${f.babyName} (${Format(f.babyPrice)})`,
              description: `Cresce em ${ms(f.growthTime)} | Produz: ${f.productName} (${f.minYield}-${f.maxYield} un.)`,
              value: `${f.id}`,
              emoji: f.babyEmoji
            }))
          );
        const rowSelect = new ActionRowBuilder().addComponents(selectMenu);

        // Botões rápidos
        const rowButtons = new ActionRowBuilder();
        filhotes.forEach(f => {
          const canAfford = carteira >= f.babyPrice;
          rowButtons.addComponents(
            new ButtonBuilder()
              .setCustomId(`adotar_${espacoNum}_${f.id}`)
              .setLabel(`${f.babyName} (${Format(f.babyPrice)})`)
              .setEmoji(f.babyEmoji)
              .setStyle(canAfford ? ButtonStyle.Success : ButtonStyle.Secondary)
              .setDisabled(!canAfford)
          );
        });

        // Controles de navegação
        const rowControls = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('voltar_espacos')
            .setLabel('Voltar aos Espaços')
            .setEmoji('🔙')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('comprar_racao')
            .setLabel('Comprar Ração (3x)')
            .setEmoji('🥫')
            .setStyle(carteira >= 900 ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );

        await msg.edit({ content: `${interaction.user}`, embeds: [embed], components: [rowSelect, rowButtons, rowControls] }).catch(console.error);
      }

      // ==========================================
      // MENU DETALHADO DE CUIDADOS COM O ANIMAL
      // ==========================================
      async function renderAnimalDetailsMenu(espacoNum) {
        const fazendaData = await getFazendaData();
        const espacoInfo = evaluateEspaco(espacoNum, fazendaData);
        const inv = await getUserInventory(interaction.user);

        if (espacoInfo.status === 'locked' || espacoInfo.status === 'empty') {
          return renderFazenda(msg);
        }

        const animal = espacoInfo.animal;
        const isBaby = espacoInfo.fase === 'filhote';
        const amor = espacoInfo.amor;
        const hearts = renderHeartBar(amor);
        const lastCarinho = fazendaData[`animal_${espacoNum}_carinho`] || 0;
        const careCooldown = animal.careCooldown;
        const now = Date.now();
        const canPet = (now - lastCarinho) >= careCooldown;
        const petCooldownRemaining = Math.max(0, careCooldown - (now - lastCarinho));
        const parsedPetCd = parseMs(petCooldownRemaining);
        const petCdTxt = `${parsedPetCd.minutes}m ${parsedPetCd.seconds}s`;

        const isHungry = espacoInfo.status === 'baby_hungry' || espacoInfo.status === 'adult_hungry';
        const isReady = espacoInfo.status === 'adult_ready';
        const hasRacao = (inv.ração_animal || 0) >= 1;

        let amorQualityTxt = '';
        if (amor >= 80) amorQualityTxt = '⭐ Radiante de Felicidade (Produção de ouro +50% XP)';
        else if (amor >= 40) amorQualityTxt = '✨ Contente & Saudável (Produção farta)';
        else amorQualityTxt = '📉 Triste & Carente (Produção reduzida, dê carinho!)';

        let statusTxt = '';
        if (isBaby) {
          statusTxt = `🐾 **Estágio:** 🐣 Filhote em Crescimento\n` +
                      `📈 **Desenvolvimento:** [${espacoInfo.bar}] **${espacoInfo.pct}%**\n` +
                      `⏳ **Adulto em:** <t:${~~(espacoInfo.prontoEm / 1000)}:R>\n` +
                      `💡 *Alimentar (+15%) e dar carinho (+1m) acelera o crescimento para adulto!*`;
        } else {
          if (isReady) {
            statusTxt = `🐾 **Estágio:** 🏆 Adulto Produtivo\n` +
                        `🧺 **Status:** ${animal.productEmoji} **Pronto para Coletar!**\n` +
                        `📦 *Clique no botão verde abaixo para colher seus produtos.*`;
          } else if (isHungry) {
            statusTxt = `🐾 **Estágio:** 🏆 Adulto Produtivo\n` +
                        `🍽️ **Status:** Com muita fome! Alimente com **1x Ração Animal** para iniciar a produção.`;
          } else {
            statusTxt = `🐾 **Estágio:** 🏆 Adulto Produtivo\n` +
                        `⏳ **Status:** Produzindo ${animal.productName}s\n` +
                        `🕒 **Conclusão:** <t:${~~(espacoInfo.prontoEm / 1000)}:R>\n` +
                        `💡 *Mantenha o carinho alto para garantir produtos de qualidade excelente!*`;
          }
        }

        const embed = new EmbedBuilder()
          .setColor(color.embed || "#22c55e")
          .setAuthor({ name: `🏡 Rancho: Espaço ${espacoNum} • Cuidados com o Animal`, iconURL: interaction.user.displayAvatarURL({ extension: 'png' }) })
          .setTitle(`${isBaby ? animal.babyEmoji : animal.adultEmoji} ${isBaby ? animal.babyName : animal.displayName} (${isBaby ? 'Filhote' : 'Adulto'})`)
          .setDescription(
            `${statusTxt}\n\n` +
            `**❤️ Afeto & Felicidade:**\n` +
            `${hearts} **${amor}%** • ${amorQualityTxt}\n\n` +
            `**🥫 Suprimentos & Fome:**\n` +
            `Rações no inventário: **${inv.ração_animal || 0}** un.\n` +
            `Necessidade alimentar: ${isHungry ? '⚠️ **Faminto (precisa de ração)**' : '✅ **Satisfeito & Nutrido**'}\n\n` +
            `**🎁 Item Produzido:** ${animal.productEmoji} **${animal.productName}** (${animal.minYield} a ${animal.maxYield} un.)`
          )
          .setFooter({ text: `Cuide bem do seu animal com carinho e alimentação para colheitas abundantes!` });

        const rowActions = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`carinho_${espacoNum}`)
            .setLabel(canPet ? 'Dar Carinho (+Amor)' : `Dar Carinho (${petCdTxt})`)
            .setEmoji('❤️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!canPet),
          new ButtonBuilder()
            .setCustomId(`alimentar_${espacoNum}`)
            .setLabel(isHungry ? 'Alimentar (1x Ração)' : 'Alimentado')
            .setEmoji('🥫')
            .setStyle(isHungry ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(!isHungry || !hasRacao),
          new ButtonBuilder()
            .setCustomId(`coletar_${espacoNum}`)
            .setLabel('Coletar Produtos')
            .setEmoji('🧺')
            .setStyle(ButtonStyle.Success)
            .setDisabled(!isReady)
        );

        const rowControls = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('voltar_espacos')
            .setLabel('Voltar aos Espaços')
            .setEmoji('🔙')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`vender_${espacoNum}`)
            .setLabel(`Vender Animal (${Format(isBaby ? Math.round(animal.babyPrice * 0.5) : animal.adultSellPrice)})`)
            .setEmoji('🏷️')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('comprar_racao')
            .setLabel('Comprar Ração')
            .setEmoji('🥫')
            .setStyle(ButtonStyle.Secondary)
        );

        await msg.edit({ content: `${interaction.user}`, embeds: [embed], components: [rowActions, rowControls] }).catch(console.error);
      }

      // ==========================================
      // AÇÕES DO USUÁRIO
      // ==========================================

      // 1. EXPANDIR RANCHO
      async function handleExpandirRancho(int) {
        const fazendaData = await getFazendaData();
        const espacos = [1, 2, 3, 4, 5, 6].map(n => evaluateEspaco(n, fazendaData));
        const proximo = espacos.find(e => e.status === 'locked');

        if (!proximo) {
          return int.followUp({ content: `Você já expandiu todos os espaços disponíveis no rancho!`, ephemeral: true });
        }

        const RANCHO_ESPACOS_REQUISITOS = {
          2: { nivel: 4, preco: 5000 },
          3: { nivel: 8, preco: 12000 },
          4: { nivel: 14, preco: 25000 },
          5: { nivel: 20, preco: 45000 },
          6: { nivel: 28, preco: 70000 }
        };

        const req = RANCHO_ESPACOS_REQUISITOS[proximo.num];
        const lvlSnap = await database.ref(`economia/${interaction.user.id}/nível`).once('value');
        const userLevel = lvlSnap.val()?.nível || 0;

        if (req && userLevel < req.nivel) {
          return int.followUp({
            content: `🔒 **|** Você precisa atingir o **Nível ${req.nivel}** para expandir o rancho para o **Espaço ${proximo.num}**! (Seu nível atual: **${userLevel}**).\n💡 *Dica: Continue cuidando dos seus animais e colhendo para subir de nível.*`,
            ephemeral: true
          });
        }

        const preco = proximo.price;
        const { carteira } = await getUserMoney(interaction.user);

        if (carteira < preco) {
          return int.followUp({
            content: `❌ **|** Saldo insuficiente! Você precisa de **${Format(preco)}** na mão para expandir para o **Espaço ${proximo.num}**.`,
            ephemeral: true
          });
        }

        await UpdateMoneyWallet(interaction, interaction.user, '-', preco, {
          type: 'fazenda_compra',
          amount: preco,
          item: `Rancho Espaço ${proximo.num}`
        });

        await database.ref(`economia/${interaction.user.id}/Fazenda/Animal/espaco_${proximo.num}_desbloqueado`).set(1);

        await renderFazenda(msg);
        const reply = await int.followUp({
          content: `🎉 **|** Parabéns <@${interaction.user.id}>! Você expandiu seu rancho com sucesso e desbloqueou o **Espaço ${proximo.num}**!`
        });
        setTimeout(() => reply.delete().catch(() => {}), 10000);
      }

      // 2. COMPRAR RAÇÃO DIRETO
      async function handleComprarRacao(int) {
        const preco = 900;
        const { carteira } = await getUserMoney(interaction.user);

        if (carteira < preco) {
          return int.followUp({
            content: `❌ **|** Saldo insuficiente! Você precisa de **${Format(preco)}** na carteira para comprar 3 unidades de Ração Animal.`,
            ephemeral: true
          });
        }

        const inv = await getUserInventory(interaction.user);
        const currentRacao = inv.ração_animal || 0;

        await UpdateMoneyWallet(interaction, interaction.user, '-', preco, {
          type: 'fazenda_compra',
          amount: preco,
          item: '3x Ração Animal'
        });

        await database.ref(`economia/${interaction.user.id}/inventario/itens/Consumíveis`).update({
          ração_animal: currentRacao + 3
        });

        const reply = await int.followUp({
          content: `🥫 **|** <@${interaction.user.id}>, você comprou **3x Ração Animal** por **${Format(preco)}**! Seu estoque foi abastecido.`
        });
        setTimeout(() => reply.delete().catch(() => {}), 10000);
      }

      // 3. ADOTAR / COMPRAR FILHOTE
      async function handleAdotar(espacoNum, animalId, int) {
        const animal = ANIMAIS_CONFIG[animalId];
        if (!animal) return;

        const fazendaData = await getFazendaData();
        if (fazendaData[`animal_${espacoNum}`] > 0) {
          return int.followUp({ content: `⚠️ **|** Este espaço já possui um animal abrigado!`, ephemeral: true });
        }
        const ANIMAL_LEVELS = {
          1: 0,   // Galinha
          2: 12,  // Vaca
          3: 22   // Porco
        };

        const reqNivel = ANIMAL_LEVELS[animalId] || 0;
        const lvlSnap = await database.ref(`economia/${interaction.user.id}/nível`).once('value');
        const userLevel = lvlSnap.val()?.nível || 0;

        if (userLevel < reqNivel) {
          return int.followUp({
            content: `🔒 **|** Você precisa atingir o **Nível ${reqNivel}** para adotar um filhote de **${animal.displayName}**! (Seu nível atual: **${userLevel}**).\n💡 *Dica: Ganhe XP alimentando e acariciando seus animais atuais para desbloquear novas espécies!*`,
            ephemeral: true
          });
        }

        const { carteira } = await getUserMoney(interaction.user);
        if (carteira < animal.babyPrice) {
          return int.followUp({
            content: `❌ **|** Saldo insuficiente! Você precisa de **${Format(animal.babyPrice)}** na carteira para comprar um filhote de **${animal.babyName}**.`,
            ephemeral: true
          });
        }

        await UpdateMoneyWallet(interaction, interaction.user, '-', animal.babyPrice, {
          type: 'fazenda_compra',
          amount: animal.babyPrice,
          item: `Filhote ${animal.babyName}`
        });

        await database.ref(`economia/${interaction.user.id}/Fazenda/Animal`).update({
          [`animal_${espacoNum}`]: animal.id,
          [`animal_${espacoNum}_fase`]: 'filhote',
          [`animal_${espacoNum}_nascimento`]: Date.now(),
          [`animal_${espacoNum}_alimento`]: 0,
          [`animal_${espacoNum}_tempo`]: Date.now(),
          [`animal_${espacoNum}_carinho`]: 0,
          [`animal_${espacoNum}_amor`]: 60,
          [`animal_${espacoNum}_bonus_tempo`]: 0
        });

        currentView = 'main';
        selectedSlot = null;
        await renderFazenda(msg);

        const reply = await int.followUp({
          content: `${animal.babyEmoji} **|** Parabéns <@${interaction.user.id}>! Você comprou um filhote de **${animal.babyName}** para o **Espaço ${espacoNum}**!\n> Alimente-o e dê carinho para ajudá-lo a crescer forte e saudável!`
        });
        setTimeout(() => reply.delete().catch(() => {}), 12000);
      }

      // 4. ALIMENTAR ANIMAL
      async function handleAlimentar(espacoNum, int) {
        const inv = await getUserInventory(interaction.user);
        const racao = inv.ração_animal || 0;

        if (racao < 1) {
          return int.followUp({
            content: `❌ **|** Você não possui **Ração Animal** suficiente! Clique no botão **Comprar Ração** para abastecer.`,
            ephemeral: true
          });
        }

        const fazendaData = await getFazendaData();
        const animalId = fazendaData[`animal_${espacoNum}`];
        const animal = ANIMAIS_CONFIG[animalId];
        if (!animal) return;

        const isBaby = fazendaData[`animal_${espacoNum}_fase`] === 'filhote';

        // Consome 1 ração
        await database.ref(`economia/${interaction.user.id}/inventario/itens/Consumíveis`).update({
          ração_animal: racao - 1
        });

        const updateObj = {
          [`animal_${espacoNum}_alimento`]: 1,
          [`animal_${espacoNum}_tempo`]: Date.now()
        };

        let bonusTexto = '';
        if (isBaby) {
          const bonusCrescimento = Math.round(animal.growthTime * 0.15); // +15% aceleração
          const currentBonus = fazendaData[`animal_${espacoNum}_bonus_tempo`] || 0;
          const currentAmor = fazendaData[`animal_${espacoNum}_amor`] !== undefined ? fazendaData[`animal_${espacoNum}_amor`] : 50;

          updateObj[`animal_${espacoNum}_bonus_tempo`] = currentBonus + bonusCrescimento;
          updateObj[`animal_${espacoNum}_amor`] = Math.min(100, currentAmor + 15);
          bonusTexto = `\n> 🚀 **Crescimento Acelerado:** +15% de progresso de crescimento!`;
        } else {
          const currentAmor = fazendaData[`animal_${espacoNum}_amor`] !== undefined ? fazendaData[`animal_${espacoNum}_amor`] : 50;
          updateObj[`animal_${espacoNum}_amor`] = Math.min(100, currentAmor + 5);
          bonusTexto = `\n> ⏳ **Produção Iniciada:** Pronto em **${ms(animal.productionTime)}**!`;
        }

        await database.ref(`economia/${interaction.user.id}/Fazenda/Animal`).update(updateObj);
        await XpUpdate(interaction, interaction.user, animal.xpFeed);

        if (currentView === 'details' && selectedSlot === espacoNum) {
          await renderAnimalDetailsMenu(espacoNum);
        } else {
          await renderFazenda(msg);
        }

        const reply = await int.followUp({
          content: `🥫 **|** <@${interaction.user.id}> alimentou seu **${isBaby ? animal.babyName : animal.displayName}** no **Espaço ${espacoNum}** com **1x Ração**! *(+${animal.xpFeed} XP)*${bonusTexto}`
        });
        setTimeout(() => reply.delete().catch(() => {}), 10000);
      }

      // 5. DAR CARINHO
      async function handleCarinho(espacoNum, int) {
        const fazendaData = await getFazendaData();
        const animalId = fazendaData[`animal_${espacoNum}`];
        const animal = ANIMAIS_CONFIG[animalId];
        if (!animal) return;

        const lastCarinho = fazendaData[`animal_${espacoNum}_carinho`] || 0;
        const now = Date.now();
        const careCooldown = animal.careCooldown;

        if (now - lastCarinho < careCooldown) {
          const rest = parseMs(careCooldown - (now - lastCarinho));
          return int.followUp({
            content: `⏳ **|** Seu animalzinho ainda está descansando do último carinho! Aguarde **${rest.minutes}m ${rest.seconds}s**.`,
            ephemeral: true
          });
        }

        const isBaby = fazendaData[`animal_${espacoNum}_fase`] === 'filhote';
        const currentAmor = fazendaData[`animal_${espacoNum}_amor`] !== undefined ? fazendaData[`animal_${espacoNum}_amor`] : 50;

        const vipInfo = await CheckUserVip(interaction.user);
        const amorBonusGain = vipInfo.isVip ? 18 : 12;
        const newAmor = Math.min(100, currentAmor + amorBonusGain);

        const updateObj = {
          [`animal_${espacoNum}_carinho`]: now,
          [`animal_${espacoNum}_amor`]: newAmor
        };

        let bonusBabyTxt = '';
        if (isBaby) {
          const currentBonus = fazendaData[`animal_${espacoNum}_bonus_tempo`] || 0;
          const babyTimeGain = vipInfo.isVip ? ms('2m') : ms('1m');
          updateObj[`animal_${espacoNum}_bonus_tempo`] = currentBonus + babyTimeGain;
          bonusBabyTxt = ` *(+${vipInfo.isVip ? '2m' : '1m'} de crescimento antecipado${vipInfo.isVip ? ` - ${vipInfo.levelName}` : ''}!)*`;
        }

        await database.ref(`economia/${interaction.user.id}/Fazenda/Animal`).update(updateObj);
        await XpUpdate(interaction, interaction.user, animal.xpPet);

        if (currentView === 'details' && selectedSlot === espacoNum) {
          await renderAnimalDetailsMenu(espacoNum);
        } else {
          await renderFazenda(msg);
        }

        const reply = await int.followUp({
          content: `❤️ **|** <@${interaction.user.id}> fez carinho no seu **${isBaby ? animal.babyName : animal.displayName}**!\n> ${animal.sound}\n> Nível de Amor: **${newAmor}%** *(+${animal.xpPet} XP)*${bonusBabyTxt}`
        });
        setTimeout(() => reply.delete().catch(() => {}), 10000);
      }

      // 6. COLETAR PRODUTOS
      async function handleColetar(espacoNum, int) {
        const fazendaData = await getFazendaData();
        const espacoInfo = evaluateEspaco(espacoNum, fazendaData);

        if (espacoInfo.status !== 'adult_ready') {
          return int.followUp({ content: `⚠️ **|** Este animal ainda não terminou o ciclo de produção!`, ephemeral: true });
        }

        const animal = espacoInfo.animal;
        const amor = espacoInfo.amor;
        const inv = await getUserInventory(interaction.user);

        let quantia = animal.minYield;
        let xpGained = animal.xpCollect;
        let qualidadeTxt = '';

        if (amor >= 80) {
          quantia = animal.maxYield + Math.floor(Math.random() * 2) + 1; // Produção de Ouro extra
          xpGained = Math.round(animal.xpCollect * 1.5);
          qualidadeTxt = `⭐ **PRODUÇÃO DE OURO!** (Animal radiante de felicidade, rendimento máximo & +50% XP)`;
        } else if (amor >= 40) {
          quantia = Math.floor(Math.random() * (animal.maxYield - animal.minYield + 1)) + animal.minYield;
          xpGained = animal.xpCollect;
          qualidadeTxt = `✨ **Produção Farta** (Animal saudável)`;
        } else {
          quantia = animal.minYield;
          xpGained = Math.max(5, Math.round(animal.xpCollect * 0.6));
          qualidadeTxt = `📉 **Produção Padrão** (Dê mais carinho ao seu animal para aumentar o rendimento!)`;
        }

        // Bônus VIP de Produção Rural
        const vipInfo = await CheckUserVip(interaction.user);
        let vipBonusTxt = '';
        if (vipInfo.isVip) {
          const bonusItems = vipInfo.level >= 2 ? 2 : 1;
          quantia += bonusItems;
          xpGained = Math.round(xpGained * (vipInfo.level >= 2 ? 1.5 : 1.25));
          vipBonusTxt = `\n> ${vipInfo.emojiVip} **Bônus ${vipInfo.levelName}:** +${bonusItems}x ${animal.productName} bônus!`;
        }

        const currentProductCount = inv[animal.productKey] || 0;

        await database.ref(`economia/${interaction.user.id}/inventario/itens/Consumíveis`).update({
          [animal.productKey]: currentProductCount + quantia
        });

        // Reseta o ciclo para faminto, preservando o afeto com leve decaimento para incentivar cuidados
        await database.ref(`economia/${interaction.user.id}/Fazenda/Animal`).update({
          [`animal_${espacoNum}_alimento`]: 0,
          [`animal_${espacoNum}_tempo`]: Date.now(),
          [`animal_${espacoNum}_amor`]: Math.max(25, amor - 10)
        });

        await XpUpdate(interaction, interaction.user, xpGained);

        if (currentView === 'details' && selectedSlot === espacoNum) {
          await renderAnimalDetailsMenu(espacoNum);
        } else {
          await renderFazenda(msg);
        }

        const reply = await int.followUp({
          content: `🧺 **|** <@${interaction.user.id}>, você coletou os produtos de sua **${animal.displayName}** no **Espaço ${espacoNum}**!\n` +
                   `> Qualidade: ${qualidadeTxt}\n` +
                   `> Recebido: ${animal.productEmoji} **${quantia}x ${animal.productName}** e *+${xpGained} XP*!${vipBonusTxt}`
        });
        setTimeout(() => reply.delete().catch(() => {}), 12000);
      }

      // 7. VENDER ANIMAL
      async function handleVender(espacoNum, int) {
        const fazendaData = await getFazendaData();
        const animalId = fazendaData[`animal_${espacoNum}`];
        const animal = ANIMAIS_CONFIG[animalId];
        if (!animal) return;

        const isBaby = fazendaData[`animal_${espacoNum}_fase`] === 'filhote';
        const valorVenda = isBaby ? Math.round(animal.babyPrice * 0.5) : animal.adultSellPrice;

        await UpdateMoneyWallet(interaction, interaction.user, '+', valorVenda, {
          type: 'fazenda_venda',
          amount: valorVenda,
          item: `Animal ${animal.displayName}`
        });

        await database.ref(`economia/${interaction.user.id}/Fazenda/Animal`).update({
          [`animal_${espacoNum}`]: 0,
          [`animal_${espacoNum}_fase`]: null,
          [`animal_${espacoNum}_nascimento`]: null,
          [`animal_${espacoNum}_alimento`]: null,
          [`animal_${espacoNum}_tempo`]: null,
          [`animal_${espacoNum}_carinho`]: null,
          [`animal_${espacoNum}_amor`]: null,
          [`animal_${espacoNum}_bonus_tempo`]: null
        });

        currentView = 'main';
        selectedSlot = null;
        await renderFazenda(msg);

        const reply = await int.followUp({
          content: `🏷️ **|** <@${interaction.user.id}>, você vendeu seu **${isBaby ? animal.babyName : animal.displayName}** por **${Format(valorVenda)}**!\n> O **Espaço ${espacoNum}** agora está vazio e pronto para abrigar um novo filhote.`
        });
        setTimeout(() => reply.delete().catch(() => {}), 10000);
      }

    } catch (error) {
      console.error('[Fazenda Error]:', error);
      return interaction.followUp({ content: `Ocorreu um erro inesperado na utilização do comando de fazenda.` });
    }
  }
};