const { ApplicationCommandType, EmbedBuilder } = require('discord.js');
const { CheckUserCooldowns, XpUpdate, UpdateMoneyWallet, CheckUserVip, Format } = require('../../utils/functions.js');

module.exports =  {
  "name": "semanal",
  "description": `⌊💸 Economia⌉ seja VIP e colete sua recompensa semanal.`,
  "type": ApplicationCommandType.ChatInput,
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {

      const { status } = await CheckUserCooldowns(interaction.user, 604800000, 'weekly')
    
      if (status) {

        const Embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`⏰ **|** Seu premio semanal será liberado para coletar: **<t:${~~((status)/1000)}:R>**.`)

        return interaction.followUp({ embeds: [Embed], fetchReply: true, ephemeral: false  });
      }
      
      const vipInfo = await CheckUserVip(interaction.user);
      const isCreator = client.config.cargos?.criador?.includes(interaction.user.id);
      
      if (!isCreator && !vipInfo.isVip) {
        return interaction.error({ content: `Você precisa ser um membro VIP ativo para utilizar este comando. Use \`/vip\` para conferir as vantagens ou adquira no dashboard!` });
      }

      const isTier2 = vipInfo.level >= 2 || (isCreator && vipInfo.level !== 1);
      const weeklyMoney = isTier2 
        ? Math.floor(Math.random() * 4001) + 10000 
        : Math.floor(Math.random() * 2001) + 6000;

      const racaoBonus = isTier2 ? 12 : 6;
      const iscaBonus = isTier2 ? 12 : 6;
      const sementeBonus = isTier2 ? 10 : 5;
      const municaoBonus = isTier2 ? 5 : 2;

      await database.ref(`/economia/${interaction.user.id}/cooldowns`).update({
        weekly: Date.now()
      });

      // Credit supplies into Consumíveis
      const consumiveisRef = database.ref(`/economia/${interaction.user.id}/inventario/itens/Consumíveis`);
      const snap = await consumiveisRef.once('value');
      const cur = snap.val() || {};
      await consumiveisRef.update({
        ração_animal: (cur.ração_animal || 0) + racaoBonus,
        isca: (cur.isca || 0) + iscaBonus,
        semente_trigo: (cur.semente_trigo || 0) + sementeBonus,
        munição: (cur.munição || 0) + municaoBonus
      });

      await UpdateMoneyWallet(interaction, interaction.user, '+', weeklyMoney, `{emoji.entrada} {mensagem.weekly} | ${weeklyMoney}`);

      const tierBadge = isTier2 ? '🌟 **VIP Ouro**' : '⭐ **VIP Prata**';

      const EMBED = new EmbedBuilder()
      .setColor(color.embed)
      .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
      .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true}) })
      .setTitle(`👑 Recompensa Semanal VIP`)
      .setDescription(`Parabéns por ser um assinante ${tierBadge}! Você recolheu seu pacote semanal com benefícios exclusivos:

💰 **Bolsa Monetária:** **${Format(weeklyMoney)}** adicionados à sua carteira.
🌾 **Pacote Rural:** +${sementeBonus}x Sementes de Trigo & +${racaoBonus}x Rações de Animais
🎯 **Suprimentos:** +${iscaBonus}x Iscas de Pesca & +${municaoBonus}x Munições de Caça

${vipInfo.remainingDays > 0 ? `⏳ *Seu VIP tem ainda **${vipInfo.remainingDays} dias** restantes.*` : ''}`)

      await XpUpdate(interaction, interaction.user, isTier2 ? 500 : 300);

      return interaction.followUp({ embeds: [EMBED], fetchReply: true, ephemeral: false  })
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
}