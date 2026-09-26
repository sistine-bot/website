const { 
  ApplicationCommandType, 
  ApplicationCommandOptionType, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  PermissionsBitField
} = require('discord.js');

const EMOJI_ATIVADO = '<:ativado:929101725485387806>';
const EMOJI_DESATIVADO = '<:desativado:929101703544991824>';

const PERMISSION_CATEGORIES = [
  {
    title: '👑・Gerais & Administração',
    permissions: [
      { key: 'Administrator', label: 'Administrador' },
      { key: 'ManageGuild', label: 'Gerenciar Servidor' },
      { key: 'ManageRoles', label: 'Gerenciar Cargos' },
      { key: 'ManageChannels', label: 'Gerenciar Canais' },
      { key: 'ViewAuditLog', label: 'Ver Registro de Auditoria' },
      { key: 'ViewGuildInsights', label: 'Ver Estatísticas do Servidor' },
      { key: 'ViewCreatorMonetizationAnalytics', label: 'Ver Monetização do Criador' },
      { key: 'ManageWebhooks', label: 'Gerenciar Webhooks' },
      { key: 'ManageGuildExpressions', label: 'Gerenciar Expressões (Emojis/Figurinhas)' },
      { key: 'CreateGuildExpressions', label: 'Criar Expressões (Emojis/Figurinhas)' },
      { key: 'ManageEvents', label: 'Gerenciar Eventos' },
      { key: 'CreateEvents', label: 'Criar Eventos' }
    ]
  },
  {
    title: '🛡️・Membros & Moderação',
    permissions: [
      { key: 'KickMembers', label: 'Expulsar Membros' },
      { key: 'BanMembers', label: 'Banir Membros' },
      { key: 'ModerateMembers', label: 'Moderar / Castigar Membros' },
      { key: 'ChangeNickname', label: 'Alterar Apelido' },
      { key: 'ManageNicknames', label: 'Gerenciar Apelidos' },
      { key: 'CreateInstantInvite', label: 'Criar Convite Instantâneo' }
    ]
  },
  {
    title: '💬・Mensagens & Chat',
    permissions: [
      { key: 'ViewChannel', label: 'Ver Canais' },
      { key: 'SendMessages', label: 'Enviar Mensagens' },
      { key: 'EmbedLinks', label: 'Inserir Links' },
      { key: 'AttachFiles', label: 'Anexar Arquivos' },
      { key: 'AddReactions', label: 'Adicionar Reações' },
      { key: 'UseExternalEmojis', label: 'Usar Emojis Externos' },
      { key: 'UseExternalStickers', label: 'Usar Figurinhas Externas' },
      { key: 'MentionEveryone', label: 'Mencionar @everyone e @here' },
      { key: 'ManageMessages', label: 'Gerenciar Mensagens' },
      { key: 'PinMessages', label: 'Fixar Mensagens' },
      { key: 'ReadMessageHistory', label: 'Ver Histórico de Mensagens' },
      { key: 'SendTTSMessages', label: 'Enviar Mensagens TTS' },
      { key: 'SendPolls', label: 'Criar Enquetes' },
      { key: 'BypassSlowmode', label: 'Ignorar Modo Lento' }
    ]
  },
  {
    title: '🧵・Tópicos & Aplicativos',
    permissions: [
      { key: 'ManageThreads', label: 'Gerenciar Tópicos' },
      { key: 'CreatePublicThreads', label: 'Criar Tópicos Públicos' },
      { key: 'CreatePrivateThreads', label: 'Criar Tópicos Privados' },
      { key: 'SendMessagesInThreads', label: 'Enviar Mensagens em Tópicos' },
      { key: 'UseApplicationCommands', label: 'Usar Comandos de Aplicativo' },
      { key: 'UseEmbeddedActivities', label: 'Usar Atividades' },
      { key: 'UseExternalApps', label: 'Usar Aplicativos Externos' }
    ]
  },
  {
    title: '🔊・Canais de Voz & Palco',
    permissions: [
      { key: 'Connect', label: 'Conectar' },
      { key: 'Speak', label: 'Falar' },
      { key: 'Stream', label: 'Transmitir ao Vivo / Vídeo' },
      { key: 'UseSoundboard', label: 'Usar Painel de Som' },
      { key: 'UseExternalSounds', label: 'Usar Sons Externos' },
      { key: 'UseVAD', label: 'Usar Detecção de Voz' },
      { key: 'PrioritySpeaker', label: 'Voz Prioritária' },
      { key: 'MuteMembers', label: 'Silenciar Membros' },
      { key: 'DeafenMembers', label: 'Ensurdecer Membros' },
      { key: 'MoveMembers', label: 'Mover Membros' },
      { key: 'SendVoiceMessages', label: 'Enviar Mensagens de Voz' },
      { key: 'SetVoiceChannelStatus', label: 'Definir Status de Canal de Voz' },
      { key: 'RequestToSpeak', label: 'Pedir a Palavra (Palco)' }
    ]
  }
];

