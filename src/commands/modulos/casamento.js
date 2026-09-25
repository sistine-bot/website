const { ButtonStyle, ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const { CheckUserBlacklisted, getUserInventory } = require('../../utils/functions.js');
const moment = require("moment");

module.exports =  {
  "name": "casamento",
  "description": `⌊⚙️ Modulos⌉ Veja informações sobre seu casamento.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "informações",
      "description": "⌊⚙️ Modulos⌉ Veja as informações do casamento de um usuário.",
      "type": ApplicationCommandType.ChatInput,
      "options": [
        {
          "name": "usuário",
          "type": ApplicationCommandOptionType.User,
          "description": "Mencione alguém para ver as informações dela",
          "required": false,
        }
      ],
    },
    {
      "name": "casar",
      "description": "⌊⚙️ Modulos⌉ Faça seu pedido de casamento a seu futuro pretendente.",
      "type": ApplicationCommandType.ChatInput,
      "options": [
        {
          "name": "usuário",
          "type": ApplicationCommandOptionType.User,
          "description": "Mencione alguém para casar com ela",
          "required": true,
        },
        {
          "name": "mensagem",
          "type": ApplicationCommandOptionType.String,
          "description": "Qual a mensagem que você deseja deixar em seu casamento?",
          "required": false,
        }
      ],
    },
    {
      "name": "divorciar",
      "description": "⌊⚙️ Modulos⌉ Faça seu pedido de casamento a seu futuro pretendente.",
      "type": ApplicationCommandType.ChatInput,
    },
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {
      
      const command = interaction.options.getSubcommand();
  
      switch(command) {
  
        case 'informações': {
  
          const user = interaction.options.getUser("usuário") || interaction.user;
          
          return database.ref(`economia/${user.id}/Casamento/`).once('value').then(async function(snapshot) {
            let casado = (snapshot.val() && snapshot.val().casado);
            if (casado === undefined || casado === null) casado = 0;
    
            let dataCasamento = (snapshot.val() && snapshot.val().dataCasamento);
            if (dataCasamento === null || dataCasamento === null) dataCasamento = 0;
    
            let datanow = (snapshot.val() && snapshot.val().datanow);
            if (datanow === null || datanow === null) datanow = 0;
    
            const time = require("parse-ms")(Date.now() - datanow);
            const Casado = client.users.cache.get(casado);
             // ${time.days}d ${time.hours}h ${time.minutes}m ${time.seconds}s
    
            const embed = new EmbedBuilder()
            .setAuthor({ name: 'Cartório', iconURL: 'https://images.vexels.com/media/users/3/158749/isolated/preview/c384ec658ac82ea21f2bccaf38142ab8-design-plano-de-anel-by-vexels.png' })
            .setColor(color.embed)
            .setDescription(`
${casado ? `
💍 | **Casado(a) com:** ${Casado}
📆 | **Durante:** <t:${~~(datanow/1000)}:D> (<t:${~~(datanow/1000)}:R>)` : 
`${emoji.seta_direita} | **Digite:** /casar @membro`}`)
            .setFooter({ text: interaction.user.tag, iconURL: interaction.user.avatarURL({ format: 'png', dynamic: true, size: 1024 }) })
            .setThumbnail(`${casado ? "https://media.discordapp.net/attachments/706636143122317443/737738168991744068/868008.png" : "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Broken_heart.svg/1200px-Broken_heart.svg.png"}`)
            .setTimestamp()
    
            return interaction.followUp({ embeds: [embed] });
    
          });
          
        } 
          break;
        
        case 'casar': {
          
          const user = interaction.options.getUser("usuário");
          if (!user) return interaction.error({ content: `Você deve mencionar um usuário para poder se casar com ele.` })
  
          if (user.id === client.user.id) return interaction.error({ content: `Você parece legal, mas, eu não quero um relacionamento agora, sou muito nova.` });
  
          if (user.bot) return interaction.error({ content: `Você não pode se casar com um bot` });
          
          if (user.id === interaction.user.id) return interaction.error({ content: `Você não pode casar com você mesmo.` });
          
          const mensagem = interaction.options.getString('mensagem');
          
          const { blacklisted, blacklistedMensagem } = await CheckUserBlacklisted(user)
          if (blacklisted) return interaction.followUp({ content: blacklistedMensagem, ephemeral: true })
          
          return database.ref(`economia/${interaction.user.id}/Casamento/`).once('value').then(async function(snapshot) {
            let casado = (snapshot.val() && snapshot.val().casado);
            if (casado === null || casado === undefined) casado = 0;
  
            if (casado > 0) {
              return interaction.followUp({ content: `${emoji.aviso} **|** você já está casado com <@${casado}>\n> **Digite:** /divorciar para ficar solteiro(a) novamente` });
            }
            
            return database.ref(`economia/${user.id}/Casamento/`).once('value').then(async function(snapshot) {
              let casado_user = (snapshot.val() && snapshot.val().casado);
              if (casado_user === null || casado_user === null) casado_user = 0;
              
              if (casado_user > 0) {
                return interaction.followUp({ content: `${emoji.aviso} **|** ${user} já está casado(a) com <@${casado_user}>` });
              }
              
              const anelcasamento = await getUserInventory(interaction.user).then(a => a.anelcasamento)
              
              const anel_user = await getUserInventory(user).then(a => a.anelcasamento)
              
              if (!anelcasamento || anelcasamento.item < 1) {
                return interaction.error({ content: `Você deve possuir um anel de casamento para poder se casar!` })
              }
              
              if (!anel_user || anel_user.item < 1) {
                return interaction.error({ content: `Seu pretendente não possui um anel de casamento!` });
              }
  
              if (mensagem && mensagem.length > 100) mensagem.slice(0, 200) + '...'
  
              const embed = new EmbedBuilder() 
              .setAuthor({ name: `${client.user.username}・Casamenteira`, iconURL: client.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
              .setColor(color.embed)
              .setDescription(`
<@${interaction.user.id}> pediu <@${user.id}> em Casamento ${mensagem ? `, com a mensagem:\n > \`${mensagem}\`` : ''}
**${user.username} Você aceita o pedido de casamento dele(a)?**`)
              .setTimestamp()
              .setFooter({ text: `Casamento・${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ format: 'png', dynamic: true, size: 1024 }) })
  
              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("confirmar").setStyle(ButtonStyle.Success).setEmoji(emoji.positivo).setLabel('Aceitar').setDisabled(false),
  
                new ButtonBuilder().setCustomId("cancel").setStyle(ButtonStyle.Danger).setEmoji(emoji.negativo).setLabel('Recusar').setDisabled(false),
              )
  
              let msg = await interaction.followUp({ content: `${user}`, embeds: [embed], components: [row], fetchReply: true, ephemeral: false })
  
              // const iFiltro1 = i => i.user.id === user.id;
              const coletor = msg.createMessageComponentCollector();
  
              coletor.on('collect', async(i) => {
                i.deferUpdate()
                // if (totalPages < 2) return;
                switch (i.customId) {
  
                  case 'confirmar': {
                    if (i.user.id !== user.id) return interaction.error({ content: `Apenas *${user.username}* pode aceitar isto.`, ephemeral: true })
                    msg.delete().catch(e => { });
  
                    // if (await CheckUserJogável(interaction, user)) return;
  
                    return database.ref(`economia/${interaction.user.id}/Casamento/`).once('value').then(async function(snapshot) {
                      let casado = (snapshot.val() && snapshot.val().casado);
                      if (casado === null || casado === undefined) casado = 0;

                      return database.ref(`economia/${user.id}/Casamento/`).once('value').then(async function(snapshot) {
                        let casado_user = (snapshot.val() && snapshot.val().casado);
                        if (casado_user === null || casado_user === undefined) casado_user = 0;

                        if (casado_user > 0) {
                          return interaction.followUp({ content: `${emoji.aviso} **|** você já está casado(a) com <@${casado_user}>` });
                        }
  
                        if (casado > 0) {
                          return interaction.followUp({ content: `${emoji.aviso} **|** já está casado(a) com <@${casado}>` });
                        }
  
                        database.ref(`economia/${interaction.user.id}/Casamento`).set({
                          casado: user.id,
                          dataCasamento: moment(Date.now()).format("DD-MM-YYYY"),
                          datanow: Date.now()
                        });
  
                        database.ref(`economia/${user.id}/Casamento/`).set({
                          casado: interaction.user.id,
                          dataCasamento: moment(Date.now()).format("DD-MM-YYYY"),
                          datanow: Date.now()
                        });
  
                        const embed = new EmbedBuilder()
                        .setColor(color.embed)
                        .setDescription(`**<@${user.id}> & <@${interaction.user.id}>**, atualizaram o status de Relacionamento para **Casados**`);
  
                        interaction.followUp({ embeds: [embed] })
  
                      })
                    })
                  }
                    break;
  
                  case 'cancel': {

                    switch (user.id) {
                      case i.user.id:
                        msg.delete().catch(e => { });
                        interaction.error({ content: `<@${user.id}> recusou o pedido de casamento de <@${interaction.user.id}>` });  
                      break;

                      case user.id:
                        msg.delete().catch(e => { });
                        interaction.error({ content: `<@${interaction.user.id}> cancelou o pedido de casamento que fez para <@${user.id}>` });
                        break;

                        default:
                          interaction.error({ content: `Apenas *${user.username}* ou *${interaction.user.username}* podem cancelar isto.`, ephemeral: true })
                          break;
                    }
  
                  }
                    break;
                }
              })
            })
          })
  
        }
          break;
  
        case 'divorciar': {
          
          return database.ref(`economia/${interaction.user.id}/Casamento/`).once('value').then(async function(snapshot) {
            let casado = (snapshot.val() && snapshot.val().casado);
            if (casado === null || casado === undefined) casado = 0;
  
            if (casado < 1) {
              return interaction.followUp({ content: `${emoji.aviso} **|** atualmente você não se encontra em um relacionamento.` });
            }

            return database.ref(`economia/${interaction.user.id}/inventario/Itens/`).once('value').then(async function(snapshot) {
              let anelcasamento = (snapshot.val() && snapshot.val().anelcasamento);
              if (anelcasamento === undefined || anelcasamento === null) anelcasamento = 0;
  
              const embed = new EmbedBuilder() 
              .setAuthor({ name: `${client.user.username}・Casamenteira`, iconURL: client.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
              .setColor(color.embed)
              .setDescription(`<@${interaction.user.id}> você realmente deseja se divorciar de seu casamento?`)
              .setTimestamp()
              .setFooter({ text: `Casamento・${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ format: 'png', dynamic: true, size: 1024 }) })
  
              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("sim").setStyle(ButtonStyle.Success).setEmoji(emoji.positivo).setLabel('Sim').setDisabled(false),
  
                new ButtonBuilder().setCustomId("não").setStyle(ButtonStyle.Danger).setEmoji(emoji.negativo).setLabel('Não').setDisabled(false),
              )
  
              const msg = await interaction.followUp({ embeds: [embed], components: [row], fetchReply: true, ephemeral: false })
              
              const coletor = msg.createMessageComponentCollector({ });
  
              coletor.on('collect', async(i) => {
                i.deferUpdate()
                
                switch (i.customId) {
  
                  case 'sim': {
                    if (i.user.id !== interaction.user.id) return interaction.error({ content: `Apenas *${interaction.user.username}* pode confirmar isto.`, ephemeral: true })
                    msg.delete().catch(e => { });
  
                    return database.ref(`economia/${interaction.user.id}/Casamento/`).once('value').then(async function(snapshot) {
                      let casado = (snapshot.val() && snapshot.val().casado);
                      if (casado === null || casado === undefined) casado = 0;

                      if (casado < 1) {
                        return interaction.followUp({ content: `${emoji.aviso} **|** atualmente você não se encontra em um relacionamento.` });
                      }
  
                      const user = client.users.cache.get(casado);
  
                      database.ref(`economia/${interaction.user.id}/Casamento`).remove();
  
                      database.ref(`economia/${user.id}/Casamento`).remove();
  
                      const embed = new EmbedBuilder()
                      .setColor(color.embed)
                      .setDescription(`**<@${user.id}> & <@${interaction.user.id}>** não estão mais casados.`);
  
                      return interaction.followUp({ content: `${user}`, embeds: [embed] })
                      
                      // client.users.cache.get(casado).send(`**${interaction.user.username}** se divorciou de você. vocês não estão mais casados.`).catch(e => { });
  
                    })
                  }
                    break;
  
                  case 'não': {
                    if (i.user.id !== interaction.user.id) return interaction.error({ content: `Apenas *${interaction.user.username}* pode cancelar isto.`, ephemeral: true })
                    msg.delete().catch(e => { });
                    
                    interaction.error({ content: `<@${interaction.user.id}> divorcio cancelado com sucesso.` });
                  }
                    break;
                }
              })
            })
          })
        }
          break;
  
        default:
          console.error(`Ocorreu um erro ao utilizar o casamento `, command)
          return interaction.error(`Ocorreu um erro inesperado ao utilizar este comando.`)
          break;
      }

    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }


  }
}