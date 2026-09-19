const {
  ApplicationCommandType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');
const {
  XpUpdate,
  Format,
  UpdateMoneyWallet,
  getUserInventory,
  getUserMoney,
  CheckUserVip
} = require('../../utils/functions.js');

function getProgressBar(current, max = 100, length = 10) {
  const percentage = Math.max(0, Math.min(1, current / max));
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

function resolveItemDetails(key, data) {
  switch (key) {
    case 'arma': {
      const tier = Number(data?.item || 1);
      let name = 'Arma';
      if (data?.nome) {
        name = Array.isArray(data.nome) ? data.nome[0] : data.nome;
      } else {
        if (tier === 1) name = 'Glock';
        else if (tier === 2) name = 'MP5';
        else if (tier === 3) name = 'M4-A1';
        else if (tier >= 4) name = 'AK-47';
      }

      let costMultiplier = 25;
      let minLevel = 1;
      if (tier === 1) { costMultiplier = 25; minLevel = 1; }
      else if (tier === 2) { costMultiplier = 50; minLevel = 15; }
      else if (tier === 3) { costMultiplier = 85; minLevel = 25; }
      else if (tier >= 4) { costMultiplier = 150; minLevel = 40; }

      return {
        key: 'arma',
        name,
        emoji: '🔫',
        minLevel,
        isNonRepairable: data?.reparavel === false,
        calcBaseCost: (missing) => missing * costMultiplier
      };
    }

    case 'armacaça': {
      let name = 'Arma de Caça';
      if (data?.nome) {
        name = Array.isArray(data.nome) ? data.nome[0] : data.nome;
      }
      return {
        key: 'armacaça',
        name,
        emoji: '🏹',
        minLevel: 1,
        isNonRepairable: data?.reparavel === false,
        calcBaseCost: (missing) => missing * 20
      };
    }

    case 'vara': {
      let name = 'Vara de Pescar';
      if (data?.nome) {
        name = Array.isArray(data.nome) ? data.nome[0] : data.nome;
      }
      return {
        key: 'vara',
        name,
        emoji: '🎣',
        minLevel: 1,
        isNonRepairable: Boolean(data?.reparavel === false || data?.tipo === 'bambu'),
        calcBaseCost: (missing) => missing * 10
      };
    }

    case 'enxada': {
      let name = 'Enxada de Ferro';
      if (data?.nome) {
        name = Array.isArray(data.nome) ? data.nome[0] : data.nome;
      }
      return {
        key: 'enxada',
        name,
        emoji: '⛏️',
        minLevel: 1,
        isNonRepairable: Boolean(data?.reparavel === false || data?.tipo === 'madeira'),
        calcBaseCost: (missing) => missing * 12
      };
    }

    case 'regador': {
      let name = 'Regador de Ferro';
      if (data?.nome) {
        name = Array.isArray(data.nome) ? data.nome[0] : data.nome;
      }
      return {
        key: 'regador',
        name,
        emoji: '🚿',
        minLevel: 1,
        isNonRepairable: Boolean(data?.reparavel === false || data?.tipo === 'plastico'),
        calcBaseCost: (missing) => missing * 15
      };
    }

    default:
      return null;
  }
}

module.exports = {
  name: 'recuperar',
  description: '⌊⚙️ Modulos⌉ Recupere a durabilidade de seus equipamentos danificados.',
  type: ApplicationCommandType.ChatInput,
  options: [],

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const vipInfo = await CheckUserVip(interaction.user);
      const VIP = vipInfo.isVip;

      const nivelSnap = await database.ref(`economia/${interaction.user.id}/nível/`).once('value');
      let nível = (nivelSnap.val() && nivelSnap.val().nível);
      if (nível === undefined || nível === null) nível = 0;

      const inventory = await getUserInventory(interaction.user);
      const { carteira } = await getUserMoney(interaction.user);
      const isCreator = client.config?.cargos?.criador?.includes(interaction.user.id);

      const candidateKeys = ['arma', 'armacaça', 'vara', 'enxada', 'regador'];
      const recoverableItems = [];

      for (const key of candidateKeys) {
        const itemData = inventory[key];

        // 1. O usuário precisa possuir o item no inventário
        const hasItem = Boolean(
          itemData && (typeof itemData === 'object' ? (itemData.item > 0 || itemData.Xp !== undefined) : itemData > 0)
        );
        if (!hasItem) continue;

        const details = resolveItemDetails(key, itemData);
        if (!details) continue;

        // 2. Não pode ser item não-reparável (bambu, madeira, plástico ou reparável explicitamente falso)
        if (details.isNonRepairable) continue;

        // 3. Checagem de nível mínimo exigido
        if (!isCreator && !VIP && nível < details.minLevel) continue;

        // 4. Durabilidade atual deve ser MENOR que 100% (se já for 100%, o item não é recuperável)
        const currentDurability = Math.max(0, Math.min(100, Number(itemData.Xp ?? 100)));
        if (currentDurability >= 100) continue;

        // Cálculo dos custos de restauração
        const missing = 100 - currentDurability;
        const baseCost = details.calcBaseCost(missing);
        let finalCost = baseCost;
        if (vipInfo.isVip && vipInfo.repairDiscount > 0) {
          finalCost = Math.round(baseCost * (1 - vipInfo.repairDiscount));
        }

        recoverableItems.push({
          key,
          name: details.name,
          emoji: details.emoji,
          data: itemData,
          currentDurability,
          missingDurability: missing,
          baseCost,
          finalCost,
          minLevel: details.minLevel
        });
      }

      // CENÁRIO 1: Nenhum item recuperável encontrado
      if (recoverableItems.length === 0) {
        const emptyEmbed = new EmbedBuilder()
          .setColor(color.embed || '#831396')
          .setAuthor({
            name: 'Oficina de Manutenção & Reparos',
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setTitle('🛠️ Nenhum Equipamento Recuperável')
          .setDescription(
            `Olá ${interaction.user}, você **não possui nenhum equipamento recuperável** no momento!\n\n` +
            `> 🛡️ **Durabilidade Completa:** Seus itens utilizáveis já estão com **100% de integridade**;\n` +
            `> 🪵 **Itens Iniciais:** Ferramentas rústicas de madeira, bambu ou plástico são descartáveis e **não podem ser consertadas**;\n` +
            `> 📦 **Inventário:** Não foram encontradas ferramentas ou armas danificadas em sua posse;\n` +
            `> 🛒 **Loja:** Caso queira adquirir ferramentas permanentes de ferro ou armas de fogo, consulte a </loja:1>.`
          )
          .setFooter({
            text: 'Sistine • Módulo de Oficina & Equipamentos',
            iconURL: client.user.displayAvatarURL()
          });

        return interaction.followUp({ embeds: [emptyEmbed] });
      }

      // CENÁRIO 2: Existem itens recuperáveis -> Montar Select Menu
      const buildInitialEmbed = (currentCarteira) => {
        const descList = recoverableItems.map(item => {
          const progressBar = getProgressBar(item.currentDurability, 100, 10);
          const costText = (vipInfo.isVip && vipInfo.repairDiscount > 0)
            ? `~~R$ ${Format(item.baseCost)}~~ ➔ **R$ ${Format(item.finalCost)}**`
            : `**R$ ${Format(item.finalCost)}**`;

          return `${item.emoji} **${item.name}**\n` +
                 `> \`[${progressBar}]\` **${item.currentDurability}%** de durabilidade • Custo: ${costText}`;
        }).join('\n\n');

        let vipNotice = '';
        if (vipInfo.isVip && vipInfo.repairDiscount > 0) {
          vipNotice = `\n> 👑 **Benefício ${vipInfo.levelName}:** Você possui **${Math.round(vipInfo.repairDiscount * 100)}% de desconto** em todos os reparos!`;
        }

        return new EmbedBuilder()
          .setColor(color.embed || '#831396')
          .setAuthor({
            name: 'Oficina de Manutenção & Reparos',
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setTitle('🛠️ Selecione o Item para Recuperar')
          .setDescription(
            `Olá ${interaction.user}, foram identificados os seguintes itens danificados em seu inventário:\n\n` +
            `${descList}\n\n` +
            `💰 **Seu Saldo em Carteira:** **R$ ${Format(currentCarteira)}**${vipNotice}\n\n` +
            `👇 *Selecione no menu abaixo o equipamento que deseja reparar para 100%.*`
          )
          .setFooter({
            text: 'Tempo limite: 60 segundos • Sistine Oficina',
            iconURL: client.user.displayAvatarURL()
          });
      };

      const buildMenuRow = () => {
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('selecionar_item_recuperar')
          .setPlaceholder('🔧 Escolha um equipamento para restaurar a durabilidade...')
          .addOptions(
            recoverableItems.map(item => {
              const discountLabel = (vipInfo.isVip && vipInfo.repairDiscount > 0)
                ? ` (VIP -${Math.round(vipInfo.repairDiscount * 100)}%)`
                : '';

              return new StringSelectMenuOptionBuilder()
                .setLabel(item.name)
                .setValue(item.key)
                .setDescription(`Durabilidade: ${item.currentDurability}% • Custo: R$ ${Format(item.finalCost)}${discountLabel}`)
                .setEmoji(item.emoji);
            })
          );

        return new ActionRowBuilder().addComponents(selectMenu);
      };

      const buildConfirmEmbed = (item, currentCarteira) => {
        const progressBar = getProgressBar(item.currentDurability, 100, 10);
        const temSaldo = currentCarteira >= item.finalCost;

        let desc = `🛠️ **|** ${interaction.user}, você selecionou **${item.name}** para manutenção.\n\n` +
                   `> ${item.emoji} **Equipamento:** ${item.name}\n` +
                   `> 📊 **Durabilidade Atual:** \`[${progressBar}]\` **${item.currentDurability}%**\n` +
                   `> 🔧 **Restauração:** +**${item.missingDurability}%** (será restaurado para **100%**)\n`;

        if (vipInfo.isVip && vipInfo.repairDiscount > 0) {
          desc += `> 👑 **Desconto ${vipInfo.levelName} (-${Math.round(vipInfo.repairDiscount * 100)}%):** De ~~R$ ${Format(item.baseCost)}~~ por **R$ ${Format(item.finalCost)}**\n`;
        } else {
          desc += `> 💰 **Custo do Reparo:** **R$ ${Format(item.finalCost)}**\n`;
        }

        desc += `> 💼 **Seu Saldo em Carteira:** **R$ ${Format(currentCarteira)}**\n`;

        if (item.key === 'regador') {
          const regadorAgua = item.data?.agua ?? 100;
          desc += `\n> 💧 **Nível de Água:** ${regadorAgua}%\n> ⚠️ *Nota: O reparo restaura apenas a durabilidade física do regador (100%). A água deve ser abastecida na plantação.*\n`;
        }

        if (!temSaldo) {
          desc += `\n❌ **Saldo Insuficiente:** Você precisa de **R$ ${Format(item.finalCost)}**, mas possui apenas **R$ ${Format(currentCarteira)}** na carteira. Saque dinheiro no </banco:1> antes de prosseguir.`;
        } else {
          desc += `\n✅ **Confirmar Manutenção:** Clique no botão abaixo para concluir o reparo e restaurar sua ferramenta para 100%.`;
        }

        return new EmbedBuilder()
          .setColor(temSaldo ? (color.embed || '#831396') : '#ef4444')
          .setAuthor({
            name: 'Oficina de Manutenção & Reparos',
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setTitle(`🔧 Inspecionando: ${item.name}`)
          .setDescription(desc)
          .setFooter({
            text: temSaldo ? 'Confirme o reparo ou escolha outro item.' : 'Saldo insuficiente na carteira.',
            iconURL: client.user.displayAvatarURL()
          });
      };

      const buildConfirmRow = (item, currentCarteira) => {
        const temSaldo = currentCarteira >= item.finalCost;

        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('confirmar_reparo')
            .setLabel(`Confirmar Reparo (R$ ${Format(item.finalCost)})`)
            .setStyle(ButtonStyle.Success)
            .setEmoji(emoji?.positivo || '✅')
            .setDisabled(!temSaldo),
          new ButtonBuilder()
            .setCustomId('voltar_menu')
            .setLabel('Escolher Outro')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙'),
          new ButtonBuilder()
            .setCustomId('cancelar_reparo')
            .setLabel('Cancelar')
            .setStyle(ButtonStyle.Danger)
            .setEmoji(emoji?.negativo || '❌')
        );
      };

      const initialEmbed = buildInitialEmbed(carteira);
      const initialRow = buildMenuRow();

      const msg = await interaction.followUp({
        embeds: [initialEmbed],
        components: [initialRow]
      });

      let currentSelectedItem = null;

      const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 60000
      });

      collector.on('collect', async (i) => {
        // Se for a seleção no menu
        if (i.isStringSelectMenu() && i.customId === 'selecionar_item_recuperar') {
          await i.deferUpdate();
          const selectedKey = i.values[0];
          const matched = recoverableItems.find(it => it.key === selectedKey);

          if (!matched) {
            return interaction.followUp({ content: 'Item selecionado inválido ou não encontrado.', ephemeral: true });
          }

          currentSelectedItem = matched;
          const freshMoney = await getUserMoney(interaction.user);
          const confirmEmbed = buildConfirmEmbed(matched, freshMoney.carteira);
          const confirmRow = buildConfirmRow(matched, freshMoney.carteira);

          return msg.edit({
            embeds: [confirmEmbed],
            components: [confirmRow]
          });
        }

        // Se for o botão Voltar
        if (i.isButton() && i.customId === 'voltar_menu') {
          await i.deferUpdate();
          currentSelectedItem = null;
          const freshMoney = await getUserMoney(interaction.user);
          const resetEmbed = buildInitialEmbed(freshMoney.carteira);
          const resetRow = buildMenuRow();

          return msg.edit({
            embeds: [resetEmbed],
            components: [resetRow]
          });
        }

        // Se for o botão Cancelar
        if (i.isButton() && i.customId === 'cancelar_reparo') {
          await i.deferUpdate();
          collector.stop('cancelled');

          const cancelEmbed = new EmbedBuilder()
            .setColor('#ef4444')
            .setAuthor({
              name: 'Oficina de Manutenção & Reparos',
              iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setDescription(`❌ **|** Operação de reparo cancelada pelo usuário.`);

          return msg.edit({
            embeds: [cancelEmbed],
            components: []
          });
        }

        // Se for o botão Confirmar Reparo
        if (i.isButton() && i.customId === 'confirmar_reparo') {
          await i.deferUpdate();

          if (!currentSelectedItem) {
            return interaction.followUp({ content: 'Nenhum equipamento selecionado para reparo.', ephemeral: true });
          }

          const freshMoney = await getUserMoney(interaction.user);
          if (freshMoney.carteira < currentSelectedItem.finalCost) {
            return interaction.followUp({
              content: `${emoji?.negativo || '❌'} **|** Saldo insuficiente na carteira para efetuar o reparo! Você precisa de **R$ ${Format(currentSelectedItem.finalCost)}**.`,
              ephemeral: true
            });
          }

          collector.stop('repaired');

          // Atualiza a durabilidade do item para 100% no Firebase
          await database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos/${currentSelectedItem.key}`).update({
            Xp: 100
          });

          // Debita o valor da carteira e registra a transação financeira
          const transacaoDesc = `{emoji.saida} {mensagem.recuperar} | ${Format(currentSelectedItem.finalCost)} | ${currentSelectedItem.name}`;
          await UpdateMoneyWallet(interaction, interaction.user, '-', currentSelectedItem.finalCost, transacaoDesc);

          // Concede XP de comando ao usuário
          await XpUpdate(interaction, interaction.user, Math.floor(Math.random() * 10) + 20);

          const hammerEmoji = emoji?.martelo || '<:martelo:925966095712665631>' || '🔨';

          const successEmbed = new EmbedBuilder()
            .setColor('#10b981')
            .setAuthor({
              name: 'Oficina de Manutenção & Reparos',
              iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTitle('🛠️ Reparo Concluído com Sucesso!')
            .setDescription(
              `${hammerEmoji} **|** ${interaction.user}, sua **${currentSelectedItem.name}** foi restaurada com sucesso para **100%** de durabilidade!\n\n` +
              `> 💰 **Valor Pago:** R$ ${Format(currentSelectedItem.finalCost)}\n` +
              `> 🛡️ **Durabilidade Atual:** \`[▰▰▰▰▰▰▰▰▰▰]\` **100%** (+${currentSelectedItem.missingDurability}%)\n` +
              `> 💼 **Saldo Restante:** R$ ${Format(freshMoney.carteira - currentSelectedItem.finalCost)}\n` +
              `> ⭐ **Experiência:** Você ganhou XP por utilizar a oficina!`
            )
            .setFooter({
              text: 'Sistine • Módulo de Oficina & Equipamentos',
              iconURL: client.user.displayAvatarURL()
            });

          return msg.edit({
            embeds: [successEmbed],
            components: []
          });
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
          const timeoutEmbed = new EmbedBuilder()
            .setColor('#71717a')
            .setAuthor({
              name: 'Oficina de Manutenção & Reparos',
              iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTitle('🕛 Tempo Expirado')
            .setDescription(`O tempo limite para escolher um equipamento na oficina expirou. Caso ainda deseje reparar seus itens, use \`/recuperar\` novamente.`);

          await msg.edit({
            embeds: [timeoutEmbed],
            components: []
          }).catch(() => {});
        }
      });

    } catch (error) {
      console.error('[SlashCommand /recuperar]', error);
      return interaction.error({ content: 'Ocorreu um erro inesperado na utilização deste comando.' });
    }
  }
};