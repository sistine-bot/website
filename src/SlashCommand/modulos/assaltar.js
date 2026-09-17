const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const ms = require('parse-ms');
const { Format, UpdateMoneyWallet, CheckUserCooldowns, getUserInventory, CheckUserVip, getUserMoney } = require('../../utils/functions.js');

module.exports =  {
  "name": "assaltar",
  "description": `⌊⚙️ Modulos⌉ Assalte outros usuários usando armas com chances aleatórias de ganhar dinheiro.`,
  "type": ApplicationCommandType.ChatInput, //.
  "options": [
    {
      "name": "usuário",
      "type": ApplicationCommandOptionType.User,
      "description": "Mencione alguém para assaltar ela",
      "required": true,
    }
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try  {

      const user = interaction.options.getUser("usuário");
      if ([interaction.user.id].includes(user.id)) return interaction.error({ content: `Você não pode assaltar você mesmo.` })
      
      const { status } = await CheckUserCooldowns(interaction.user, 60 * 60000, 'crime')
      
      if (status) {

        const embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`🚔 **|** Você está procurado, você poderá sair da encolha: **<t:${~~((status)/1000)}:R>**.`)

        return interaction.followUp({ embeds: [embed] });
      }
      
      if ([client.user.id].includes(user.id)) return interaction.error({ content: `Você quer pegar meu dinheiro?, Venha apostar comigo e me ganhe de uma forma justa.` })
      
      if (client.config?.cargos?.criador?.includes(user.id)) return interaction.error({ content: `Você não pode roubar o criador do bot.` });
      
      const snapEmp = await database.ref(`economia/${interaction.user.id}/emprego`).once('value');
      let emprego = (snapEmp.val() && snapEmp.val().emprego) || 0;
      
      if (emprego >= 5) {
        return interaction.error({ content: `Você não pode realizar assaltos pois sua profissão não permite condutas ilegais.` });
      }
      
      const { munição, arma } = await getUserInventory(interaction.user);
      
      if (!arma || arma.item < 1) return interaction.error({ content: `Você precisa de uma arma equipada para fazer um assalto.` });
      if (munição < 1) return interaction.error({ content: `Você não possui munição o suficiente para assaltar alguém.` });

      const { infoVIP, vip, tempo, data } = await CheckUserVip(user);
      const VIP = (data !== null && tempo - (Date.now() - data) < 0 || infoVIP == false) ? false : true;
            
      const snapAnti = await database.ref(`economia/${user.id}/AntiRoubo/`).once('value');
      const antiData = snapAnti.val() || {};
      let antiTempo = antiData.tempo || 0;
      let antiDataTime = antiData.data || 0;

      if (antiTempo === 'indeterminado' || (antiDataTime !== 0 && antiTempo - (Date.now() - antiDataTime) > 0 && VIP)) {
        const EMBED = new EmbedBuilder()
          .setColor(color.embed)
          .setDescription(`O usuário <@${user.id}> não pode ser roubado pois possui **Proteção Anti-Roubo** ativa.`);
        return interaction.followUp({ embeds: [EMBED] });
      }

      const { carteira: victimWallet } = await getUserMoney(user);
      
      if (victimWallet < 200) return interaction.error({ content: `O usuário <@${user.id}> não possui moedas suficientes na carteira para ser assaltado.` });

      if (arma.Xp <= 2) {
        database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos/arma`).set(null);

        const Embed = new EmbedBuilder()
          .setColor(color.embed || "#ff0000")
          .setDescription(`Você tentou assaltar alguém com uma arma quebrada e ela se despedaçou! Você perdeu sua **${arma.nome}**.`);

        return interaction.followUp({ embeds: [Embed] });
      }

      const durabilityLoss = Math.floor(Math.random() * 3) + 2; // 2 a 4 pontos
      const newArmaXP = Math.max(0, arma.Xp - durabilityLoss);

      await database.ref(`economia/${interaction.user.id}/cooldowns/`).update({
        crime: Date.now()
      });

      // Chance de sucesso baseada na arma (55% a 70%)
      const roll = Math.random();
      const successChance = 0.50 + (arma.item * 0.05); // Tier 1: 55%, Tier 2: 60%, Tier 3: 65%, Tier 4: 70%

      if (roll > successChance) {
        // Falha no assalto: Perde munição, desgasta arma e toma multa de fuga
        const multaFuga = Math.floor(Math.random() * 301) + 200; // 200 a 500 moedas
        
        database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos`).update({
          munição: Math.max(0, munição - 1),
          arma: { item: arma.item, nome: arma.nome, Xp: newArmaXP }
        });

        await UpdateMoneyWallet(interaction, interaction.user, '-', multaFuga, `{emoji.saida} Multa de fuga policial no assalto | ${multaFuga}`);

        const embed = new EmbedBuilder()
          .setColor(color.embed || "#ff0000")
          .setDescription(`🚨 **|** Você deu voz de assalto para <@${user.id}>, mas a vítima reagiu e você teve que fugir da polícia!\n> Você gastou **1 munição** e pagou uma multa de fuga de **${Format(multaFuga)}**.`);

        return interaction.followUp({ embeds: [embed] });
      } else {
        // Sucesso no assalto com tetos travados por arma
        let percent = 0.10;
        let maxCap = 1500;
        if (arma.item === 1) { percent = 0.10; maxCap = 1500; } // Glock: máx 1.500
        else if (arma.item === 2) { percent = 0.15; maxCap = 3000; } // MP5: máx 3.000
        else if (arma.item === 3) { percent = 0.20; maxCap = 5000; } // M4-A1: máx 5.000
        else if (arma.item >= 4) { percent = 0.25; maxCap = 8000; } // AK-47: máx 8.000

        let stolen = Math.min(maxCap, Math.floor(victimWallet * percent));
        stolen = Math.max(50, stolen);
        if (stolen > victimWallet) stolen = victimWallet;

        database.ref(`economia/${interaction.user.id}/inventario/itens/Equipamentos`).update({
          munição: Math.max(0, munição - 1),
          arma: { item: arma.item, nome: arma.nome, Xp: newArmaXP }
        });
        
        await updateAssaltos();
        
        await UpdateMoneyWallet(interaction, interaction.user, '+', stolen, `{emoji.entrada} {mensagem.assalto.vitoria} | ${stolen} | ${user.id}`);
        await UpdateMoneyWallet(interaction, user, '-', stolen, `{emoji.saida} {mensagem.assalto.derrota} | ${stolen} | ${interaction.user.id}`);

        const EMbed = new EmbedBuilder()
          .setColor(color.embed || "#00ff00")
          .setDescription(`🔫 **|** Você assaltou com sucesso o usuário <@${user.id}> e levou **${Format(stolen)}** da carteira dele!`);

        return interaction.followUp({ embeds: [EMbed] });
      }
      
      function updateAssaltos() {
        
        return database.ref(`economia/${interaction.user.id}/assaltos`).once('value').then(async function(snapshot) {
          let assaltos = (snapshot.val() && snapshot.val().assaltos);
          if (assaltos === undefined || assaltos === null) assaltos = 0;
          
          database.ref(`economia/${interaction.user.id}/assaltos`).update({
            assaltos: assaltos + 1,
          });
        })
      }
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }

    
  }
}