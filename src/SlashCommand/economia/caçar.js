const { ApplicationCommandType, EmbedBuilder } = require('discord.js');
const { getUserInventory, CheckUserCooldowns, XpUpdate } = require('../../utils/functions.js');

module.exports =  {
  "name": "caçar",
  "description": `⌊💸 Economia⌉ Saia para caçar e tenha a chance de ganhar carne para poder vender.`,
  "type": ApplicationCommandType.ChatInput,
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {
      
      const { status } = await CheckUserCooldowns(interaction.user, 60 * 60000, 'caça')
      
      if (status) {
        const Embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`⏰ **|** A temporada de caça acabou! Você será liberado para caçar: **<t:${~~((status)/1000)}:R>**.`)

        return interaction.followUp({ embeds: [Embed], fetchReply: true, ephemeral: false  });
      }

      const { munição, armacaça, carne, peixe } = await getUserInventory(interaction.user)

      if (armacaça && armacaça.item < 1) {
        return interaction.error({ content: `Você precisa de uma Arma de Caça.` });
      }

      const quantia = Math.floor(Math.random() * 3) + 1

      if (munição < quantia) {
        return interaction.error({ content: `Você não possuí munição suficiente` });
      }

      if (armacaça.Xp < 2) {

        database.ref(`/economia/${interaction.user.id}/inventario/itens/Equipamentos/`).update({
          armacaça: null,
        });

        database.ref(`/economia/${interaction.user.id}/cooldowns`).update({
          caça: Date.now()
        });

        const Embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`Você tentou caçar e sua arma de caça acabou quebrando, fazendo você perder ela.`)

        await XpUpdate(interaction, interaction.user, Math.floor(Math.random() * 10) + 23);
        return interaction.followUp({ embeds: [Embed], fetchReply: true, ephemeral: false  })
      }

      const valor = Math.floor(Math.random() * 15) + 5;
      
      database.ref(`/economia/${interaction.user.id}/inventario/itens/Consumíveis`).update({
        carne: carne + valor,
      });

      database.ref(`/economia/${interaction.user.id}/cooldowns`).update({
        caça: Date.now()
      });

      database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos/`).update({
        munição: munição - quantia,
        armacaça: { Xp: armacaça.Xp - (Math.floor(Math.random() * 4) + 2), item: armacaça.item, nome: armacaça.nome }
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

      const embed = new EmbedBuilder()
      .setColor(color.embed)
      .setDescription(`🏹 **|** ${mensagem}`)

      await XpUpdate(interaction, interaction.user, Math.floor(Math.random() * 10) + 23);
      return interaction.followUp({ embeds: [embed], fetchReply: true, ephemeral: false  })

    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
}