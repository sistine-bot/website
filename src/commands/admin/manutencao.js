const { EmbedBuilder } = require('discord.js');
const { isStaff } = require('../../utils/functions.js');

module.exports = {
  name: "manutencao",
  aliases: ["maintenance", "modomanutencao"],
  description: "Ativa ou desativa o Modo de Manutenção Global do bot Sistine.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      const subCommand = (args[0] || '').toLowerCase();

      if (['on', 'ativar', 'enable'].includes(subCommand)) {
        const previsao = args[1] || 'Em breve';
        const motivo = args.slice(2).join(' ') || 'Atualizações e melhorias na infraestrutura do bot';

        await database.ref('Administração/Manutencao').set({
          ativa: true,
          motivo,
          previsao,
          ativadoPor: `${message.author.username} (${message.author.id})`,
          ativadoEm: Date.now()
        });

        const embed = new EmbedBuilder()
          .setColor('#eab308')
          .setTitle('🛠️ Modo de Manutenção Global ATIVADO!')
          .setDescription(
            `O bot Sistine entrou em manutenção técnica.\n\n` +
            `📋 **Motivo:** \`${motivo}\`\n` +
            `⏳ **Previsão de Retorno:** \`${previsao}\`\n` +
            `🛡️ **Ativado por:** <@${message.author.id}>\n\n` +
            `🔒 **Status:** Comandos de usuários comuns bloqueados. Criadores e Desenvolvedores continuam com acesso livre.`
          )
          .setFooter({ text: 'Sistine Sistema de Manutenção' })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      if (['off', 'desativar', 'disable'].includes(subCommand)) {
        await database.ref('Administração/Manutencao').set({
          ativa: false,
          desativadoPor: `${message.author.username} (${message.author.id})`,
          desativadoEm: Date.now()
        });

        const embed = new EmbedBuilder()
          .setColor('#10b981')
          .setTitle('✅ Modo de Manutenção DESATIVADO!')
          .setDescription(
            `O bot Sistine voltou à sua operação normal!\n\n` +
            `🔓 **Acesso restaurado:** Todos os usuários podem utilizar comandos de mensagens e slash livremente.\n` +
            `🛡️ **Desativado por:** <@${message.author.id}>`
          )
          .setFooter({ text: 'Sistine Sistema de Manutenção' })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      // Ver status atual
      const snap = await database.ref('Administração/Manutencao').once('value');
      const maintData = snap.val() || { ativa: false };

      const statusEmbed = new EmbedBuilder()
        .setColor(maintData.ativa ? '#eab308' : '#10b981')
        .setTitle('🛠️ Painel de Manutenção Global (Sistine)')
        .setDescription(
          `**Estado Atual:** ${maintData.ativa ? '🔴 **ATIVA (Em Manutenção)**' : '🟢 **DESATIVADA (Online)**'}\n\n` +
          (maintData.ativa ?
            `📋 **Motivo:** \`${maintData.motivo || 'N/A'}\`\n` +
            `⏳ **Previsão:** \`${maintData.previsao || 'N/A'}\`\n` +
            `🛡️ **Ativado por:** \`${maintData.ativadoPor || 'N/A'}\`\n\n` : '') +
          `📖 **Comandos:**\n` +
          `> \`${prefixo}manutencao on <previsão> <motivo>\` - Ativa o modo de manutenção\n` +
          `> \`${prefixo}manutencao off\` - Desativa a manutenção\n` +
          `> \`${prefixo}manutencao status\` - Verifica o status atual`
        )
        .setFooter({ text: 'Apenas Criadores e Desenvolvedores' })
        .setTimestamp();

      return message.reply({ embeds: [statusEmbed] });

    } catch (error) {
      console.error('[Command manutencao error]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao alterar o estado de manutenção.`
      });
    }
  }
};
