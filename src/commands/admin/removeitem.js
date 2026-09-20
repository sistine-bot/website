const { EmbedBuilder } = require('discord.js');
const { getUser, isStaff, NumberConvert, Format } = require('../../utils/functions.js');

module.exports = {
  name: "removeitem",
  aliases: ["delitem", "removeritem", "tiraritem"],
  description: "Remove um item específico ou reduz a quantidade do inventário de um usuário.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      if (!args[0] || !args[1]) {
        return message.reply({
          content: `📖 **Uso Correto:**\n> \`${prefixo}removeitem <@usuário/ID> <item> [quantidade]\`\n\n` +
            `💡 **Exemplos:**\n` +
            `> \`${prefixo}removeitem @user arma\` *(Remove a arma de fogo equipada)*\n` +
            `> \`${prefixo}removeitem @user porte\` *(Remove o Porte de Armas)*\n` +
            `> \`${prefixo}removeitem @user trigo 20\` *(Remove 20x Trigo)*`
        });
      }

      const targetUser = getUser(message, args[0]);
      if (!targetUser || !targetUser.id) {
        return message.reply({ content: `${emoji.negativo || '❌'} **|** Usuário não encontrado ou inválido.` });
      }

      const rawItemQuery = args[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const rawQuantidade = args[2] ? NumberConvert(args[2]) : 1;
      const quantidade = (!rawQuantidade || isNaN(rawQuantidade) || rawQuantidade < 1) ? 1 : Math.floor(rawQuantidade);

      const dbPath = `economia/${targetUser.id}/inventario/itens`;

      // Equipamentos
      const equipMap = {
        'arma': 'arma',
        'armas': 'arma',
        'porte': 'porte',
        'portedearmas': 'porte',
        'armacaca': 'armacaça',
        'armadecaca': 'armacaça',
        'vara': 'vara',
        'varadepescar': 'vara',
        'enxada': 'enxada',
        'regador': 'regador',
        'anel': 'anelcasamento',
        'anelcasamento': 'anelcasamento'
      };

      if (equipMap[rawItemQuery]) {
        const key = equipMap[rawItemQuery];
        await database.ref(`${dbPath}/Equipamentos/${key}`).remove();

        const embed = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle('🗑️ Equipamento Removido')
          .setDescription(
            `O equipamento \`${key}\` foi removido com sucesso de <@${targetUser.id}>!\n\n` +
            `👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
            `🛡️ **Staff:** <@${message.author.id}>`
          )
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      // Consumíveis
      const consumiveisNormalizados = {
        'trigo': 'Trigo',
        'milho': 'Milho',
        'feijao': 'Feijão',
        'canadeacucar': 'CanaDeAçucar',
        'cana': 'CanaDeAçucar',
        'cenoura': 'Cenoura',
        'abobora': 'Abóbora',
        'semente_trigo': 'semente_trigo',
        'semente_milho': 'semente_milho',
        'semente_feijao': 'semente_feijao',
        'semente_cana': 'semente_cana',
        'semente_cenoura': 'semente_cenoura',
        'semente_abobora': 'semente_abobora',
        'ovo': 'Ovo',
        'leite': 'Leite',
        'bacon': 'Bacon',
        'racao_animal': 'ração_animal',
        'racao': 'ração_animal',
        'isca': 'isca',
        'peixe': 'peixe',
        'carne': 'carne',
        'adubo': 'adubo',
        'municao': 'munição',
        'balas': 'munição',
        'backgroundticket': 'backgroundticket',
        'ticket': 'backgroundticket',
        'bau': 'baús',
        'baus': 'baús',
        'chave': 'chave'
      };

      const matchedConsumivel = consumiveisNormalizados[rawItemQuery];

      if (!matchedConsumivel) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Item não reconhecido (\`${args[1]}\`).`
        });
      }

      const snapCurrent = await database.ref(`${dbPath}/Consumíveis/${matchedConsumivel}`).once('value');
      const atual = Number(snapCurrent.val() || 0);

      if (atual <= 0) {
        return message.reply({
          content: `${emoji.aviso || '⚠️'} **|** O usuário <@${targetUser.id}> já não possui nenhum(a) \`${matchedConsumivel}\` no inventário.`
        });
      }

      const novoTotal = Math.max(0, atual - quantidade);

      if (novoTotal === 0) {
        await database.ref(`${dbPath}/Consumíveis/${matchedConsumivel}`).remove();
      } else {
        await database.ref(`${dbPath}/Consumíveis/${matchedConsumivel}`).set(novoTotal);
      }

      const embed = new EmbedBuilder()
        .setColor('#ef4444')
        .setTitle('🗑️ Item Consumível Removido')
        .setDescription(
          `Foram removidos **-${Format(quantidade)}x ${matchedConsumivel}** da mochila de <@${targetUser.id}>!\n\n` +
          `📊 **Saldo restante no inventário:** \`${Format(novoTotal)}x\`\n` +
          `👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
          `🛡️ **Staff:** <@${message.author.id}>`
        )
        .setFooter({ text: 'Sistine Administração de Inventário' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('[Command removeitem error]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao remover o item.`
      });
    }
  }
};
