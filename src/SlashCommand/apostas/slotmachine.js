const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { getUserMoney, UpdateMoneyWallet, NumberConvert, Format } = require('../../utils/functions.js');

module.exports =  {
  "name": "slotmachine",
  "description": `⌊🎰 Apostas⌉ Multiplique seu dinheiro de acordo com as frutas.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "quantidade",
      "type": ApplicationCommandOptionType.String,
      "description": "Qual a quantia que você deseja apostar.",
      "required": true,
    }
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const { carteira } = await getUserMoney(interaction.user);
      const number = NumberConvert(interaction.options.getString('quantidade'));
      
      if (isNaN(number) || number <= 0) return interaction.error({ content: `\`${number}\` não me parece um número válido.` });
      if (carteira < number) return interaction.error({ content: `Você não possui o valor suficiente na carteira.` });
      if (number < 50) return interaction.error({ content: `O valor mínimo para aposta é de **${Format(50)}**` });
      if (number > 25000) return interaction.error({ content: `O valor máximo para aposta é de **${Format(25000)}**` });
      
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
          Multiplique = 10;
        } else if (final === `🍌 | 🍌 | 🍌` || final === `🍉 | 🍉 | 🍉` || final === `🍊 | 🍊 | 🍊`) {
          Multiplique = 6;
        } else if (final === `🍏 | 🍏 | 🍏` || final === `🍇 | 🍇 | 🍇` || final === `🍓 | 🍓 | 🍓`) {
          Multiplique = 4;
        } else if (random1 === random2 || random2 === random3 || random1 === random3) {
          Multiplique = 2;
        } else {
          win = false;
        }

        if (win) {
          // Adiciona o prêmio multiplicado de volta à carteira
          await UpdateMoneyWallet(interaction, interaction.user, '+', (number * Multiplique), `{emoji.entrada} {mensagem.slotmachine.vitoria} | ${(number * Multiplique)}`);
        } else {
          // Registra apenas a transação de perda na database (o dinheiro já foi tirado antes)
          await database.ref(`economia/${interaction.user.id}/Transações/`).push(`{emoji.saida} {mensagem.slotmachine.derrota} | ${number}`);
        }

        let embedFinal = new EmbedBuilder()
          .setTitle("🎰 Slot Machine")
          .setDescription(`**[ ${final} ]**\n\n> Você apostou: **${Format(number)}** ${win ? `e ganhou: **${Format(number * Multiplique)}** (${Multiplique}x)` : `e perdeu.`}`)
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