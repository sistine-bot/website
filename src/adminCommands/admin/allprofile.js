const { EmbedBuilder } = require('discord.js');
const { getUser, isStaff } = require('../../utils/functions.js');
const { BACKGROUNDS_CATALOG, LAYOUTS_CATALOG, getBackgroundById, getLayoutById } = require('../../utils/shopCatalog.js');

module.exports = {
  name: "allprofile",
  aliases: ["allwallpapers", "alllayouts", "liberartudo", "removertudo", "fullperfil"],
  description: "Libera ou remove todos os wallpapers e layouts de perfil de um usuário.",

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
          .setTitle('🎨 Gerenciador Global de Wallpapers e Layouts')
          .setDescription(
            `Este comando permite conceder ou remover em massa todas as customizações de perfil.\n\n` +
            `📖 **Uso Correto:**\n` +
            `> \`${prefixo}allprofile <@usuário/ID> <liberar|remover> [todos|wallpapers|layouts]\`\n\n` +
            `💡 **Exemplos de Uso:**\n` +
            `> \`${prefixo}allprofile @user liberar\` *(Libera todos os 52 wallpapers e 11 layouts)*\n` +
            `> \`${prefixo}allprofile @user liberar wallpapers\` *(Libera todos os wallpapers)*\n` +
            `> \`${prefixo}allprofile @user liberar layouts\` *(Libera todos os layouts)*\n` +
            `> \`${prefixo}allprofile @user remover\` *(Remove todos e reseta para o clássico padrão)*\n` +
            `> \`${prefixo}allprofile @user remover wallpapers\` *(Remove todos os wallpapers adquiridos)*\n` +
            `> \`${prefixo}allprofile @user remover layouts\` *(Remove todos os layouts adquiridos)*`
          )
          .setFooter({ text: 'Sistine Admin Profile Engine' })
          .setTimestamp();

        return message.reply({ embeds: [helpEmbed] });
      };

      if (!args[0] || !args[1]) {
        return showHelp();
      }

      // Detecção flexível da ordem dos argumentos:
      // Pode ser !allprofile @user <ação> ou !allprofile <ação> @user
      const unlockActions = ['liberar', 'add', 'dar', 'give', 'unlock', 'all', 'full', 'ativar', 'desbloquear'];
      const removeActions = ['remover', 'del', 'delete', 'tirar', 'limpar', 'clear', 'reset', 'remove'];

      let action = null;
      let targetUser = null;
      let categoryArg = null;

      const arg0Lower = args[0].toLowerCase();
      const arg1Lower = args[1].toLowerCase();

      if (unlockActions.includes(arg0Lower) || removeActions.includes(arg0Lower)) {
        action = unlockActions.includes(arg0Lower) ? 'unlock' : 'remove';
        targetUser = getUser(message, args[1]);
        categoryArg = args[2] ? args[2].toLowerCase() : 'todos';
      } else if (unlockActions.includes(arg1Lower) || removeActions.includes(arg1Lower)) {
        action = unlockActions.includes(arg1Lower) ? 'unlock' : 'remove';
        targetUser = getUser(message, args[0]);
        categoryArg = args[2] ? args[2].toLowerCase() : 'todos';
      } else {
        return showHelp();
      }

      if (!targetUser || !targetUser.id) {
        return message.reply({ content: `${emoji.negativo || '❌'} **|** Usuário não encontrado ou ID inválido.` });
      }

      // Identifica o escopo da ação (wallpapers, layouts ou ambos)
      let scope = 'todos';
      const wpAliases = ['wallpaper', 'wallpapers', 'wp', 'bg', 'bgs', 'background', 'backgrounds', 'fundo', 'fundos'];
      const layoutAliases = ['layout', 'layouts', 'moldura', 'molduras', 'tema', 'temas'];

      if (wpAliases.includes(categoryArg)) {
        scope = 'wallpapers';
      } else if (layoutAliases.includes(categoryArg)) {
        scope = 'layouts';
      }

      const userId = targetUser.id;
      const defaultBg = getBackgroundById('default_bg') || { id: 'default_bg', url: '/src/utils/assets/backgrounds/default_bg.jpg' };
      const defaultLayout = getLayoutById('classic_azul') || { id: 'classic_azul' };

      const allWallpaperIds = BACKGROUNDS_CATALOG.map(b => b.id);
      const allLayoutIds = LAYOUTS_CATALOG.map(l => l.id);

      if (action === 'unlock') {
        // ==========================================
        // LIBERAR TODOS
        // ==========================================
        const promises = [];
        let wpCount = 0;
        let layoutCount = 0;

        if (scope === 'wallpapers' || scope === 'todos') {
          const bgMap = {};
          BACKGROUNDS_CATALOG.forEach(b => {
            bgMap[b.id] = true;
          });

          promises.push(database.ref(`economia/${userId}/Perfil/Backgrounds`).update(bgMap));
          promises.push(database.ref(`economia/${userId}/inventario/wallpapers`).set(allWallpaperIds));
          promises.push(database.ref(`economia/${userId}/inventario/backgrounds`).set(allWallpaperIds));
          promises.push(database.ref(`economia/${userId}/inventory/wallpapers`).set(allWallpaperIds));
          wpCount = allWallpaperIds.length;
        }

        if (scope === 'layouts' || scope === 'todos') {
          const layoutMap = {
            tema_azul: 1,
            tema_branco: 1,
            tema_laranja: 1,
            tema_preto: 1,
            tema_verde: 1,
            tema_vermelho: 1,
            tema_roxo: 1
          };

          LAYOUTS_CATALOG.forEach(l => {
            layoutMap[l.id] = true;
          });

          promises.push(database.ref(`economia/${userId}/Perfil/Layouts`).update(layoutMap));
          promises.push(database.ref(`economia/${userId}/inventario/layouts`).set(allLayoutIds));
          promises.push(database.ref(`economia/${userId}/inventory/layouts`).set(allLayoutIds));
          layoutCount = allLayoutIds.length;
        }

        await Promise.all(promises);

        const embedSuccess = new EmbedBuilder()
          .setColor('#10b981')
          .setTitle('🎨 Customizações Liberadas com Sucesso!')
          .setDescription(
            `Todas as customizações selecionadas foram concedidas a <@${userId}>!\n\n` +
            (wpCount > 0 ? `🖼️ **Wallpapers Liberados:** \`${wpCount} disponíveis\`\n` : '') +
            (layoutCount > 0 ? `📐 **Layouts Liberados:** \`${layoutCount} disponíveis\`\n` : '') +
            `\n👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
            `🛡️ **Staff Responsável:** <@${message.author.id}>`
          )
          .setFooter({ text: 'Sistine Profile Engine • Itens liberados no banco de dados e dashboard' })
          .setTimestamp();

        return message.reply({ embeds: [embedSuccess] });

      } else {
        // ==========================================
        // REMOVER TODOS
        // ==========================================
        const promises = [];
        let wpRemoved = false;
        let layoutRemoved = false;

        const snapUser = await database.ref(`economia/${userId}/Perfil`).once('value');
        const perfilData = snapUser.val() || {};
        const equipados = perfilData.Equipados || {};

        if (scope === 'wallpapers' || scope === 'todos') {
          promises.push(database.ref(`economia/${userId}/Perfil/Backgrounds`).set({ default_bg: true }));
          promises.push(database.ref(`economia/${userId}/inventario/wallpapers`).set(['default_bg']));
          promises.push(database.ref(`economia/${userId}/inventario/backgrounds`).set(['default_bg']));
          promises.push(database.ref(`economia/${userId}/inventory/wallpapers`).set(['default_bg']));

          // Se estiver com wallpaper não padrão equipado, reseta para o clássico
          if (equipados.backgroundId && equipados.backgroundId !== 'default_bg') {
            promises.push(database.ref(`economia/${userId}/Perfil/Equipados`).update({
              background: defaultBg.url,
              backgroundId: 'default_bg'
            }));
            promises.push(database.ref(`economia/${userId}/Perfil/Informações/imagemperfil`).set(defaultBg.url));
            promises.push(database.ref(`economia/${userId}/Perfil/Informacoes/imagemperfil`).set(defaultBg.url));
          }
          wpRemoved = true;
        }

        if (scope === 'layouts' || scope === 'todos') {
          // Mantém apenas o clássico azul e zera/remove todos os outros
          const resetLayouts = {
            classic_azul: true,
            tema_azul: 1,
            tema_azul_log: 1,
            tema_branco: null,
            tema_laranja: null,
            tema_preto: null,
            tema_verde: null,
            tema_vermelho: null,
            tema_roxo: null,
            tema_branco_log: 0,
            tema_laranja_log: 0,
            tema_preto_log: 0,
            tema_verde_log: 0,
            tema_vermelho_log: 0,
            tema_roxo_log: 0
          };

          // Limpa quaisquer IDs adicionais do catálogo
          LAYOUTS_CATALOG.forEach(l => {
            if (l.id !== 'classic_azul') {
              resetLayouts[l.id] = null;
            }
          });

          promises.push(database.ref(`economia/${userId}/Perfil/Layouts`).set(resetLayouts));
          promises.push(database.ref(`economia/${userId}/inventario/layouts`).set(['classic_azul']));
          promises.push(database.ref(`economia/${userId}/inventory/layouts`).set(['classic_azul']));

          // Reseta layout equipado para classic_azul
          promises.push(database.ref(`economia/${userId}/Perfil/Equipados`).update({
            layout: 'classic_azul',
            layoutId: 'classic_azul'
          }));
          layoutRemoved = true;
        }

        await Promise.all(promises);

        const embedRemoved = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle('🗑️ Customizações Removidas!')
          .setDescription(
            `As customizações foram removidas e o perfil de <@${userId}> foi resetado para os padrões originais.\n\n` +
            (wpRemoved ? `🖼️ **Wallpapers:** Resetados para \`Espaço Cósmico (Padrão)\`\n` : '') +
            (layoutRemoved ? `📐 **Layouts:** Resetados para \`Clássico Azul Safira\`\n` : '') +
            `\n👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
            `🛡️ **Staff Responsável:** <@${message.author.id}>`
          )
          .setFooter({ text: 'Sistine Profile Engine • Inventário limpo com sucesso' })
          .setTimestamp();

        return message.reply({ embeds: [embedRemoved] });
      }

    } catch (error) {
      console.error('[Command allprofile error]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao processar as customizações de perfil:\n\`\`\`js\n${error.message || error}\n\`\`\``
      });
    }
  }
};
