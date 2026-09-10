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
      
      const { status } = await CheckUserCooldowns(interaction.user, 60 * 60000, 'crime')
      
      if (status) {
        const embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`⏰ **|** Você está procurado, você poderá cometer crimes denovo **<t:${~~((status)/1000)}:R>**.`)

        return interaction.followUp({ embeds: [embed] });
      }
        
      
      const { munição, arma } = await getUserInventory(interaction.user)
      
      if (munição < 1) return interaction.error({ content: `Você não possui munições para cometer um crime` })

      if (arma.Xp && arma.Xp < 1) arma = 0;
      if (arma && arma.item < 1) return interaction.error({ content: `Você precisa de uma arma para cometer um crime.` });

      const { infoVIP, vip, tempo, data } = await CheckUserVip(interaction.user)
      const VIP = (data !== null && tempo - (Date.now() - data) < 0 || infoVIP == false) ? false : true
      
      // const desconto = VIP ? number : number * 95 / 100

      let WinNumber = Math.floor(Math.random() * 10) + 1;
      let Emote = '';
      let multiplier = 1;
      if (infoVIP) {
        if (vip == 1) Emote = '<:vipGold:1061405487628812358>', multiplier = 1.5;
        else if (vip == 2) Emote = '<:vipDiamante:1061405543299821698>', multiplier = 2.0;
      }
      if (client.config?.cargos?.criador?.includes(interaction.user.id)) multiplier = 3, WinNumber = 10, Emote = '<:ownerbadge:1235848955250872391>';
      
      const newArmaXP = Math.max(0, arma.Xp - (Math.floor(Math.random() * 4) + 2));

      await database.ref(`/economia/${interaction.user.id}/cooldowns`).update({
        crime: Date.now()
      });

      if (WinNumber < 5) {
        // Derrota - Pego pela polícia
        const PerdaMoney = Math.floor(Math.random() * 700) + 500;
        
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
          .setDescription(`${random_policia[Math.floor(Math.random() * random_policia.length)]} e ficou procurado durante 60 minutos.`);

        return interaction.followUp({ embeds: [embed] });
      } else {
        // Vitória no crime
        const CrimeMoney = Math.floor((Math.floor(Math.random() * 1200) + 800) * multiplier);

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