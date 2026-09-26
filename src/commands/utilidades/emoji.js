const { 
  ApplicationCommandType, 
  ApplicationCommandOptionType, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} = require('discord.js');

module.exports = {
  name: "emoji",
  aliases: ["emojis", "emojilist"],
  category: "utilidades",
  description: `⌊🛠️ Utilidades⌉ Veja informações ou liste os emojis do servidor e da Sistine.`,
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "lista",
      aliases: ["list", "listar", "ver", "todos", "all", "l"],
      description: "⌊🛠️ Utilidades⌉ Mostra a lista de emojis.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "escolha",
          type: ApplicationCommandOptionType.String,
          description: "Qual lista de emojis deseja visualizar",
          required: false,
          choices: [
            { name: "Servidor Atual", value: "servidor" },
            { name: "Todos (Sistine)", value: "todos" }
          ]
        }
      ]
    },
    {
      name: "informações",
      aliases: ["info", "informacoes", "infos", "i", "detalhes"],
      description: "⌊🛠️ Utilidades⌉ Veja informações detalhadas sobre um emoji.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "emoji",
          type: ApplicationCommandOptionType.String,
          description: "Mencione, cole ou digite o nome/ID do emoji.",
          required: true
        }
      ]
    }
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const embedColor = color?.embed || '#831396';
      const rawSub = interaction.options?.getSubcommand?.(false) || args?.[0] || 'lista';
      let subCommand = rawSub.toLowerCase();
      if (['info', 'informacoes', 'informações', 'infos', 'i', 'detalhes'].includes(subCommand)) {
        subCommand = 'informações';
      } else if (['lista', 'list', 'listar', 'ver', 'todos', 'all', 'l'].includes(subCommand)) {
        subCommand = 'lista';
      }

      switch (subCommand) {
        case 'lista': {
          const escolha = interaction.options?.getString?.('escolha') || 'servidor';
          const isGuildOnly = escolha === 'servidor';

          const targetEntity = isGuildOnly ? interaction.guild : client;
          const nomeOrigem = isGuildOnly ? interaction.guild.name : 'Todos os emojis da Sistine';
          const iconImg = isGuildOnly 
            ? interaction.guild.iconURL({ dynamic: true, size: 512 }) 
            : client.user.displayAvatarURL({ dynamic: true, size: 512 });

          const allEmojis = Array.from(targetEntity.emojis.cache.values());

          if (allEmojis.length === 0) {
            return interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setColor(embedColor)
                  .setTitle(`😀 Emojis — ${nomeOrigem}`)
                  .setDescription('Nenhum emoji personalizado foi encontrado neste escopo.')
              ]
            });
          }

          const pageSize = 30;
          let pagina = 1;
          const totalPages = Math.ceil(allEmojis.length / pageSize) || 1;

          function renderPage(page) {
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const pageEmojis = allEmojis.slice(start, end);
            const emojisContent = pageEmojis.map(e => `${e}`).join(' ') || 'Nenhum emoji nesta página.';

            return new EmbedBuilder()
              .setColor(embedColor)
              .setAuthor({ name: `${nomeOrigem} (${allEmojis.length} emojis)`, iconURL: iconImg || client.user.displayAvatarURL() })
              .setDescription(emojisContent)
              .setFooter({ text: `Página ${page} de ${totalPages} • Total: ${allEmojis.length} emojis` })
              .setTimestamp();
          }

          function getButtonsRow(page) {
            return new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("primeira")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⏪')
                .setDisabled(page <= 1),

              new ButtonBuilder()
                .setCustomId("anterior")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️')
                .setDisabled(page <= 1),

              new ButtonBuilder()
                .setCustomId("proxima")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('➡️')
                .setDisabled(page >= totalPages),

              new ButtonBuilder()
                .setCustomId("ultima")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⏩')
                .setDisabled(page >= totalPages)
            );
          }

          const initialEmbed = renderPage(pagina);
          const initialRow = getButtonsRow(pagina);

          const msg = await interaction.followUp({
            embeds: [initialEmbed],
            components: totalPages > 1 ? [initialRow] : [],
            fetchReply: true
          });

          if (totalPages <= 1 || !msg || !msg.createMessageComponentCollector) return;

          const collector = msg.createMessageComponentCollector({
            filter: x => x.user.id === interaction.user.id,
            time: 120000
          });

          collector.on('collect', async (i) => {
            try {
              await i.deferUpdate().catch(() => {});

              switch (i.customId) {
                case 'primeira':
                  pagina = 1;
                  break;
                case 'anterior':
                  if (pagina > 1) pagina--;
                  break;
                case 'proxima':
                  if (pagina < totalPages) pagina++;
                  break;
                case 'ultima':
                  pagina = totalPages;
                  break;
              }

              await msg.edit({
                embeds: [renderPage(pagina)],
                components: [getButtonsRow(pagina)]
              }).catch(() => {});

            } catch (err) {
              console.error('[emoji lista pagination error]', err);
            }
          });

          collector.on('end', async () => {
            try {
              const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("p1").setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                new ButtonBuilder().setCustomId("p2").setStyle(ButtonStyle.Secondary).setEmoji('⬅️').setDisabled(true),
                new ButtonBuilder().setCustomId("p3").setStyle(ButtonStyle.Secondary).setEmoji('➡️').setDisabled(true),
                new ButtonBuilder().setCustomId("p4").setStyle(ButtonStyle.Secondary).setEmoji('⏩').setDisabled(true)
              );
              await msg.edit({ components: [disabledRow] }).catch(() => {});
            } catch (_) {}
          });

          break;
        }

        case 'informações': {
          let emoteInput = interaction.options?.getString?.('emoji');
          if (!emoteInput && args && args.length > 0) {
            emoteInput = args[args[0] === 'informações' || args[0] === 'info' ? 1 : 0];
          }

          if (!emoteInput) {
            return interaction.error({ content: 'Você precisa informar o emoji que deseja consultar!' });
          }

          // Extrai o ID do emoji caso esteja no formato padrão <a:nome:id> ou <:nome:id>
          const customEmojiMatch = emoteInput.match(/^<a?:([a-zA-Z0-9_]+):([a-zA-Z0-9_]+)>$/);
          const rawIdMatch = emoteInput.match(/^(\d{17,20})$/);

          let foundEmoji = null;

          if (customEmojiMatch) {
            const emojiId = customEmojiMatch[2];
            const emojiName = customEmojiMatch[1].toLowerCase();
            const guildEmojis = Array.from(interaction.guild?.emojis?.cache?.values() || []);
            const clientEmojis = Array.from(client.emojis?.cache?.values() || []);
            foundEmoji = interaction.guild?.emojis?.cache?.get(emojiId) || client.emojis?.cache?.get(emojiId) ||
                         guildEmojis.find(e => e.name?.toLowerCase() === emojiName) ||
                         clientEmojis.find(e => e.name?.toLowerCase() === emojiName);
          } else if (rawIdMatch) {
            foundEmoji = interaction.guild?.emojis?.cache?.get(rawIdMatch[1]) || client.emojis?.cache?.get(rawIdMatch[1]);
          } else {
            // Tenta buscar por nome exato no servidor ou no bot
            const cleanName = emoteInput.replace(/[<>:]/g, '').toLowerCase();
            const guildEmojis = Array.from(interaction.guild?.emojis?.cache?.values() || []);
            const clientEmojis = Array.from(client.emojis?.cache?.values() || []);
            foundEmoji = guildEmojis.find(e => e.name?.toLowerCase() === cleanName) ||
                         clientEmojis.find(e => e.name?.toLowerCase() === cleanName);
          }

          // Se for um emoji customizado encontrado
          if (foundEmoji) {
            const link = foundEmoji.url;
            const createdTs = Math.floor(foundEmoji.createdTimestamp / 1000);

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setURL(link)
                .setLabel('Abrir Imagem Original')
                .setEmoji('🔗')
            );

            const embed = new EmbedBuilder()
              .setColor(embedColor)
              .setTitle(`🔎 Informações do Emoji: :${foundEmoji.name}:`)
              .setThumbnail(link)
              .addFields(
                { name: '😀・Visualização:', value: `${foundEmoji}`, inline: true },
                { name: '🏷️・Nome:', value: `\`${foundEmoji.name}\``, inline: true },
                { name: '👥・ID:', value: `\`${foundEmoji.id}\``, inline: true },
                { name: '💃・Animado:', value: foundEmoji.animated ? '`Sim`' : '`Não`', inline: true },
                { name: '🖥️・Servidor:', value: `\`${foundEmoji.guild?.name || 'Externo / Sistine'}\``, inline: true },
                { name: '🗓️・Criado em:', value: `<t:${createdTs}:D> (<t:${createdTs}:R>)`, inline: true }
              )
              .setFooter({ text: `Consultado por ${interaction.user.username}` })
              .setTimestamp();

            return interaction.followUp({ embeds: [embed], components: [row] });
          }

          // Se for emoji nativo Unicode do Discord (ex: 🔥, 👑, ⭐)
          const codePoints = Array.from(emoteInput).map(c => `U+${c.codePointAt(0).toString(16).toUpperCase()}`).join(' ');

          const unicodeEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`🔎 Emoji Unicode Nativo`)
            .setDescription(`O emoji **${emoteInput}** é um emoji padrão Unicode (não pertence a um servidor específico).`)
            .addFields(
              { name: '😀・Aparência:', value: `${emoteInput}`, inline: true },
              { name: '🔢・CodePoints:', value: `\`${codePoints}\``, inline: true }
            )
            .setFooter({ text: `Consultado por ${interaction.user.username}` })
            .setTimestamp();

          return interaction.followUp({ embeds: [unicodeEmbed] });
        }

        default:
          return interaction.error({ content: 'Subcomando inválido. Utilize `lista` ou `informações`.' });
      }

    } catch (error) {
      console.error('[emoji command error]', error);
      return interaction.error({ content: 'Ocorreu um erro inesperado ao executar o comando de emoji.' });
    }
  }
};