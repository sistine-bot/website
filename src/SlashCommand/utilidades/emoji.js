const { ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports =  {
  "name": "emoji",
  "description": `⌊🛠️ Utilidades⌉ Veja informações de emojis.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "lista",
      "description": "⌊🛠️ Utilidades⌉ Mostra uma lista de emojis.",
      "type": ApplicationCommandType.ChatInput,
      "options": [
        {
          "name": "escolha",
          "type": ApplicationCommandOptionType.String,
          "description": "Qual lista deseja ver",
          "required": true,
          "choices": [
            {
              "name": "servidor",
              "value": "servidor"
            },
            {
              "name": "todos",
              "value": "todos"
            },
          ]
        },
      ],
    },
    {
      "name": "informações",
      "description": "🛠️ Utilidades - Veja informações sobre um emoji.",
      "type": ApplicationCommandType.ChatInput,
      "options": [
        {
          "name": "emoji",
          "type": ApplicationCommandOptionType.String,
          "description": "Qual emoji você deseja ver as informações?",
          "required": true,
        }
      ],
    },
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {
      
      const subCommand = interaction.options && interaction.options['_subcommand'];

      switch (subCommand) {

        case 'lista': {

          const MensagemFinal = 'Está meio vazio por aqui.';
          
          const escolha = interaction.options.getString('escolha')
          
          const servers = (escolha == 'servidor') ? interaction.guild : client,
                nome = (escolha == 'servidor') ? interaction.guild.name : 'Todos os meus',
                imagem = (escolha == 'servidor') ? interaction.guild.iconURL({ format: 'png', dynamic: true, size: 1024 })  : client.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })
          let num = 0;
          let pagina = 1;
          let totalPages = parseInt(servers.emojis.cache.size/30+1);
    
          let embed = new EmbedBuilder()
          .setAuthor({ name: `${client.user.username}`, iconURL: imagem })
          .setTitle(`${nome} emojis: ${servers.emojis.cache.size}`)
          .setDescription(`${servers.emojis.cache.map(e => e).slice(0,30).join(' | ')}`)
          .setFooter({ text: `Página ${pagina} de ${totalPages}` })
          .setColor(color.embed)
    
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("voltarT").setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(false),
    
            new ButtonBuilder().setCustomId("esquerda").setStyle(ButtonStyle.Secondary).setEmoji('⬅️').setDisabled(false),
    
            new ButtonBuilder().setCustomId("direita").setStyle(ButtonStyle.Secondary).setEmoji('➡️').setDisabled(false),
    
            new ButtonBuilder().setCustomId("passarT").setStyle(ButtonStyle.Secondary).setEmoji('⏩').setDisabled(false),
          )
    
          let msg = await interaction.followUp({ embeds: [embed], components: [row], fetchReply: true, ephemeral: false  })
    
          const coletor = msg.createMessageComponentCollector({ filter: x => x.user.id === interaction.user.id });
    
          coletor.on('collect', async(i) => {
            i.deferUpdate()
            // if (totalPages < 2) return;

            try {

              switch (i.customId) {
      
                case 'esquerda': {
      
                  if(pagina !== 1) {
                    num = num-30
                    num = num.toString().length > 1 ? num-parseInt(num.toString().slice(num.toString().length-1)) : 0
                    pagina -= 1
      
                    const embedPageUm = new EmbedBuilder()
                    .setAuthor({ name: `${nome}`, iconURL: imagem })
                    .setTitle(`${nome} emojis: ${servers.emojis.cache.size}`)
                    .setDescription(`${servers.emojis.cache.map(e => e).slice(pagina*30-30,pagina*30).join(' | ') ? servers.emojis.cache.map(e => e).slice(pagina*30-30,pagina*30).join(' | ') : MensagemFinal}`)
                    .setFooter({ text: `Página ${pagina} de ${totalPages}`, iconURL: client.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })})
                    .setColor(color.embed)
      
                    msg.edit({ embeds: [embedPageUm] });
      
                  } else {
                    pagina = totalPages
                    num = totalPages*30-40
      
                    const embedPageDois = new EmbedBuilder()
                    .setAuthor({ name: `${nome}`, imagem })
                    .setTitle(`${nome} emojis: ${servers.emojis.cache.size}`)
                    .setDescription(`${servers.emojis.cache.map(e => e).slice(totalPages*30-30,pagina*30).join(' | ') ? servers.emojis.cache.map(e => e).slice(totalPages*30-30,pagina*30).join(' | ') : MensagemFinal}`)
                    .setFooter({ text: `Página ${pagina} de ${totalPages}`, iconURL: client.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
                    .setColor(color.embed)
      
                    msg.edit({ embeds: [embedPageDois] })
      
                  }
                }
                  break;
      
                case 'direita': {
      
                  if(pagina !== totalPages) {
                    num = num.toString().length > 1 ? num-parseInt(num.toString().slice(num.toString().length-1)) : 0
                    num = num+30
                    pagina += 1
                    
                    const embedPageDois = new EmbedBuilder()
                    .setAuthor({ name: `${nome}`, iconURL:  imagem })
                    .setTitle(`${nome} emojis: ${servers.emojis.cache.size}`)
                    .setDescription(`${servers.emojis.cache.map(e => e).slice(pagina*30-30,pagina*30).join(' | ') ? servers.emojis.cache.map(e => e).slice(pagina*30-30,pagina*30).join(' | ') : MensagemFinal} `)
                    .setFooter({ text: `Página ${pagina} de ${totalPages}`, iconURL: client.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })})
                    .setColor(color.embed)
      
                    return msg.edit({ embeds: [embedPageDois ] })
                  } else {
                    pagina = 1
                    num = 0
                    
                    const embedPageDois = new EmbedBuilder()
                    .setAuthor({ name: `${nome}`, iconURL: imagem })
                    .setTitle(`${nome} emojis: ${servers.emojis.cache.size}`)
                    .setDescription(`${servers.emojis.cache.map(e => e).slice(0,pagina*30).join(' | ') ? servers.emojis.cache.map(e => e).slice(0,pagina*30).join(' | ') : MensagemFinal}`)
                    .setFooter({ text: `Página ${pagina} de ${totalPages}`, iconURL: client.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
                    .setColor(color.embed)
      
                    msg.edit({ embeds: [embedPageDois] })
                  }
                }
                  break;
      
                case 'voltarT': {
                  num = 0;
                  pagina = 1;
      
                  const embedPageDois = new EmbedBuilder()
                  .setAuthor({ name: `${nome}`, iconURL: imagem })
                  .setTitle(`${nome} emojis: ${servers.emojis.cache.size}`)
                  .setDescription(`${servers.emojis.cache.map(e => e).slice(pagina*30-30,pagina*30).join(' | ') ? servers.emojis.cache.map(e => e).slice(pagina*30-30,pagina*30).join(' | ') : MensagemFinal}`)
                  .setFooter({ text: `Página ${pagina} de ${totalPages}`, iconURL: client.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
                  .setColor(color.embed)
      
                  msg.edit({ embeds: [embedPageDois] });
                }
                  break;
      
                case 'passarT': {
                  pagina = totalPages
                  num = totalPages*10-10
      
                  const embedPageDois = new EmbedBuilder()
                  .setAuthor({ name: `${nome}`, iconURL: imagem })
                  .setTitle(`${nome} emojis: ${servers.emojis.cache.size}`)
                  .setDescription(`${servers.emojis.cache.map(e => e).slice(pagina*30-30,pagina*30).join(' | ') ? servers.emojis.cache.map(e => e).slice(pagina*30-30,pagina*30).join(' | ') : MensagemFinal}`)
                  .setFooter({ text: `Página ${pagina} de ${totalPages}`, iconURL: client.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
                  .setColor(color.embed)
      
                  msg.edit({ embeds: [embedPageDois] });
      
                }
                  break;
      
              }

            } catch (error) {
              console.log('ocorreu um erro ao carregar a lista de emojis', error) 
              return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
            }
          });
          
        }
        break;

        case 'informações': {
          
          const emote = interaction.options.getString('emoji');
          const regex = emote.replace(/^<a?:\w+:(\d+)>$/, '$1');
          
          let emoji = client.emojis.cache.find(emoji => `<:${emoji.name}:${emoji.id}>` === regex) ||
              client.emojis.cache.find(emoji => emoji.name === regex) || 
              client.emojis.cache.get(regex);
          
          if (!emoji) return interaction.error({ content: `<@${interaction.user.id}>, Eu não consegui procurar nenhum emoji: \`${emote}\`. ` })
          
          const link = emoji.url;
          const row = new ActionRowBuilder().addComponents([
            new ButtonBuilder().setStyle(ButtonStyle.Link)
            .setURL(link)
            .setLabel('Abrir imagem no navegador'),
          ]);
  
          const embed = new EmbedBuilder()
          .setAuthor({ name: ` • Informações do emoji: ${emoji.name}`, url: emoji.url })
          .setColor(color.embed)
          .setThumbnail(`${emoji.url}`)
          .addFields(
          { name: `👤・Menção`, value:  `\`${emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`}\` `, inline: true },
          { name: `👥・Id:`, value: `\`${emoji.id}\``, inline: true },
          { name: `🖥️・Servidor:`, value: emoji.guild.name, inline: true },
          { name: `💃・Animado:`, value: `${emoji.animated ? 'Sim' : 'Não'}`, inline: true},
          { name: `🗓️・Criado em:`, value: `<t:${~~(emoji.createdTimestamp/1000)}:D> (<t:${~~(emoji.createdTimestamp/1000)}:R>)`, inline: true },
          )
          // .addField(`📍・Link:`, `[Clique aqui para abrir](${})`, inline: false)
          // .setFooter({ name: `${interaction.user.username}`, url: interaction.user.avatarURL({ dynamic: true })})
  
          return interaction.followUp({ embeds: [embed], components: [row] });
  
        }
        break;

      }
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  
  }
}