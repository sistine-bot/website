const { EmbedBuilder } = require('discord.js');
const { CheckUserBlacklisted, setUserBlacklist, removeUserBlacklist, getUser, ParseDuration } = require('../../utils/functions.js');

module.exports = {
  name: "blacklist",
  aliases: ["banir", "bl", "blockuser"],
  description: "Gerencia o banimento global de usuários do bot e da dashboard.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      const isCreator = client.config?.cargos?.criador?.includes(message.author.id);
      const isDev = client.config?.cargos?.developer?.includes(message.author.id);

      if (!isCreator && !isDev) {
        return message.reply({ content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criador/Dev) pode gerenciar a Blacklist.` });
      }

      const subCommand = (args[0] || '').toLowerCase();

      if (['add', 'adicionar', 'ban'].includes(subCommand)) {
        if (!args[1] || !args[2]) {
          return message.reply({
            content: `📖 **Uso Correto:**\n` +
              `> \`${prefixo}blacklist add @usuário/ID <tempo> <motivo>\`\n\n` +
              `💡 **Exemplos:**\n` +
              `> \`${prefixo}blacklist add @user 7d Abuso de bugs no cassino\`\n` +
              `> \`${prefixo}blacklist add 1234567890 30d selfbot\`\n` +
              `> \`${prefixo}blacklist add @user permanente Tentativa de ataque à infraestrutura\``
          });
        }

        const targetUser = getUser(message, args[1]) || { id: args[1].replace(/\D/g, ''), username: `ID ${args[1]}` };
        if (!targetUser.id) {
          return message.reply({ content: `${emoji.negativo || '❌'} **|** Usuário inválido ou ID não encontrado.` });
        }

        if (client.config?.cargos?.criador?.includes(targetUser.id)) {
          return message.reply({ content: `${emoji.negativo || '❌'} **|** Você não pode banir um Criador do bot.` });
        }

        const rawTempo = args[2].toLowerCase();
        let tempoMs = 'indeterminado' || 'perma';
        if (rawTempo !== 'permanente' && rawTempo !== 'indeterminado') {
          const parsed = ParseDuration(rawTempo);
          if (!parsed || parsed <= 0) {
            return message.reply({ content: `${emoji.negativo || '❌'} **|** Formato de tempo inválido. Use \`1h\`, \`2d\`, \`7d\`, \`30d\` ou \`permanente\`.` });
          }
          tempoMs = parsed;
        }

        const motivo = args.slice(3).join(' ') || 'Violação das diretrizes do bot Sistine';

        await setUserBlacklist(targetUser.id, {
          motivo,
          tempo: tempoMs,
          staff: `${message.author.username} (${message.author.id})`,
          staffId: message.author.id
        });

        const embed = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle('⛔ Usuário Banido dos Sistemas (Blacklist)')
          .setDescription(
            `O usuário **${targetUser.username || targetUser.tag || targetUser.id}** (\`${targetUser.id}\`) foi banido com sucesso.\n\n` +
            `📜 **Motivo:** \`${motivo}\`\n` +
            `📆 **Duração:** \`${rawTempo}\`\n` +
            `🛡️ **Staff Responsável:** <@${message.author.id}>\n\n` +
            `• Bloqueado de executar qualquer comando slash ou mensagem.\n`
          )
          .setFooter({ text: 'Sistine Segurança & Moderação Global' })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      if (['remove', 'remover', 'unban', 'del'].includes(subCommand)) {
        if (!args[1]) {
          return message.reply({ content: `📖 **Uso Correto:** \`${prefixo}blacklist remove @usuário/ID\`` });
        }

        const targetId = args[1].replace(/\D/g, '');
        if (!targetId) {
          return message.reply({ content: `${emoji.negativo || '❌'} **|** Forneça um ID ou menção válida.` });
        }

        const currentStatus = await CheckUserBlacklisted(targetId);
        if (!currentStatus.blacklisted) {
          return message.reply({ content: `${emoji.aviso || '⚠️'} **|** Este usuário não está na Blacklist.` });
        }

        await removeUserBlacklist(targetId);

        const embed = new EmbedBuilder()
          .setColor('#10b981')
          .setTitle('✅ Usuário Desbanido da Blacklist')
          .setDescription(
            `O usuário \`${targetId}\` foi removido da Blacklist com sucesso!\n\n` +
            `🔓 **Acesso restaurado:** O usuário agora pode utilizar comandos e acessar a dashboard normalmente.`
          )
          .setFooter({ text: 'Sistine Segurança & Moderação Global' })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      if (['check', 'ver', 'info', 'status'].includes(subCommand)) {
        if (!args[1]) {
          return message.reply({ content: `📖 **Uso Correto:** \`${prefixo}blacklist check @usuário/ID\`` });
        }

        const targetUser = getUser(message, args[1]) || { id: args[1].replace(/\D/g, ''), username: `ID ${args[1]}` };
        const status = await CheckUserBlacklisted(targetUser.id);

        if (!status.blacklisted) {
          return message.reply({ content: `✅ **|** O usuário **${targetUser.username || targetUser.id}** está **LIVRE** (não possui nenhuma punição ativa).` });
        }

        const embed = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle('🔍 Status de Blacklist Ativa')
          .addFields(
            { name: '👤 Usuário:', value: `${targetUser.username || targetUser.id} (\`${targetUser.id}\`)`, inline: true },
            { name: '🛡️ Aplicado por:', value: `\`${status.staff}\``, inline: true },
            { name: '📆 Duração:', value: `${status.tempo}`, inline: true },
            { name: '📜 Motivo:', value: `\`\`\`${status.motivo}\`\`\`` }
          )
          .setFooter({ text: 'Sistine Moderação Global' })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      // Ajuda padrão
      const helpEmbed = new EmbedBuilder()
        .setColor(color.embed || '#831396')
        .setTitle('🛡️ Painel de Blacklist Global (Sistine)')
        .setDescription(
          `Gerencie usuários banidos de todos os comandos e do Dashboard do bot.\n\n` +
          `**Comandos disponíveis:**\n` +
          `> \`${prefixo}blacklist add <@user/ID> <tempo> <motivo>\` - Bane o usuário de comandos e da dashboard.\n` +
          `> \`${prefixo}blacklist remove <@user/ID>\` - Remove o usuário da Blacklist.\n` +
          `> \`${prefixo}blacklist check <@user/ID>\` - Verifica a situação atual de um usuário.\n\n` +
          `💡 *Tempos aceitos:* \`1h\`, \`1d\`, \`7d\`, \`30d\`, \`permanente\``
        )
        .setFooter({ text: 'Apenas Criadores e Desenvolvedores podem utilizar este comando.' });

      return message.reply({ embeds: [helpEmbed] });

    } catch (err) {
      console.error('[Command blacklist]', err);
      return message.reply({ content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao processar a solicitação de Blacklist.` });
    }
  }
};
