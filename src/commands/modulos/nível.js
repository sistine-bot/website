const { ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports =  {
  "name": "nível",
  "description": `⌊⚙️ Modulos⌉ Veja o seu nível.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "usuário",
      "type": ApplicationCommandOptionType.User,
      "description": "Mencione alguém para saber o nível",
      "required": false,
    }
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {

      const { getXpForNextLevel, isLevelUpAlertEnabled, setLevelUpAlert, LEVEL_UNLOCKS, checkUserStarted } = require('../../utils/experienceManager.js');

      const user = interaction.options.getUser("usuário") || interaction.user;
      const isSelf = user.id === interaction.user.id;

      const isStarted = await checkUserStarted(user.id);
      if (!isStarted) {
        const notStartedEmbed = new EmbedBuilder()
          .setColor('#ef4444')
          .setAuthor({
            name: `${isSelf ? 'Progressão Bloqueada' : 'Usuário Não Iniciado'} ・ ${user.username}`,
            iconURL: typeof user.displayAvatarURL === 'function' ? user.displayAvatarURL({ dynamic: true }) : undefined
          })
          .setTitle(isSelf ? '🚀 Inicie sua Jornada para Ativar Níveis e XP!' : '⚠️ Este jogador ainda não iniciou sua jornada!')
          .setDescription(
            isSelf
              ? `Olá, **${user.username}**! Você ainda não resgatou seu **Kit Iniciante**.\n\n` +
                `🔒 **O ganho de XP e a evolução de nível estão bloqueados.**\n\n` +
                `🎁 **Como desbloquear:**\n` +
                `> Utilize o comando </start:0> *(ou \`/start\`)* para receber suas primeiras moedas, ferramentas e liberar o **Nível 1** com todas as vantagens iniciais (Taxista, Galinha, Lote 1 e muito mais)!`
              : `**${user.username}** ainda não executou o comando \`/start\`.\n\nEles precisam iniciar sua jornada para ativar a progressão e desbloquear o **Nível 1**.`
          )
          .setFooter({ text: 'Sistine ・ Use /start para começar' })
          .setTimestamp();

        return interaction.followUp({ embeds: [notStartedEmbed] });
      }
    
      return database.ref(`economia/${user.id}/nível/`).once('value').then(async function(snapshot) {
        let nível = (snapshot.val() && snapshot.val().nível);
        if (nível === undefined || nível === null || nível < 1) {
          nível = 1;
          await database.ref(`economia/${user.id}/nível`).update({ nível: 1 });
        }
        
        let xp = (snapshot.val() && snapshot.val().xp);
        if (xp === undefined || xp === null) xp = 0;
        
        const alertActive = await isLevelUpAlertEnabled(user.id);
        const NívelUp = getXpForNextLevel(nível);
        const xpRestante = Math.max(0, NívelUp - xp);

        // Barra de progresso visual
        const percent = Math.min(1, Math.max(0, xp / NívelUp));
        const filled = Math.round(percent * 10);
        const progressBar = `[${'█'.repeat(filled)}${'░'.repeat(10 - filled)}] ${Math.round(percent * 100)}%`;

        const proximoDesbloqueio = LEVEL_UNLOCKS[nível + 1];
        let unlockPreview = '';
        if (proximoDesbloqueio && proximoDesbloqueio.length > 0) {
          unlockPreview = `\n🎁 **Desbloqueios no Nível ${nível + 1}:**\n` +
            proximoDesbloqueio.map(u => `> ${u.emoji} ${u.name}`).join('\n');
        }
        
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("config")
            .setStyle(alertActive ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setLabel(alertActive ? 'Alertas: Ativados' : 'Alertas: Desativados')
            .setEmoji(alertActive ? '🔔' : '🔕')
            .setDisabled(!isSelf),
        );
        
        const embed = new EmbedBuilder() 
          .setColor(color.embed || '#831396')
          .setAuthor({
            name: `Painel de Progressão & Nível ・ ${user.username}`,
            iconURL: typeof user.displayAvatarURL === 'function' ? user.displayAvatarURL({ dynamic: true }) : undefined
          })
          .setDescription(`
💠 **| Nível Atual:** \`Nível ${nível}\`
✨ **| XP Atual:** \`${new Intl.NumberFormat('pt-BR').format(xp)} / ${new Intl.NumberFormat('pt-BR').format(NívelUp)} XP\`
📊 **| Progresso:** \`${progressBar}\`
🎆 **| Restam:** \`${new Intl.NumberFormat('pt-BR').format(xpRestante)} XP\` para o **Nível ${nível + 1}**
🔔 **| Notificações de Level Up:** \`${alertActive ? 'Ativadas' : 'Desativadas'}\`
${unlockPreview}

🗣 **|** Converse no chat, complete turnos de trabalho e colha culturas para acumular XP!`)
          .setFooter({ text: 'Sistine ・ Alterne notificações no botão abaixo ou no Dashboard' })
          .setTimestamp();
        
        const msg = await interaction.followUp({ embeds: [embed], components: [row] });
        
        if (user.id !== interaction.user.id) return;

        const coletor = msg.createMessageComponentCollector({ filter: x => x.user.id === interaction.user.id, time: 60000 });

        coletor.on('collect', async(i) => {
          await i.deferUpdate();

          try {
            if (i.customId === 'config') {
              const currentStatus = await isLevelUpAlertEnabled(interaction.user.id);
              const newStatus = !currentStatus;
              await setLevelUpAlert(interaction.user.id, newStatus);
              
              const updatedRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("config")
                  .setStyle(newStatus ? ButtonStyle.Success : ButtonStyle.Secondary)
                  .setLabel(newStatus ? 'Alertas: Ativados' : 'Alertas: Desativados')
                  .setEmoji(newStatus ? '🔔' : '🔕')
              );

              await msg.edit({ components: [updatedRow] }).catch(() => {});

              return interaction.followUp({
                content: `⚙️ **|** Notificações de novos níveis ${newStatus ? '**ativadas** 🔔' : '**desativadas** 🔕'} com sucesso!`,
                ephemeral: true
              });
            }
          } catch (error) {
            console.error(`[nível.js] Erro ao alternar alertas:`, error);
          }
        });
        
      })

    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }

    
  }
}