module.exports = {
  name: "usuário",
  aliases: ["user", "usuario", "userinfo", "uinfo", "avatar"],
  category: "utilidades",
  description: `⌊🛠️ Utilidades⌉ Veja informações de perfil, avatar, banner e permissões de um usuário.`,
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "informações",
      aliases: ["info", "informacoes", "infos", "i", "detalhes", "perfil", "userinfo", "uinfo"],
      description: "⌊🛠️ Utilidades⌉ Veja as informações gerais de um usuário.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "usuário",
          type: ApplicationCommandOptionType.User,
          description: "Mencione ou digite o ID do usuário (deixe vazio para ver o seu).",
          required: false,
        }
      ],
    },
    {
      name: "imagem",
      aliases: ["foto", "pic", "avatar", "banner", "fotos", "img"],
      description: "⌊🛠️ Utilidades⌉ Amplia o avatar ou banner de um usuário.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "escolha",
          type: ApplicationCommandOptionType.String,
          description: "Qual imagem deseja ampliar",
          required: true,
          choices: [
            { name: "Avatar", value: "avatar" },
            { name: "Banner", value: "banner" },
          ]
        },
        {
          name: "usuário",
          type: ApplicationCommandOptionType.User,
          description: "Mencione ou digite o ID do usuário (deixe vazio para o seu).",
          required: false,
        }
      ],
    }
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const embedColor = color?.embed || '#831396';

      // Identifica o subcomando considerando aliases e chamadas via prefixo
      let rawSub = interaction.options?.getSubcommand?.(false) || args?.[0] || 'informações';
      let subCommand = String(rawSub).toLowerCase();
      if (['imagem', 'foto', 'pic', 'avatar', 'banner', 'fotos', 'img'].includes(subCommand)) {
        subCommand = 'imagem';
      } else {
        subCommand = 'informações';
      }

      // Identifica o usuário alvo
      let targetUser = interaction.options?.getUser?.("usuário");
      if (!targetUser) {
        // Tenta obter de args se passado via prefixo
        for (const arg of (args || [])) {
          if (['imagem', 'avatar', 'banner', 'foto', 'pic', 'informações', 'info', 'informacoes', 'infos', 'perfil'].includes(arg.toLowerCase())) continue;
          const mentionMatch = arg.match(/^<@!?(\d+)>$/);
          const rawIdMatch = arg.match(/^(\d{17,20})$/);
          const uid = mentionMatch ? mentionMatch[1] : (rawIdMatch ? rawIdMatch[1] : null);
          if (uid) {
            targetUser = client.users.cache.get(uid) || await client.users.fetch(uid).catch(() => null);
            if (targetUser) break;
          }
        }
      }
      if (!targetUser) targetUser = interaction.user;

      const member = interaction.guild 
        ? (interaction.guild.members?.cache?.get(targetUser.id) || await interaction.guild.members?.fetch?.(targetUser.id).catch(() => null))
        : null;

      switch (subCommand) {
        case 'informações': {
          const createdTs = Math.floor(targetUser.createdTimestamp / 1000);
          const joinedTs = member?.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;

          const globalTag = targetUser.globalName 
            ? `${targetUser.globalName} (@${targetUser.username})` 
            : `@${targetUser.username}`;

          const apelido = member?.nickname ? `\`${member.nickname}\`` : '`Nenhum apelido`';
          const avatarUrl = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });

          // Constrói Embed 1: Perfil
          const buildProfileEmbed = () => {
            const embed = new EmbedBuilder()
              .setColor(embedColor)
              .setAuthor({ name: `Perfil de ${targetUser.username}`, iconURL: avatarUrl })
              .setThumbnail(avatarUrl)
              .addFields(
                { name: `👤・Nome / Tag:`, value: `**${globalTag}**`, inline: true },
                { name: `🏷️・Apelido no Servidor:`, value: apelido, inline: true },
                { name: `👥・ID:`, value: `\`${targetUser.id}\``, inline: true },
                { name: `🤖・Conta de Bot:`, value: targetUser.bot ? '`Sim`' : '`Não`', inline: true },
                { name: `🗓️・Conta Criada em:`, value: `<t:${createdTs}:D> (<t:${createdTs}:R>)`, inline: false }
              );

            if (joinedTs) {
              embed.addFields({ name: `📆・Entrou no Servidor em:`, value: `<t:${joinedTs}:D> (<t:${joinedTs}:R>)`, inline: false });
            }

            if (member?.roles?.cache) {
              const rolesList = Array.from(member.roles.cache.values());
              const roleCount = rolesList.filter(r => r.id !== interaction.guild?.id).length;
              embed.addFields({ name: `🎭・Total de Cargos:`, value: `\`${roleCount} cargo(s)\``, inline: true });
            }

            embed.setFooter({ text: `Solicitado por ${interaction.user.username}` }).setTimestamp();
            return embed;
          };

          // Constrói Embed 2: Todas as Permissões
          const buildPermissionsEmbed = () => {
            const totalPermsCount = PERMISSION_CATEGORIES.reduce((acc, cat) => acc + cat.permissions.length, 0);
            let activeCount = 0;

            for (const cat of PERMISSION_CATEGORIES) {
              for (const p of cat.permissions) {
                if (member?.permissions?.has(p.key)) activeCount++;
              }
            }

            let desc = `Legenda: ${EMOJI_ATIVADO} Ativado • ${EMOJI_DESATIVADO} Desativado\nPermissões ativas: **${activeCount}/${totalPermsCount}**`;
            if (member?.permissions?.has('Administrator')) {
              desc += `\n👑 *Este membro possui **Administrador** (acesso a todas as permissões).*`;
            }

            const embed = new EmbedBuilder()
              .setColor(embedColor)
              .setAuthor({ name: `Permissões de ${targetUser.username}`, iconURL: avatarUrl })
              .setTitle(`🛡️ Todas as Permissões no Servidor`)
              .setDescription(desc);

            for (const cat of PERMISSION_CATEGORIES) {
              const lines = cat.permissions.map(p => {
                const hasPerm = member?.permissions ? member.permissions.has(p.key) : false;
                const statusEmoji = hasPerm ? EMOJI_ATIVADO : EMOJI_DESATIVADO;
                return `> ${p.label}: ${statusEmoji}`;
              });

              embed.addFields({
                name: cat.title,
                value: lines.join('\n'),
                inline: false
              });
            }

            embed.setFooter({ text: `Servidor: ${interaction.guild?.name || 'Desconhecido'} • Solicitado por ${interaction.user.username}` }).setTimestamp();
            return embed;
          };

          // Constrói Embed 3: Cargos
          const buildRolesEmbed = () => {
            const userRoles = Array.from(member?.roles?.cache?.values() || [])
              .filter(r => r.id !== interaction.guild?.id)
              .sort((a, b) => (b.position || 0) - (a.position || 0));

            const rolesString = userRoles.length > 0
              ? userRoles.map(r => `<@&${r.id}>`).slice(0, 30).join(', ') + (userRoles.length > 30 ? `\n*...e mais ${userRoles.length - 30} cargos.*` : '')
              : 'Nenhum cargo atribuído.';

            const highestRole = member?.roles?.highest && member.roles.highest.id !== interaction.guild?.id
              ? `<@&${member.roles.highest.id}>`
              : 'Nenhum';

            return new EmbedBuilder()
              .setColor(embedColor)
              .setAuthor({ name: `Cargos de ${targetUser.username}`, iconURL: avatarUrl })
              .setTitle(`🎭 Cargos no Servidor`)
              .addFields(
                { name: `👑・Cargo Mais Alto:`, value: highestRole, inline: true },
                { name: `🏷️・Total de Cargos:`, value: `\`${userRoles.length} cargo(s)\``, inline: true },
                { name: `📋・Lista de Cargos:`, value: rolesString, inline: false }
              )
              .setFooter({ text: `Servidor: ${interaction.guild?.name || 'Desconhecido'}` })
              .setTimestamp();
          };

          // Linhas de Botões de Navegação
          const getProfileButtons = () => new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("ver_permissoes")
              .setStyle(ButtonStyle.Secondary)
              .setLabel('Ver Permissões')
              .setEmoji('🛡️')
              .setDisabled(!member),

            new ButtonBuilder()
              .setCustomId("ver_cargos")
              .setStyle(ButtonStyle.Secondary)
              .setLabel('Ver Cargos')
              .setEmoji('🎭')
              .setDisabled(!member)
          );

          const getPermissionsButtons = () => new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("ver_perfil")
              .setStyle(ButtonStyle.Secondary)
              .setLabel('Voltar ao Perfil')
              .setEmoji('👤'),

            new ButtonBuilder()
              .setCustomId("ver_cargos")
              .setStyle(ButtonStyle.Secondary)
              .setLabel('Ver Cargos')
              .setEmoji('🎭')
          );

          const getRolesButtons = () => new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("ver_perfil")
              .setStyle(ButtonStyle.Secondary)
              .setLabel('Voltar ao Perfil')
              .setEmoji('👤'),

            new ButtonBuilder()
              .setCustomId("ver_permissoes")
              .setStyle(ButtonStyle.Secondary)
              .setLabel('Ver Permissões')
              .setEmoji('🛡️')
          );

          const msg = await interaction.followUp({
            embeds: [buildProfileEmbed()],
            components: member ? [getProfileButtons()] : [],
            fetchReply: true
          });

          if (!member || !msg || !msg.createMessageComponentCollector) return;

          const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 90000
          });

          collector.on('collect', async (i) => {
            try {
              await i.deferUpdate().catch(() => {});

              if (i.customId === 'ver_permissoes') {
                await msg.edit({
                  embeds: [buildPermissionsEmbed()],
                  components: [getPermissionsButtons()]
                }).catch(() => {});

              } else if (i.customId === 'ver_cargos') {
                await msg.edit({
                  embeds: [buildRolesEmbed()],
                  components: [getRolesButtons()]
                }).catch(() => {});

              } else if (i.customId === 'ver_perfil') {
                await msg.edit({
                  embeds: [buildProfileEmbed()],
                  components: [getProfileButtons()]
                }).catch(() => {});
              }

            } catch (err) {
              console.error('[usuário collector error]', err);
            }
          });

          collector.on('end', async () => {
            try {
              const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("b1").setStyle(ButtonStyle.Secondary).setLabel('Permissões').setEmoji('🛡️').setDisabled(true),
                new ButtonBuilder().setCustomId("b2").setStyle(ButtonStyle.Secondary).setLabel('Cargos').setEmoji('🎭').setDisabled(true)
              );
              await msg.edit({ components: [disabledRow] }).catch(() => {});
            } catch (_) {}
          });

          break;
        }

        case 'imagem': {
          let escolha = interaction.options?.getString?.('escolha');
          if (!escolha && args) {
            if (args.some(a => a.toLowerCase() === 'banner')) escolha = 'banner';
            else escolha = 'avatar';
          }
          if (!escolha) escolha = 'avatar';

          // Busca dados completos do usuário para banner nativo
          const fullUser = await client.users.fetch(targetUser.id, { force: true }).catch(() => targetUser);

          if (escolha === 'banner') {
            const bannerUrl = fullUser.bannerURL({ size: 2048, dynamic: true });

            if (!bannerUrl) {
              return interaction.followUp({
                content: `${emoji?.aviso || '⚠️'} **|** O usuário **${fullUser.username}** não possui um banner de perfil personalizado configurado.`
              });
            }

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setURL(bannerUrl)
                .setLabel('Abrir Banner no Navegador')
                .setEmoji('🖼️')
            );

            const embed = new EmbedBuilder()
              .setColor(embedColor)
              .setAuthor({ name: `Banner de ${fullUser.username}`, iconURL: fullUser.displayAvatarURL() })
              .setImage(bannerUrl)
              .setFooter({ text: `Solicitado por ${interaction.user.username}` })
              .setTimestamp();

            return interaction.followUp({ embeds: [embed], components: [row] });

          } else {
            // Avatar
            const avatarUrl = fullUser.displayAvatarURL({ size: 2048, dynamic: true });

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setURL(avatarUrl)
                .setLabel('Abrir Avatar no Navegador')
                .setEmoji('🖼️')
            );

            const embed = new EmbedBuilder()
              .setColor(embedColor)
              .setAuthor({ name: `Avatar de ${fullUser.username}`, iconURL: avatarUrl })
              .setImage(avatarUrl)
              .setFooter({ text: `Solicitado por ${interaction.user.username}` })
              .setTimestamp();

            return interaction.followUp({ embeds: [embed], components: [row] });
          }
        }

        default:
          if (typeof interaction.error === 'function') {
            return interaction.error({ content: 'Subcomando inválido. Use `informações` ou `imagem`.' });
          }
          return interaction.followUp?.({ content: 'Subcomando inválido. Use `informações` ou `imagem`.', ephemeral: true }).catch(() => {});
      }

    } catch (error) {
      console.error('[usuário command error]', error);
      if (typeof interaction.error === 'function') {
        return interaction.error({ content: 'Ocorreu um erro inesperado ao executar o comando de usuário.' });
      }
      return interaction.followUp?.({ content: 'Ocorreu um erro inesperado ao executar o comando de usuário.', ephemeral: true }).catch(() => {});
    }
  }
};