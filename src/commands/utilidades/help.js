const { 
  ApplicationCommandType, 
  ApplicationCommandOptionType, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder, 
  EmbedBuilder 
} = require('discord.js');

const { findSlashCommand, SLASH_ALIASES, SUBCOMMAND_ALIASES } = require('../../utils/commandBridge.js');

function cleanDesc(desc) {
  if (!desc) return 'Nenhuma descrição informada.';
  return desc.replace(/^⌊[^⌉]+⌉\s*/, '').replace(/^[🛠️⚙️💸🎰😂]\s*[a-zA-Záàâãéèêíïóôõöúçñ\s\-]+-\s*/i, '').trim();
}

const CATEGORIES = {
  utilidades: {
    name: 'Utilidades',
    emoji: '🛠️',
    description: 'Comandos informativos, estatísticas e utilidades para o servidor e usuários.'
  },
  economia: {
    name: 'Economia & Finanças',
    emoji: '💸',
    description: 'Sistema completo de moedas, trabalho diário/semanal, transferências, loja e mercado.'
  },
  apostas: {
    name: 'Apostas & Cassino',
    emoji: '🎰',
    description: 'Jogos de azar, blackjack, corrida de cavalos, caça-níqueis e disputas.'
  },
  modulos: {
    name: 'Módulos & RPG',
    emoji: '⚙️',
    description: 'Casamento, empregos, plantações, fazenda, perfis customizados e níveis.'
  }
};

