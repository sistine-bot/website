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

      const user = interaction.options.getUser("usuário") || interaction.user;
    
      return database.ref(`economia/${user.id}/nível/`).once('value').then(async function(snapshot) {
        let nível = (snapshot.val() && snapshot.val().nível);
        if (nível === undefined || nível === null) nível = 0;
        
        let xp = (snapshot.val() && snapshot.val().xp);
        if (xp === undefined || xp === null) xp = 0;
        
        let NívelNovo = (snapshot.val() && snapshot.val().notifyNível);
        if (NívelNovo === null || NívelNovo === undefined) NívelNovo = 1;

        let Notify = (snapshot.val() && snapshot.val().notify);
        if (Notify === null || Notify === undefined) Notify = 0;
        
        let NívelUp = (nível ? nível : 1) * 1000;
        
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("config").setStyle(ButtonStyle.Secondary).setEmoji('⚙️').setDisabled(false),
        )
        
        const embed = new EmbedBuilder() 
        .setColor(color.embed)
        .setDescription(`
💠 **| Nível:** ${nível}
✨ **| XP Atual:** ${xp}
🎆 **| Restam:** ${NívelUp - xp}xp para: **${NívelUp}** (Nível ${nível+1})
⚙️ **| Notificações de novos níveis:** ${NívelNovo ? 'Sim' : 'Não'}

🗣 **|** Continue conversando e sendo ativo, para passar de nível.`)
        
        const msg = await interaction.followUp({ embeds: [embed], components: [row] });
        
        const coletor = msg.createMessageComponentCollector({ filter: x => x.user.id === interaction.user.id });

          coletor.on('collect', async(i) => {
            i.deferUpdate()

            try {

              if (i.customId == 'config') {
                
                return database.ref(`economia/${interaction.user.id}/nível`).once('value').then(async function(snapshot) {
                  let NívelNovo = (snapshot.val() && snapshot.val().notifyNível);
                  if (NívelNovo === null || NívelNovo === undefined) NívelNovo = 1;
                  
                  if (NívelNovo == 1) {
                    database.ref(`economia/${interaction.user.id}/nível`).update({
                      notifyNível: 0
                    });
                    
                    return interaction.followUp({ content: `✅ **|** Notificações de novos níveis desativado com sucesso.`, ephemeral: true });
                  } else {
                    database.ref(`economia/${interaction.user.id}/nível`).update({
                      notifyNível: 1
                    });
                    
                    return interaction.followUp({ content: `✅ **|** Notificações de novos níveis ativada com sucesso.`, ephemeral: true });
                  }
                });
              }
              
            } catch (error) {
              console.error(`Ocorreu um erro ao configurar seu nível.`)
              return error;
            }
            
          });
        
      })

    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }

    
  }
}