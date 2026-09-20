const { EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Format, UpdateMoneyWallet, CheckUserVip, CheckUserCooldowns, XpUpdate } = require('../../utils/functions.js');
const moment = require('moment');
moment.locale('pt-br');

module.exports = {
  "name": "vip",
  "description": `⌊⚙️ Modulos⌉ Veja informações sobre seu status VIP e benefícios ativos`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "usuário",
      "type": ApplicationCommandOptionType.User,
      "description": "Veja o status VIP de outro membro",
      "required": false,
    }
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const targetUser = interaction.options.getUser("usuário") || interaction.user;
      const isSelf = targetUser.id === interaction.user.id;
      const vipInfo = await CheckUserVip(targetUser);

      if (!vipInfo.isVip) {
        const embedNoVip = new EmbedBuilder()
          .setColor(color.embed)
          .setAuthor({ name: `Sistema VIP • ${client.user.username}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
          .setTitle(isSelf ? `✨ Você ainda não possui um plano VIP ativo` : `✨ ${targetUser.username} não possui VIP ativo`)
          .setDescription(`Torne-se um apoiador e tenha acesso a vantagens exclusivas em toda a economia e no dashboard!

⭐ **VIP Prata (Nível 1):**
• **+20% de rendimento** na colheita da plantação e animais da fazenda
• **2x Multiplicador de XP** em todos os comandos
• **25% de desconto** no conserto de armas e ferramentas (\`/recuperar\`)
• **+25% de carnes e peixes** ao caçar e pescar com durabilidade protegida
• Recompensa semanal de **R$ 20.000 ~ R$ 30.000** + suprimentos rurais

🌟 **VIP Ouro (Nível 2):**
• **+40% de rendimento** na plantação e carinho animal 50% mais rápido
• **3x Multiplicador de XP** em todas as ações
• **50% de desconto** no conserto de armas e ferramentas (\`/recuperar\`)
• **+50% de carnes e peixes** na caça/pesca com desgaste mínimo
• Recompensa semanal de **R$ 45.000 ~ R$ 65.000** + pacote rural reforçado
• Emblema exclusivo no perfil do Discord e no Dashboard Web`)
          .setFooter({ text: `Adquira pelo dashboard online ou apoie nosso servidor!` });

        return interaction.followUp({ embeds: [embedNoVip] });
      }

      const { status } = await CheckUserCooldowns(interaction.user, 604800000, 'weekly');
      const isTier2 = vipInfo.level >= 2;
      const tierBadge = isTier2 ? '🌟 VIP Ouro (Nível 2)' : '⭐ VIP Prata (Nível 1)';
      const expiryTimestamp = vipInfo.data && vipInfo.tempo ? Math.floor((vipInfo.tempo + vipInfo.data) / 1000) : null;

      const embedVip = new EmbedBuilder()
        .setColor(isTier2 ? 0xF1C40F : 0x95A5A6)
        .setAuthor({ name: `Passaporte VIP • ${client.user.username}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setTitle(`${vipInfo.emojiVip} Status VIP de ${targetUser.username}`)
        .setDescription(`Plano atual: **${tierBadge}**
${vipInfo.remainingDays > 0 ? `⏳ Tempo restante: **${vipInfo.remainingDays} dias** (${expiryTimestamp ? `<t:${expiryTimestamp}:R>` : 'Ativo'})` : '⏳ Tempo restante: **Vitalício / Especial**'}
📅 Ativo desde: **${vipInfo.data ? moment(vipInfo.data).format('LL') : 'Data não registrada'}**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 **Vantagens Ativas na Sua Conta:**
🌾 **Plantação & Fazenda:** +${(vipInfo.ruralBonus * 100).toFixed(0)}% de colheita e afeto acelerado
⚡ **Bônus de Experiência:** **${vipInfo.level >= 2 ? '3x' : '2x'} XP** em todas as atividades
🛠️ **Oficina & Reparos:** **${(vipInfo.repairDiscount * 100).toFixed(0)}% OFF** em restaurações (\`/recuperar\`)
🏹 **Caça & Pesca:** +${vipInfo.level >= 2 ? '50%' : '25%'} de recursos com desgaste reduzido
🎁 **Recompensa Semanal:** ${status ? `Disponível <t:${~~(status / 1000)}:R>` : '✅ **Pronto para resgate!**'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        .setFooter({ text: `Dica: Use /semanal para resgatar sua bolsa semanal diretamente.` });

      const buttons = [];
      if (isSelf) {
        if (!status) {
          buttons.push(
            new ButtonBuilder()
              .setCustomId("claim_vip_weekly")
              .setStyle(ButtonStyle.Success)
              .setEmoji('🗓️')
              .setLabel('Coletar Semanal')
          );
        } else {
          buttons.push(
            new ButtonBuilder()
              .setCustomId("claimed_weekly_disabled")
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('⏰')
              .setLabel('Semanal em Cooldown')
              .setDisabled(true)
          );
        }
      }

      const row = buttons.length > 0 ? new ActionRowBuilder().addComponents(buttons) : null;
      const msg = await interaction.followUp({
        embeds: [embedVip],
        components: row ? [row] : []
      });

      if (isSelf && !status && row) {
        const collector = msg.createMessageComponentCollector({
          filter: (i) => i.user.id === interaction.user.id,
          time: 60000
        });

        collector.on('collect', async (i) => {
          if (i.customId === 'claim_vip_weekly') {
            collector.stop();

            const checkCooldown = await CheckUserCooldowns(interaction.user, 604800000, 'weekly');
            if (checkCooldown.status) {
              return i.reply({
                content: `⏰ Você já coletou sua recompensa semanal recentemente! Liberado <t:${~~(checkCooldown.status / 1000)}:R>.`,
                ephemeral: true
              });
            }

            await database.ref(`/economia/${interaction.user.id}/cooldowns`).update({
              weekly: Date.now()
            });

            const weeklyMoney = isTier2
              ? Math.floor(Math.random() * 20000) + 45000
              : Math.floor(Math.random() * 10000) + 20000;

            const racaoBonus = isTier2 ? 12 : 6;
            const iscaBonus = isTier2 ? 12 : 6;
            const sementeBonus = isTier2 ? 10 : 5;
            const municaoBonus = isTier2 ? 5 : 2;

            const consumiveisRef = database.ref(`/economia/${interaction.user.id}/inventario/itens/Consumíveis`);
            const snap = await consumiveisRef.once('value');
            const cur = snap.val() || {};
            await consumiveisRef.update({
              ração_animal: (cur.ração_animal || 0) + racaoBonus,
              isca: (cur.isca || 0) + iscaBonus,
              semente_trigo: (cur.semente_trigo || 0) + sementeBonus,
              munição: (cur.munição || 0) + municaoBonus
            });

            await UpdateMoneyWallet(interaction, interaction.user, '+', weeklyMoney, {
              type: 'weekly',
              amount: weeklyMoney
            });
            await XpUpdate(interaction, interaction.user, isTier2 ? 500 : 300);

            const claimEmbed = new EmbedBuilder()
              .setColor(color.embed)
              .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
              .setTitle(`🎁 Semanal Resgatado com Sucesso!`)
              .setDescription(`Você recolheu sua recompensa semanal **${tierBadge}**:
💰 **Bolsa:** **${Format(weeklyMoney)}** adicionados à sua carteira
🌾 **Pacote Rural:** +${sementeBonus}x Sementes de Trigo & +${racaoBonus}x Rações de Animais
🎯 **Suprimentos:** +${iscaBonus}x Iscas de Pesca & +${municaoBonus}x Munições de Caça`)
              .setFooter({ text: `Volte na próxima semana para resgatar novamente!` });

            const disabledRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("claimed_weekly_disabled")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⏰')
                .setLabel('Semanal Coletado')
                .setDisabled(true)
            );

            await i.update({ embeds: [embedVip], components: [disabledRow] });
            return interaction.followUp({ embeds: [claimEmbed], ephemeral: false });
          }
        });
      }
    } catch (error) {
      console.error(error);
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
};