const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { Format, UpdateMoneyWallet, CheckUserCooldowns } = require('../../../src/utils/functions.js');

const ValorEmpregos = {
  taxista: { min: 150, max: 280, label: '150 - 280' },
  caminhoneiro: { min: 250, max: 420, label: '250 - 420' },
  gari: { min: 350, max: 550, label: '350 - 550' },
  entregador: { min: 450, max: 700, label: '450 - 700' },
  frentista: { min: 600, max: 900, label: '600 - 900' },
  mecânico: { min: 750, max: 1150, label: '750 - 1.150' }, 
  medico: { min: 950, max: 1450, label: '950 - 1.450' },
  policial: { min: 1250, max: 1750, label: '1.250 - 1.750' },
};

const Tempo = 1800000; // 30m
const Work = new Set();

// Função auxiliar para mapear dados do ID do emprego e evitar duplicações de código
function obterDadosEmprego(id) {
  switch (id) {
    case 1: return { nome: 'Taxista', min: ValorEmpregos.taxista.min, max: ValorEmpregos.taxista.max, salario: ValorEmpregos.taxista.label, nivel: 0, ilegal: true, emote: '🚕', chave: 'taxista' };
    case 2: return { nome: 'Caminhoneiro', min: ValorEmpregos.caminhoneiro.min, max: ValorEmpregos.caminhoneiro.max, salario: ValorEmpregos.caminhoneiro.label, nivel: 5, ilegal: true, emote: '🚚', chave: 'caminhoneiro' };
    case 3: return { nome: 'Gari', min: ValorEmpregos.gari.min, max: ValorEmpregos.gari.max, salario: ValorEmpregos.gari.label, nivel: 10, ilegal: true, emote: '🗑️', chave: 'gari' };
    case 4: return { nome: 'Entregador', min: ValorEmpregos.entregador.min, max: ValorEmpregos.entregador.max, salario: ValorEmpregos.entregador.label, nivel: 15, ilegal: true, emote: '🛵', chave: 'entregador' };
    case 5: return { nome: 'Frentista', min: ValorEmpregos.frentista.min, max: ValorEmpregos.frentista.max, salario: ValorEmpregos.frentista.label, nivel: 20, ilegal: false, emote: '⛽', chave: 'frentista' };
    case 6: return { nome: 'Mecânico', min: ValorEmpregos.mecânico.min, max: ValorEmpregos.mecânico.max, salario: ValorEmpregos.mecânico.label, nivel: 25, ilegal: false, emote: '👨‍🔧', chave: 'mecânico' };
    case 7: return { nome: 'Médico', min: ValorEmpregos.medico.min, max: ValorEmpregos.medico.max, salario: ValorEmpregos.medico.label, nivel: 30, ilegal: false, emote: '👨‍⚕️', chave: 'medico' };
    case 8: return { nome: 'Policial', min: ValorEmpregos.policial.min, max: ValorEmpregos.policial.max, salario: ValorEmpregos.policial.label, nivel: 50, ilegal: false, emote: '👮', chave: 'policial' };
    default: return { nome: 'Desempregado', min: 0, max: 0, salario: '0', nivel: 0, ilegal: true, emote: '🤷‍♂️', chave: 'nenhum' };
  }
}

