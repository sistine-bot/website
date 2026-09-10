const { ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const NoImage = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png'

module.exports =  {
  "name": "usuário",
  "description": `⌊🛠️ Utilidades⌉ Veja informações sobre usuários.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "imagem",
      "description": "⌊🛠️ Utilidades⌉ Amplia uma imagem de um usuário.",
      "type": ApplicationCommandType.ChatInput,
      "options": [
        {
          "name": "escolha",
          "type": ApplicationCommandOptionType.String,
          "description": "Qual imagem deseja ampliar",
          "required": true,
          "choices": [
            {
              "name": "avatar",
              "value": "avatar"
            },
            {
              "name": "banner",
              "value": "banner"
            },
          ]
        },
        {
          "name": "usuário",
          "type": ApplicationCommandOptionType.User,
          "description": "Mencione alguém para ver as informações dela",
          "required": false,
        }
      ],
    },
    {
      "name": "informações",
      "description": "⌊🛠️ Utilidades⌉ Veja as informações de um usuário.",
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
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {

    try  {
      const command = interaction.options.getSubcommand();
      
      switch (command) {

        case 'informações':  {
        
          const user = interaction.options.getUser("usuário") || interaction.user;
          
          const member = interaction.guild.members.cache.get(user.id);
          
          const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("um").setStyle(ButtonStyle.Secondary).setEmoji('➡️').setDisabled(member ? false : true),
          )
          
          const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("dois").setStyle(ButtonStyle.Secondary).setEmoji('⬅️').setDisabled(false),
          )
          
          const embed = new EmbedBuilder()
          .setTitle(client.user.username, client.user.displayAvatarURL({ dynamic: true }))
          .setColor(color.embed)
          .setThumbnail(user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
          .addFields(
            { name: `👤・Apelido:`, value: `\`${user.nickname ? `${user.nickname}` : 'Nenhum apelido'}\``, inline: true },
            { name: `👥・Id:`, value: `\`${user.id}\``, inline: true },
            { name: `🤖・Bot:`, value: user.bot ? 'Sim' : 'Não', inline: true },
            { name: `🗓️・Conta criada em:`, value: `<t:${~~(user.createdTimestamp/1000)}:D> (<t:${~~(user.createdTimestamp/1000)}:R>)`, inline: false },
          )
          member ? embed.addFields({ name: `📆・Entrou em:`, value: `<t:${~~(member.joinedTimestamp/1000)}:D> (<t:${~~(member.joinedTimestamp/1000)}:R>)`, inline: false }) : '';
          
          let msg = await interaction.followUp({ embeds: [embed], components: [row1] });
          
          const iFiltro1 = i => i.user.id === interaction.user.id;
          const coletor = msg.createMessageComponentCollector({ filter: iFiltro1 });
          
          coletor.on('collect', async(i) => {
            i.deferUpdate()
            
            switch (i.customId) {
              case 'um': {
                
                function formatPermissions(permissions) {
                  const permissionList = permissions.toArray().map(permission => `\`${permission}\``).join(', ');
                  
                  return { list: permissionList, count: permissions.toArray().length,};
                }
                
                const member = interaction.guild.members.cache.get(user.id);
                
                const channelPermissions = interaction.channel.permissionsFor(member);
                
                const embed2 = new EmbedBuilder()
                .setAuthor({ name: `${user.username}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                .setColor(color.embed)
                .addFields(
                  { name: `<:rolecreated:931643756749398118>・Cargos (${member.roles.cache.filter(r => r.id !== interaction.guild.id).map(a => `\`${a.name}\``).length})`, value: `${member.roles.cache.filter(r => r.id !== interaction.guild.id).map(roles => `<@&${roles.id}>`).join(', ') || "Esse membro não possui cargos."}`, inline: false},
                  { name: `<:lista:933611977664770118>・Permissões (${formatPermissions(channelPermissions).count})`, value: `${formatPermissions(channelPermissions).list}` }
                )
                
                return msg.edit({ embeds: [embed2], components: [row2] });
                
              }
              break;
              
            case 'dois': {
              return msg.edit({ embeds: [embed], components: [row1] });
            }
              break;
          }
        })
        
          
        }
          break;

        case 'imagem': {
        
          const { DiscordBanners } = require('discord-banners');
          const discordBanners = new DiscordBanners(client);
          
          const escolha = interaction.options.getString('escolha');
          const user = interaction.options.getUser("usuário") || interaction.user;
          
          let link = NoImage;
          if (escolha == 'banner') {
            
            const banner = await discordBanners.getBanner(user.id, { size: 2048, format: "png", dynamic: true })
            
            if (banner.includes('https://cdn.discordapp.com/banners/')) link = banner;
            else link = NoImage;
            
          } else {
            link = user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })
          }
          
          const row = new ActionRowBuilder().addComponents([
            new ButtonBuilder().setStyle(ButtonStyle.Link)
            .setURL(link)
            .setLabel(`Abrir ${escolha} no navegador`),
          ]);
          
          let embed = new EmbedBuilder()
          .setColor(color.embed)
          .setAuthor({ name: user.username, url: link })
          .setImage(link || NoImage)
          
          const mensagem = user.id === client.user.id ? `Oi, ${interaction.user.username} 💁‍♀️ Sou linda né? Meu nome e ${client.user.username}` : '';
          return interaction.followUp({ content: `${mensagem + '\n<@'+ user.id + '>'}`, embeds: [embed], components: [row] });
        }
          break;
          
          default:
            console.error(`Erro ao receber informações do usuário, ${command} recebido.`)
            return interaction.followUp({ content: `Ocorreu um erro ao ver estas informações do servidor. Tente novamente` })
      }
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }

  }
}