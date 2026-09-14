const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { getUserInventory, CheckUserCooldowns, CheckUserVip, Format, UpdateMoneyWallet } = require('../../utils/functions.js');

module.exports =  {
  "name": "crime",
  "description": `⌊💸 Economia⌉ Cometa crime e tenha a chance de ganhar dinheiro.`,
  "type": ApplicationCommandType.ChatInput,
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {
      
      const SnapshotEmprego = await database.ref(`economia/${interaction.user.id}/emprego`).once('value');
      let emprego = (SnapshotEmprego.val() && SnapshotEmprego.val().emprego);
      if (emprego === undefined || emprego === null) emprego = 0;

      if (emprego >= 5) return interaction.error({ content: `Você não pode cometer um crime pos seu emprego não permite.` });
      
      const { status } = await CheckUserCooldowns(interaction.user, 45 * 60000, 'crime')
      
      if (status) {
        const embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`⏰ **|** Você está procurado pela polícia! Poderá cometer crimes novamente **<t:${~~((status)/1000)}:R>**.`)

        return interaction.followUp({ embeds: [embed] });
      }
        
      let { munição, arma } = await getUserInventory(interaction.user)
      
      if (munição < 1) return interaction.error({ content: `Você não possui munições para cometer um crime.` })

      if (arma.Xp && arma.Xp < 1) arma = 0;
      if (arma && arma.item < 1) return interaction.error({ content: `Você precisa de uma arma equipada para cometer um crime.` });

      const { infoVIP, vip, tempo, data } = await CheckUserVip(interaction.user)
      const VIP = (data !== null && tempo - (Date.now() - data) < 0 || infoVIP == false) ? false : true

      let Emote = '';
      let multiplier = 1;
      if (infoVIP) {
        if (vip == 1) Emote = '<:vipGold:1061405487628812358>', multiplier = 1.25;
        else if (vip == 2) Emote = '<:vipDiamante:1061405543299821698>', multiplier = 1.5;
      }
      if (client.config?.cargos?.criador?.includes(interaction.user.id)) multiplier = 2.0, Emote = '<:ownerbadge:1235848955250872391>';
      
      // Desgaste da arma: 2 a 4 pontos
      const durabilityLoss = Math.floor(Math.random() * 3) + 2;
      const newArmaXP = Math.max(0, arma.Xp - durabilityLoss);

      await database.ref(`/economia/${interaction.user.id}/cooldowns`).update({
        crime: Date.now()
      });

      // 55% de chance de vitória, 45% de derrota
      const isVictory = Math.random() < 0.55;

      if (!isVictory) {
        // Derrota - Pego pela polícia (Multa de 450 a 850)
        const PerdaMoney = Math.floor(Math.random() * 401) + 450;
        
        database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos`).update({
          munição: Math.max(0, munição - 1),
          arma: { item: arma.item, nome: arma.nome, Xp: newArmaXP }
        });

        await UpdateMoneyWallet(interaction, interaction.user, '-', PerdaMoney, `{emoji.saida} {mensagem.crime.derrota} | ${Format(PerdaMoney)}`);

        const random_policia = [
          `💵 | Você foi pego em uma operação e perdeu: **${Format(PerdaMoney)}**`,
          `💵 | Você teve sua residência revistada e perdeu: **${Format(PerdaMoney)}**`,
          `💵 | Você foi interceptado em fuga e multado em: **${Format(PerdaMoney)}**`,
          `💵 | Seu esquema foi desmantelado pela polícia e você perdeu: **${Format(PerdaMoney)}**`,
          `💵 | Seu comparsa foi preso e você perdeu: **${Format(PerdaMoney)}**`,
        ];

        const embed = new EmbedBuilder()
          .setColor(color.embed || "#ff0000")
          .setDescription(`${random_policia[Math.floor(Math.random() * random_policia.length)]} e ficou procurado durante 45 minutos.`);

        return interaction.followUp({ embeds: [embed] });
      } else {
        // Vitória no crime (750 a 1.350 * multiplicador)
        const baseCrime = Math.floor(Math.random() * 601) + 750;
        const CrimeMoney = Math.floor(baseCrime * multiplier);

        database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos`).update({
          munição: Math.max(0, munição - 1),
          arma: { item: arma.item, nome: arma.nome, Xp: newArmaXP }
        });

        await UpdateMoneyWallet(interaction, interaction.user, '+', CrimeMoney, `{emoji.entrada} {mensagem.crime.vitoria} | ${Format(CrimeMoney)}`);

        const random_crime = [
          "💵 | Você furtou na orla da praia e ganhou:" + ` **${Format(CrimeMoney)}** ${Emote ? `(${Emote} ${multiplier}x)` : ''}`,
          "💵 | Você clonou um cartão e ganhou:" + ` **${Format(CrimeMoney)}** ${Emote ? `(${Emote} ${multiplier}x)` : ''}`,
          "💵 | Você invadiu um sistema seguro e faturou:" + ` **${Format(CrimeMoney)}** ${Emote ? `(${Emote} ${multiplier}x)` : ''}`,
          "💵 | Você fez uma operação clandestina e ganhou:" +  ` **${Format(CrimeMoney)}** ${Emote ? `(${Emote} ${multiplier}x)` : ''}`,
          "💵 | Você negociou mercadorias ilegais e faturou:" +  ` **${Format(CrimeMoney)}** ${Emote ? `(${Emote} ${multiplier}x)` : ''}`,
        ];

        const embed = new EmbedBuilder()
          .setColor(color.embed || "#00ff00")
          .setDescription(`${random_crime[Math.floor(Math.random() * random_crime.length)]}`);

        return interaction.followUp({ embeds: [embed] });
      }
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
}