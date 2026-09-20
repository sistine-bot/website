const { EmbedBuilder, version: djsVersion } = require('discord.js');
const os = require('os');
const { isStaff, FormatDuration } = require('../../utils/functions.js');

module.exports = {
  name: "botstatus",
  aliases: ["statusbot", "systeminfo", "botstats", "statsbot"],
  description: "Exibe informações técnicas sobre os recursos do sistema, memória e status do bot.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      const memory = process.memoryUsage();
      const ramUsedMB = (memory.heapUsed / 1024 / 1024).toFixed(2);
      const ramTotalMB = (memory.heapTotal / 1024 / 1024).toFixed(2);
      const rssMB = (memory.rss / 1024 / 1024).toFixed(2);

      const totalUsuarios = client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0);
      const uptimeSec = Math.floor(process.uptime());
      const uptimeFormatado = FormatDuration(`${uptimeSec}s`) || `${uptimeSec} segundos`;

      const embed = new EmbedBuilder()
        .setColor(color.embed || '#831396')
        .setTitle('⚙️ Painel de Telemetria e Status do Sistema')
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          {
            name: '🤖 Instância do Bot',
            value: `> **Nome:** \`${client.user.tag}\`\n> **ID:** \`${client.user.id}\`\n> **Ping WebSocket:** \`${client.ws.ping}ms\`\n> **Uptime:** \`${uptimeFormatado}\``,
            inline: false
          },
          {
            name: '📊 Estatísticas de Alcance',
            value: `> **Servidores:** \`${client.guilds.cache.size.toLocaleString('pt-BR')}\`\n> **Usuários Totais:** \`${totalUsuarios.toLocaleString('pt-BR')}\`\n> **Comandos Slash:** \`${client.slashCommands?.size || 0}\`\n> **Comandos de Prefixo:** \`${client.commands?.size || 0}\``,
            inline: false
          },
          {
            name: '🧠 Consumo de Memória (Node.js)',
            value: `> **Heap Usado:** \`${ramUsedMB} MB\` / \`${ramTotalMB} MB\`\n> **RSS Total:** \`${rssMB} MB\``,
            inline: true
          },
          {
            name: '🖥️ Ambiente do Host',
            value: `> **Node.js:** \`${process.version}\`\n> **Discord.js:** \`v${djsVersion}\`\n> **Plataforma:** \`${os.platform()} (${os.arch()})\``,
            inline: true
          }
        )
        .setFooter({ text: 'Sistine System Diagnostics' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('[Command botstatus error]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao obter os dados de telemetria do bot.`
      });
    }
  }
};
