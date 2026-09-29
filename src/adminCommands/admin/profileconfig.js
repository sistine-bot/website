const { EmbedBuilder } = require('discord.js');
const { getUser, isStaff } = require('../../utils/functions.js');
const { BACKGROUNDS_CATALOG, LAYOUTS_CATALOG, getBackgroundById, getLayoutById } = require('../../utils/shopCatalog.js');

/**
 * Função de busca inteligente de itens nos catálogos de Wallpapers e Layouts
 * @param {string} query Termo de busca (nome ou ID)
 * @param {'background' | 'layout' | null} typeFilter Filtro opcional de categoria
 */
function findprofileconfig(query, typeFilter = null) {
  if (!query) return null;
  const rawQuery = String(query).trim().toLowerCase();
  const normalizedQuery = rawQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const idFormattedQuery = normalizedQuery.replace(/\s+/g, '_');
  const spaceFormattedQuery = normalizedQuery.replace(/_/g, ' ');

  const candidates = [];
  if (!typeFilter || typeFilter === 'background') {
    BACKGROUNDS_CATALOG.forEach(b => candidates.push({ ...b, itemType: 'background' }));
  }
  if (!typeFilter || typeFilter === 'layout') {
    LAYOUTS_CATALOG.forEach(l => candidates.push({ ...l, itemType: 'layout' }));
  }

  // 1. Mapeamento de sinônimos/atalhos comuns de cores para layouts
  const colorMap = {
    // Cores originais (Clássico)
    'azul': 'classic_azul',
    'branco': 'classic_branco',
    'laranja': 'classic_laranja',
    'preto': 'classic_preto',
    'dark': 'classic_preto',
    'verde': 'classic_verde',
    'vermelho': 'classic_vermelho',
    'roxo': 'classic_roxo',

    // Novas cores (Clássico)
    'rosa': 'classic_rosa',
    'sakura': 'classic_rosa',
    'ciano': 'classic_ciano',
    'glacial': 'classic_ciano',
    'dourado': 'classic_dourado',
    'solar': 'classic_dourado',
    'magenta': 'classic_magenta',
    'lima': 'classic_lima',
    'verde lima': 'classic_lima',
    'vinho': 'classic_vinho',
    'carmim': 'classic_vinho',
    'prata': 'classic_prata',
    'grafite': 'classic_prata',
    'indigo': 'classic_indigo',

    // Prestígio
    'cyberpunk': 'cyberpunk_neon',
    'neon': 'cyberpunk_neon',
    'ouro': 'vip_gold_frame',
    'gold': 'vip_gold_frame',
    'imperial': 'vip_gold_frame',

    // Layouts Modernos Inferiores (Originais)
    'inferior azul': 'embaixo_azul',
    'moderno azul': 'embaixo_azul',
    'embaixo azul': 'embaixo_azul',
    'inferior preto': 'embaixo_preto',
    'moderno preto': 'embaixo_preto',
    'embaixo preto': 'embaixo_preto',
    'inferior roxo': 'embaixo_roxo',
    'moderno roxo': 'embaixo_roxo',
    'inferior branco': 'embaixo_branco',
    'moderno branco': 'embaixo_branco',
    'inferior vermelho': 'embaixo_vermelho',
    'moderno vermelho': 'embaixo_vermelho',
    'inferior verde': 'embaixo_verde',
    'moderno verde': 'embaixo_verde',
    'inferior laranja': 'embaixo_laranja',
    'moderno laranja': 'embaixo_laranja',

    // Layouts Modernos Inferiores (Novas cores)
    'inferior rosa': 'embaixo_rosa',
    'moderno rosa': 'embaixo_rosa',
    'inferior ciano': 'embaixo_ciano',
    'moderno ciano': 'embaixo_ciano',
    'inferior dourado': 'embaixo_dourado',
    'moderno dourado': 'embaixo_dourado',
    'inferior magenta': 'embaixo_magenta',
    'moderno magenta': 'embaixo_magenta',
    'inferior lima': 'embaixo_lima',
    'moderno lima': 'embaixo_lima',
    'inferior vinho': 'embaixo_vinho',
    'moderno vinho': 'embaixo_vinho',
    'inferior prata': 'embaixo_prata',
    'moderno prata': 'embaixo_prata',
    'inferior indigo': 'embaixo_indigo',
    'moderno indigo': 'embaixo_indigo'
  };

  if ((!typeFilter || typeFilter === 'layout') && colorMap[normalizedQuery]) {
    const matchedLayout = candidates.find(item => item.itemType === 'layout' && item.id === colorMap[normalizedQuery]);
    if (matchedLayout) return matchedLayout;
  }

  // Atalhos para wallpapers comuns
  const bgAliasMap = {
    'padrao': 'default_bg',
    'default': 'default_bg',
    'windows': 'bg_windowsxp',
    'xp': 'bg_windowsxp',
    'sistine': 'bg_sistine_01',
    'rumia': 'bg_sistine_02',
    'amamori': 'bg_amamori'
  };

  if ((!typeFilter || typeFilter === 'background') && bgAliasMap[normalizedQuery]) {
    const matchedBg = candidates.find(item => item.itemType === 'background' && item.id === bgAliasMap[normalizedQuery]);
    if (matchedBg) return matchedBg;
  }

  // 2. Correspondência exata por ID
  let match = candidates.find(item => {
    const idLower = item.id.toLowerCase();
    return idLower === rawQuery || idLower === normalizedQuery || idLower === idFormattedQuery;
  });
  if (match) return match;

  // 3. Correspondência exata por Nome
  match = candidates.find(item => {
    const normName = item.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normName === normalizedQuery || normName === spaceFormattedQuery;
  });
  if (match) return match;

  // 4. Começa com Nome ou ID
  match = candidates.find(item => {
    const normName = item.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const idLower = item.id.toLowerCase();
    return normName.startsWith(normalizedQuery) || idLower.startsWith(normalizedQuery) || idLower.startsWith(idFormattedQuery);
  });
  if (match) return match;

  // 5. Contém (Includes) em Nome ou ID
  match = candidates.find(item => {
    const normName = item.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const idLower = item.id.toLowerCase();
    const idSpaced = idLower.replace(/_/g, ' ');
    return normName.includes(normalizedQuery) || idLower.includes(normalizedQuery) || idLower.includes(idFormattedQuery) || idSpaced.includes(spaceFormattedQuery);
  });

  return match || null;
}

