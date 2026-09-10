const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { Format } = require('../../utils/functions.js');

module.exports =  {
  "name": "estatísticas",
  "description": `⌊🎰 Apostas⌉ Veja as estatísticas de suas apostas.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "status",
      "description": "Escolha em qual aposta você deseja ver:",
      "type": ApplicationCommandOptionType.String,
      "required": true,
      "choices": [
        {
          "name": "Apostas",
          "value": "apostas"
        },
        {
          "name": "Jokenpo",
          "value": "jkp"
        },
      ]
    },
    {
      "name": "usuário",
      "type": ApplicationCommandOptionType.User,
      "description": "Mencione alguém para saber as estatísticas dela",
      "required": false,
    }
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {

      const user = interaction.options.getUser("usuário") || interaction.user;
    
      const escolha = interaction.options.getString('status');
      
      switch (escolha) {
        
        case 'apostas': {
          let teste = database.ref(`/economia/${user.id}/apostas/aposta`).once('value').then(async function(snapshot) {
            let Ganhou = (snapshot.val() && snapshot.val().ganhou);
            if (Ganhou === undefined || Ganhou === null) Ganhou = 0; 

            let Perdeu = (snapshot.val() && snapshot.val().perdeu);
            if (Perdeu === undefined || Perdeu === null) Perdeu = 0; 

            // if (total < 1) return interaction.followUp({ content: `${emoji.negativo} **|** ${interaction.user}, ${interaction.options.getUser("usuário") ? `Este usuário nunca jogou uma partida.` : 'Você nunca jogou uma partida.'}` })

            let DinheiroGanho = (snapshot.val() && snapshot.val().Moneyganhou);
            if (DinheiroGanho === undefined || DinheiroGanho === null) DinheiroGanho = 0; 

            let DinheiroPerdeu = (snapshot.val() && snapshot.val().MoneyPerdeu);
            if (DinheiroPerdeu === undefined || DinheiroPerdeu === null) DinheiroPerdeu = 0;

            let total = Ganhou + Perdeu;

            // var winPercentage = (Ganhou / 50) * 100; //Ganhou / (Ganhou + Perdeu);
            // var losePercentage = (Perdeu / 50) * 100; //Perdeu / (Ganhou + Perdeu);

            var winPercentage = (Ganhou) / (Ganhou + Perdeu);
            winPercentage = parseInt(winPercentage * 100)
            var losePercentage = (Perdeu) / (Ganhou + Perdeu);
            losePercentage = parseInt(losePercentage * 100)

            const embed = new EmbedBuilder()
            .setColor(color.embed)
            .setDescription(`
  💸 **|** ${interaction.options.getUser("usuário") ? `Estatísticas de apostas de: ${user}` : 'Suas estatísticas de apostas'}
  🎰 **|** Total de apostas: **${Format(total, '')}**
  📥 **|** Vitórias (${winPercentage ? winPercentage : 0}%): **${Format(Ganhou, '')}**
  📤 **|** Derrotas (${losePercentage ? losePercentage : 0}%): **${Format(Perdeu, '')}**
  💵 **|** Dinheiro ganho: **${Format(DinheiroGanho, '')}**
  💸 **|** Dinheiro perdido: **${Format(DinheiroPerdeu, '')}**
  💰 **|** Total de dinheiro: **${Format(DinheiroGanho + DinheiroPerdeu, '')}**
  > Quanto mais apostar, mais perto de 50% as vitórias/derrotas irão estar.
  `)

            return interaction.followUp({ embeds: [embed] });
          })
        }
          break;
          
        case 'jkp': {
          let teste = database.ref(`/economia/${user.id}/apostas/jokenpo`).once('value').then(async function(snapshot) {
            let Ganhou = (snapshot.val() && snapshot.val().ganhou);
            if (Ganhou === undefined || Ganhou === null) Ganhou = 0; 

            let Perdeu = (snapshot.val() && snapshot.val().perdeu);
            if (Perdeu === undefined || Perdeu === null) Perdeu = 0; 

            let DinheiroGanho = (snapshot.val() && snapshot.val().Moneyganhou);
            if (DinheiroGanho === undefined || DinheiroGanho === null) DinheiroGanho = 0; 

            let DinheiroPerdeu = (snapshot.val() && snapshot.val().MoneyPerdeu);
            if (DinheiroPerdeu === undefined || DinheiroPerdeu === null) DinheiroPerdeu = 0; 

            let total = Ganhou + Perdeu;

            // var winPercentage = (Ganhou / 50) * 100; //Ganhou / (Ganhou + Perdeu);
            // var losePercentage = (Perdeu / 50) * 100; //Perdeu / (Ganhou + Perdeu);

            var winPercentage = (Ganhou) / (Ganhou + Perdeu);
            winPercentage = parseInt(winPercentage * 100)
            var losePercentage = (Perdeu) / (Ganhou + Perdeu);
            losePercentage = parseInt(losePercentage * 100)

            const embed = new EmbedBuilder()
            .setColor(color.embed)
            .setDescription(`
💸 **|** ${interaction.options.getUser("usuário") ? `Estatísticas de jokenpo de: ${user}` : 'Suas estatísticas de jokenpo'}
🎰 **|** Total de apostas: **${Format(total, '')}**
📥 **|** Vitórias (${winPercentage ? winPercentage : 0}%): **${Format(Ganhou, '')}**
📤 **|** Derrotas (${losePercentage ? losePercentage : 0}%): **${Format(Perdeu, '')}**
💵 **|** Dinheiro ganho: **${Format(DinheiroGanho, '')}**
💸 **|** Dinheiro perdido: **${Format(DinheiroPerdeu, '')}**
💰 **|** Total de dinheiro: **${Format(DinheiroGanho + DinheiroPerdeu, '')}**
> Quanto mais apostar, mais perto de 50% as vitórias/derrotas irão estar.
    `)

            return interaction.followUp({ embeds: [embed] });
          })
        }
          break
      }
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }

    
  }
}