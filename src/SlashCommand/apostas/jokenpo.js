const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');
const { getUserMoney, UpdateMoneyWallet, NumberConvert, Format } = require('../../utils/functions.js');

module.exports =  {
  "name": "jokenpo",
  "description": `⌊🎰 Apostas⌉ Aposte usando pedra, papel ou tesoura contra mim e ganhe dinheiro.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "escolha",
      "description": "Faça sua escolha",
      "type": ApplicationCommandOptionType.String,
      "required": true,
      "choices": [
        {
          "name": "🗿 Pedra",
          "value": "pedra"
        },
        {
          "name": "🧻 Papel",
          "value": "papel"
        },
        {
          "name": "✂️ Tesoura",
          "value": "tesoura"
        },
      ]
    },
    {
      "name": "quantidade",
      "type": ApplicationCommandOptionType.String,
      "description": "Digite a quantia de sua aposta",
      "required": true,
    }
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    
    try {
      
      async function UpdateApostas(User, Win, NovoDinheiroGanho, NovoDinheiroPerca) {

        return database.ref(`/economia/${User.id}/apostas/jokenpo`).once('value').then(async function(snapshot) {
          let Ganhou = (snapshot.val() && snapshot.val().ganhou);
          if (Ganhou === undefined || Ganhou === null) Ganhou = 0; 
  
          let Perdeu = (snapshot.val() && snapshot.val().perdeu);
          if (Perdeu === undefined || Perdeu === null) Perdeu = 0; 
  
          let DinheiroGanho = (snapshot.val() && snapshot.val().Moneyganhou);
          if (DinheiroGanho === undefined || DinheiroGanho === null) DinheiroGanho = 0; 
  
          let DinheiroPerdeu = (snapshot.val() && snapshot.val().MoneyPerdeu);
          if (DinheiroPerdeu === undefined || DinheiroPerdeu === null) DinheiroPerdeu = 0;
  
          if (Win == '+') {
  
            database.ref(`/economia/${User.id}/apostas/jokenpo`).update({
              ganhou: Ganhou + 1,
              perdeu: Perdeu + 0,
              Moneyganhou: DinheiroGanho + NovoDinheiroGanho,
              MoneyPerdeu: DinheiroPerdeu + NovoDinheiroPerca,
            });
  
          } else if (Win == '-') {
  
            database.ref(`/economia/${User.id}/apostas/jokenpo`).update({
              ganhou: Ganhou + 0,
              perdeu: Perdeu + 1,
              Moneyganhou: DinheiroGanho + NovoDinheiroGanho,
              MoneyPerdeu: DinheiroPerdeu + NovoDinheiroPerca,
            });
  
          }
  
        })
      }

      const { carteira } = await getUserMoney(interaction.user);
      
      const quantia = interaction.options.getString('quantidade');
      
      let number = NumberConvert(quantia);
      if (quantia == 'all' || quantia == 'tudo') number = carteira;
  
      if (isNaN(number) || number <= 0) return interaction.error({ content: `\`${quantia}\` não me parece um número válido.` });
      if (carteira < number) return interaction.error({ content: `Você não possui dinheiro suficiente na carteira.` });
      
      if (number < 50) return interaction.error({ content: `O valor mínimo para aposta é de **${Format(50)}**` });
      if (number > 25000) return interaction.error({ content: `O valor máximo para aposta é de **${Format(25000)}**` });
  
      const escolha = interaction.options.getString('escolha');
      
      const msg1 = `<@${interaction.user.id}> - <a:pedrapapeltesoura:931715964628779049>\n<@${client.user.id}> - <a:pedrapapeltesoura2:931715901466771540>`;
  
      const jogadas = {
        pedra: { emoji: '<:pedra:931718838066757632>', vence: 'tesoura', perde: 'papel' },
        papel: { emoji: '<:papel:931718208514326559>', vence: 'pedra', perde: 'tesoura' },
        tesoura: { emoji: '<:tesoura:931717850014548018>', vence: 'papel', perde: 'pedra' }
      };

      const opcoes = ['pedra', 'papel', 'tesoura'];
      const jogadaComputador = opcoes[Math.floor(Math.random() * opcoes.length)];

      let resultado = 'empate';
      if (escolha === jogadaComputador) {
        resultado = 'empate';
      } else if (jogadas[escolha].vence === jogadaComputador) {
        resultado = 'vitoria';
      } else {
        resultado = 'derrota';
      }

      // Desconta a aposta antecipadamente para evitar double-spending
      await UpdateMoneyWallet(interaction, interaction.user, '-', number);
      
      let mensagemResultado = '';
      if (resultado === 'empate') {
        await UpdateMoneyWallet(interaction, interaction.user, '+', number);
        mensagemResultado = `👔 **Empate!** Seu dinheiro (${Format(number)}) foi devolvido.`;
      } else if (resultado === 'vitoria') {
        await UpdateMoneyWallet(interaction, interaction.user, '+', number * 2, `{emoji.entrada} {mensagem.jokenpo.vitoria} | ${number}`);
        await UpdateApostas(interaction.user, '+', number, 0);
        mensagemResultado = `🎉 **<@${interaction.user.id}> ganhou ${Format(number)}!**`;
      } else {
        await database.ref(`economia/${interaction.user.id}/Transações/`).push(`{emoji.saida} {mensagem.jokenpo.derrota} | ${number}`);
        await UpdateApostas(interaction.user, '-', 0, number);
        mensagemResultado = `❌ **<@${interaction.user.id}> perdeu ${Format(number)}.**`;
      }
      
      return interaction.followUp({ content: msg1 }).then(m => {
        setTimeout(() => {
          m.edit({ content: `<@${interaction.user.id}> - ${jogadas[escolha].emoji} **${escolha}**\n<@${client.user.id}> - ${jogadas[jogadaComputador].emoji} **${jogadaComputador}**\n\n> ${mensagemResultado}` }).catch(() => {});
        }, 3 * 1000);
      });
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }

    
  }
}