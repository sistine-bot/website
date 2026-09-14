const { ApplicationCommandType, EmbedBuilder } = require('discord.js');
const { getUserInventory, CheckUserCooldowns, XpUpdate, CheckUserVip } = require('../../utils/functions.js');

module.exports =  {
  "name": "caçar",
  "description": `⌊💸 Economia⌉ Saia para caçar e tenha a chance de ganhar carne para poder vender.`,
  "type": ApplicationCommandType.ChatInput,
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {
      
      const { status } = await CheckUserCooldowns(interaction.user, 45 * 60000, 'caça')
      
      if (status) {
        const Embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`⏰ **|** A temporada de caça acabou! Você será liberado para caçar novamente: **<t:${~~((status)/1000)}:R>**.`)

        return interaction.followUp({ embeds: [Embed], fetchReply: true, ephemeral: false  });
      }

      const { munição, armacaça, carne, peixe } = await getUserInventory(interaction.user)

      if (armacaça && armacaça.item < 1) {
        return interaction.error({ content: `Você precisa de uma Arma de Caça.` });
      }

      const quantia = Math.floor(Math.random() * 2) + 1; // Gasta 1 a 2 munições

      if (munição < quantia) {
        return interaction.error({ content: `Você não possui munição suficiente (necessário pelo menos ${quantia}).` });
      }

      if (armacaça.Xp < 2) {

        database.ref(`/economia/${interaction.user.id}/inventario/itens/Equipamentos/armacaça`).set(null);

        database.ref(`/economia/${interaction.user.id}/cooldowns`).update({
          caça: Date.now()
        });

        const Embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`Você tentou caçar e sua arma de caça acabou quebrando! Adquira outra em \`/loja armas\`.`)

        await XpUpdate(interaction, interaction.user, Math.floor(Math.random() * 10) + 23);
        return interaction.followUp({ embeds: [Embed], fetchReply: true, ephemeral: false  })
      }

      const vipInfo = await CheckUserVip(interaction.user);
      const baseValor = Math.floor(Math.random() * 9) + 6; // 6 a 14 Carnes
      let bonusVip = 0;
      if (vipInfo.isVip) {
        bonusVip = vipInfo.level >= 2 ? Math.max(2, Math.round(baseValor * 0.5)) : Math.max(1, Math.round(baseValor * 0.25));
      }
      const valor = baseValor + bonusVip;
      
      database.ref(`/economia/${interaction.user.id}/inventario/itens/Consumíveis`).update({
        carne: carne + valor,
      });

      database.ref(`/economia/${interaction.user.id}/cooldowns`).update({
        caça: Date.now()
      });

      // Depreciação de 2 a 4 pontos (ou 1 a 2 se VIP)
      const durabilityLoss = vipInfo.isVip ? (Math.floor(Math.random() * 2) + 1) : (Math.floor(Math.random() * 3) + 2);
      const novaDurabilidade = Math.max(0, armacaça.Xp - durabilityLoss);

      database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos/armacaça`).update({
        Xp: novaDurabilidade,
        item: armacaça.item,
        nome: armacaça.nome
      });
      database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos/`).update({
        munição: Math.max(0, munição - quantia)
      });

      const Mensagens = [
        `Durante uma expedição de sobrevivência na selva, você coletou \`${valor} Carnes\`.`,
        `Explorando terras desconhecidas, você caçou e obteve \`${valor} Carnes\`.`,
        `Em uma jornada épica de caça, você trouxe para casa \`${valor} Carnes\`.`,
        `Desafiando os limites, você passou um período extenso na natureza e conseguiu \`${valor} Carnes\`.`,
        `Explorando florestas exuberantes, sua perícia na caça resultou em \`${valor} Carnes\`.`,
        `Durante uma expedição noturna, você capturou \`${valor} Carnes\`.`,
        `Com astúcia e paciência, você acumulou \`${valor} Carnes\` durante uma temporada de caça intensiva.`,
        `Você demonstrou maestria na arte da caça, obtendo \`${valor} Carnes\` em uma única jornada.`,
      ]

      const mensagem = Mensagens[Math.floor(Math.random() * Mensagens.length)];

      let desc = `🏹 **|** ${mensagem}`;
      if (bonusVip > 0) {
        desc += `\n${vipInfo.emojiVip} **Bônus VIP (${vipInfo.levelName}):** +${bonusVip} Carnes extras e durabilidade preservada!`;
      }

      const embed = new EmbedBuilder()
      .setColor(color.embed)
      .setDescription(desc)

      await XpUpdate(interaction, interaction.user, Math.floor(Math.random() * 10) + 23);
      return interaction.followUp({ embeds: [embed], fetchReply: true, ephemeral: false  })

    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
}