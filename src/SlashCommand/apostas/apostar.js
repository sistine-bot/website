const { ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { CheckUserBlacklisted, getUserMoney, CheckUserVip, TransactionUpdate, UpdateMoneyWallet, NumberConvert, Format } = require('../../utils/functions.js');

module.exports =  {
  "name": "apostar",
  "description": `⌊🎰 Apostas⌉ Aposte contra alguém e ganhe dinheiro de forma justa.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "usuário",
      "type": ApplicationCommandOptionType.User,
      "description": "Mencione alguém para poder apostar",
      "required": true,
    },
    {
      "name": "quantidade",
      "type": ApplicationCommandOptionType.String,
      "description": "Qual a quantia que você deseja apostar.",
      "required": true,
    },
    {
      "name": "escolha",
      "description": "Faça sua escolha para a aposta.",
      "type": ApplicationCommandOptionType.String,
      "required": false,
      "choices": [
        {
          "name": "impar",
          "value": "impar"
        },
        {
          "name": "par",
          "value": "par"
        },
      ]
    },
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try { 
      
      async function UpdateApostas(User, Win, NovoDinheiroGanho, NovoDinheiroPerca) {
        return database.ref(`/economia/${User.id}/apostas/aposta`).once('value').then(async function(snapshot) {
          let Ganhou = (snapshot.val() && snapshot.val().ganhou);
          if (Ganhou === undefined || Ganhou === null) Ganhou = 0; 

          let Perdeu = (snapshot.val() && snapshot.val().perdeu);
          if (Perdeu === undefined || Perdeu === null) Perdeu = 0; 
          
          let DinheiroGanho = (snapshot.val() && snapshot.val().Moneyganhou);
          if (DinheiroGanho === undefined || DinheiroGanho === null) DinheiroGanho = 0; 

          let DinheiroPerdeu = (snapshot.val() && snapshot.val().MoneyPerdeu);
          if (DinheiroPerdeu === undefined || DinheiroPerdeu === null) DinheiroPerdeu = 0;
          
          if (Win == '+') {
            
            database.ref(`/economia/${User.id}/apostas/aposta`).update({
              ganhou: Ganhou + 1,
              perdeu: Perdeu + 0,
              Moneyganhou: DinheiroGanho + NovoDinheiroGanho,
              MoneyPerdeu: DinheiroPerdeu + NovoDinheiroPerca,
            });
            
          } else if (Win == '-') {
            
            database.ref(`/economia/${User.id}/apostas/aposta`).update({
              ganhou: Ganhou + 0,
              perdeu: Perdeu + 1,
              Moneyganhou: DinheiroGanho + NovoDinheiroGanho,
              MoneyPerdeu: DinheiroPerdeu + NovoDinheiroPerca,
            });
            
          }
          
        })
      }
      
      const user = interaction.options.getUser("usuário");
      if (!user) return interaction.error({ content: `Você deve mencionar um usuário para poder apostar.` })
      
      const { blacklisted, blacklistedMensagem } = await CheckUserBlacklisted(user)
      if (blacklisted) return interaction.followUp({ content: blacklistedMensagem, ephemeral: true })
      
      if (user.bot && user.id !== client.user.id) return interaction.error({ content: `Você não pode apostar com um bot`});
      
      if (user.id === interaction.user.id) return interaction.error({ content: `Você não pode apostar com você mesmo` });
      
      const escolha = interaction.options.getString('escolha') ||  ['Ímpar', 'Par'][Math.floor(Math.random() * 2)];
      
      const escolhaUser = (escolha == 'Par') ? 'Ímpar' : 'Par'
      
      const Quantidade = await interaction.options.getString('quantidade');
      
      const { carteira } = await getUserMoney(interaction.user)

      let number = NumberConvert(Quantidade);
      if (['all', 'tudo'].includes(Quantidade.toLowerCase())) number = carteira;
      
      if (isNaN(number)) return interaction.error({ content: `\`${Quantidade}\` não me parece um número válido.` })

      if (carteira < number) return interaction.error({ content: `Você não possui dinheiro suficiente para apostar com este usuário.` });

      if (number < 200) return interaction.error({ content: `O valor mínimo para aposta é de **${Format(200)}**` });
      if (number > 20000) return interaction.error({ content: `O valor máximo para aposta é de **${Format(20000)}**` });
      
      // CARTEIRA USER
      const carteiraUser = await getUserMoney(user).then(money => money.carteira);
      
      if (number > carteiraUser) return interaction.error({ content: `${user} não possui dinheiro suficiente para apostar com você.` });
      
      const id = user.id;
      
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("um").setStyle(ButtonStyle.Secondary).setEmoji(emoji.positivo || '✅').setLabel("Aceitar").setDisabled(false),
        new ButtonBuilder().setCustomId("dois").setStyle(ButtonStyle.Secondary).setEmoji(emoji.negativo || '❌').setLabel("Recusar").setDisabled(false),
      );
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("um").setStyle(ButtonStyle.Secondary).setEmoji(emoji.positivo || '✅').setLabel("Aceitar").setDisabled(true),
        new ButtonBuilder().setCustomId("dois").setStyle(ButtonStyle.Secondary).setEmoji(emoji.negativo || '❌').setLabel("Recusar").setDisabled(true),
      );
      
      const dado = Math.floor(Math.random() * 6) + 1;

      let msg = await interaction.followUp({ content:
`🎲 **|** **${interaction.user.username}** escolheu **${escolha}** e chamou: **${user.username}** que ficará com: **${escolhaUser}**, aposta valendo: **${Format(number)}** *(Pote total: ${Format(number * 2)})*
> <@${id}> Confirme para a aposta começar. *(Taxa de duelo: 7.5% comuns / 3% VIP)*`, components: [row], fetchReply: true, ephemeral: false });
      
      const coletor = msg.createMessageComponentCollector({ filter: i => i.user.id === id, time: 60000 });

      coletor.on('collect', async(int) => {
        int.deferUpdate();

        try {

          switch (int.customId) {
            case 'um': {
              coletor.stop();
              await msg.edit({ components: [row2] }).catch(() => {});

              const { blacklisted, blacklistedMensagem } = await CheckUserBlacklisted(user);
              if (blacklisted) return interaction.followUp({ content: blacklistedMensagem, ephemeral: true });
              
              const { carteira: carteiraAtualAutor } = await getUserMoney(interaction.user);
              if (carteiraAtualAutor < number) return interaction.error({ content: `<@${interaction.user.id}> não possui mais o valor suficiente para a aposta.` });

              const carteiraAtualOponente = await getUserMoney(user).then(money => money.carteira);
              if (carteiraAtualOponente < number) return interaction.error({ content: `<@${user.id}> não possui mais dinheiro suficiente para esta aposta.` });
              
              const resultado = (dado % 2 === 0) ? 'Par' : 'Ímpar';

              let ganhador = '';

              switch (resultado) {
                case 'Par':
                  ganhador = (escolha === 'Par') ? interaction.user.id : user.id;
                  break;
                case 'Ímpar':
                  ganhador = (escolha === 'Ímpar') ? interaction.user.id : user.id;
                  break;
              }

              const ganhadorUser = (ganhador === interaction.user.id) ? interaction.user : user;
              const perdedorUser = (ganhador === interaction.user.id) ? user : interaction.user;

              const { infoVIP, tempo, data } = await CheckUserVip(ganhadorUser);
              const VIP = (data !== null && tempo - (Date.now() - data) < 0 || infoVIP === false) ? false : true;
              
              const poteTotal = number * 2;
              const taxaPercentual = VIP ? 0.03 : 0.075;
              const taxa = Math.floor(poteTotal * taxaPercentual);
              const valorLiquido = poteTotal - taxa;
              const ganhoLiquido = valorLiquido - number;

              await UpdateMoneyWallet(interaction, user, '-', number);
              await UpdateMoneyWallet(interaction, interaction.user, '-', number);
              
              await TransactionUpdate(interaction, `{emoji.entrada} {mensagem.aposta.vitoria} | ${ganhoLiquido} | ${perdedorUser.id}`, ganhadorUser);
              await UpdateApostas(ganhadorUser, '+', ganhoLiquido, 0);

              await TransactionUpdate(interaction, `{emoji.saida} {mensagem.aposta.derrota} | ${number} | ${ganhadorUser.id}`, perdedorUser);
              await UpdateApostas(perdedorUser, '-', 0, number);

              await UpdateMoneyWallet(interaction, ganhadorUser, '+', valorLiquido);
              return msg.reply({ 
                content: `🎉 **|** O dado rolou e caiu: **${dado}** (${resultado})! <@${ganhador}> você ganhou a aposta e faturou **${Format(ganhoLiquido)}** líquidos! \n> 🏛️ **Taxa de Imposto (${VIP ? '3.0% VIP' : '7.5% Padrão'}):** **${Format(taxa)}** foram recolhidos pelo governo.` 
              });
            }

            case 'dois':
              coletor.stop();
              await msg.edit({ components: [row2] }).catch(() => {});
              return msg.reply({ content: `❌ **|** <@${id}> recusou a aposta contra <@${interaction.user.id}>.` });
          }

        } catch(error) {
          console.error(error);
          return interaction.error({ content: `Ocorreu um erro ao concluir esta aposta.` });
        }
      });
    
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }

    
  }
}