const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { isStaff } = require('../../utils/functions.js');

module.exports = {
  name: "rc",
  aliases: ["r", "restartcommand", "reloadcmd", "reloadcommand"],
  description: "Recarrega um comando de prefixo em tempo de execução sem reiniciar o bot.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      if (!args[0]) {
        return message.reply({
          content: `📖 **Uso Correto:**\n> \`${prefixo}rc <comando>\` ou \`${prefixo}rc <pasta> <comando>\`\n\n💡 **Exemplo:** \`${prefixo}rc addbanco\` ou \`${prefixo}rc admin addbanco\``
        });
      }

      const searchRoots = [
        path.join(process.cwd(), 'src', 'adminCommands'),
        path.join(process.cwd(), 'src', 'commands')
      ];
      let targetCategory = '';
      let targetCmd = '';
      let targetFilePath = '';

      if (args[1]) {
        // Formato: !rc <categoria> <comando>
        targetCategory = args[0].toLowerCase();
        targetCmd = args[1].toLowerCase();
        for (const root of searchRoots) {
          const candidate = path.join(root, targetCategory, `${targetCmd}.js`);
          if (fs.existsSync(candidate)) {
            targetFilePath = candidate;
            break;
          }
        }
      } else {
        // Formato inteligente: !rc <comando> (busca automaticamente em todas as subpastas)
        targetCmd = args[0].toLowerCase();
        for (const root of searchRoots) {
          if (!fs.existsSync(root)) continue;
          const dirs = fs.readdirSync(root).filter(f => fs.statSync(path.join(root, f)).isDirectory());

          for (const dir of dirs) {
            const candidate = path.join(root, dir, `${targetCmd}.js`);
            if (fs.existsSync(candidate)) {
              targetFilePath = candidate;
              targetCategory = dir;
              break;
            }
          }
          if (targetFilePath) break;
        }
      }

      if (!targetFilePath || !fs.existsSync(targetFilePath)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** O arquivo do comando \`${args.join(' ')}\` não foi encontrado nas pastas administrativas de comandos.`
        });
      }

      // Limpa cache
      delete require.cache[require.resolve(targetFilePath)];

      // Remove referências e aliases antigos
      const oldCommand = client.commands.get(targetCmd);
      if (oldCommand && oldCommand.aliases && Array.isArray(oldCommand.aliases)) {
        for (const alias of oldCommand.aliases) {
          client.aliases.delete(alias);
        }
      }
      client.commands.delete(targetCmd);

      // Recarrega novo comando
      const newCommand = require(targetFilePath);

      if (!newCommand || !newCommand.name) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** O comando foi lido mas não possui a propriedade \`name\` válida.`
        });
      }

      client.commands.set(newCommand.name, newCommand);

      if (newCommand.aliases && Array.isArray(newCommand.aliases)) {
        for (const alias of newCommand.aliases) {
          client.aliases.set(alias, newCommand.name);
        }
      }

      const embed = new EmbedBuilder()
        .setColor('#10b981')
        .setTitle('🔄 Comando de Prefixo Recarregado!')
        .setDescription(
          `O comando \`${newCommand.name}\` foi recarregado do disco com sucesso!\n\n` +
          `📁 **Categoria:** \`${targetCategory}\`\n` +
          `🏷️ **Aliases:** ${newCommand.aliases?.length ? newCommand.aliases.map(a => `\`${a}\``).join(', ') : '*Nenhum*'}\n` +
          `🛡️ **Operador:** <@${message.author.id}>`
        )
        .setFooter({ text: 'Sistine Hot-Reload' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (e) {
      console.error('[Command rc error]', e);
      return message.reply({
        content: `❌ **|** Ocorreu um erro ao reiniciar este comando:\n\`\`\`js\n${e.message || e}\n\`\`\``
      });
    }
  }
};