const { EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const bjGames = new Map(); 
const Deck = require("../../../src/arquivos/blackjack/deck.js");
const Hand = require("../../../src/arquivos/blackjack/hand.js");
const ImgBlackjack = "https://cdn.glitch.com/caa6cada-63a6-4f75-bbeb-f622da3a8604%2Fblackjack-badge.png?v=1609304997428";

const { getUserMoney, TransactionUpdate, UpdateMoneyWallet, NumberConvert, Format } = require('../../utils/functions.js');

// FUNÇÕES AUXILIARES NATIVAS: Calculam os pontos diretamente pela Array de cartas para evitar falhas de escopo/protótipo
function calcularScore(handInst) {
  if (!handInst || !handInst.cards) return 0;
  let score = 0;
  let aces = 0;

  handInst.cards.forEach(card => {
    if (card.face === "A") {
      aces++;
      score += 11;
    } else if (card.face === "J" || card.face === "Q" || card.face === "K") {
      score += 10;
    } else {
      score += parseInt(card.face, 10) || 0;
    }
  });

  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

function verificarBust(handInst) {
  return calcularScore(handInst) > 21;
}

function renderizarMao(handInst) {
  if (!handInst || !handInst.cards || handInst.cards.length === 0) return "Nenhuma carta";
  let string = "";
  handInst.cards.forEach(card => {
    string += `${card.face} de ${card.suite}\n`;
  });
  return string;
}

module.exports = {
  "name": "blackjack",
  "description": `⌊🎰 Apostas⌉ Jogo de cartas com objetivo de somar 21 pontos.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "quantidade",
      "type": ApplicationCommandOptionType.String,
      "description": "Qual a quantia que você deseja apostar.",
      "required": true,
    },
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const { CheckUserCooldowns } = require('../../utils/functions.js');
      const { status } = await CheckUserCooldowns(interaction.user, 30000, 'cassino');
      if (status) {
        return interaction.followUp({ 
          content: `⏰ **|** Controle de banca! Aguarde **<t:${~~((status)/1000)}:R>** para iniciar outra partida de Blackjack.`,
          ephemeral: true 
        });
      }

      const Quantidade = interaction.options.getString('quantidade');
      const number = NumberConvert(Quantidade);

      const { carteira } = await getUserMoney(interaction.user);

      if (isNaN(number)) return interaction.error({ content: `\`${Quantidade}\` Isto não me parece um número válido.` });
      if (carteira < number) return interaction.error({ content: `Você não possui dinheiro o suficiente para apostar.` });
      if (number < 200) return interaction.error({ content: `O Valor mínimo para uma aposta é **R$ 200**` });
      if (number > 10000) return interaction.error({ content: `O Valor máximo para uma aposta é **R$ 10.000**` });

      await database.ref(`/economia/${interaction.user.id}/cooldowns`).update({ cassino: Date.now() });

      if (bjGames.has(interaction.user.id)) {
        return interaction.error({ content: `Você já está em um jogo! Termine o jogo atual antes de iniciar outro!` });
      }

      const rowAtiva = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("comprar").setStyle(ButtonStyle.Secondary).setEmoji(emoji.positivo || '✅').setLabel("Comprar"),
        new ButtonBuilder().setCustomId("parar").setStyle(ButtonStyle.Secondary).setEmoji(emoji.negativo || '❌').setLabel("Parar"),
      );

      const rowDesativada = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("comprar").setStyle(ButtonStyle.Secondary).setEmoji(emoji.positivo || '✅').setLabel("Comprar").setDisabled(true),
        new ButtonBuilder().setCustomId("parar").setStyle(ButtonStyle.Secondary).setEmoji(emoji.negativo || '❌').setLabel("Parar").setDisabled(true),
      );

      const Descrição = `💸 **| Objetivo:** Tente chegar o mais próximo de **21**, caso ultrapasse ou seu adversário consiga primeiro que você, você perdeu!\n\n💰 **|** Aposta: **${Format(number, 'R$')}**\n\n> **\`Comprar\`**, para pegar outra carta ou **\`parar\`** para passar.`;

      function JogoBlackjack() {
        this.deck = new Deck().shuffle();
        this.player = new Hand();
        this.dealer = new Hand();
      }

      const game = new JogoBlackjack();
      
      game.player.add(game.deck.draw());
      game.player.add(game.deck.draw());
      game.dealer.add(game.deck.draw());

      bjGames.set(interaction.user.id, game);
      await UpdateMoneyWallet(interaction, interaction.user, '-', number);

      const gerarEmbedGame = (titulo, textoDesc, corEmbed) => {
        return new EmbedBuilder()
          .setTitle(titulo)
          .setDescription(textoDesc)
          .setColor(corEmbed)
          .addFields(
            { name: `**🙎‍♂️ ${interaction.user.username}**`, value: renderizarMao(game.player) + `\n**Pontos:** \`${calcularScore(game.player)}\``, inline: true },
            { name: `**👧 ${client.user.username}**`, value: renderizarMao(game.dealer) + `\n**Pontos:** \`${calcularScore(game.dealer)}\``, inline: true }
          )
          .setThumbnail(ImgBlackjack)
          .setTimestamp()
          .setFooter({ text: interaction.user.username });
      };

      const msg = await interaction.followUp({ 
        content: `${interaction.user}`, 
        embeds: [gerarEmbedGame(`${client.user.username} • BlackJack`, Descrição, color.embed || "#00ff00")],
        components: [rowAtiva] 
      });

      const collector = interaction.channel.createMessageComponentCollector({ 
        filter: m => m.user.id === interaction.user.id && m.message.id === msg.id, 
        time: 300000 
      });

      collector.on("collect", async (m) => {
        await m.deferUpdate();

        const jogoAtual = bjGames.get(interaction.user.id);
        if (!jogoAtual) return collector.stop("erro");

        if (m.customId === "comprar") {
          jogoAtual.player.add(jogoAtual.deck.draw());

          if (verificarBust(jogoAtual.player)) {
            collector.stop("perdeu_estourou");
          } else {
            await msg.edit({ embeds: [gerarEmbedGame(`${client.user.username} • BlackJack`, Descrição, color.embed || "#00ff00")] });
          }
        } 
        
        else if (m.customId === "parar") {
          await msg.edit({ components: [rowDesativada] }).catch(() => {});

          // Regra Oficial do Dealer de Blackjack: Puxa cartas até atingir no mínimo 17 pontos
          while (calcularScore(jogoAtual.dealer) < 17) {
            jogoAtual.dealer.add(jogoAtual.deck.draw());
            
            await msg.edit({ 
              embeds: [gerarEmbedGame(`${client.user.username} • BlackJack (Turno da Mesa)`, "Sistine está puxando uma carta do baralho...", color.embed || "#00ff00")] 
            }).catch(() => {});

            await new Promise(resolve => setTimeout(resolve, 1200));
          }

          // Verificação justa dos resultados:
          const finalScorePlayer = calcularScore(jogoAtual.player);
          const finalScoreDealer = calcularScore(jogoAtual.dealer);

          if (verificarBust(jogoAtual.dealer)) {
            collector.stop("ganhou");
          } else if (finalScoreDealer > finalScorePlayer) {
            collector.stop("perdeu_dealer_maior");
          } else if (finalScoreDealer === finalScorePlayer) {
            collector.stop("empate");
          } else {
            collector.stop("ganhou");
          }
        }
      });

      collector.on("end", async (coletado, motivo) => {
        bjGames.delete(interaction.user.id);

        let finalEmbed;
        if (motivo === "ganhou") {
          finalEmbed = gerarEmbedGame(`${client.user.username} • Ganhou!`, `🎉 Você ganhou **${Format(number * 2)}**`, "#01ff45");
          await UpdateMoneyWallet(interaction, interaction.user, '+', number * 2, {
            type: 'bj_vitoria',
            amount: number,
            targetUser: interaction.user
          });
        } 
        else if (motivo === "empate") {
          // CORREÇÃO ECONOMIA: Devolve o dinheiro exato que ele apostou de volta para a carteira
          finalEmbed = gerarEmbedGame(`${client.user.username} • Empate (Push)`, `👔 Você e a mesa empataram com os mesmos pontos! Seu dinheiro de aposta (**${Format(number, 'R$')}**) foi devolvido.`, "#ffff00");
          await UpdateMoneyWallet(interaction, interaction.user, '+', number); 
        }
        else if (motivo === "perdeu_estourou") {
          finalEmbed = gerarEmbedGame(`${client.user.username} • Estourou!`, `❌ Você passou de 21 e perdeu **${Format(number, 'R$')}**`, "#ff0101");
          await TransactionUpdate(interaction, {
            type: 'bj_derrota',
            amount: number,
            targetUser: interaction.user
          }, interaction.user);
        } 
        else if (motivo === "perdeu_dealer_maior") {
          finalEmbed = gerarEmbedGame(`${client.user.username} • O Dealer ganhou!`, `❌ A mesa fez mais pontos e você perdeu **${Format(number, 'R$')}**`, "#ff0101");
          await TransactionUpdate(interaction, {
            type: 'bj_derrota',
            amount: number,
            targetUser: interaction.user
          }, interaction.user);
        } 
        else {
          finalEmbed = gerarEmbedGame(`${client.user.username} • Cancelado`, `⏰ Tempo esgotado! A mesa recolheu as cartas.`, color.embed || "#00ff00");
        }

        await msg.edit({ embeds: [finalEmbed], components: [rowDesativada] }).catch(() => {});
      });
      
    } catch (error) {
      console.error(error);
      bjGames.delete(interaction.user.id);
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
};