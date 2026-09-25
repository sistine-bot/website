const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { isStaff } = require('../../utils/functions.js');

module.exports = {
  name: "rs",
  aliases: ["restartslash", "reloadslashcmd"],
  description: "Recarrega um comando slash individual em tempo de execução sem reiniciar o bot.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      if (!args[0]) {
        return message.reply({
          content: `📖 **Uso Correto:**\n> \`${prefixo}rs <comando>\` ou \`${prefixo}rs <pasta> <comando>\`\n\n💡 **Exemplo:** \`${prefixo}rs daily\` ou \`${prefixo}rs economia daily\``
        });
      }

      const slashRoot = fs.existsSync(path.join(process.cwd(), 'src', 'commands'))
        ? path.join(process.cwd(), 'src', 'commands')
        : path.join(process.cwd(), 'src', 'SlashCommand');
      let targetCategory = '';
      let targetCmd = '';
      let targetFilePath = '';

      if (args[1]) {
        targetCategory = args[0].toLowerCase();
        targetCmd = args[1].toLowerCase();
        const candidate = path.join(slashRoot, targetCategory, `${targetCmd}.js`);
        if (fs.existsSync(candidate)) {
          targetFilePath = candidate;
        }
      } else {
        targetCmd = args[0].toLowerCase();
        const dirs = fs.readdirSync(slashRoot).filter(f => fs.statSync(path.join(slashRoot, f)).isDirectory());

        for (const dir of dirs) {
          const candidate = path.join(slashRoot, dir, `${targetCmd}.js`);
          if (fs.existsSync(candidate)) {
            targetFilePath = candidate;
            targetCategory = dir;
            break;
          }
        }
      }

      if (!targetFilePath || !fs.existsSync(targetFilePath)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** O comando slash \`${args.join(' ')}\` não foi encontrado em \`src/SlashCommand/\`.`
        });
      }

      // Limpa cache
      delete require.cache[require.resolve(targetFilePath)];
      client.slashCommands.delete(targetCmd);

      // Carrega versão atualizada
      const newSlash = require(targetFilePath);

      if (!newSlash || !newSlash.name) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** O comando slash não possui uma propriedade \`name\` válida.`
        });
      }

      client.slashCommands.set(newSlash.name, newSlash);

      const embed = new EmbedBuilder()
        .setColor('#10b981')
        .setTitle('⚡ Comando Slash Recarregado!')
        .setDescription(
          `O comando slash \`/${newSlash.name}\` foi recarregado em memória com sucesso!\n\n` +
          `📁 **Categoria:** \`${targetCategory}\`\n` +
          `📝 **Descrição:** ${newSlash.description || '*Sem descrição*'}\n` +
          `🛡️ **Operador:** <@${message.author.id}>`
        )
        .setFooter({ text: 'Sistine Hot-Reload' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (e) {
      console.error('[Command rs error]', e);
      return message.reply({
        content: `❌ **|** Ocorreu um erro ao reiniciar o comando slash:\n\`\`\`js\n${e.message || e}\n\`\`\``
      });
    }
  }
};