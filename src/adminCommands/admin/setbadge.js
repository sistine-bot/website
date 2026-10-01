const { EmbedBuilder } = require('discord.js');
const { getUser, isStaff } = require('../../utils/functions/index.js');
const { 
  getAllBadges, 
  findBadge, 
  saveBadgeToDb, 
  deleteBadgeFromDb, 
  toggleGlobalBadge, 
  giveUserBadge, 
  giveAllBadgesToUser, 
  removeUserBadge, 
  removeAllBadgesFromUser, 
  setUserBadgeActive 
} = require('../../utils/managers/badgeManager.js');

module.exports = {
  name: "badge",
  aliases: ["badgeconfig", "badgeadm", "badgemanager", "managebadge", "editarbadge", "setbadge", "badgesadm"],
  description: "Gerencia, cria, edita, concede, remove e ativa/desativa insígnias no sistema do bot via banco de dados.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar comandos administrativos de badges.`
        });
      }

      const showHelp = () => {
        const helpEmbed = new EmbedBuilder()
          .setColor(color.embed || '#831396')
          .setTitle('🏅 Central Administrativa de Badges (Insígnias)')
          .setDescription(
            `Gerencie o sistema modular de insígnias configuradas no banco de dados.\n\n` +
            `📖 **Comandos Disponíveis:**\n\n` +
            `🎁 **Conceder & Remover:**\n` +
            `> \`${prefixo}setbadge dar <@user> <id_ou_nome>\` - Concede uma badge a um usuário.\n` +
            `> \`${prefixo}setbadge dar <@user> all\` - Concede TODAS as badges ao usuário (Dev Unlock transparente!).\n` +
            `> \`${prefixo}setbadge remover <@user> <id_ou_nome>\` - Remove uma badge de um usuário.\n` +
            `> \`${prefixo}setbadge remover <@user> all\` - Remove todas as badges concedidas do usuário.\n\n` +
            `⚡ **Ativação Global & Usuário:**\n` +
            `> \`${prefixo}setbadge ativar <id_da_badge>\` - Ativa uma badge globalmente no bot.\n` +
            `> \`${prefixo}setbadge desativar <id_da_badge>\` - Desativa uma badge globalmente no bot.\n` +
            `> \`${prefixo}setbadge userativar <@user> <id>\` - Força ativação (equipar) no perfil do usuário.\n` +
            `> \`${prefixo}setbadge userdesativar <@user> <id>\` - Força desativação no perfil do usuário.\n\n` +
            `🛠️ **Criação & Edição Modular (DB):**\n` +
            `> \`${prefixo}setbadge criar <id> <nome> | <descrição> | <icone_url> | [bot|discord]\`\n` +
            `> \`${prefixo}setbadge editar <id> <nome|desc|icone|tipo> <novo valor>\`\n` +
            `> \`${prefixo}setbadge excluir <id>\` - Remove a badge do banco de dados.\n\n` +
            `📋 **Consulta:**\n` +
            `> \`${prefixo}setbadge list [bot|discord|todos]\` - Lista todas as badges do sistema.\n` +
            `> \`${prefixo}setbadge info <id_ou_nome>\` - Mostra detalhes completos de uma badge.`
          )
          .setFooter({ text: 'Sistine Badge Engine • Totalmente integrado ao Firebase Realtime Database' })
          .setTimestamp();

        return message.reply({ embeds: [helpEmbed] });
      };

      if (!args[0]) {
        return showHelp();
      }

      const subCommand = args[0].toLowerCase();

      // =========================================================================
      // 1. CONCEDER BADGE(S) (DAR / GIVE / ADD)
      // =========================================================================
      if (['dar', 'give', 'add', 'conceder', 'liberar'].includes(subCommand)) {
        if (!args[1] || !args[2]) {
          return message.reply({
            content: `${emoji.aviso || '⚠️'} **|** Uso: \`${prefixo}setbadge dar <@usuário/ID> <id_da_badge | all>\``
          });
        }

        const targetUser = getUser(message, args[1]);
        if (!targetUser || !targetUser.id) {
          return message.reply({ content: `${emoji.negativo || '❌'} **|** Usuário não encontrado ou ID inválido.` });
        }

        const badgeArg = args.slice(2).join(' ').trim();

        // Conceder TODAS as badges (Dev Unlock transparente!)
        if (['all', 'todos', 'tudo', 'todas'].includes(badgeArg.toLowerCase())) {
          await giveAllBadgesToUser(database, targetUser.id);

          const embedAll = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('✨ Todas as Badges Concedidas!')
            .setDescription(
              `Todas as insígnias cadastradas no sistema foram liberadas no banco de dados para <@${targetUser.id}>!\n\n` +
              `👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
              `🛡️ **Staff Responsável:** <@${message.author.id}>\n` +
              `💡 As badges foram salvas em \`customUnlocked\` e podem ser equipadas/desequipadas a qualquer momento.`
            )
            .setFooter({ text: 'Sistine Modular Badge Engine' })
            .setTimestamp();

          return message.reply({ embeds: [embedAll] });
        }

        // Conceder uma badge específica
        const badge = await findBadge(badgeArg, database, true);
        if (!badge) {
          return message.reply({
            content: `${emoji.negativo || '❌'} **|** Nenhuma badge encontrada correspondente a: \`${badgeArg}\`.\n💡 Use \`${prefixo}setbadge list\` para ver todas as badges cadastradas.`
          });
        }

        await giveUserBadge(database, targetUser.id, badge.id);

        const embedSuccess = new EmbedBuilder()
          .setColor('#10b981')
          .setTitle('🏅 Badge Concedida com Sucesso!')
          .setDescription(
            `A insígnia **${badge.name}** foi concedida para <@${targetUser.id}>!\n\n` +
            `🔑 **ID:** \`${badge.id}\`\n` +
            `📝 **Descrição:** ${badge.description || 'Sem descrição'}\n` +
            `🏷️ **Tipo:** \`${badge.type || 'bot'}\`\n` +
            `👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
            `🛡️ **Staff:** <@${message.author.id}>`
          )
          .setFooter({ text: 'Sistine Modular Badge Engine • Salvo no DB' })
          .setTimestamp();

        return message.reply({ embeds: [embedSuccess] });
      }

      // =========================================================================
      // 2. REMOVER BADGE(S) (REMOVER / DEL / DELETE)
      // =========================================================================
      if (['remover', 'del', 'delete', 'tirar', 'remove'].includes(subCommand)) {
        if (!args[1] || !args[2]) {
          return message.reply({
            content: `${emoji.aviso || '⚠️'} **|** Uso: \`${prefixo}setbadge remover <@usuário/ID> <id_da_badge | all>\``
          });
        }

        const targetUser = getUser(message, args[1]);
        if (!targetUser || !targetUser.id) {
          return message.reply({ content: `${emoji.negativo || '❌'} **|** Usuário não encontrado ou ID inválido.` });
        }

        const badgeArg = args.slice(2).join(' ').trim();

        // Remover TODAS as badges
        if (['all', 'todos', 'tudo', 'todas'].includes(badgeArg.toLowerCase())) {
          await removeAllBadgesFromUser(database, targetUser.id);

          const embedClear = new EmbedBuilder()
            .setColor('#ef4444')
            .setTitle('🗑️ Todas as Badges Concedidas Removidas!')
            .setDescription(
              `Todas as insígnias concedidas via customUnlocked foram removidas de <@${targetUser.id}>!\n\n` +
              `👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
              `🛡️ **Staff Responsável:** <@${message.author.id}>`
            )
            .setFooter({ text: 'Sistine Modular Badge Engine' })
            .setTimestamp();

          return message.reply({ embeds: [embedClear] });
        }

        // Remover badge específica
        const badge = await findBadge(badgeArg, database, true);
        const badgeIdToRemove = badge ? badge.id : badgeArg.trim().toLowerCase();

        await removeUserBadge(database, targetUser.id, badgeIdToRemove);

        const embedRemoved = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle('🗑️ Badge Removida!')
          .setDescription(
            `A insígnia foi removida da conta de <@${targetUser.id}>!\n\n` +
            `🔑 **ID:** \`${badgeIdToRemove}\`\n` +
            (badge ? `🏷️ **Nome:** **${badge.name}**\n` : '') +
            `👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
            `🛡️ **Staff:** <@${message.author.id}>`
          )
          .setFooter({ text: 'Sistine Modular Badge Engine • Atualizado no DB' })
          .setTimestamp();

        return message.reply({ embeds: [embedRemoved] });
      }

      // =========================================================================
      // 3. ATIVAR GLOBALMENTE NO SISTEMA
      // =========================================================================
      if (['ativar', 'enable', 'habilitar'].includes(subCommand)) {
        if (!args[1]) {
          return message.reply({ content: `${emoji.aviso || '⚠️'} **|** Uso: \`${prefixo}setbadge ativar <id_da_badge>\`` });
        }

        const badgeQuery = args.slice(1).join(' ').trim();
        const badge = await findBadge(badgeQuery, database, true);
        if (!badge) {
          return message.reply({ content: `${emoji.negativo || '❌'} **|** Badge não encontrada: \`${badgeQuery}\`` });
        }

        await toggleGlobalBadge(database, badge.id, true);

        return message.reply({
          content: `${emoji.positivo || '✅'} **|** A insígnia **${badge.name}** (\`${badge.id}\`) foi **ATIVADA globalmente** no sistema via banco de dados.`
        });
      }

      // =========================================================================
      // 4. DESATIVAR GLOBALMENTE NO SISTEMA
      // =========================================================================
      if (['desativar', 'disable', 'desabilitar'].includes(subCommand)) {
        if (!args[1]) {
          return message.reply({ content: `${emoji.aviso || '⚠️'} **|** Uso: \`${prefixo}setbadge desativar <id_da_badge>\`` });
        }

        const badgeQuery = args.slice(1).join(' ').trim();
        const badge = await findBadge(badgeQuery, database, true);
        if (!badge) {
          return message.reply({ content: `${emoji.negativo || '❌'} **|** Badge não encontrada: \`${badgeQuery}\`` });
        }

        await toggleGlobalBadge(database, badge.id, false);

        return message.reply({
          content: `${emoji.positivo || '✅'} **|** A insígnia **${badge.name}** (\`${badge.id}\`) foi **DESATIVADA globalmente** no sistema. Ela não aparecerá nos perfis até ser reativada.`
        });
      }

      // =========================================================================
      // 5. ATIVAR/DESATIVAR NO PERFIL DE UM USUÁRIO (USERATIVAR / USERDESATIVAR)
      // =========================================================================
      if (['userativar', 'equipar', 'userequip'].includes(subCommand)) {
        if (!args[1] || !args[2]) {
          return message.reply({ content: `${emoji.aviso || '⚠️'} **|** Uso: \`${prefixo}setbadge userativar <@user> <id_da_badge>\`` });
        }

        const targetUser = getUser(message, args[1]);
        if (!targetUser) return message.reply({ content: `${emoji.negativo || '❌'} **|** Usuário não encontrado.` });

        const badgeQuery = args.slice(2).join(' ').trim();
        const badge = await findBadge(badgeQuery, database, true);
        const bId = badge ? badge.id : badgeQuery;

        await setUserBadgeActive(database, targetUser.id, bId, true);

        return message.reply({
          content: `${emoji.positivo || '✅'} **|** A insígnia \`${bId}\` foi **ativada (equipada)** no perfil de <@${targetUser.id}>.`
        });
      }

      if (['userdesativar', 'desequipar', 'userunequip'].includes(subCommand)) {
        if (!args[1] || !args[2]) {
          return message.reply({ content: `${emoji.aviso || '⚠️'} **|** Uso: \`${prefixo}setbadge userdesativar <@user> <id_da_badge>\`` });
        }

        const targetUser = getUser(message, args[1]);
        if (!targetUser) return message.reply({ content: `${emoji.negativo || '❌'} **|** Usuário não encontrado.` });

        const badgeQuery = args.slice(2).join(' ').trim();
        const badge = await findBadge(badgeQuery, database, true);
        const bId = badge ? badge.id : badgeQuery;

        await setUserBadgeActive(database, targetUser.id, bId, false);

        return message.reply({
          content: `${emoji.positivo || '✅'} **|** A insígnia \`${bId}\` foi **desativada (oculta)** do perfil de <@${targetUser.id}>.`
        });
      }

      // =========================================================================
      // 6. CRIAR NOVA BADGE NO BANCO DE DADOS (MODULAR)
      // =========================================================================
      if (['criar', 'create', 'nova', 'addbadge'].includes(subCommand)) {
        // Formato esperado: !setbadge criar <id> <nome> | <descrição> | <icone_url> | [bot|discord]
        const fullArgs = args.slice(1).join(' ');
        const parts = fullArgs.split('|').map(s => s.trim());

        if (parts.length < 3) {
          return message.reply({
            content: `${emoji.aviso || '⚠️'} **|** Formato de criação incorreto!\n` +
              `> **Uso:** \`${prefixo}setbadge criar <id> <nome> | <descrição> | <icone_url_ou_caminho> | [bot|discord]\`\n\n` +
              `💡 **Exemplo:**\n` +
              `\`${prefixo}setbadge criar campeao Campeão de Eventos | Vencedor oficial dos torneios da Sistine | https://i.imgur.com/exemplo.png | bot\``
          });
        }

        const firstPart = parts[0].split(' ');
        const id = firstPart[0].toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
        const name = firstPart.slice(1).join(' ').trim() || id;
        const description = parts[1] || 'Sem descrição.';
        const icon = parts[2] || '/src/utils/assets/badges/diamond_badge.png';
        const type = parts[3] ? (parts[3].toLowerCase() === 'discord' ? 'discord' : 'bot') : 'bot';

        if (!id) {
          return message.reply({ content: `${emoji.negativo || '❌'} **|** ID da badge inválido.` });
        }

        const newBadgeData = {
          id,
          name,
          description,
          icon,
          type,
          category: type,
          enabled: true,
          priority: 80,
          createdAt: Date.now()
        };

        await saveBadgeToDb(database, newBadgeData);

        const embedCreated = new EmbedBuilder()
          .setColor('#10b981')
          .setTitle('✨ Nova Badge Criada no Banco de Dados!')
          .setDescription(
            `A nova insígnia foi registrada com sucesso e já está disponível em todo o bot e dashboard!\n\n` +
            `🔑 **ID:** \`${id}\`\n` +
            `🏷️ **Nome:** **${name}**\n` +
            `📝 **Descrição:** ${description}\n` +
            `🖼️ **Ícone:** \`${icon}\`\n` +
            `📂 **Tipo:** \`${type}\`\n` +
            `🟢 **Status:** Ativada`
          )
          .setFooter({ text: 'Sistine Modular Badge Engine • Salvo em Administração/Badges' })
          .setTimestamp();

        return message.reply({ embeds: [embedCreated] });
      }

      // =========================================================================
      // 7. EDITAR BADGE NO BANCO DE DADOS
      // =========================================================================
      if (['editar', 'edit', 'configurar'].includes(subCommand)) {
        if (!args[1] || !args[2] || !args[3]) {
          return message.reply({
            content: `${emoji.aviso || '⚠️'} **|** Uso: \`${prefixo}setbadge editar <id> <nome|desc|icone|tipo> <novo valor>\``
          });
        }

        const targetId = args[1].toLowerCase().trim();
        const field = args[2].toLowerCase().trim();
        const newValue = args.slice(3).join(' ').trim();

        const badge = await findBadge(targetId, database, true);
        if (!badge) {
          return message.reply({ content: `${emoji.negativo || '❌'} **|** Badge não encontrada: \`${targetId}\`` });
        }

        const updatedData = { ...badge };

        if (['nome', 'name'].includes(field)) {
          updatedData.name = newValue;
        } else if (['desc', 'descricao', 'descrição', 'description'].includes(field)) {
          updatedData.description = newValue;
        } else if (['icone', 'icon', 'url', 'imagem'].includes(field)) {
          updatedData.icon = newValue;
        } else if (['tipo', 'type', 'cat', 'categoria'].includes(field)) {
          updatedData.type = newValue.toLowerCase() === 'discord' ? 'discord' : 'bot';
          updatedData.category = updatedData.type;
        } else {
          return message.reply({
            content: `${emoji.negativo || '❌'} **|** Campo inválido! Use: \`nome\`, \`desc\`, \`icone\` ou \`tipo\`.`
          });
        }

        await saveBadgeToDb(database, updatedData);

        return message.reply({
          content: `${emoji.positivo || '✅'} **|** Badge **${badge.name}** (\`${badge.id}\`) atualizada com sucesso!\n` +
            `> Campo **${field}** alterado para: \`${newValue}\``
        });
      }

      // =========================================================================
      // 8. EXCLUIR BADGE DO BANCO DE DADOS
      // =========================================================================
      if (['excluir', 'delete', 'deletar', 'removerbadge'].includes(subCommand)) {
        if (!args[1]) {
          return message.reply({ content: `${emoji.aviso || '⚠️'} **|** Uso: \`${prefixo}setbadge excluir <id_da_badge>\`` });
        }

        const targetId = args[1].toLowerCase().trim();
        const badge = await findBadge(targetId, database, true);
        if (!badge) {
          return message.reply({ content: `${emoji.negativo || '❌'} **|** Badge não encontrada: \`${targetId}\`` });
        }

        await deleteBadgeFromDb(database, badge.id);

        return message.reply({
          content: `${emoji.positivo || '✅'} **|** A badge **${badge.name}** (\`${badge.id}\`) foi excluída do banco de dados.`
        });
      }

      // =========================================================================
      // 9. LISTAR TODAS AS BADGES (LIST)
      // =========================================================================
      if (['list', 'listar', 'all'].includes(subCommand)) {
        const filter = args[1] ? args[1].toLowerCase() : 'todos';
        const allBadges = await getAllBadges(database, true);
        let list = Object.values(allBadges);

        if (['bot'].includes(filter)) {
          list = list.filter(b => b.type === 'bot');
        } else if (['discord'].includes(filter)) {
          list = list.filter(b => b.type === 'discord');
        }

        const activeCount = list.filter(b => b.enabled !== false).length;
        const disabledCount = list.filter(b => b.enabled === false).length;

        const lines = list.map(b => {
          const statusIcon = b.enabled !== false ? '🟢' : '🔴';
          const typeTag = b.type === 'discord' ? '`Discord`' : '`Bot`';
          return `${statusIcon} **${b.name}** (\`${b.id}\`) — ${typeTag}`;
        });

        // Pagina de 20 em 20 linhas para caber com folga no embed
        const pageSize = 20;
        const totalPages = Math.ceil(lines.length / pageSize) || 1;
        const page = 1;
        const pageLines = lines.slice((page - 1) * pageSize, page * pageSize);

        const embedList = new EmbedBuilder()
          .setColor(color.embed || '#831396')
          .setTitle('🏅 Catálogo Geral de Badges do Sistema')
          .setDescription(
            `Total de Badges: **${list.length}** | 🟢 Ativas: **${activeCount}** | 🔴 Desativadas: **${disabledCount}**\n\n` +
            pageLines.join('\n') +
            (totalPages > 1 ? `\n\n*(Exibindo página 1 de ${totalPages}. Total de ${list.length} badges)*` : '')
          )
          .setFooter({ text: `Uso: ${prefixo}setbadge info <id> para ver detalhes` })
          .setTimestamp();

        return message.reply({ embeds: [embedList] });
      }

      // =========================================================================
      // 10. DETALHES DE UMA BADGE (INFO)
      // =========================================================================
      if (['info', 'view', 'detalhes'].includes(subCommand)) {
        if (!args[1]) {
          return message.reply({ content: `${emoji.aviso || '⚠️'} **|** Uso: \`${prefixo}setbadge info <id_ou_nome>\`` });
        }

        const query = args.slice(1).join(' ').trim();
        const badge = await findBadge(query, database, true);
        if (!badge) {
          return message.reply({ content: `${emoji.negativo || '❌'} **|** Badge não encontrada: \`${query}\`` });
        }

        const embedInfo = new EmbedBuilder()
          .setColor(badge.enabled !== false ? '#10b981' : '#ef4444')
          .setTitle(`🏅 Informações da Badge: ${badge.name}`)
          .setDescription(
            `🔑 **ID:** \`${badge.id}\`\n` +
            `📝 **Descrição:** ${badge.description || 'Sem descrição'}\n` +
            `🏷️ **Tipo:** \`${badge.type || 'bot'}\`\n` +
            `📂 **Categoria:** \`${badge.category || badge.type || 'bot'}\`\n` +
            `🟢 **Status Global:** ${badge.enabled !== false ? 'Ativada no Sistema' : 'Desativada Globalmente'}\n` +
            `🖼️ **Caminho/URL do Ícone:** \`${badge.icon || 'Nenhum'}\`\n` +
            (badge.isTiered ? `⭐ **Possui Níveis:** Sim (${badge.levels?.length || 0} níveis)\n` : '') +
            (badge.requires ? `🔒 **Condição Automática:** \`${badge.requires}\`\n` : '')
          )
          .setFooter({ text: 'Sistine Badge Engine' })
          .setTimestamp();

        return message.reply({ embeds: [embedInfo] });
      }

      return showHelp();

    } catch (error) {
      console.error('[Command setbadge error]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao processar o comando de administração de badges:\n\`\`\`js\n${error.message || error}\n\`\`\``
      });
    }
  }
};
