const { ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { getUserMoney, UpdateMoneyWallet, Format } = require('../../utils/functions.js');

module.exports = {
  "name": "raspadinha",
  "description": "⌊🎰 Apostas⌉ Compre uma raspadinha e tenha a sorte de receber uma premiada.",
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "informações",
      "aliases": ["info", "informacoes", "infos", "i", "detalhes", "regras", "premios", "prêmios"],
      "description": "⌊🎰 Apostas⌉ Veja todas as informações sobre a raspadinha.",
      "type": ApplicationCommandType.ChatInput,
    },
    {
      "name": "comprar",
      "aliases": ["buy", "jogar", "play", "raspar", "adquirir"],
      "description": "⌊🎰 Apostas⌉ Compre uma raspadinha no valor de 500.",
      "type": ApplicationCommandType.ChatInput,
    },
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const Farmer_Combo = 3000;
      const Galinha_Combo = 1800;
      const Porco_Combo = 1400;
      const Vaca_Combo = 1100;
      const Ovelha_Combo = 800;
      const CUSTO_BILHETE = 600;
      
      const roll = [
        "👩‍🌾", 
        "<:galinha:947544319261286432>", 
        "<:porco:947544319034794026>", 
        "<:vaca:947544320637010010>", 
        "<:ovelha:947544319106117673>", 
      ];
      
      // Obtendo o subcomando considerando aliases e chamadas por prefixo
      let rawCommand = interaction.options?.getSubcommand?.(false) || args?.[0] || 'comprar';
      let command = String(rawCommand).toLowerCase();
      if (['info', 'informacoes', 'informações', 'infos', 'i', 'detalhes', 'regras', 'premios', 'prêmios'].includes(command)) {
        command = 'informações';
      } else {
        command = 'comprar';
      }

      switch (command) {
        case 'informações': {
          return interaction.followUp({ content: `💸 **|** ${interaction.user}, Veja aqui as informações sobre as raspadinhas.\n👤 **|** Ao comprar uma raspadinha no valor de **${Format(CUSTO_BILHETE)}**, raspe clicando nos ||spoilers|| e veja os emojis que aparecem!\n🎫 **|** Você ganha caso forme uma combinação de 3 iguais: **horizontal (-)**, **vertical (|)** ou **diagonal (/)**.\n\n> **👩‍🌾 - Prêmio de:** ${Format(Farmer_Combo)}\n> **<:galinha:947544319261286432> - Prêmio de:** ${Format(Galinha_Combo)}\n> **<:porco:947544319034794026> - Prêmio de:** ${Format(Porco_Combo)}\n> **<:vaca:947544320637010010> - Prêmio de:** ${Format(Vaca_Combo)}\n> **<:ovelha:947544319106117673> - Prêmio de:** ${Format(Ovelha_Combo)}` });
        }

        case 'comprar': {
          const { CheckUserCooldowns } = require('../../utils/functions.js');
          const { status } = await CheckUserCooldowns(interaction.user, 20000, 'cassino');
          if (status) {
            return interaction.followUp({ 
              content: `⏰ **|** Controle de banca! Aguarde **<t:${~~((status)/1000)}:R>** para comprar outra raspadinha.`,
              ephemeral: true 
            });
          }

          const { carteira } = await getUserMoney(interaction.user);
          if (carteira < CUSTO_BILHETE) return interaction.error({ content: `Você precisa de no mínimo: **${Format(CUSTO_BILHETE)}** na carteira para comprar.` });
          
          await database.ref(`/economia/${interaction.user.id}/cooldowns`).update({ cassino: Date.now() });

          function Random() {
            return roll[Math.floor(Math.random() * roll.length)];
          }
  
          const fruit1 = Random(); const fruit2 = Random(); const fruit3 = Random();
          const fruit4 = Random(); const fruit5 = Random(); const fruit6 = Random();
          const fruit7 = Random(); const fruit8 = Random(); const fruit9 = Random();
  
          function Check(char) {
            let combos = 0;
            if (`${fruit1} ${fruit2} ${fruit3}` === `${char} ${char} ${char}`) combos++; 
            if (`${fruit4} ${fruit5} ${fruit6}` === `${char} ${char} ${char}`) combos++; 
            if (`${fruit7} ${fruit8} ${fruit9}` === `${char} ${char} ${char}`) combos++; 
  
            if (fruit1 === char && fruit4 === char && fruit7 === char) combos++; 
            if (fruit2 === char && fruit5 === char && fruit8 === char) combos++; 
            if (fruit3 === char && fruit6 === char && fruit9 === char) combos++; 
  
            if (fruit1 === char && fruit5 === char && fruit9 === char) combos++; 
            if (fruit7 === char && fruit5 === char && fruit3 === char) combos++; 
  
            return combos;
          }
  
          let prize = 0;
          prize += (Check('👩‍🌾') * Farmer_Combo);
          prize += (Check('<:galinha:947544319261286432>') * Galinha_Combo);
          prize += (Check('<:porco:947544319034794026>') * Porco_Combo);
          prize += (Check('<:vaca:947544320637010010>') * Vaca_Combo);
          prize += (Check("<:ovelha:947544319106117673>") * Ovelha_Combo);
  
          const rowAtiva = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("coletar").setStyle(ButtonStyle.Success).setEmoji('💸').setLabel('Coletar Prêmio'),
            new ButtonBuilder().setCustomId("cancelar").setStyle(ButtonStyle.Danger).setEmoji('❌').setLabel('Descartar'),
          );

          const rowDesativada = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("coletar").setStyle(ButtonStyle.Success).setEmoji('💸').setLabel('Coletar Prêmio').setDisabled(true),
            new ButtonBuilder().setCustomId("cancelar").setStyle(ButtonStyle.Danger).setEmoji('❌').setLabel('Descartar').setDisabled(true),
          );
  
          // Remove o dinheiro do custo da raspadinha com registro
          await UpdateMoneyWallet(interaction, interaction.user, '-', CUSTO_BILHETE, {
            type: 'scratchcard_derrota',
            amount: CUSTO_BILHETE
          });
          
          const msg = await interaction.followUp({ 
            content: `💸 **|** Você comprou uma raspadinha no valor de **${Format(CUSTO_BILHETE)}**.\n> Caso tenha formado 3 emojis iguais na horizontal, vertical ou diagonal, clique em **Coletar Prêmio**. Cuidado, pois tentar coletar uma raspadinha sem prêmio fará você perder **${Format(300)}** por tentar burlar o sistema!\n\n||${fruit1}|| ||${fruit2}|| ||${fruit3}||\n||${fruit4}|| ||${fruit5}|| ||${fruit6}||\n||${fruit7}|| ||${fruit8}|| ||${fruit9}||`, 
            components: [rowAtiva] 
          });
            
          // CORREÇÃO: Adicionado tempo limite de 2 minutos (120000ms) para evitar Memory Leak
          const coletor = msg.createMessageComponentCollector({ 
            filter: i => i.user.id === interaction.user.id && i.message.id === msg.id, 
            time: 120000 
          });
  
          coletor.on('collect', async (i) => {
            await i.deferUpdate();
            
            if (i.customId === 'coletar') {
              coletor.stop('coletado');
              
              if (prize < 1) {
                await UpdateMoneyWallet(interaction, interaction.user, '-', 250, {
                  type: 'scratchcard_derrota',
                  amount: 250
                });
                return interaction.channel.send({ content: `😓 **|** <@${interaction.user.id}>, você tentou coletar uma raspadinha perdedora! Como punição, você **perdeu ${Format(250)}** da carteira.` });
              }
    
              await UpdateMoneyWallet(interaction, interaction.user, '+', prize, {
                type: 'scratchcard_vitoria',
                amount: prize
              });
              return interaction.channel.send({ content: `💸 **|** Parabéns <@${interaction.user.id}>, você raspou corretamente e recebeu: **${Format(prize)}** de prêmio!` });
            }
            
            if (i.customId === 'cancelar') {
              coletor.stop('cancelado');
            }
          });

          coletor.on('end', async (coletado, motivo) => {
            // Desativa os componentes visualmente no término da interação
            await msg.edit({ components: [rowDesativada] }).catch(() => {});

            if (motivo === 'cancelado') {
              await interaction.followUp({ content: `Você descartou a raspadinha com sucesso.`, ephemeral: true });
            }
            else if (motivo === 'time') {
              await interaction.followUp({ content: `⏰ O tempo limite para interagir com a raspadinha expirou.`, ephemeral: true });
            }
          });
          break;
        }
      }
    } catch (error) {
      console.error(error);
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
};