const { EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserInventory, XpUpdate } = require('../../utils/functions.js');
const parseMs = require('parse-ms');
const ms = require('ms');

const Tempos = {
  1: ms('15m'),
  2: ms('30m'),
  3: ms('1h')
};

module.exports = {
  "name": "fazenda",
  "description": `⌊⚙️ Modulos⌉ Cuide dos animais de sua fazenda.`,
  "type": ApplicationCommandType.ChatInput,
  
  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const msg = await interaction.followUp({ content: `<a:loading:929931026589954128> **|** Carregando fazenda.` });
      
      await edit(msg);
      
      // Otimização: Adicionado tempo limite de 2 minutos para evitar estouro de memória RAM
      const componenteColetor = msg.createMessageComponentCollector({ 
        filter: x => x.user.id === interaction.user.id,
        time: 120000 
      });

      componenteColetor.on('collect', async (int) => {
        await int.deferUpdate();
        
        try {
          const animalId = int.customId;
          if (animalId) {
            const numeroRancho = parseInt(animalId.split('_')[1]);
            const infos = await getFazenda(numeroRancho);
            
            switch (infos.button) {
              case 'Coletar':
                await efetuarColeta(numeroRancho);  
                break;
            
              case 'Alimentar':
                await efetuarAlimentacao(numeroRancho);
                break;
  
              default:
                await interaction.followUp({ content: `Este rancho está aguardando o tempo de produção ou precisa ser comprado na loja.`, ephemeral: true });
                break;
            }
          }
        } catch (error) {
          console.error("Erro ao processar clique na fazenda:", error);
        }
      });

      componenteColetor.on('end', () => {
        // Desativa os botões quando o comando expirar
        database.ref(`economia/${interaction.user.id}/Fazenda/Animal`).once('value').then(async (snapshot) => {
          const animal1 = await getFazenda(1);
          const animal2 = await getFazenda(2);
          const animal3 = await getFazenda(3);

          const rowDesativada = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("animal_1").setStyle(ButtonStyle.Secondary).setEmoji(animal1.emoji).setLabel(animal1.button).setDisabled(true),
            new ButtonBuilder().setCustomId("animal_2").setStyle(ButtonStyle.Secondary).setEmoji(animal2.emoji).setLabel(animal2.button).setDisabled(true),
            new ButtonBuilder().setCustomId("animal_3").setStyle(ButtonStyle.Secondary).setEmoji(animal3.emoji).setLabel(animal3.button).setDisabled(true),
          );
          msg.edit({ components: [rowDesativada] }).catch(() => {});
        });
      });
      
      async function getFazenda(rancho) {
        const snapshot = await database.ref(`economia/${interaction.user.id}/Fazenda/Animal`).once('value');
        const dbData = snapshot.val() || {};
        
        let animalTipo = dbData[`animal_${rancho}`] || 0;
        let alimentoStatus = dbData[`animal_${rancho}_alimento`] || 0;
        let tempoGravado = dbData[`animal_${rancho}_tempo`] || 0;
        
        let NomeAnimal = 'Comprar', emojiAnimal = '<:cancel:947544865904930846>', tempoEsperaTotal = 0;
        
        if (animalTipo === 1) { NomeAnimal = 'Galinha'; emojiAnimal = '<:galinha:947544319261286432>'; tempoEsperaTotal = Tempos[1]; }
        if (animalTipo === 2) { NomeAnimal = 'Vaca'; emojiAnimal = '<:vaca:947544320637010010>'; tempoEsperaTotal = Tempos[2]; }
        if (animalTipo === 3) { NomeAnimal = 'Porco'; emojiAnimal = '<:porco:947544319034794026>'; tempoEsperaTotal = Tempos[3]; }
        
        const tempoRestanteMs = tempoEsperaTotal - (Date.now() - tempoGravado);
        const estaEmCooldown = tempoGravado !== 0 && tempoRestanteMs > 0;
        const tempoFormatadoObj = parseMs(estaEmCooldown ? tempoRestanteMs : 0);
        
        const textoTempo = `${tempoFormatadoObj.hours}h ${tempoFormatadoObj.minutes}m ${tempoFormatadoObj.seconds}s`;
        
        let textoBotao = 'Comprar';
        let botaoDesabilitado = true;
        
        if (animalTipo > 0) {
          if (alimentoStatus === 0) {
            textoBotao = estaEmCooldown ? 'Aguarde' : 'Alimentar';
            botaoDesabilitado = estaEmCooldown;
          } else if (alimentoStatus === 1) {
            textoBotao = estaEmCooldown ? 'Aguarde' : 'Coletar';
            botaoDesabilitado = estaEmCooldown;
          }
        }
        
        return { 
          animal: animalTipo, 
          emoji: emojiAnimal, 
          nome: NomeAnimal, 
          time: estaEmCooldown, 
          tempo: textoTempo, 
          animal_tempo: tempoGravado, 
          timeAwaiting: tempoEsperaTotal, 
          button: textoBotao, 
          boolean: botaoDesabilitado 
        };
      }
      
      async function edit(targetMsg) {
        const animal1 = await getFazenda(1);
        const animal2 = await getFazenda(2);
        const animal3 = await getFazenda(3);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("animal_1").setStyle(ButtonStyle.Secondary).setEmoji(animal1.emoji).setLabel(animal1.button).setDisabled(animal1.boolean),
          new ButtonBuilder().setCustomId("animal_2").setStyle(ButtonStyle.Secondary).setEmoji(animal2.emoji).setLabel(animal2.button).setDisabled(animal2.boolean),
          new ButtonBuilder().setCustomId("animal_3").setStyle(ButtonStyle.Secondary).setEmoji(animal3.emoji).setLabel(animal3.button).setDisabled(animal3.boolean),
        );
        
        const embed = new EmbedBuilder()
          .setColor(color.embed || "#00ff00")
          .setAuthor({ name: "👨‍🌾 Fazenda" })
          .setDescription(`> Cuide de seus animais alimentando eles e recolhendo seus itens.\n\n${animal1.animal ? `${animal1.emoji} **| Rancho 1** - **${animal1.nome}**` : `${animal1.emoji} **| Rancho 1** - Comprar </loja:1186167909530218520>`}\n${animal2.animal ? `${animal2.emoji} **| Rancho 2** - **${animal2.nome}**` : `${animal2.emoji} **| Rancho 2** - Comprar </loja:1186167909530218520>`}\n${animal3.animal ? `${animal3.emoji} **| Rancho 3** - **${animal3.nome}**` : `${animal3.emoji} **| Rancho 3** - Comprar </loja:1186167909530218520>`}`)
          .setThumbnail("https://st.depositphotos.com/1010104/1716/v/600/depositphotos_17164593-stock-illustration-farm-with-animals.jpg")
          .addFields(
            { name: `Rancho 1 ${animal1.time ? `- ${animal1.tempo} (<t:${~~((animal1.animal_tempo + animal1.timeAwaiting)/1000)}:R>)` : ''}`, value: `${animal1.animal ? `${animal1.emoji} ${animal1.emoji} ${animal1.emoji}` : animal1.emoji}` },
            { name: `Rancho 2 ${animal2.time ? `- ${animal2.tempo} (<t:${~~((animal2.animal_tempo + animal2.timeAwaiting)/1000)}:R>)` : ''}`, value: `${animal2.animal ? `${animal2.emoji} ${animal2.emoji} ${animal2.emoji}` : animal2.emoji}` },
            { name: `Rancho 3 ${animal3.time ? `- ${animal3.tempo} (<t:${~~((animal3.animal_tempo + animal3.timeAwaiting)/1000)}:R>)` : ''}`, value: `${animal3.animal ? `${animal3.emoji} ${animal3.emoji} ${animal3.emoji}` : animal3.emoji}` },
          );

        await targetMsg.edit({ content: `${interaction.user}`, embeds: [embed], components: [row] }).catch(() => {});
      }

      async function efectuarAlimentacao(rancho) {
        const animal = await getFazenda(rancho);
        const inventario = await getUserInventory(interaction.user);
        const ração_animal = inventario.ração_animal || 0;

        if (animal.animal < 1) {
          return interaction.error({ content: `Você não possui nenhum animal neste rancho para ser alimentado.` });
        }
        
        if (ração_animal < 1) {
          return interaction.error({ content: `Você não possui ração o suficiente no seu inventário para alimentá-lo.` });
        }
        
        let NomeAnimalCompleto = '', emojiEspecífico = '', XpQuantia = 0;

        if (animal.animal === 1) { NomeAnimalCompleto = 'sua Galinha'; emojiEspecífico = '<:galinha:947544319261286432>'; XpQuantia = 16; }
        if (animal.animal === 2) { NomeAnimalCompleto = 'sua Vaca'; emojiEspecífico = '<:vaca:947544320637010010>'; XpQuantia = 15; }
        if (animal.animal === 3) { NomeAnimalCompleto = 'seu Porco'; emojiEspecífico = '<:porco:947544319034794026>'; XpQuantia = 21; }
        
        await database.ref(`economia/${interaction.user.id}/inventario/itens/Consumíveis`).update({
          ração_animal: ração_animal - 1,
        });
        
        await database.ref(`economia/${interaction.user.id}/Fazenda/Animal`).update({
          [`animal_${rancho}_alimento`]: 1,
          [`animal_${rancho}_tempo`]: Date.now()
        });
        
        await XpUpdate(interaction, interaction.user.id, XpQuantia);
        await edit(msg);

        const replyAlimentar = await interaction.followUp({ content: `${emoji.positivo || '✅'} **|** <@${interaction.user.id}>, Você alimentou ${NomeAnimalCompleto} ${emojiEspecífico} com: **1 ração**.` });
        setTimeout(() => replyAlimentar.delete().catch(() => {}), 15000);
      }

      async function efetuarColeta(rancho) {
        const animal = await getFazenda(rancho);

        if (animal.animal < 1) {
          return interaction.error({ content: `Você não possui nenhum animal ativo que possa produzir produtos.` });
        }

        const ItensUsuario = await getUserInventory(interaction.user);
        let ItemColetado = '', QuantiaSorteada = 0, emoteAnimal = '', NomeAnimalTxt = '';

        if (animal.animal === 1) { emoteAnimal = '<:galinha:947544319261286432>'; NomeAnimalTxt = 'sua Galinha'; ItemColetado = 'Ovo'; QuantiaSorteada = Math.floor(Math.random() * 4) + 2; }
        if (animal.animal === 2) { emoteAnimal = '<:vaca:947544320637010010>'; NomeAnimalTxt = 'sua Vaca'; ItemColetado = 'Leite'; QuantiaSorteada = Math.floor(Math.random() * 4) + 2; }
        if (animal.animal === 3) { emoteAnimal = '<:porco:947544319034794026>'; NomeAnimalTxt = 'seu Porco'; ItemColetado = 'Bacon'; QuantiaSorteada = Math.floor(Math.random() * 3) + 2; }
        
        const quantidadeAtual = ItensUsuario[ItemColetado] || 0;

        await database.ref(`economia/${interaction.user.id}/inventario/itens/Consumíveis`).update({
          [ItemColetado]: quantidadeAtual + QuantiaSorteada
        });

        await database.ref(`economia/${interaction.user.id}/Fazenda/Animal`).update({
          [`animal_${rancho}_alimento`]: 0,
          [`animal_${rancho}_tempo`]: Date.now() // Aplica o tempo de cooldown de fome após coletar
        });
        
        await edit(msg);

        const replyColetar = await interaction.followUp({ content: `${emoji.positivo || '✅'} **|** <@${interaction.user.id}>, Você coletou **${QuantiaSorteada} ${ItemColetado}** de ${NomeAnimalTxt} ${emoteAnimal}.` });
        setTimeout(() => replyColetar.delete().catch(() => {}), 15000);
      }

    } catch (error) {
      console.error("Erro no escopo principal do comando fazenda:", error);
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
};