const { EmbedBuilder } = require('discord.js');
const itens = require(`${process.cwd()}/src/utils/itens.json`);
const { getUser, isStaff, NumberConvert, getUserInventory, Format } = require('../../utils/functions.js');

module.exports = {
  name: "additem",
  aliases: ["daritem", "giveitem", "itemadd"],
  description: "Adiciona um item específico ao inventário/mochila de um usuário.",

  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      if (!isStaff(client, message.author.id)) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** Apenas a Staff Global (Criadores e Desenvolvedores) pode executar este comando.`
        });
      }

      if (!args[0] || !args[1]) {
        return message.reply({
          content: `📖 **Uso Correto:**\n> \`${prefixo}additem <@usuário/ID> <item> [quantidade]\`\n\n` +
            `💡 **Exemplos:**\n` +
            `> \`${prefixo}additem @user porte\` *(Adiciona Porte de Armas)*\n` +
            `> \`${prefixo}additem @user ak47\` *(Adiciona AK-47)*\n` +
            `> \`${prefixo}additem @user trigo 50\` *(Adiciona 50x Trigo)*\n` +
            `> \`${prefixo}additem @user munição 100\` *(Adiciona 100x Munição)*`
        });
      }

      const targetUser = getUser(message, args[0]);
      if (!targetUser || !targetUser.id) {
        return message.reply({ content: `${emoji.negativo || '❌'} **|** Usuário não encontrado ou inválido.` });
      }

      const rawItemQuery = args[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const rawQuantidade = args[2] ? NumberConvert(args[2]) : 1;
      const quantidade = (!rawQuantidade || isNaN(rawQuantidade) || rawQuantidade < 1) ? 1 : Math.floor(rawQuantidade);

      // Mapeamento especial de armas de fogo
      const weaponMap = {
        'glock': { id: 1, nome: 'Glock' },
        'mp5': { id: 2, nome: 'MP5' },
        'm4a1': { id: 3, nome: 'M4-A1' },
        'm4': { id: 3, nome: 'M4-A1' },
        'ak47': { id: 4, nome: 'Ak-47' },
        'ak': { id: 4, nome: 'Ak-47' }
      };

      const dbPath = `economia/${targetUser.id}/inventario/itens`;

      if (weaponMap[rawItemQuery]) {
        const weaponInfo = weaponMap[rawItemQuery];
        await database.ref(`${dbPath}/Equipamentos/arma`).set({
          item: weaponInfo.id,
          nome: weaponInfo.nome,
          Xp: 100
        });

        const embed = new EmbedBuilder()
          .setColor('#10b981')
          .setTitle('🔫 Arma Adicionada com Sucesso!')
          .setDescription(
            `A arma **${weaponInfo.nome}** foi equipada no inventário de <@${targetUser.id}>!\n\n` +
            `👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
            `🛡️ **Staff:** <@${message.author.id}>`
          )
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      // Procura por outros equipamentos
      if (rawItemQuery === 'porte' || rawItemQuery === 'portedearmas') {
        await database.ref(`${dbPath}/Equipamentos/porte`).set({
          item: 1,
          nome: "Porte de Armas",
          Xp: 0
        });

        const embed = new EmbedBuilder()
          .setColor('#10b981')
          .setTitle('🪪 Porte de Armas Concedido!')
          .setDescription(
            `O **Porte de Armas** legal foi concedido ao usuário <@${targetUser.id}>!\n\n` +
            `👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
            `🛡️ **Staff:** <@${message.author.id}>`
          )
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      if (rawItemQuery === 'armacaca' || rawItemQuery === 'armadecaca') {
        await database.ref(`${dbPath}/Equipamentos/armacaça`).set({
          item: 1,
          nome: "Arma de Caça",
          Xp: 100
        });

        const embed = new EmbedBuilder()
          .setColor('#10b981')
          .setTitle('🏹 Equipamento Concedido!')
          .setDescription(
            `A **Arma de Caça** foi adicionada ao usuário <@${targetUser.id}>!\n\n` +
            `👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
            `🛡️ **Staff:** <@${message.author.id}>`
          )
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      if (rawItemQuery === 'vara' || rawItemQuery === 'varadepescar') {
        await database.ref(`${dbPath}/Equipamentos/vara`).set({
          item: 1,
          nome: "Vara de Pescar",
          Xp: 100
        });

        const embed = new EmbedBuilder()
          .setColor('#10b981')
          .setTitle('🎣 Equipamento Concedido!')
          .setDescription(`A **Vara de Pescar** foi adicionada ao usuário <@${targetUser.id}>!`)
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      if (rawItemQuery === 'enxada') {
        await database.ref(`${dbPath}/Equipamentos/enxada`).set({
          item: 1,
          nome: "Enxada",
          Xp: 100
        });

        const embed = new EmbedBuilder()
          .setColor('#10b981')
          .setTitle('⛏️ Equipamento Concedido!')
          .setDescription(`A **Enxada** foi adicionada ao usuário <@${targetUser.id}>!`)
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      if (rawItemQuery === 'regador') {
        await database.ref(`${dbPath}/Equipamentos/regador`).set({
          item: 1,
          nome: "Regador",
          Xp: 100,
          agua: 100
        });

        const embed = new EmbedBuilder()
          .setColor('#10b981')
          .setTitle('🚿 Equipamento Concedido!')
          .setDescription(`O **Regador** (100% água) foi adicionado ao usuário <@${targetUser.id}>!`)
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      if (rawItemQuery === 'anel' || rawItemQuery === 'anelcasamento') {
        await database.ref(`${dbPath}/Equipamentos/anelcasamento`).set({
          item: 1,
          nome: "Anel de Casamento",
          Xp: 0
        });

        const embed = new EmbedBuilder()
          .setColor('#10b981')
          .setTitle('💍 Equipamento Concedido!')
          .setDescription(`O **Anel de Casamento** foi adicionado ao usuário <@${targetUser.id}>!`)
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      // Mapeamento de consumíveis comuns
      const consumiveisNormalizados = {
        'trigo': 'Trigo',
        'milho': 'Milho',
        'feijao': 'Feijão',
        'feijoes': 'Feijão',
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
          content: `${emoji.negativo || '❌'} **|** Item não reconhecido (\`${args[1]}\`).\n` +
            `💡 **Itens válidos:** \`porte\`, \`glock\`, \`mp5\`, \`m4a1\`, \`ak47\`, \`trigo\`, \`milho\`, \`feijao\`, \`cenoura\`, \`abobora\`, \`carne\`, \`peixe\`, \`municao\`, \`isca\`, \`bau\`, \`chave\`, \`vara\`, \`enxada\`, \`regador\`, etc.`
        });
      }

      const snapCurrent = await database.ref(`${dbPath}/Consumíveis/${matchedConsumivel}`).once('value');
      const atual = Number(snapCurrent.val() || 0);
      const novoTotal = atual + quantidade;

      await database.ref(`${dbPath}/Consumíveis/${matchedConsumivel}`).set(novoTotal);

      const embed = new EmbedBuilder()
        .setColor('#10b981')
        .setTitle('📦 Item Consumível Adicionado!')
        .setDescription(
          `Foram adicionados **+${Format(quantidade)}x ${matchedConsumivel}** na mochila de <@${targetUser.id}>!\n\n` +
          `📊 **Novo total no inventário:** \`${Format(novoTotal)}x\`\n` +
          `👤 **Usuário:** \`${targetUser.username || targetUser.tag || targetUser.id}\`\n` +
          `🛡️ **Staff:** <@${message.author.id}>`
        )
        .setFooter({ text: 'Sistine Administração de Inventário' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('[Command additem error]', error);
      return message.reply({
        content: `${emoji.negativo || '❌'} **|** Ocorreu um erro ao adicionar o item.`
      });
    }
  }
};
