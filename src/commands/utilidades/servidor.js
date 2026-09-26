const { 
  ApplicationCommandType, 
  ApplicationCommandOptionType, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  ChannelType,
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

function normalize(str) {
  return str ? String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';
}

function findRole(guild, query) {
  if (!guild || !query) return null;
  const clean = String(query).trim();
  if (!clean) return null;

  // 1. Menção direta <@&ID>
  const mentionMatch = clean.match(/^<@&(\d+)>$/);
  if (mentionMatch) {
    const role = guild.roles.cache.get(mentionMatch[1]);
    if (role) return role;
  }

  // 2. ID direto
  const idMatch = clean.match(/^(\d{16,21})$/);
  if (idMatch && guild.roles.cache.has(idMatch[1])) {
    return guild.roles.cache.get(idMatch[1]);
  }
  if (guild.roles.cache.has(clean)) {
    return guild.roles.cache.get(clean);
  }

  const roles = Array.from(guild.roles.cache.values());

  // 3. Busca por nome exato (case-insensitive)
  const exact = roles.find(r => r.name.toLowerCase() === clean.toLowerCase());
  if (exact) return exact;

  // 4. Busca por nome normalizado (sem acentos)
  const cleanNorm = normalize(clean);
  const exactNorm = roles.find(r => normalize(r.name) === cleanNorm);
  if (exactNorm) return exactNorm;

  // 5. Início do nome
  const startsWith = roles.find(r => normalize(r.name).startsWith(cleanNorm));
  if (startsWith) return startsWith;

  // 6. Contém no nome
  const includes = roles.find(r => normalize(r.name).includes(cleanNorm));
  if (includes) return includes;

  return null;
}

module.exports = {
  name: "servidor",
  aliases: ["server", "serverinfo", "sinfo"],
  category: "utilidades",
  description: `⌊🛠️ Utilidades⌉ Veja informações, imagens, cargos ou canais do servidor.`,
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "informações",
      aliases: ["info", "informacoes", "infos", "i", "detalhes", "serverinfo", "sinfo", "geral", "sobre"],
      description: "⌊🛠️ Utilidades⌉ Veja as informações gerais do servidor.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "servidor",
          type: ApplicationCommandOptionType.String,
          description: "ID do servidor (deixe em branco para o atual)",
          required: false,
        }
      ],
    },
    {
      name: "imagem",
      aliases: ["foto", "icone", "ícone", "banner", "splash", "fotos", "img"],
      description: "⌊🛠️ Utilidades⌉ Amplia o ícone, banner ou splash do servidor.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "escolha",
          type: ApplicationCommandOptionType.String,
          description: "Qual imagem do servidor deseja visualizar",
          required: true,
          choices: [
            { name: "Ícone", value: "ícone" },
            { name: "Banner", value: "banner" },
            { name: "Splash de Convite", value: "splash" },
          ]
        },
        {
          name: "servidor",
          type: ApplicationCommandOptionType.String,
          description: "ID do servidor (opcional)",
          required: false,
        }
      ],
    },
    {
      name: "cargo",
      aliases: ["cargos", "role", "roles", "roleinfo", "cargoinfo", "rinfo"],
      description: "⌊🛠️ Utilidades⌉ Veja informações detalhadas, membros e permissões de um cargo.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "informações",
          type: ApplicationCommandOptionType.Role,
          description: "Mencione, digite o ID ou selecione o cargo",
          required: true,
        }
      ]
    },
    {
      name: "canal",
      aliases: ["canais", "channel", "channels"],
      description: "⌊🛠️ Utilidades⌉ Veja informações sobre um canal do servidor.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "canal",
          type: ApplicationCommandOptionType.Channel,
          description: "Selecione o canal desejado (deixe vazio para o canal atual)",
          required: false,
        }
      ]
    }
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const embedColor = color?.embed || '#831396';
      const pfx = interaction.prefixo || interaction.prefix || '!';

      // Detecta subcomando ou fallback considerando aliases
      let rawSub = interaction.options?.getSubcommand?.(false);
      if (!rawSub && Array.isArray(args) && args.length > 0) {
        rawSub = args[0];
      }

      let subCommand = rawSub ? String(rawSub).toLowerCase() : null;

      if (['imagem', 'foto', 'icone', 'ícone', 'banner', 'splash', 'fotos', 'img'].includes(subCommand)) {
        subCommand = 'imagem';
      } else if (['cargo', 'cargos', 'role', 'roles', 'roleinfo', 'cargoinfo', 'rinfo'].includes(subCommand)) {
        subCommand = 'cargo';
      } else if (['canal', 'canais', 'channel', 'channels'].includes(subCommand)) {
        subCommand = 'canal';
      } else if (['informações', 'info', 'informacoes', 'infos', 'i', 'detalhes', 'serverinfo', 'sinfo', 'geral', 'sobre'].includes(subCommand)) {
        subCommand = 'informações';
      } else {
        // Se chamado apenas como !servidor (sem subcomandos) ou se o subcomando for 'menu'/'ajuda'
        subCommand = 'menu';
      }

      // Determina a guilda alvo
      const targetGuildId = interaction.options?.getString?.('servidor');
      let guild = interaction.guild;
      if (targetGuildId) {
        guild = client.guilds.cache.get(targetGuildId) || (await client.guilds.fetch(targetGuildId).catch(() => null)) || interaction.guild;
      }

      if (!guild) {
        if (typeof interaction.error === 'function') {
          return interaction.error({ content: 'Não foi possível encontrar as informações deste servidor.' });
        }
        return interaction.followUp?.({ content: 'Não foi possível encontrar as informações deste servidor.', ephemeral: true }).catch(() => {});
      }

      // Funções auxiliares para construtor de embeds do servidor
      const buildServerInfoEmbed = async () => {
        const membersList = Array.from(guild.members?.cache?.values() || []);
        const totalMembers = guild.memberCount || membersList.length || 0;
        const cachedBots = membersList.filter(m => m.user?.bot).length;
        const cachedHumans = membersList.filter(m => !m.user?.bot).length;
        const createdTs = Math.floor(guild.createdTimestamp / 1000);

        let ownerInfo = 'Não identificado';
        try {
          const owner = (await guild.fetchOwner().catch(() => null)) || (client.users ? await client.users.fetch(guild.ownerId).catch(() => null) : null);
          if (owner) {
            const u = owner.user || owner;
            ownerInfo = `**${u.username}** (\`${guild.ownerId}\`)`;
          } else {
            ownerInfo = `\`ID: ${guild.ownerId}\``;
          }
        } catch (_) {
          ownerInfo = `\`ID: ${guild.ownerId}\``;
        }

        const channelsList = Array.from(guild.channels?.cache?.values() || []);
        const textChannels = channelsList.filter(c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement).length;
        const voiceChannels = channelsList.filter(c => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice).length;
        const categoryChannels = channelsList.filter(c => c.type === ChannelType.GuildCategory).length;

        const boostTier = guild.premiumTier ? `Nível ${guild.premiumTier}` : 'Sem Nível';
        const boostCount = guild.premiumSubscriptionCount || 0;

        const embed = new EmbedBuilder()
          .setColor(embedColor)
          .setTitle(`🏰 Informações do Servidor: ${guild.name}`)
          .addFields(
            { name: `👑・Proprietário(a):`, value: ownerInfo, inline: false },
            { name: `🆔・ID do Servidor:`, value: `\`${guild.id}\``, inline: true },
            { name: `🗓️・Criado em:`, value: `<t:${createdTs}:D> (<t:${createdTs}:R>)`, inline: true },
            { name: `🚀・Impulsos (Boosts):`, value: `\`${boostCount} boosts\` (${boostTier})`, inline: true },
            { 
              name: `👥・Membros (${new Intl.NumberFormat('pt-BR').format(totalMembers)}):`, 
              value: `> 👤 **Humanos:** ${cachedHumans > 0 ? cachedHumans : totalMembers}\n> 🤖 **Bots:** ${cachedBots}`, 
              inline: true 
            },
            { 
              name: `📂・Canais (${channelsList.length}):`, 
              value: `> 💬 **Texto:** ${textChannels}\n> 🔊 **Voz:** ${voiceChannels}\n> 📁 **Categorias:** ${categoryChannels}`, 
              inline: true 
            },
            { 
              name: `🎭・Outros Recursos:`, 
              value: `> 🏷️ **Cargos:** ${guild.roles?.cache?.size || 0}\n> 😀 **Emojis:** ${guild.emojis?.cache?.size || 0}`, 
              inline: true 
            }
          )
          .setFooter({ text: `Solicitado por ${interaction.user.username}` })
          .setTimestamp();

        const icon = guild.iconURL?.({ dynamic: true, size: 512 });
        if (icon) embed.setThumbnail(icon);

        const banner = guild.bannerURL?.({ dynamic: true, size: 1024 });
        if (banner) embed.setImage(banner);

        return embed;
      };

      const buildServerIconEmbed = () => {
        const iconUrl = guild.iconURL?.({ dynamic: true, size: 2048 });
        if (!iconUrl) {
          return new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`Ícone do Servidor — ${guild.name}`)
            .setDescription('O servidor não possui um ícone personalizado configurado.');
        }
        return new EmbedBuilder()
          .setColor(embedColor)
          .setTitle(`Ícone do Servidor — ${guild.name}`)
          .setImage(iconUrl)
          .setFooter({ text: `Solicitado por ${interaction.user.username}` })
          .setTimestamp();
      };

      switch (subCommand) {
        case 'menu': {
          const menuEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setAuthor({ 
              name: `Central de Comandos do Servidor — ${guild.name}`, 
              iconURL: guild.iconURL?.({ dynamic: true }) || undefined 
            })
            .setTitle(`🛠️ Comandos Disponíveis do Servidor`)
            .setDescription(`Use os subcomandos abaixo para visualizar informações completas, imagens, cargos e canais deste servidor!\nVocê pode utilizá-los via comando por barra (\`/servidor <subcomando>\`) ou por prefixo (\`${pfx}servidor <subcomando>\`).`)
            .addFields(
              {
                name: `📋・${pfx}servidor informações (ou ${pfx}servidor info)`,
                value: `> Veja estatísticas gerais do servidor: dono, data de criação, membros (humanos e bots), canais, impulsos e emojis.\n> *Exemplo:* \`${pfx}servidor info\``,
                inline: false
              },
              {
                name: `🖼️・${pfx}servidor imagem [ícone | banner | splash]`,
                value: `> Amplie o ícone, banner ou a tela de fundo (splash de convite) do servidor em alta resolução.\n> *Exemplo:* \`${pfx}servidor imagem banner\``,
                inline: false
              },
              {
                name: `🏷️・${pfx}servidor cargo <cargo>`,
                value: `> Veja informações detalhadas, cor, membros e **todas as 52 permissões** do Discord de um cargo.\n> Você pode **mencionar**, digitar o **ID** ou o **nome** do cargo no servidor!\n> *Exemplo:* \`${pfx}servidor cargo @Moderador\` ou \`${pfx}servidor cargo Moderador\``,
                inline: false
              },
              {
                name: `💬・${pfx}servidor canal [#canal]`,
                value: `> Consulte informações, tópico, configurações e permissões de um canal de texto ou voz.\n> *Exemplo:* \`${pfx}servidor canal #geral\``,
                inline: false
              }
            )
            .setFooter({ text: `Servidor: ${guild.name} • Solicitado por ${interaction.user.username}` })
            .setTimestamp();

          const menuRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("sv_menu_info")
              .setStyle(ButtonStyle.Primary)
              .setLabel('Informações do Servidor')
              .setEmoji('📋'),

            new ButtonBuilder()
              .setCustomId("sv_menu_icone")
              .setStyle(ButtonStyle.Secondary)
              .setLabel('Ver Ícone')
              .setEmoji('🖼️')
          );

          const menuMsg = await interaction.followUp({
            embeds: [menuEmbed],
            components: [menuRow],
            fetchReply: true
          });

          if (!menuMsg || !menuMsg.createMessageComponentCollector) return;

          const collector = menuMsg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 90000
          });

          collector.on('collect', async (i) => {
            try {
              await i.deferUpdate().catch(() => {});
              if (i.customId === 'sv_menu_info') {
                const infoEmbed = await buildServerInfoEmbed();
                const backRow = new ActionRowBuilder().addComponents(
                  new ButtonBuilder().setCustomId("sv_menu_voltar").setStyle(ButtonStyle.Secondary).setLabel('Voltar ao Menu').setEmoji('🔙')
                );
                await menuMsg.edit({ embeds: [infoEmbed], components: [backRow] }).catch(() => {});
              } else if (i.customId === 'sv_menu_icone') {
                const iconEmbed = buildServerIconEmbed();
                const backRow = new ActionRowBuilder().addComponents(
                  new ButtonBuilder().setCustomId("sv_menu_voltar").setStyle(ButtonStyle.Secondary).setLabel('Voltar ao Menu').setEmoji('🔙')
                );
                await menuMsg.edit({ embeds: [iconEmbed], components: [backRow] }).catch(() => {});
              } else if (i.customId === 'sv_menu_voltar') {
                await menuMsg.edit({ embeds: [menuEmbed], components: [menuRow] }).catch(() => {});
              }
            } catch (_) {}
          });

          collector.on('end', async () => {
            try {
              const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("d1").setStyle(ButtonStyle.Primary).setLabel('Informações do Servidor').setEmoji('📋').setDisabled(true),
                new ButtonBuilder().setCustomId("d2").setStyle(ButtonStyle.Secondary).setLabel('Ver Ícone').setEmoji('🖼️').setDisabled(true)
              );
              await menuMsg.edit({ components: [disabledRow] }).catch(() => {});
            } catch (_) {}
          });

          return;
        }

        case 'informações': {
          const embed = await buildServerInfoEmbed();
          return interaction.followUp({ embeds: [embed] });
        }

        case 'imagem': {
          let escolha = interaction.options?.getString?.('escolha');
          if (!escolha && args) {
            if (args.some(a => a.toLowerCase() === 'banner')) escolha = 'banner';
            else if (args.some(a => a.toLowerCase() === 'splash')) escolha = 'splash';
            else escolha = 'ícone';
          }
          if (!escolha) escolha = 'ícone';

          let link = null;
          let labelNome = 'Ícone';

          if (escolha === 'banner') {
            link = guild.bannerURL({ dynamic: true, size: 2048 });
            labelNome = 'Banner';
            if (!link) {
              return interaction.followUp({
                content: `${emoji?.aviso || '⚠️'} **|** O servidor **${guild.name}** não possui um banner configurado.`
              });
            }
          } else if (escolha === 'splash') {
            link = guild.splashURL({ dynamic: true, size: 2048 });
            labelNome = 'Splash de Convite';
            if (!link) {
              return interaction.followUp({
                content: `${emoji?.aviso || '⚠️'} **|** O servidor **${guild.name}** não possui uma imagem de splash de convite.`
              });
            }
          } else {
            link = guild.iconURL({ dynamic: true, size: 2048 });
            labelNome = 'Ícone';
            if (!link) {
              return interaction.followUp({
                content: `${emoji?.aviso || '⚠️'} **|** O servidor **${guild.name}** não possui um ícone personalizado.`
              });
            }
          }

          const row = new ActionRowBuilder().addComponents([
            new ButtonBuilder()
              .setStyle(ButtonStyle.Link)
              .setURL(link)
              .setLabel(`Abrir ${labelNome} no Navegador`)
              .setEmoji('🖼️')
          ]);

          const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`${labelNome} do Servidor — ${guild.name}`)
            .setImage(link)
            .setFooter({ text: `Solicitado por ${interaction.user.username}` })
            .setTimestamp();

          return interaction.followUp({ embeds: [embed], components: [row] });
        }

        case 'cargo': {
          let cargo = interaction.options?.getRole?.('informações') || interaction.options?.getRole?.('cargo');

          if (!cargo && args) {
            let searchTokens = [...args];
            // Remove 'cargo', 'cargos', 'role', 'roles' e aliases se vierem no primeiro argumento
            if (searchTokens.length > 0 && ['cargo', 'cargos', 'role', 'roles', 'roleinfo', 'cargoinfo', 'rinfo'].includes(searchTokens[0].toLowerCase())) {
              searchTokens.shift();
            }
            if (searchTokens.length > 0 && ['informações', 'info', 'informacoes', 'infos', 'i', 'detalhes'].includes(searchTokens[0].toLowerCase())) {
              searchTokens.shift();
            }

            const query = searchTokens.join(' ').trim();
            if (query) {
              cargo = findRole(guild, query);
            }
          }

          // Se ainda não achou, verifica menção direta na mensagem
          if (!cargo && interaction.message?.mentions?.roles?.size > 0) {
            cargo = interaction.message.mentions.roles.first();
          }

          if (!cargo) {
            const errorMsg = `Você precisa especificar um cargo válido!\n💡 **Dica:** Você pode mencionar o cargo (\`<@&ID>\`), digitar o ID ou o nome do cargo no servidor.\n\n*Exemplos:*\n• \`${pfx}servidor cargo @Moderador\`\n• \`${pfx}servidor cargo Moderador\`\n• \`${pfx}servidor cargo 929101725485387806\``;
            if (typeof interaction.error === 'function') {
              return interaction.error({ content: errorMsg });
            }
            return interaction.followUp?.({ content: errorMsg, ephemeral: true }).catch(() => {});
          }

          // Estatísticas do cargo e membros
          const totalGuildMembers = guild.memberCount || 1;
          let membersWithRole = [];
          if (cargo.id === guild.id) {
            membersWithRole = Array.from(guild.members?.cache?.values() || []);
          } else if (cargo.members && cargo.members.size > 0) {
            membersWithRole = Array.from(cargo.members.values());
          } else {
            const cachedMembers = Array.from(guild.members?.cache?.values() || []);
            membersWithRole = cachedMembers.filter(m => 
              m.roles?.cache ? m.roles.cache.has(cargo.id) : false
            );
          }

          const roleMembersCount = cargo.id === guild.id 
            ? totalGuildMembers 
            : (cargo.members?.size || membersWithRole.length);

          const percentage = ((roleMembersCount / totalGuildMembers) * 100).toFixed(1);
          const createdTs = Math.floor(cargo.createdTimestamp / 1000);
          const roleColor = cargo.hexColor && cargo.hexColor !== '#000000' ? cargo.hexColor : embedColor;
          const roleIcon = cargo.iconURL?.({ size: 1024, dynamic: true }) || null;
          const guildIcon = guild.iconURL?.({ dynamic: true }) || null;
          const hasAdmin = cargo.permissions ? cargo.permissions.has('Administrator') : false;

          // Constrói Embed 1: Detalhes do Cargo
          const buildRoleEmbed = () => {
            const embed = new EmbedBuilder()
              .setColor(roleColor)
              .setAuthor({ 
                name: `Informações do Cargo: ${cargo.name}`, 
                iconURL: roleIcon || guildIcon 
              })
              .setTitle(`🏷️ ${cargo.name}`)
              .setDescription(`Consulte abaixo os detalhes, configurações e estatísticas do cargo <@&${cargo.id}>.`)
              .addFields(
                { name: `👤・Menção:`, value: `<@&${cargo.id}>`, inline: true },
                { name: `🆔・ID do Cargo:`, value: `\`${cargo.id}\``, inline: true },
                { name: `🎨・Cor Hex:`, value: `\`${cargo.hexColor.toUpperCase()}\``, inline: true },
                { name: `👥・Membros:`, value: `\`${roleMembersCount} membro(s)\` (${percentage}%)`, inline: true },
                { name: `📍・Posição:`, value: `\`#${cargo.position} / ${guild.roles?.cache?.size || '?'}\``, inline: true },
                { name: `👑・Administrador:`, value: hasAdmin ? '`Sim (Total)`' : '`Não`', inline: true },
                { name: `👀・Exibir Separado:`, value: cargo.hoist ? '`Sim`' : '`Não`', inline: true },
                { name: `📢・Mencionável:`, value: cargo.mentionable ? '`Sim`' : '`Não`', inline: true },
                { name: `🤖・Gerenciado:`, value: cargo.managed ? '`Sim (Bot/App)`' : '`Não`', inline: true },
                { name: `📆・Criado em:`, value: `<t:${createdTs}:D> (<t:${createdTs}:R>)`, inline: false }
              )
              .setFooter({ text: `Servidor: ${guild.name} • Solicitado por ${interaction.user.username}` })
              .setTimestamp();

            if (roleIcon) {
              embed.setThumbnail(roleIcon);
            }

            return embed;
          };

          // Constrói Embed 2: Todas as 52 Permissões do Cargo
          const buildPermissionsEmbed = () => {
            const totalPermsCount = PERMISSION_CATEGORIES.reduce((acc, cat) => acc + cat.permissions.length, 0);
            let activeCount = 0;

            for (const cat of PERMISSION_CATEGORIES) {
              for (const p of cat.permissions) {
                if (cargo.permissions?.has(p.key)) activeCount++;
              }
            }

            let desc = `Legenda: ${EMOJI_ATIVADO} Ativado • ${EMOJI_DESATIVADO} Desativado\nPermissões ativas: **${activeCount}/${totalPermsCount}**`;
            if (hasAdmin) {
              desc += `\n👑 *Este cargo possui permissão de **Administrador** (concede acesso total a todas as permissões).*`;
            }

            const embed = new EmbedBuilder()
              .setColor(roleColor)
              .setAuthor({ 
                name: `Permissões de ${cargo.name}`, 
                iconURL: roleIcon || guildIcon 
              })
              .setTitle(`🛡️ Todas as Permissões do Cargo`)
              .setDescription(desc);

            for (const cat of PERMISSION_CATEGORIES) {
              const lines = cat.permissions.map(p => {
                const hasPerm = cargo.permissions ? cargo.permissions.has(p.key) : false;
                const statusEmoji = hasPerm ? EMOJI_ATIVADO : EMOJI_DESATIVADO;
                return `> ${p.label}: ${statusEmoji}`;
              });

              embed.addFields({
                name: cat.title,
                value: lines.join('\n'),
                inline: false
              });
            }

            embed.setFooter({ text: `Servidor: ${guild.name} • Solicitado por ${interaction.user.username}` })
              .setTimestamp();

            return embed;
          };

          // Constrói Embed 3: Lista de Membros
          const buildMembersEmbed = () => {
            let membersString = '';
            if (cargo.id === guild.id) {
              membersString = `Todos os membros do servidor possuem este cargo por padrão (\`${totalGuildMembers} membros\`).`;
            } else if (membersWithRole.length > 0) {
              const maxDisplay = 35;
              const displayList = membersWithRole.slice(0, maxDisplay);
              membersString = displayList.map(m => `<@${m.id}>`).join(', ');
              if (membersWithRole.length > maxDisplay) {
                membersString += `\n\n*...e mais ${membersWithRole.length - maxDisplay} membro(s).*`;
              }
            } else {
              membersString = 'Nenhum membro possui este cargo no momento.';
            }

            return new EmbedBuilder()
              .setColor(roleColor)
              .setAuthor({ 
                name: `Membros com o Cargo: ${cargo.name}`, 
                iconURL: roleIcon || guildIcon 
              })
              .setTitle(`👥 Membros (${roleMembersCount})`)
              .setDescription(membersString)
              .setFooter({ text: `Total: ${roleMembersCount} membro(s) • Servidor: ${guild.name}` })
              .setTimestamp();
          };

          const getInfoButtons = () => new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("sv_cargo_permissoes")
              .setStyle(ButtonStyle.Secondary)
              .setLabel('Ver Permissões')
              .setEmoji('🛡️'),

            new ButtonBuilder()
              .setCustomId("sv_cargo_membros")
              .setStyle(ButtonStyle.Secondary)
              .setLabel('Ver Membros')
              .setEmoji('👥')
          );

          const getPermissionsButtons = () => new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("sv_cargo_info")
              .setStyle(ButtonStyle.Secondary)
              .setLabel('Voltar ao Cargo')
              .setEmoji('🏷️'),

            new ButtonBuilder()
              .setCustomId("sv_cargo_membros")
              .setStyle(ButtonStyle.Secondary)
              .setLabel('Ver Membros')
              .setEmoji('👥')
          );

          const getMembersButtons = () => new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("sv_cargo_info")
              .setStyle(ButtonStyle.Secondary)
              .setLabel('Voltar ao Cargo')
              .setEmoji('🏷️'),

            new ButtonBuilder()
              .setCustomId("sv_cargo_permissoes")
              .setStyle(ButtonStyle.Secondary)
              .setLabel('Ver Permissões')
              .setEmoji('🛡️')
          );

          const msg = await interaction.followUp({
            embeds: [buildRoleEmbed()],
            components: [getInfoButtons()],
            fetchReply: true
          });

          if (!msg || !msg.createMessageComponentCollector) return;

          const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 90000
          });

          collector.on('collect', async (i) => {
            try {
              await i.deferUpdate().catch(() => {});

              if (i.customId === 'sv_cargo_permissoes') {
                await msg.edit({
                  embeds: [buildPermissionsEmbed()],
                  components: [getPermissionsButtons()]
                }).catch(() => {});

              } else if (i.customId === 'sv_cargo_membros') {
                await msg.edit({
                  embeds: [buildMembersEmbed()],
                  components: [getMembersButtons()]
                }).catch(() => {});

              } else if (i.customId === 'sv_cargo_info') {
                await msg.edit({
                  embeds: [buildRoleEmbed()],
                  components: [getInfoButtons()]
                }).catch(() => {});
              }

            } catch (err) {
              console.error('[servidor cargo collector error]', err);
            }
          });

          collector.on('end', async () => {
            try {
              const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("b1").setStyle(ButtonStyle.Secondary).setLabel('Permissões').setEmoji('🛡️').setDisabled(true),
                new ButtonBuilder().setCustomId("b2").setStyle(ButtonStyle.Secondary).setLabel('Membros').setEmoji('👥').setDisabled(true)
              );
              await msg.edit({ components: [disabledRow] }).catch(() => {});
            } catch (_) {}
          });

          return;
        }

        case 'canal': {
          let canal = interaction.options?.getChannel?.('canal') || interaction.channel;
          if (!canal) canal = interaction.channel;

          const createdTs = Math.floor(canal.createdTimestamp / 1000);

          const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`💬 Informações do Canal: #${canal.name}`)
            .setDescription(canal.topic ? `📖 **Tópico:**\n\`\`\`${canal.topic}\`\`\`` : '*Tópico não definido.*')
            .addFields(
              { name: `👤・Menção:`, value: `<#${canal.id}>`, inline: true },
              { name: `🆔・ID:`, value: `\`${canal.id}\``, inline: true },
              { name: `🔞・NSFW:`, value: canal.nsfw ? '`Sim`' : '`Não`', inline: true },
              { name: `🗓️・Criado em:`, value: `<t:${createdTs}:D> (<t:${createdTs}:R>)`, inline: true },
              { name: `🖥️・Servidor:`, value: `\`${canal.guild?.name || 'Atual'}\``, inline: true }
            )
            .setFooter({ text: `Solicitado por ${interaction.user.username}` })
            .setTimestamp();

          return interaction.followUp({ embeds: [embed] });
        }

        default:
          if (typeof interaction.error === 'function') {
            return interaction.error({ content: 'Subcomando inválido. Utilize `informações`, `imagem`, `cargo` ou `canal`.' });
          }
          return interaction.followUp?.({ content: 'Subcomando inválido. Utilize `informações`, `imagem`, `cargo` ou `canal`.', ephemeral: true }).catch(() => {});
      }

    } catch (error) {
      console.error('[servidor command error]', error);
      if (typeof interaction.error === 'function') {
        return interaction.error({ content: 'Ocorreu um erro inesperado ao executar o comando de servidor.' });
      }
      return interaction.followUp?.({ content: 'Ocorreu um erro inesperado ao executar o comando de servidor.', ephemeral: true }).catch(() => {});
    }
  }
};