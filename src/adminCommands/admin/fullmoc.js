const { EmbedBuilder } = require('discord.js');
const itens = require(`${process.cwd()}/src/utils/itens.json`);
const { getUser, isStaff } = require('../../utils/functions.js');

module.exports = {
  name: "fullmoc",
  aliases: ["fullmochila", "mochilafull"],
  description: "Preenche a mochila/inventário de um usuário com itens e equipamentos para testes.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      const user = args[0] ? getUser(message, args[0]) : message.author;
      if (!user || !user.id) {
        return message.reply({ content: `${emoji.negativo || '❌'} **|** Usuário não encontrado.` });
      }

      const db = `economia/${user.id}/inventario/itens`;

      await database.ref(`${db}/Consumíveis/`).update({
        Trigo: 999,
        Milho: 999,
        Feijão: 999,
        CanaDeAçucar: 999,
        Cenoura: 999,
        Abóbora: 999,
        semente_trigo: 999,
        semente_milho: 999,
        semente_feijao: 999,
        semente_cana: 999,
        semente_cenoura: 999,
        semente_abobora: 999,
        Ovo: 999,
        Leite: 999,
        Bacon: 999,
        ração_animal: 999,
        isca: 999,
        peixe: 999,
        carne: 999,
        adubo: 999,
        backgroundticket: 999,
        munição: 999,
        baús: 99,
        chave: 99
      });

      await database.ref(`${db}/Equipamentos/`).update({
        anelcasamento: { item: 1, nome: "Anel de Casamento", Xp: 0 },
        porte: { item: 1, nome: "Porte de Armas", Xp: 0 },
        armacaça: { item: 1, nome: "Arma de Caça", Xp: 100 },
        arma: { item: 4, nome: "Ak-47", Xp: 100 },
        vara: { item: 1, nome: "Vara de Pescar", Xp: 100 },
        enxada: { item: 1, nome: "Enxada", Xp: 100 },
        regador: { item: 1, nome: "Regador", Xp: 100, agua: 100 }
      });

      const embed = new EmbedBuilder()
        .setColor(color.embed || '#831396')
        .setTitle('🎒 Mochila Preenchida com Sucesso')
        .setDescription(
          `${emoji.positivo || '✅'} **|** A mochila de <@${user.id}> foi preenchida com o kit completo de testes!\n\n` +
          `📦 **Consumíveis adicionados:** 999x de cada (Colheitas, Sementes, Animais, Munições, Iscas)\n` +
          `⚔️ **Equipamentos adicionados:** Porte de Armas, Ak-47, Arma de Caça, Vara de Pescar, Enxada, Regador e Anel.\n\n` +
          `🛡️ **Staff:** <@${message.author.id}>`
        )
        .setFooter({ text: 'Sistine Administração' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('[Command fullmoc]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao preencher a mochila.`
      });
    }
  }
};