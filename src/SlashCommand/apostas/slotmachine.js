const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { getUserMoney, UpdateMoneyWallet, NumberConvert, Format, CheckUserCooldowns } = require('../../utils/functions.js');

module.exports =  {
  "name": "slotmachine",
  "description": `⌊🎰 Apostas⌉ Multiplique seu dinheiro de acordo com as frutas.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "quantidade",
      "type": ApplicationCommandOptionType.String,
      "description": "Qual a quantia que você deseja apostar (50 a 2.500).",
      "required": true,
    }
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const { status } = await CheckUserCooldowns(interaction.user, 15000, 'cassino');
      if (status) {
        const embedCd = new EmbedBuilder()
          .setColor(color.embed || "#ff0000")
          .setDescription(`⏰ **|** Controle de banca! Aguarde **<t:${~~((status)/1000)}:R>** para girar a slot machine novamente.`);
        return interaction.followUp({ embeds: [embedCd] });
      }

      const { carteira } = await getUserMoney(interaction.user);
      const number = NumberConvert(interaction.options.getString('quantidade'));
      
      if (isNaN(number) || number <= 0) return interaction.error({ content: `\`${number}\` não me parece um número válido.` });
      if (carteira < number) return interaction.error({ content: `Você não possui o valor suficiente na carteira.` });
      if (number < 50) return interaction.error({ content: `O valor mínimo para aposta é de **${Format(50)}**` });
      if (number > 2500) return interaction.error({ content: `O valor máximo para aposta é de **${Format(2500)}**` });
      
      await database.ref(`/economia/${interaction.user.id}/cooldowns`).update({ cassino: Date.now() });

      const roll = ["🍒", "🍌", "🍓", "🍊", "🍏", "🍉", "🍇"];
      const Random = () => roll[Math.floor(Math.random() * roll.length)];

      const random1 = Random();
      const random2 = Random();
      const random3 = Random();
      let final = `${random1} | ${random2} | ${random3}`;

      // OTIMIZAÇÃO: Remove o dinheiro IMEDIATAMENTE antes do giro começar para evitar burlas
      await UpdateMoneyWallet(interaction, interaction.user, '-', number);

      let embed = new EmbedBuilder()
        .setColor(color.embed || "#00ff00")
        .setTitle("🎰 Slot Machine")
        .setDescription(`**[ <a:slotmachine1:924801286216503326> |  <a:slotmachine2:924801318793642044> | <a:slotmachine3:924801355770658826> ]**\n\n> Girando as manivelas...`)
        .setTimestamp();

      const m = await interaction.followUp({ embeds: [embed] });
        
      // Timeout limpo de 2 segundos de animação
      setTimeout(async () => {
        let Multiplique = 1;
        let win = true;

        if (final === `🍒 | 🍒 | 🍒`) {
          Multiplique = 15; // Jackpot Triplo
        } else if (final === `🍌 | 🍌 | 🍌` || final === `🍉 | 🍉 | 🍉` || final === `🍊 | 🍊 | 🍊`) {
          Multiplique = 6; // Trios Médios
        } else if (final === `🍏 | 🍏 | 🍏` || final === `🍇 | 🍇 | 🍇` || final === `🍓 | 🍓 | 🍓`) {
          Multiplique = 4; // Trios Básicos
        } else if (random1 === random2 || random2 === random3 || random1 === random3) {
          Multiplique = 1.8; // Qualquer Par
        } else {
          win = false;
        }

        const premioFinal = Math.floor(number * Multiplique);

        if (win) {
          // Adiciona o prêmio multiplicado de volta à carteira
          await UpdateMoneyWallet(interaction, interaction.user, '+', premioFinal, `{emoji.entrada} {mensagem.slotmachine.vitoria} | ${premioFinal}`);
        } else {
          // Registra apenas a transação de perda na database (o dinheiro já foi tirado antes)
          await database.ref(`economia/${interaction.user.id}/Transações/`).push(`{emoji.saida} {mensagem.slotmachine.derrota} | ${number}`);
        }

        let embedFinal = new EmbedBuilder()
          .setTitle("🎰 Slot Machine")
          .setDescription(`**[ ${final} ]**\n\n> Você apostou: **${Format(number)}** ${win ? `e ganhou: **${Format(premioFinal)}** (${Multiplique}x)` : `e perdeu.`}`)
          .setColor(win ? "#00ff00" : "#ff0000")
          .setTimestamp();

        await m.edit({ embeds: [embedFinal] }).catch(() => {});
      }, 2000);
      
    } catch (error) {
      console.error(error);
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
};