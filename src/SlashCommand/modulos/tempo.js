const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

module.exports =  {
  "name": "tempo",
  "description": `⌊⚙️ Módulos⌉ Veja quanto tempo falta para você poder liberar algo.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "usuário",
      "type": ApplicationCommandOptionType.User,
      "description": "Mencione alguém para ver suas informações.",
      "required": false,
    }
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    
    try {

      const user = interaction.options.getUser("usuário") || interaction.user;
      
      const OneDay = 86400000,
      OneHour = 3600000,
      thirdMinutes = 1800000;

      async function getTimeToUseCommandNow(time, dir, variable, boolean) {
        return database.ref(`${dir}`).once('value').then(async function(snapshot) {
          // let body = snapshot.val() || body[variable];
          let body = (snapshot.val() && snapshot.val()[variable]);
          if (body === undefined || body === null) body = 0;
          
          if(body !== null && time - (Date.now() - body) > 0 ) {
            return `<t:${~~((body + time)/1000)}:R>`
          } else {
            return 'Disponível para utilizar.'
          }
        })
      }
      
      async function getTimeToUseCommands(time, dir, variable, boolean) {
        return database.ref(`${dir}`).once('value').then(async function(snapshot) {
          let body = (snapshot.val() && snapshot.val()[variable]);
          if (body === undefined || body === null) body = 0;
          
          let tempo = (snapshot.val() && snapshot.val()[time]);
          if (tempo === undefined || body === null) tempo = 0;
          if (tempo == 'indeterminado') return user.username + ' não possui isso.'
          if(body !== null && tempo - (Date.now() - body) > 0 ) {
            return `<t:${~~((tempo + body)/1000)}:R>`
          } else {
            return user.username + ' não possui isso.'
          }
        })
      }
      
      const TempoDaily = await getTimeToUseCommandNow(OneDay, `/economia/${user.id}/cooldowns/`, 'daily');
      
      const TempoSemanal = await getTimeToUseCommandNow(OneDay * 7, `/economia/${user.id}/cooldowns/`, 'weekly');

      const TempoReputação = await getTimeToUseCommandNow(OneHour, `/economia/${user.id}/cooldowns/`, 'reputacao');

      const TempoEmprego = await getTimeToUseCommandNow(thirdMinutes, `/economia/${user.id}/cooldowns/`, 'trabalho');

      const TempoCrime = await getTimeToUseCommandNow(OneHour, `/economia/${user.id}/cooldowns/`, 'crime');

      const TempoRoubar = await getTimeToUseCommandNow(thirdMinutes, `/economia/${user.id}/cooldowns/`, 'roubar');

      const TempoCaçar = await getTimeToUseCommandNow(OneHour, `/economia/${user.id}/cooldowns/`, 'caça');

      const TempoPescar = await getTimeToUseCommandNow(OneHour, `/economia/${user.id}/cooldowns/`, 'pesca');

      const TempoNamoro = await getTimeToUseCommandNow(OneHour, `/economia/${user.id}/cooldowns/`, 'namorar');
      
      const TempoVIP = await getTimeToUseCommands('tempo', `/economia/${user.id}/vip/`, 'data', true);

      const TempoBlacklist = await getTimeToUseCommands('tempo', `/BlackList/${user.id}`, 'data', true);

      const TempoAntiRoubo = await getTimeToUseCommands('tempo', `economia/${user.id}/AntiRoubo/`, 'data', true);
      
      const embed = new EmbedBuilder()
      .setColor(color.embed)
      .setTitle(interaction.user.tag, interaction.user.avatarURL({ format: 'png', dynamic: true, size: 1024 }))
      .setDescription(`**⏰ | Tempo's de: ${user.username}**`)
      .addFields(
        { name: `**🔨 |** Trabalhar`, value: TempoEmprego },
        { name: `**👨‍💻 |** Crime`, value: TempoCrime },
        { name: `**🔫 |** Assaltar`, value: TempoRoubar },
        { name: `**🎣 |** Pescar`, value: TempoPescar },
        { name: `**🦌 |** Caçar`, value: TempoCaçar },
        { name: `**🏅 |** Reputação`, value: TempoReputação },
        { name: `**💸 |** Daily`, value: TempoDaily},
        { name: `**📆 |** Semanal`, value: TempoSemanal},
        { name: `**👩‍❤️‍💋‍👨 |** Namorar:`, value: TempoNamoro }, 
        { name: `**💎 |** VIP`, value: TempoVIP },
        { name: `**👮 |** Anti Roubo`, value: TempoAntiRoubo},
        { name: `**🚫 |** Blacklist:`, value: TempoBlacklist},
      )
      .setThumbnail('https://i.pinimg.com/originals/f7/88/f2/f788f200fe59bd0fd95b82cf61a2ce5b.png')
      
      return interaction.followUp({ embeds: [embed] });

    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }

    
  }
}