module.exports = {
  "name": "emprego",
  "description": `⌊⚙️ Módulos⌉ Veja informações sobre empregos.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "escolha",
      "description": "Faça sua escolha para o módulo.",
      "type": ApplicationCommandOptionType.String,
      "required": true,
      "choices": [
        { "name": "informações", "value": "informações" },
        { "name": "escolher", "value": "escolher" },
        { "name": "trabalhar", "value": "trabalhar" },
      ]
    },
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const command = interaction.options.getString('escolha');
      const mensagens = {
        taxista: ["Pegou um passageiro no aeroporto e deixou ele no centro.", "Pegou um passageiro na esquina e deixou no hotel."],
        caminhoneiro: ["Pegou a carga de eletrônicos em SP e deixou no RJ.", "Carregando carga de móveis em Curitiba e deixando em Floripa."],
        gari: ["Pegando o lixo na esquina da rua Main e seguindo pro aterro.", "Limpando as ruas do bairro residencial e seguindo pro parque."],
        entregador: ["Entregando pacote de roupas no bairro residencial.", "Entregando encomenda de alimentos na universidade."],
        frentista: ["Abastecendo veículos com combustível na rua Main.", "Trocando pneus e verificando o nível de óleo no shopping."],
        mecânico: ["Realizando manutenção preventiva em um carro.", "Reparando o sistema de freios em um carro no shopping."],
        medico: ["Realizando consulta com paciente no consultório.", "Realizando exames de rotina no hospital."],
        policial: ["Realizando patrulhamento na rua Main.", "Realizando investigação no estacionamento do shopping."]
      };

      switch (command) {
        case 'informações': {
          const snapshot = await database.ref(`economia/${interaction.user.id}/emprego/`).once('value');
          const empId = snapshot.val()?.emprego || 0;
          const dados = obterDadosEmprego(empId);
            
          const embed = new EmbedBuilder() 
            .setAuthor({ name: `Empregos`, iconURL: client.user.displayAvatarURL({ size: 256 }) })
            .setColor(color.embed || "#00ff00")
            .setDescription(empId ? `💼 **|** Emprego: \`${dados.nome}\`\n💸 **|** Salário: \`≈${dados.salario}\`\n🔫 **|** Permitido ilegal: \`${dados.ilegal ? 'Sim' : 'Não'}\`` : '💼 **|** Emprego: \`Desempregado\`')
            .setTimestamp()
            .setFooter({ text: `Empregos ・ ${interaction.guild.name}` });
            
          return interaction.followUp({ embeds: [embed] });
        }

        case 'escolher': {
          const cdSnapshot = await database.ref(`/economia/${interaction.user.id}/cooldowns/`).once('value');
          const empregoCooldowns = cdSnapshot.val()?.emprego || 0;
            
          if (empregoCooldowns !== 0 && Tempo - (Date.now() - empregoCooldowns) > 0) {
            const embed = new EmbedBuilder()
              .setColor(color.embed || "#ff0000")
              .setDescription(`⏰ **|** Você pode alterar de emprego **<t:${~~((empregoCooldowns + Tempo)/1000)}:R>**.`);
            return interaction.followUp({ embeds: [embed] });
          }
            
          const lvlSnapshot = await database.ref(`economia/${interaction.user.id}/nível/`).once('value');
          const nível = lvlSnapshot.val()?.nível || 0;

          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('menu_empregos')
              .setPlaceholder('Selecione um emprego.')
              .addOptions(
                { label: '🚕 Taxista', value: '1' },
                { label: '🚚 Caminhoneiro', value: '2' },
                { label: '🗑️ Gari', value: '3' },
                { label: '🛵 Entregador', value: '4' },
                { label: '⛽ Frentista', value: '5' },
                { label: '👨‍🔧 Mecânico', value: '6' },
                { label: '👨‍⚕️ Médico', value: '7' },
                { label: '👮 Policial', value: '8' },
              ),
          );
    
          const embed = new EmbedBuilder()
            .setAuthor({ name: `Selecione sua profissão`, iconURL: client.user.displayAvatarURL({ size: 256 }) })
            .setColor(color.embed || "#00ff00")
            .setDescription(`**Atualmente você é nível: ${nível}**\n\n🚕 **| Taxista** ≈${ValorEmpregos.taxista.label} (Lvl: \`0+\`)\n🚚 **| Caminhoneiro** ≈${ValorEmpregos.caminhoneiro.label} (Lvl: \`5+\`)\n🗑️ **| Gari** ≈${ValorEmpregos.gari.label} (Lvl: \`10+\`)\n🛵 **| Entregador** ≈${ValorEmpregos.entregador.label} (Lvl: \`15+\`)\n⛽ **| Frentista** ≈${ValorEmpregos.frentista.label} (Lvl: \`20+\`)\n👨‍🔧 **| Mecânico** ≈${ValorEmpregos.mecânico.label} (Lvl: \`25+\` - 🚫 Ilegal)\n👨‍⚕️ **| Médico** ≈${ValorEmpregos.medico.label} (Lvl: \`30+\` - 🚫 Ilegal)\n👮 **| Policial** ≈${ValorEmpregos.policial.label} (Lvl: \`50+\` - 🚫 Ilegal)`)
            .setTimestamp();
    
          const msgMenu = await interaction.followUp({ embeds: [embed], components: [row] });
          const Colector = msgMenu.createMessageComponentCollector({ filter: X => X.user.id === interaction.user.id, time: 60000 });
    
          Colector.on('collect', async (collected) => {
            await collected.deferUpdate();
            Colector.stop();
              
            const idEscolhido = parseInt(collected.values[0]);
            const dadosAlvo = obterDadosEmprego(idEscolhido);
    
            if (nível < dadosAlvo.nivel) {
              return await interaction.error({ content: `Você precisa ser no mínimo nível: **${dadosAlvo.nivel}** para escolher a profissão de ${dadosAlvo.nome}.` });
            }
              
            await database.ref(`/economia/${interaction.user.id}/cooldowns/`).update({ emprego: Date.now() });
            await database.ref(`economia/${interaction.user.id}/emprego`).update({ emprego: idEscolhido });
    
            const embedSucesso = new EmbedBuilder()
              .setColor(color.embed || "#00ff00")
              .setDescription(`Você selecionou com sucesso a profissão de: **${dadosAlvo.nome}**`);
    
            await interaction.followUp({ embeds: [embedSucesso] });
          });

          Colector.on('end', () => {
            row.components[0].setDisabled(true);
            msgMenu.edit({ components: [row] }).catch(() => {});
          });
        }
          break;
      
        case 'trabalhar': {
          if (Work.has(interaction.user.id)) {
            return interaction.error({ content: `Aguarde terminar seu expediente ativo antes de tentar trabalhar novamente.` });
          }
          
          const snapshot = await database.ref(`economia/${interaction.user.id}/emprego/`).once('value');
          const empId = snapshot.val()?.emprego || 0;
    
          if (empId < 1) return interaction.error({ content: `Você está desempregado. Escolha uma profissão em \`/emprego escolha: escolher\`` });
            
          const { status } = await CheckUserCooldowns(interaction.user, Tempo, 'trabalho');
          if (status) {
            const embed = new EmbedBuilder()
              .setColor(color.embed || "#ff0000")
              .setDescription(`⏰ **|** Você poderá trabalhar novamente **<t:${~~((status)/1000)}:R>**.`);
            return interaction.followUp({ embeds: [embed] });
          }
    
          const dadosTrabalho = obterDadosEmprego(empId);
          let rotas = Math.floor(Math.random() * 5) + 3; // Reduzido o número de cliques máximo de 11 para 8 para não cansar o usuário
          
          const obterFraseAleatoria = () => {
            const listaFrases = mensagens[dadosTrabalho.chave] || ["Trabalhando firmemente no expediente."];
            return listaFrases[Math.floor(Math.random() * listaFrases.length)];
          };

          const gerarEmbedTrabalho = (totalRotas, frase) => {
            return new EmbedBuilder() 
              .setAuthor({ name: `Trabalhando de ${dadosTrabalho.nome}`, iconURL: client.user.displayAvatarURL({ size: 256 }) })
              .setColor(color.embed || "#00ff00")
              .setDescription(`${dadosTrabalho.emote} **|** ${frase}\n> Restam: **${totalRotas}** rotas para concluir seu turno.`)
              .setTimestamp();
          };
    
          const rowAtiva = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("trampar").setStyle(ButtonStyle.Secondary).setEmoji(dadosTrabalho.emote));
          const rowDesativada = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("trampar").setStyle(ButtonStyle.Secondary).setEmoji(dadosTrabalho.emote).setDisabled(true));
    
          Work.add(interaction.user.id);
          let msgTrabalho = await interaction.followUp({ embeds: [gerarEmbedTrabalho(rotas, obterFraseAleatoria())], components: [rowAtiva] });
    
          const coletorTrabalho = msgTrabalho.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 45000 });
    
          coletorTrabalho.on('collect', async (i) => {
            await i.deferUpdate();
            rotas--;
    
            if (rotas > 0) {
              await msgTrabalho.edit({ embeds: [gerarEmbedTrabalho(rotas, obterFraseAleatoria())] });
            } else {
              coletorTrabalho.stop('concluido');
              Work.delete(interaction.user.id);
    
              const ganhoSorteado = Math.floor(Math.random() * (dadosTrabalho.max - dadosTrabalho.min + 1)) + dadosTrabalho.min;
              
              const embedFinal = new EmbedBuilder() 
                .setAuthor({ name: `Expediente Encerrado`, iconURL: client.user.displayAvatarURL({ size: 256 }) })
                .setColor("#00ff00")
                .setDescription(`${dadosTrabalho.emote} **|** Você terminou todas as suas rotas do dia e recebeu seu pagamento de: **${Format(ganhoSorteado)}**!`)
                .setTimestamp();
    
              await database.ref(`/economia/${interaction.user.id}/cooldowns/`).update({ trabalho: Date.now() });
              await UpdateMoneyWallet(interaction, interaction.user, '+', ganhoSorteado, `{emoji.entrada} {mensagem.emprego} | ${ganhoSorteado} | ${dadosTrabalho.nome}`);
              
              await msgTrabalho.edit({ embeds: [embedFinal], components: [rowDesativada] });
            }
          });
    
          coletorTrabalho.on('end', (c, motivo) => {
            Work.delete(interaction.user.id);
            if (motivo === 'time') {
              msgTrabalho.edit({ components: [rowDesativada] }).catch(() => {});
            }
          });
        }
          break;
      }
    } catch (error) {
      console.error(error);
      Work.delete(interaction.user.id);
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização do comando de empregos.` });
    }
  }
};