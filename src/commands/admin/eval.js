const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const util = require('util');
const { isStaff } = require('../../utils/functions.js');

function clean(text, token = '') {
  if (typeof text !== 'string') text = util.inspect(text, { depth: 1 });

  // Mascarar tokens e credenciais críticas
  if (token) {
    const reg = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    text = text.replace(reg, '[TOKEN_REDACTED]');
  }

  return text
    .replace(/`/g, '`' + String.fromCharCode(8203))
    .replace(/@/g, '@' + String.fromCharCode(8203));
}

module.exports = {
  name: "eval",
  aliases: ["e", "ev", "execute"],
  description: "Executa expressões JavaScript diretamente no ambiente do bot.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas Desenvolvedores e Criadores globais podem executar expressões com o comando eval.`
        });
      }

      if (!args[0]) {
        return message.reply({
          content: `📖 **Uso Correto:** \`${prefixo}eval <código JavaScript>\`\n💡 **Exemplo:** \`${prefixo}eval client.guilds.cache.size\``
        });
      }

      const inputCode = args.join(' ');
      const start = process.hrtime();

      let evaled;
      try {
        evaled = await eval(inputCode);
      } catch (err) {
        const diff = process.hrtime(start);
        const execTime = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

        const errorOutput = clean(err?.stack || err?.message || String(err), client.token);

        const errorEmbed = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle('⚠️ Erro na Execução (Eval)')
          .addFields(
            { name: '📥 Entrada:', value: `\`\`\`js\n${inputCode.slice(0, 1000)}\n\`\`\`` },
            { name: '📤 Exceção:', value: `\`\`\`js\n${errorOutput.slice(0, 1000)}\n\`\`\`` }
          )
          .setFooter({ text: `Falha em ${execTime}ms` })
          .setTimestamp();

        return message.reply({ embeds: [errorEmbed] });
      }

      const diff = process.hrtime(start);
      const execTime = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

      const cleanedOutput = clean(evaled, client.token);

      if (cleanedOutput.length > 1500) {
        // Envia como arquivo txt se a saída for muito extensa
        const buffer = Buffer.from(cleanedOutput, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { name: 'eval_output.txt' });

        return message.reply({
          content: `⚡ **Executado em:** \`${execTime}ms\` (Saída muito grande, anexada abaixo):`,
          files: [attachment]
        });
      }

      const successEmbed = new EmbedBuilder()
        .setColor('#10b981')
        .setTitle('⚡ Execução Bem-Sucedida (Eval)')
        .addFields(
          { name: '📥 Entrada:', value: `\`\`\`js\n${inputCode.slice(0, 1000)}\n\`\`\`` },
          { name: '📤 Saída:', value: `\`\`\`js\n${cleanedOutput || 'undefined'}\n\`\`\`` }
        )
        .setFooter({ text: `Tipo: ${typeof evaled} | Concluído em ${execTime}ms` })
        .setTimestamp();

      return message.reply({ embeds: [successEmbed] });

    } catch (criticalErr) {
      console.error('[Critical Eval Error]', criticalErr);
      return message.reply({ content: `❌ **|** Erro crítico ao processar eval: ${criticalErr.message}` });
    }
  }
};