module.exports = {
  name: "help",
  aliases: ["ajuda", "comandos", "menu", "h"],
  category: "utilidades",
  description: `⌊🛠️ Utilidades⌉ Veja todos os comandos ou informações sobre um comando específico.`,
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "comando",
      type: ApplicationCommandOptionType.String,
      description: "Digite o nome do comando para ver seus detalhes.",
      required: false,
    }
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const prefix = interaction.prefix || interaction.prefixo || '!';
      const embedColor = color?.embed || '#831396';

      // 1. Extrai o nome do comando se fornecido
      let comandoInput = interaction.options?.getString?.("comando");
      if (!comandoInput && args && args.length > 0) {
        comandoInput = args[0];
      }

      // Separa todos os comandos slash em suas categorias
      const groupedCommands = {
        utilidades: [],
        economia: [],
        apostas: [],
        modulos: []
      };

      if (client.slashCommands) {
        for (const [cmdName, cmdData] of client.slashCommands.entries()) {
          // Determina a categoria
          let cat = cmdData.category;
          if (!cat || !groupedCommands[cat]) {
            const desc = cmdData.description || '';
            if (desc.includes('Economia')) cat = 'economia';
            else if (desc.includes('Apostas')) cat = 'apostas';
            else if (desc.includes('Módulos') || desc.includes('Modulos')) cat = 'modulos';
            else cat = 'utilidades';
          }
          if (groupedCommands[cat] && !groupedCommands[cat].some(c => c.name === cmdData.name)) {
            groupedCommands[cat].push(cmdData);
          }
        }
      }

      // Ordena alfabeticamente
      for (const cat in groupedCommands) {
        groupedCommands[cat].sort((a, b) => a.name.localeCompare(b.name));
      }

      // =========================================================================
      // CASO 1: O usuário pediu detalhes de um comando específico (ex: !help saldo)
      // =========================================================================
      if (comandoInput) {
        const query = String(comandoInput).trim().toLowerCase();

        // Busca em slash commands, aliases do bridge, aliases do comando ou admin commands
        let targetCmd = client.slashCommands?.get(query) || findSlashCommand(query, client);
        
        let isAdminCmd = false;
        if (!targetCmd && client.commands) {
          targetCmd = client.commands.get(query) || client.commands.get(client.aliases?.get(query));
          if (targetCmd) isAdminCmd = true;
        }

        if (!targetCmd) {
          const notFoundEmbed = new EmbedBuilder()
            .setColor('#ff4a4a')
            .setTitle(`❌ Comando \`${query}\` não encontrado!`)
            .setDescription(
              `Não encontrei nenhum comando com este nome ou alias.\n\n` +
              `💡 **Dica:** Digite apenas \`${prefix}help\` para abrir o painel com todos os comandos disponíveis!`
            )
            .setFooter({ text: 'Central de Ajuda Sistine' });

          return interaction.followUp({ embeds: [notFoundEmbed] });
        }

        const cmdName = targetCmd.name;
        const rawDesc = targetCmd.description || 'Sem descrição cadastrada.';
        const cleanDescription = cleanDesc(rawDesc);

        // Agrupa aliases conhecidos para esse comando
        const foundAliases = [];
        if (targetCmd.aliases && Array.isArray(targetCmd.aliases)) {
          foundAliases.push(...targetCmd.aliases);
        }
        for (const [alias, canonical] of Object.entries(SLASH_ALIASES)) {
          if (canonical === cmdName && !foundAliases.includes(alias)) {
            foundAliases.push(alias);
          }
        }

        // Descobre argumentos / opções para montar a sintaxe
        let usageArgsPrefix = '';
        let optionsList = [];

        if (targetCmd.options && Array.isArray(targetCmd.options)) {
          for (const opt of targetCmd.options) {
            // Se for subcomando
            if (opt.type === 1 || opt.type === 'SUB_COMMAND') {
              let subArgs = '';
              if (opt.options && Array.isArray(opt.options)) {
                subArgs = opt.options.map(o => o.required ? `<${o.name}>` : `[${o.name}]`).join(' ');
              }

              // Recupera aliases do subcomando
              const subAliases = (opt.aliases && Array.isArray(opt.aliases) ? opt.aliases : null) ||
                SUBCOMMAND_ALIASES[cmdName]?.[opt.name] ||
                SUBCOMMAND_ALIASES._common?.[opt.name] || [];

              const aliasesStr = subAliases.length > 0
                ? ` *(atalhos: ${subAliases.map(a => `\`${a}\``).join(', ')})*`
                : '';

              optionsList.push(`• \`${prefix}${cmdName} ${opt.name}${subArgs ? ' ' + subArgs : ''}\`${aliasesStr}\n  ↳ *${cleanDesc(opt.description)}*`);
            } else {
              const argStr = opt.required ? `<${opt.name}>` : `[${opt.name}]`;
              usageArgsPrefix += ` ${argStr}`;
              optionsList.push(`• \`${opt.name}\` (${opt.required ? 'Obrigatório' : 'Opcional'}) — ${cleanDesc(opt.description)}`);
            }
          }
        }

        let catInfo = CATEGORIES[targetCmd.category] || (isAdminCmd ? { name: 'Administração', emoji: '👑' } : { name: 'Geral', emoji: '📌' });

        const detailEmbed = new EmbedBuilder()
          .setColor(embedColor)
          .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
          .setTitle(`${catInfo.emoji} Detalhes do Comando: \`${cmdName}\``)
          .setDescription(`*${cleanDescription}*`)
          .addFields(
            { name: '📁・Categoria:', value: `\`${catInfo.name}\``, inline: true },
            { name: '🔀・Atalhos / Aliases:', value: foundAliases.length > 0 ? foundAliases.map(a => `\`${a}\``).join(', ') : '`Nenhum`', inline: true },
            { name: '💻・Uso via Prefixo:', value: `\`${prefix}${cmdName}${usageArgsPrefix.trim() ? ' ' + usageArgsPrefix.trim() : ''}\``, inline: false },
            { name: '⚡・Uso via Slash Command:', value: `\`/${cmdName}\``, inline: false }
          );

        if (optionsList.length > 0) {
          detailEmbed.addFields({
            name: '⚙️・Subcomandos e Argumentos:',
            value: optionsList.slice(0, 8).join('\n') + (optionsList.length > 8 ? `\n*...e mais ${optionsList.length - 8} opções.*` : ''),
            inline: false
          });
        }

        detailEmbed.setFooter({ text: `Prefixo neste servidor: ${prefix} • Sistine Bot` }).setTimestamp();

        return interaction.followUp({ embeds: [detailEmbed] });
      }

      // =========================================================================
      // CASO 2: Painel Geral com todos os comandos por prefixo e interativo
      // =========================================================================

      function buildHomeEmbed() {
        const totalCmds = Object.values(groupedCommands).reduce((acc, arr) => acc + arr.length, 0);

        return new EmbedBuilder()
          .setColor(embedColor)
          .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
          .setTitle(`📖 Painel de Comandos — ${client.user.username}`)
          .setDescription(
            `Olá **${interaction.user.username}**, seja bem-vindo(a) à central de comandos!\n` +
            `Aqui você pode visualizar todos os comandos disponíveis organizados por categorias.\n\n` +
            `📌 **Prefixo no servidor:** \`${prefix}\` *(ou utilize via Slash \`/comando\`)*\n` +
            `🔍 **Ver detalhes de um comando:** \`${prefix}help <comando>\`\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
          )
          .addFields(
            {
              name: `🛠️・Utilidades (${groupedCommands.utilidades.length})`,
              value: groupedCommands.utilidades.length > 0
                ? groupedCommands.utilidades.map(c => `\`${prefix}${c.name}\``).join(' ')
                : '`Nenhum comando`',
              inline: false
            },
            {
              name: `💸・Economia & Finanças (${groupedCommands.economia.length})`,
              value: groupedCommands.economia.length > 0
                ? groupedCommands.economia.map(c => `\`${prefix}${c.name}\``).join(' ')
                : '`Nenhum comando`',
              inline: false
            },
            {
              name: `🎰・Apostas & Cassino (${groupedCommands.apostas.length})`,
              value: groupedCommands.apostas.length > 0
                ? groupedCommands.apostas.map(c => `\`${prefix}${c.name}\``).join(' ')
                : '`Nenhum comando`',
              inline: false
            },
            {
              name: `⚙️・Módulos & RPG (${groupedCommands.modulos.length})`,
              value: groupedCommands.modulos.length > 0
                ? groupedCommands.modulos.map(c => `\`${prefix}${c.name}\``).join(' ')
                : '`Nenhum comando`',
              inline: false
            }
          )
          .setFooter({ 
            text: `Total de ${totalCmds} comandos • Selecione uma categoria abaixo para detalhes`, 
            iconURL: client.user.displayAvatarURL() 
          })
          .setTimestamp();
      }

      function buildCategoryEmbed(categoryKey) {
        const catInfo = CATEGORIES[categoryKey];
        const cmds = groupedCommands[categoryKey] || [];

        const embed = new EmbedBuilder()
          .setColor(embedColor)
          .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
          .setTitle(`${catInfo.emoji} Categoria: ${catInfo.name}`)
          .setDescription(
            `${catInfo.description}\n\n` +
            `💡 **Dica:** Para detalhes completos e opções, digite: \`${prefix}help <comando>\`\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
          );

        if (cmds.length === 0) {
          embed.addFields({ name: 'Nenhum comando', value: 'Nenhum comando disponível nesta categoria no momento.' });
        } else {
          // Lista cada comando com sintaxe de prefixo e descrição limpa
          const formattedCmds = cmds.map(c => {
            const shortDesc = cleanDesc(c.description);
            return `> \`${prefix}${c.name}\` — ${shortDesc}`;
          });

          // Divide em blocos se for muito grande
          const chunkSize = 12;
          for (let i = 0; i < formattedCmds.length; i += chunkSize) {
            const chunk = formattedCmds.slice(i, i + chunkSize);
            embed.addFields({
              name: i === 0 ? `Comandos Disponíveis (${cmds.length}):` : 'Continuação:',
              value: chunk.join('\n'),
              inline: false
            });
          }
        }

        embed.setFooter({ text: `Prefixo: ${prefix} • Use o menu abaixo para navegar entre as categorias` }).setTimestamp();
        return embed;
      }

      // Constrói os componentes do painel
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('help_category_select')
        .setPlaceholder('Escolha uma categoria para ver os comandos...')
        .addOptions([
          {
            label: 'Início / Todos os Comandos',
            value: 'home',
            description: 'Volta para a visão geral de todos os comandos',
            emoji: '🏠'
          },
          {
            label: 'Utilidades',
            value: 'utilidades',
            description: `${groupedCommands.utilidades.length} comandos de informações e utilitários`,
            emoji: '🛠️'
          },
          {
            label: 'Economia & Finanças',
            value: 'economia',
            description: `${groupedCommands.economia.length} comandos de dinheiro, loja, banco e mercado`,
            emoji: '💸'
          },
          {
            label: 'Apostas & Jogos',
            value: 'apostas',
            description: `${groupedCommands.apostas.length} minijogos de azar, cassino e disputas`,
            emoji: '🎰'
          },
          {
            label: 'Módulos & RPG',
            value: 'modulos',
            description: `${groupedCommands.modulos.length} comandos de casamento, fazenda, empregos e perfil`,
            emoji: '⚙️'
          }
        ]);

      const menuRow = new ActionRowBuilder().addComponents(selectMenu);

      const buttonsRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setURL(client.config?.SUPPORT_LINK || 'https://discord.gg/sistine')
          .setLabel('Servidor de Suporte')
          .setEmoji('💬'),

        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
          .setLabel('Me Adicione')
          .setEmoji('✨')
      );

      const mainEmbed = buildHomeEmbed();
      const responseMessage = await interaction.followUp({
        embeds: [mainEmbed],
        components: [menuRow, buttonsRow],
        fetchReply: true
      });

      if (!responseMessage || !responseMessage.createMessageComponentCollector) {
        return;
      }

      // Coletor para navegação interativa no menu
      const collector = responseMessage.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 120000 // 2 minutos
      });

      collector.on('collect', async (i) => {
        try {
          if (!i.isStringSelectMenu()) return;
          await i.deferUpdate().catch(() => {});

          const selectedValue = i.values[0];
          let updatedEmbed;

          if (selectedValue === 'home') {
            updatedEmbed = buildHomeEmbed();
          } else if (CATEGORIES[selectedValue]) {
            updatedEmbed = buildCategoryEmbed(selectedValue);
          } else {
            updatedEmbed = buildHomeEmbed();
          }

          await responseMessage.edit({
            embeds: [updatedEmbed],
            components: [menuRow, buttonsRow]
          }).catch(() => {});

        } catch (colErr) {
          console.error('[help collector error]', colErr);
        }
      });

      collector.on('end', async () => {
        try {
          // Desabilita o menu de seleção ao expirar o tempo
          selectMenu.setDisabled(true);
          const disabledRow = new ActionRowBuilder().addComponents(selectMenu);
          await responseMessage.edit({
            components: [disabledRow, buttonsRow]
          }).catch(() => {});
        } catch (_) {}
      });

    } catch (error) {
      console.error('[help command error]', error);
      return interaction.error({ content: `Ocorreu um erro ao gerar o painel de ajuda.` });
    }
  }
};