const { EmbedBuilder } = require('discord.js');
const { XpUpdate, CheckUserCooldowns, getUserInventory, CheckUserVip } = require('../../utils/functions.js');

module.exports =  {
  "name": "pescar",
  "description": `⌊💸 Economia⌉ Desbrave as profundezas do mar e ganhe peixes para poder vender.`,
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {
      
      const { status } = await CheckUserCooldowns(interaction.user, 45 * 60000, 'pesca')
      
      if (status) {
        const embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`⏰ **|** Você poderá pescar novamente: <t:${~~((status)/1000)}:R>`)

        return interaction.followUp({ embeds: [embed] })
      }

      const { vara, isca, peixe } = await getUserInventory(interaction.user)
      
      if (vara.item < 1) {
        return interaction.error({ content: `Você precisa de uma **Vara de Pesca** para poder pescar.` })
      }

      if (isca < 1) {
        return interaction.error({ content: `Você não possui iscas suficientes.` })
      }

      if (vara.Xp < 2) {

        database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos/vara`).set(null);

        database.ref(`/economia/${interaction.user.id}/cooldowns`).update({
          pesca: Date.now()
        });

        const Embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`Você tentou pescar e sua vara de pesca acabou quebrando! Adquira outra em \`/loja itens\`.`)

        await XpUpdate(interaction, interaction.user, Math.floor(Math.random() * 10) + 23);
        return interaction.followUp({ embeds: [Embed], fetchReply: true, ephemeral: false  })
      }

      const vipInfo = await CheckUserVip(interaction.user);
      const basePeixe = Math.floor(Math.random() * 11) + 6; // 6 a 16 peixes
      let bonusPeixe = 0;
      if (vipInfo.isVip) {
        bonusPeixe = vipInfo.level >= 2 ? Math.max(3, Math.round(basePeixe * 0.5)) : Math.max(2, Math.round(basePeixe * 0.25));
      }
      const newPeixe = basePeixe + bonusPeixe;
      const baseIsca = Math.floor(Math.random() * 3) + 1; // 1 a 3 iscas
      const newIsca = Math.min(isca, vipInfo.isVip ? Math.max(1, baseIsca - 1) : baseIsca);

      database.ref(`economia/${interaction.user.id}/inventario/itens/Consumíveis`).update({
        peixe: peixe + newPeixe,
        isca: isca - newIsca,
      });
      
      database.ref(`/economia/${interaction.user.id}/cooldowns`).update({
        pesca: Date.now()
      });

      // Depreciação de 2 a 4 pontos (ou 1 a 2 se VIP)
      const durabilityLoss = vipInfo.isVip ? (Math.floor(Math.random() * 2) + 1) : (Math.floor(Math.random() * 3) + 2);

      const novaDurabilidade = Math.max(0, vara.Xp - durabilityLoss);
      database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos/vara`).update({
        Xp: novaDurabilidade
      });

      const Mensagens = [
        `Você acabou de pescar! Você pescou: \`${newPeixe} peixes\` e você gastou **${newIsca} iscas** para pegá-los.`,
        `Você passou o dia inteiro pescando e conseguiu pegar \`${newPeixe} peixes\`. Gastou **${newIsca} iscas**.`,
        `Hoje você conseguiu pegar \`${newPeixe} peixes\` e gastou **${newIsca} iscas**.`,
        `Você pescou em águas profundas e conseguiu pegar \`${newPeixe} peixes\` raros. Gastou **${newIsca} iscas**.`,
        `Você pescou \`${newPeixe} peixes\` em apenas meia hora e gastou **${newIsca} iscas**.`,
        `Você pescou \`${newPeixe} peixes\` e gastou **${newIsca} iscas**.`
      ]

      const mensagem = await Mensagens[Math.floor(Math.random() * Mensagens.length)];

      let desc = `🎣 **|** ${mensagem}`;
      if (bonusPeixe > 0) {
        desc += `\n${vipInfo.emojiVip} **Bônus VIP (${vipInfo.levelName}):** +${bonusPeixe} Peixes extras e preservação de vara/iscas!`;
      }

      const embed = new EmbedBuilder()
      .setColor(color.embed)
      .setDescription(desc)

      await XpUpdate(interaction, interaction.user, Math.floor(Math.random() * 10) + 23);
      return interaction.followUp({ embeds: [embed] })

    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
}