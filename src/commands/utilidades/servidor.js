const { ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const NoImage = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png'

module.exports =  {
  "name": "servidor",
  "description": `⌊🛠️ Utilidades⌉ Veja informações sobre o servidor.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "informações",
      "description": "⌊🛠️ Utilidades⌉ Veja as informações de um servidor.",
      "type": ApplicationCommandType.ChatInput,
      "options": [
        {
          "name": "servidor",
          "type": ApplicationCommandOptionType.String,
          "description": "Qual servidor você deseja ver as informações?",
          "required": false,
        }
      ],
    },
    {
      "name": "imagem",
      "description": "⌊🛠️ Utilidades⌉ Amplia uma imagem do servidor.",
      "type": ApplicationCommandType.ChatInput,
      "options": [
        {
          "name": "escolha",
          "type": ApplicationCommandOptionType.String,
          "description": "Qual imagem deseja ampliar",
          "required": true,
          "choices": [
            {
              "name": "ícone",
              "value": "ícone",
            },
            {
              "name": "splash",
              "value": "splash"
            },
            {
              "name": "banner",
              "value": "banner"
            },
          ]
        },
        {
          "name": "servidor",
          "type": ApplicationCommandOptionType.String,
          "description": "Selecione qual servidor",
          "required": false,
        }
      ],
    },
    {
      "name": "cargo",
      "description": "⌊🛠️ Utilidades⌉ Mostra as informações do cargo.",
      type: 2,
      "options": [
        {
          "name": "informações",
          "description": "⌊🛠️ Utilidades⌉ Mostra as informações do cargo desejado.",
          type: 1,
          "options": [
            {
              "name": "cargo",
              "type": 8,
              "description": "Qual cargo deseja ver as informações?",
              "required": true,
            }
          ],
        },
      ]
    },
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {

      const command = interaction.options.getSubcommand();

      const targetGuildId = interaction.options.getString('servidor');
      let guild = interaction.guild;
      if (targetGuildId) {
        guild = client.guilds.cache.get(targetGuildId) || (await client.guilds.fetch(targetGuildId).catch(() => null)) || interaction.guild;
      }

      if (!guild) {
        return interaction.followUp({
          content: `${emoji.negativo || '❌'} **|** Não foi possível encontrar as informações deste servidor.`,
          ephemeral: true
        });
      }

      switch (interaction.options && interaction.options['_group']) {

        case 'canal': {
          
          if (command && command == 'informações') {
            const canal = interaction.options.getChannel('canal') || interaction.channel;
            
            const embed = new EmbedBuilder()
            .setTitle(client.user.username, client.user.displayAvatarURL({ dynamic: true }))
            .setColor(color.embed)
            .setTitle(`Informações do canal: ${canal.name}`)
            .setDescription(`${canal.topic ? `📖・Tópico:\n\`\`\`${canal.topic}\`\`\`` : `🤷‍♀️ Tópico não definido.`}`)
            .addFields(
              { name: `👤・Menção:`, value: `\`<#${canal.id}>\` `, inline: true },
              { name: `👥・Id:`, value: `\`${canal.id}\` ` },
              { name: `🔞・NSFW`, value: `${canal.nsfw ? 'Sim' : 'Não'}`, inline: true },
              { name: `🗓️・Criado em:`, value: `<t:${~~(canal.createdTimestamp/1000)}:D> (<t:${~~(canal.createdTimestamp/1000)}:R>)`, inline: true },
              { name: `🖥️・Servidor:`, value: `\`${canal.guild.name}\``, inline: true },
            )
            .setTimestamp();
            
            return interaction.followUp({ embeds: [embed] });
            
          };
          
        }
          break;

        case 'cargo': {
          
          if (command && command == 'informações') {
            
            const cargo = interaction.options.getRole('cargo');
            
            const membros = interaction.guild.members.cache.filter(member => {
              return member.roles.cache.find(r => r.id === cargo.id);
            })
            
            const embed = new EmbedBuilder()
            .setTitle(client.user.username, client.user.displayAvatarURL({ dynamic: true }))
            .setColor(color.embed)
            .setTitle(`Informações do cargo: ${cargo.name}`)
            .addFields(
              { name: `👤・Menção:`, value: `\`<#${cargo.id}>\` `, inline: true },
              { name: `👥・Id:`, value: ` \`${cargo.id}\`` },
              { name: `🗓️・Criado em:`, value: `<t:${~~(cargo.createdTimestamp/1000)}:D> (<t:${~~(cargo.createdTimestamp/1000)}:R>)`, inline: true },
              { name: `👀・Cargo separado:`, value: `${cargo.hoist ? 'Sim': 'Não'}`, inline: true },
              { name: `🤖・Integração:`, value: `${cargo.managed ? 'Sim' : 'Não'}`, inline: true },
              { name: `**@**・Mencionável:`, value: `${cargo.mentionable ? 'Sim' : 'Não'}`, inline: true },
              { name: `👤・Membros:`, value: `${membros.size}`, inline: false },
              { name: `🎨・Cor:`, value: `${cargo.hexColor.toUpperCase()}`, inline: false }
            )
            .setTimestamp()
            
            return interaction.followUp({ embeds: [embed] });
            
          }
          
        }
          break;

        default: {

          switch (command) {
            case 'informações': {
              
              function checkBots(guild) {
                let botCount = 0;
                guild.members.cache.forEach(member => { 
                  if (member.user.bot) botCount++;
                });
                return botCount;
              }
      
              function checkMembers(guild) {
                let memberCount = 0;
                guild.members.cache.forEach(member => {
                  if (!member.user.bot) memberCount++;
                });
                return memberCount;
              }
      
              const serverIcon = guild.iconURL({ format: 'png', dynamic: true, size: 1024 });
              
              const membros = new Intl.NumberFormat('pt-BR').format(guild.memberCount || 0);
              
              let ownerInfo = 'Não identificado';
              if (guild.ownerId) {
                try {
                  const owner = (await guild.fetchOwner?.().catch(() => null)) || (await client.users?.fetch?.(guild.ownerId).catch(() => null));
                  if (owner) {
                    const user = owner.user || owner;
                    const tag = user.discriminator && user.discriminator !== '0'
                      ? `${user.username}#${user.discriminator}`
                      : user.username;
                    ownerInfo = `\`${tag}\` (${guild.ownerId})`;
                  } else {
                    ownerInfo = `\`ID: ${guild.ownerId}\``;
                  }
                } catch (e) {
                  ownerInfo = `\`ID: ${guild.ownerId}\``;
                }
              }
              
              const embed = new EmbedBuilder()
              .setTitle(`${guild.name}`)
              .setColor(color.embed)
              .addFields(
                { name: `👤・Nome:`, value: `\`${guild.name}\``, inline: true },
                { name: `👥・Id:`, value: `\`${guild.id}\``, inline: true },
                { name: `👑・Dono:`, value: `${ownerInfo}`, inline: true },
                { name: `🗓️・Criado em:`, value: `<t:${~~(guild.createdTimestamp/1000)}:D> (<t:${~~(guild.createdTimestamp/1000)}:R>)`, inline: true },
                { name: `<:user:925955074222608505>・Membros: ${membros}`, value: `
👤・**Humanos:** ${checkMembers(guild)}
🤖・**Robôs:** ${checkBots(guild)}`, inline: false },
                { name: `📂・Canais: ${guild.channels?.cache?.size || 0}`, value: `
📝 Texto: ${guild.channels?.cache?.filter(c => c.type == 0).size || 0}
🗣 Voz: ${guild.channels?.cache?.filter(c => c.type == 2).size || 0}`, inline: false }
              );
              
              if (serverIcon) embed.setThumbnail(serverIcon);
              const banner = guild.bannerURL({ format: 'png', dynamic: true, size: 1024 });
              if (banner) embed.setImage(banner);
              
              return interaction.followUp({ embeds: [embed] });
              
            };
            break;

            case 'imagem': {
            
              const escolha = interaction.options.getString('escolha');
              
              let link = NoImage;

              switch (escolha) {
                case 'ícone':
                  link = guild.iconURL({ format: 'png', dynamic: true, size: 1024 }) || NoImage
                  break;

                case 'splash':
                  link = guild.splashURL({ dynamic: true }) || NoImage
                  break;

                case 'banner':
                  link = guild.bannerURL({ dynamic: true }) || NoImage;
                  break;

                default:
                  link = NoImage;
                  break;
              }
              const row = new ActionRowBuilder().addComponents([
                new ButtonBuilder().setStyle(ButtonStyle.Link)
                .setURL(link)
                .setLabel('Abrir imagem no navegador'),
              ]);
              
              const embed = new EmbedBuilder()
              .setColor(color.embed)
              .setTitle(guild.name)
              .setImage(link)
              
              return interaction.followUp({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
              
            }
              break;
          }
        
      }
          break;
      }
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  
  }
}