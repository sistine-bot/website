const { EmbedBuilder } = require('discord.js');
const { XpUpdate, CheckUserCooldowns, getUserInventory } = require('../../../src/utils/functions.js');

module.exports =  {
  "name": "pescar",
  "description": `⌊💸 Economia⌉ Desbrave as profundezas do mar e ganhe peixes para poder vender.`,
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {
      
      const { status } = await CheckUserCooldowns(interaction.user, 60 * 60000, 'pesca')
      
      if (status) {
        const embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`⏰ **|** Você poderá pescar: <t:${~~((status)/1000)}:R>`)

        return interaction.followUp({ embeds: [embed] })
      }

      const { vara, isca, peixe } = await getUserInventory(interaction.user)
      
      if (vara.item < 1) {
        return interaction.error({ content: `Você precisa de uma **Vara de Pesca** para poder pescar` })
      }

      if (isca < 1) {
        return interaction.error({ content: `Você não possui iscas o suficiente` })
      }

      if (vara.Xp < 2) {

        database.ref(`economia/${interaction.user.id}/inventario/Itens/`).update({
          vara: null,
        });

        database.ref(`/economia/${interaction.user.id}/cooldowns`).update({
          pesca: Date.now()
        });

        const Embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`Você tentou pescar e sua vara de pesca quebrou`)

        await XpUpdate(interaction, interaction.user, Math.floor(Math.random() * 10) + 23);
        return interaction.followUp({ embeds: [Embed], fetchReply: true, ephemeral: false  })
      }

      const newIsca = Math.min(isca, Math.floor(Math.random() * 3) + 1);
      const newPeixe = Math.floor(Math.random() * 20) + 5;

      database.ref(`economia/${interaction.user.id}/inventario/itens/Consumíveis`).update({
        peixe: peixe + newPeixe,
        isca: isca - newIsca,
      });
      
      database.ref(`/economia/${interaction.user.id}/cooldowns`).update({
        pesca: Date.now()
      });

      database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos/vara`).update({
        Xp: vara.Xp - (Math.floor(Math.random() * 4) + 2)
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

      const embed = new EmbedBuilder()
      .setColor(color.embed)
      .setDescription(`🎣 **|** ${mensagem}`)

      await XpUpdate(interaction, interaction.user, Math.floor(Math.random() * 10) + 23);
      return interaction.followUp({ embeds: [embed] })

    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
}