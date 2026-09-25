const { EmbedBuilder } = require('discord.js');
const { isStaff } = require('../../utils/functions.js');

module.exports = {
  name: "adminhelp",
  aliases: ["admin", "helpadmin", "ahelp", "comandosadmin"],
  description: "Exibe a central de comandos administrativos do bot Sistine.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) tem permissão para visualizar o painel administrativo.`
        });
      }

      const embed = new EmbedBuilder()
        .setColor(color.embed || '#831396')
        .setTitle('👑 Central Administrativa Global — Sistine')
        .setDescription(
          `Olá **${message.author.username}**, aqui estão todos os comandos administrativos disponíveis no bot.\n` +
          `Utilize o prefixo \`${prefixo}\` antes de cada comando.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
        )
        .addFields(
          {
            name: '💵 Economia & Finanças',
            value:
              `> \`${prefixo}addbanco <quantia> [@user]\` - Adiciona dinheiro ao banco.\n` +
              `> \`${prefixo}addcarteira <quantia> [@user]\` - Adiciona dinheiro à carteira.\n` +
              `> \`${prefixo}removebanco <quantia> [@user]\` - Remove dinheiro do banco.\n` +
              `> \`${prefixo}removecarteira <quantia> [@user]\` - Remove dinheiro da carteira.\n` +
              `> \`${prefixo}setmoney <@user> <carteira|banco|ambos> <valor>\` - Define saldo exato.`
          },
          {
            name: '🎒 Inventário & Mochila',
            value:
              `> \`${prefixo}additem <@user> <item> [qtd]\` - Concede item/arma/porte.\n` +
              `> \`${prefixo}removeitem <@user> <item> [qtd]\` - Remove item ou equipamento.\n` +
              `> \`${prefixo}fullmoc [@user]\` - Preenche a mochila inteira para testes.\n` +
              `> \`${prefixo}limparmoc [@user]\` - Esvazia a mochila inteira.`
          },
          {
            name: '⚙️ Benefícios & Vínculos',
            value:
              `> \`${prefixo}editarvip <tempo|0> <ouro|diamante> <@user>\` - Gerencia o VIP.\n` +
              `> \`${prefixo}editarantiroubo <tempo|0> <@user>\` - Gerencia o escudo anti-roubo.\n` +
              `> \`${prefixo}setcasados <@user1> <@user2>\` - Força casamento no cartório.\n` +
              `> \`${prefixo}removecooldowns [@user] [cmd|all]\` - Reseta cooldowns.`
          },
          {
            name: '🛡️ Moderação & Segurança Global',
            value:
              `> \`${prefixo}blacklist add <@user> <tempo> <motivo>\` - Bane do bot e dashboard.\n` +
              `> \`${prefixo}blacklist remove <@user/ID>\` - Remove da Blacklist.\n` +
              `> \`${prefixo}blacklist check <@user/ID>\` - Consulta status de punição.\n` +
              `> \`${prefixo}blacklist list\` - Lista todos os usuários banidos.\n` +
              `> \`${prefixo}resetuser <@user>\` - Zera completamente o progresso da conta.`
          },
          {
            name: '🔧 Sistema & Desenvolvimento',
            value:
              `> \`${prefixo}manutencao <on|off|status>\` - Controla o modo manutenção global.\n` +
              `> \`${prefixo}eval <código>\` - Executa expressões JavaScript no bot.\n` +
              `> \`${prefixo}drop [quantia]\` - Inicia um airdrop coletável no canal.\n` +
              `> \`${prefixo}botstatus\` - Telemetria, consumo de RAM e ping.\n` +
              `> \`${prefixo}rc <comando>\` - Recarrega comando de prefixo (hot-reload).\n` +
              `> \`${prefixo}rs <comando>\` - Recarrega comando slash (hot-reload).\n` +
              `> \`${prefixo}reloadslashs\` - Sincroniza todos os slash commands na API.\n` +
              `> \`${prefixo}reloadevents\` - Recarrega os listeners de eventos.`
          }
        )
        .setFooter({ text: 'Apenas Criadores e Desenvolvedores Oficiais' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('[Command adminhelp error]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao carregar o menu administrativo.`
      });
    }
  }
};