module.exports = {
  name: "profileconfig",
  aliases: ["manageprofile", "setprofile", "setprofilelayout", "darlayout", "removerlayout"],
  description: "Adiciona ou remove um wallpaper ou layout específico por nome ou ID de um usuário.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      const showHelp = () => {
        const helpEmbed = new EmbedBuilder()
          .setColor(color.embed || '#831396')
          .setTitle('🖼️ Gerenciador Individual de Wallpaper e Layout')
          .setDescription(
            `Adicione ou remova itens específicos de perfil por Nome ou ID.\n\n` +
            `📖 **Uso Correto:**\n` +
            `> \`${prefixo}profileconfig <@usuário/ID> <add|remover> [tipo: wallpaper|layout] <nome ou ID>\`\n\n` +
            `💡 **Exemplos de Adicionar:**\n` +
            `> \`${prefixo}profileconfig @user add Windows XP\`\n` +
            `> \`${prefixo}profileconfig @user add bg_sistine_01\`\n` +
            `> \`${prefixo}profileconfig @user add layout Cyberpunk Holográfico\`\n` +
            `> \`${prefixo}profileconfig @user add Branco\` *(Layout clássico branco)*\n\n` +
            `💡 **Exemplos de Remover:**\n` +
            `> \`${prefixo}profileconfig @user remover Windows XP\`\n` +
            `> \`${prefixo}profileconfig @user remover cyberpunk_neon\`\n` +
            `> \`${prefixo}profileconfig @user remover Vermelho\` *(Layout clássico vermelho)*`
          )
          .setFooter({ text: 'Sistine Custom Engine • Busca por nome ou ID' })
          .setTimestamp();

        return message.reply({ embeds: [helpEmbed] });
      };

      if (!args[0] || !args[1] || !args[2]) {
        return showHelp();
      }

      const addActions = ['add', 'dar', 'adicionar', 'give', 'liberar', 'unlock'];
      const removeActions = ['remover', 'del', 'delete', 'tirar', 'remove'];

      let action = null;
      let targetUser = null;
      let remainingArgs = [];

      const arg0Lower = args[0].toLowerCase();
      const arg1Lower = args[1].toLowerCase();

      if (addActions.includes(arg0Lower) || removeActions.includes(arg0Lower)) {
        action = addActions.includes(arg0Lower) ? 'add' : 'remove';
        targetUser = getUser(message, args[1]);
        remainingArgs = args.slice(2);
      } else if (addActions.includes(arg1Lower) || removeActions.includes(arg1Lower)) {
        action = addActions.includes(arg1Lower) ? 'add' : 'remove';
        targetUser = getUser(message, args[0]);
        remainingArgs = args.slice(2);
      } else {
        return showHelp();
      }

      if (!targetUser || !targetUser.id) {
        return message.reply({ content: `${emoji.negativo || '❌'} **|** Usuário não encontrado ou ID inválido.` });
      }

      if (!remainingArgs.length) {
        return showHelp();
      }

      // Verifica se o usuário especificou o tipo como primeiro termo (ex: !profileconfig @user add wallpaper Windows XP)
      let typeFilter = null;
      const firstArgLower = remainingArgs[0].toLowerCase();
      const wpFilterAliases = ['wallpaper', 'wallpapers', 'wp', 'bg', 'background', 'fundo'];
      const layoutFilterAliases = ['layout', 'layouts', 'moldura', 'tema'];

      if (wpFilterAliases.includes(firstArgLower)) {
        typeFilter = 'background';
        remainingArgs.shift();
      } else if (layoutFilterAliases.includes(firstArgLower)) {
        typeFilter = 'layout';
        remainingArgs.shift();
      }

      const itemQuery = remainingArgs.join(' ').trim();
      if (!itemQuery) {
        return showHelp();
      }

      const foundItem = findprofileconfig(itemQuery, typeFilter);

      if (!foundItem) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Não foi possível encontrar nenhum wallpaper ou layout correspondente a: \`${itemQuery}\`.\n` +
            `💡 Dica: Verifique se o nome ou ID está correto ou consulte os catálogos no comando \`/loja\`.`
        });
      }

      const userId = targetUser.id;
      const defaultBg = getBackgroundById('default_bg') || { id: 'default_bg', url: '/src/utils/assets/backgrounds/default_bg.jpg' };

      // ==========================================
      // OPERAÇÃO: ADICIONAR (ADD)
      // ==========================================
      if (action === 'add') {
        if (foundItem.itemType === 'background') {
          // Salva no objeto Perfil/Backgrounds
          await database.ref(`economia/${userId}/Perfil/Backgrounds/${foundItem.id}`).set(true);

          // Atualiza arrays de inventário sem duplicatas
          const snapWallpapers = await database.ref(`economia/${userId}/inventario/wallpapers`).once('value');
          let currentWallpapers = snapWallpapers.val();
          if (!Array.isArray(currentWallpapers)) currentWallpapers = ['default_bg'];
          if (!currentWallpapers.includes(foundItem.id)) {
            currentWallpapers.push(foundItem.id);
          }

          await Promise.all([
            database.ref(`economia/${userId}/inventario/wallpapers`).set(currentWallpapers),
            database.ref(`economia/${userId}/inventario/backgrounds`).set(currentWallpapers),
            database.ref(`economia/${userId}/inventory/wallpapers`).set(currentWallpapers)
          ]);

          const embedAddBg = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('🖼️ Wallpaper Concedido com Sucesso!')
            .setDescription(
              `O wallpaper foi adicionado ao inventário de <@${userId}>!\n\n` +
              `🏷️ **Item:** **${foundItem.name}**\n` +
              `🔑 **ID:** \`${foundItem.id}\`\n` +
              `📂 **Categoria:** \`${foundItem.category || 'Geral'}\`\n` +
              `💰 **Preço de Catálogo:** R$ ${Number(foundItem.price || 0).toLocaleString('pt-BR')}\n` +
              `👑 **Exclusivo VIP:** ${foundItem.vipOnly ? 'Sim ⭐' : 'Não'}\n\n` +
              `👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
              `🛡️ **Staff:** <@${message.author.id}>`
            )
            .setFooter({ text: 'Sistine Profile Engine • Item disponível no perfil e dashboard' })
            .setTimestamp();

          return message.reply({ embeds: [embedAddBg] });

        } else {
          // Layout
          const updates = {
            [foundItem.id]: true
          };

          // Se for tema clássico, adiciona também a chave tema_<cor>: 1
          if (foundItem.id.startsWith('classic_')) {
            const colorName = foundItem.id.replace('classic_', '');
            updates[`tema_${colorName}`] = 1;
          }

          await database.ref(`economia/${userId}/Perfil/Layouts`).update(updates);

          const snapLayouts = await database.ref(`economia/${userId}/inventario/layouts`).once('value');
          let currentLayouts = snapLayouts.val();
          if (!Array.isArray(currentLayouts)) currentLayouts = ['classic_azul'];
          if (!currentLayouts.includes(foundItem.id)) {
            currentLayouts.push(foundItem.id);
          }

          await Promise.all([
            database.ref(`economia/${userId}/inventario/layouts`).set(currentLayouts),
            database.ref(`economia/${userId}/inventory/layouts`).set(currentLayouts)
          ]);

          const embedAddLayout = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('📐 Layout Concedido com Sucesso!')
            .setDescription(
              `O layout foi adicionado ao inventário de <@${userId}>!\n\n` +
              `🏷️ **Layout:** **${foundItem.name}**\n` +
              `🔑 **ID:** \`${foundItem.id}\`\n` +
              `📂 **Categoria:** \`${foundItem.category || 'Geral'}\`\n` +
              `💰 **Preço de Catálogo:** R$ ${Number(foundItem.price || 0).toLocaleString('pt-BR')}\n` +
              `👑 **Exclusivo VIP:** ${foundItem.vipOnly ? 'Sim ⭐' : 'Não'}\n\n` +
              `👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
              `🛡️ **Staff:** <@${message.author.id}>`
            )
            .setFooter({ text: 'Sistine Profile Engine • Layout pronto para equipar' })
            .setTimestamp();

          return message.reply({ embeds: [embedAddLayout] });
        }

      // ==========================================
      // OPERAÇÃO: REMOVER (REMOVE)
      // ==========================================
      } else {
        if (foundItem.id === 'default_bg') {
          return message.reply({
            content: `${emoji.negativo || '❌'} **|** O wallpaper \`default_bg\` (Espaço Cósmico) é o fundo padrão do sistema e não pode ser removido.`
          });
        }

        if (foundItem.id === 'classic_azul') {
          return message.reply({
            content: `${emoji.negativo || '❌'} **|** O layout \`classic_azul\` (Clássico Azul Safira) é o layout padrão do sistema e não pode ser removido.`
          });
        }

        const snapPerfil = await database.ref(`economia/${userId}/Perfil`).once('value');
        const perfilVal = snapPerfil.val() || {};
        const equipados = perfilVal.Equipados || {};

        if (foundItem.itemType === 'background') {
          // Remove de Perfil/Backgrounds
          await database.ref(`economia/${userId}/Perfil/Backgrounds/${foundItem.id}`).remove();

          // Atualiza arrays de inventário
          const snapWallpapers = await database.ref(`economia/${userId}/inventario/wallpapers`).once('value');
          let currentWallpapers = snapWallpapers.val();
          if (Array.isArray(currentWallpapers)) {
            currentWallpapers = currentWallpapers.filter(id => id !== foundItem.id);
            if (!currentWallpapers.includes('default_bg')) currentWallpapers.unshift('default_bg');
          } else {
            currentWallpapers = ['default_bg'];
          }

          const removePromises = [
            database.ref(`economia/${userId}/inventario/wallpapers`).set(currentWallpapers),
            database.ref(`economia/${userId}/inventario/backgrounds`).set(currentWallpapers),
            database.ref(`economia/${userId}/inventory/wallpapers`).set(currentWallpapers)
          ];

          let wasEquipped = false;
          if (equipados.backgroundId === foundItem.id || equipados.background === foundItem.url) {
            wasEquipped = true;
            removePromises.push(database.ref(`economia/${userId}/Perfil/Equipados`).update({
              background: defaultBg.url,
              backgroundId: 'default_bg'
            }));
            removePromises.push(database.ref(`economia/${userId}/Perfil/Informações/imagemperfil`).set(defaultBg.url));
            removePromises.push(database.ref(`economia/${userId}/Perfil/Informacoes/imagemperfil`).set(defaultBg.url));
          }

          await Promise.all(removePromises);

          const embedRemBg = new EmbedBuilder()
            .setColor('#ef4444')
            .setTitle('🗑️ Wallpaper Removido')
            .setDescription(
              `O wallpaper foi removido do inventário de <@${userId}>!\n\n` +
              `🏷️ **Item:** **${foundItem.name}**\n` +
              `🔑 **ID:** \`${foundItem.id}\`\n` +
              (wasEquipped ? `⚠️ **Aviso:** Este wallpaper estava equipado e o perfil foi resetado para o padrão (*Espaço Cósmico*).\n\n` : '\n') +
              `👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
              `🛡️ **Staff:** <@${message.author.id}>`
            )
            .setFooter({ text: 'Sistine Profile Engine • Item desvinculado da conta' })
            .setTimestamp();

          return message.reply({ embeds: [embedRemBg] });

        } else {
          // Layout
          await database.ref(`economia/${userId}/Perfil/Layouts/${foundItem.id}`).remove();

          if (foundItem.id.startsWith('classic_')) {
            const colorName = foundItem.id.replace('classic_', '');
            await database.ref(`economia/${userId}/Perfil/Layouts`).update({
              [`tema_${colorName}`]: null,
              [`tema_${colorName}_log`]: 0
            });
          }

          const snapLayouts = await database.ref(`economia/${userId}/inventario/layouts`).once('value');
          let currentLayouts = snapLayouts.val();
          if (Array.isArray(currentLayouts)) {
            currentLayouts = currentLayouts.filter(id => id !== foundItem.id);
            if (!currentLayouts.includes('classic_azul')) currentLayouts.unshift('classic_azul');
          } else {
            currentLayouts = ['classic_azul'];
          }

          const removePromises = [
            database.ref(`economia/${userId}/inventario/layouts`).set(currentLayouts),
            database.ref(`economia/${userId}/inventory/layouts`).set(currentLayouts)
          ];

          let wasEquipped = false;
          if (equipados.layout === foundItem.id || equipados.layoutId === foundItem.id) {
            wasEquipped = true;
            removePromises.push(database.ref(`economia/${userId}/Perfil/Equipados`).update({
              layout: 'classic_azul',
              layoutId: 'classic_azul'
            }));
            removePromises.push(database.ref(`economia/${userId}/Perfil/Layouts`).update({
              tema_azul: 1,
              tema_azul_log: 1
            }));
          }

          await Promise.all(removePromises);

          const embedRemLayout = new EmbedBuilder()
            .setColor('#ef4444')
            .setTitle('🗑️ Layout Removido')
            .setDescription(
              `O layout foi removido do inventário de <@${userId}>!\n\n` +
              `🏷️ **Layout:** **${foundItem.name}**\n` +
              `🔑 **ID:** \`${foundItem.id}\`\n` +
              (wasEquipped ? `⚠️ **Aviso:** Este layout estava equipado e o perfil foi resetado para o padrão (*Clássico Azul Safira*).\n\n` : '\n') +
              `👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
              `🛡️ **Staff:** <@${message.author.id}>`
            )
            .setFooter({ text: 'Sistine Profile Engine • Layout desvinculado da conta' })
            .setTimestamp();

          return message.reply({ embeds: [embedRemLayout] });
        }
      }

    } catch (error) {
      console.error('[Command profileconfig error]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao processar o item de customização:\n\`\`\`js\n${error.message || error}\n\`\`\``
      });
    }
  }
};
