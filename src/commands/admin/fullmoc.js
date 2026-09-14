const { EmbedBuilder } = require('discord.js')
const itens = require(`${process.cwd()}/src/utils/itens.json`);
const { getUser } = require('../../utils/functions.js');

module.exports = {
  name: "fullmoc",
  aliases: ['fullmochila', 'mochilafull'],
  
  run: async (client, message, args, prefixo, color, database, emoji) => {
    
    try {

        if (!(client.config.cargos.criador).includes(message.author.id)) {
            return false;
        }
        
        let user = getUser(message, args[1]);
        
        const db = `economia/${user.id}/inventario/itens`

        database.ref(`${db}/Consumíveis/`).update({
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
        });

        database.ref(`${db}/Equipamentos`).update({
            anelcasamento: { item: 1, nome: "Anel de Casamento", Xp: 0 },
            porte: { item: 1, nome: "Porte de Armas", Xp: 0 },
            armacaça: { item: 1, nome: "Arma de Caça", Xp: 100 },
            arma: { item: 4, nome: "Ak-47", Xp: 100 },
            vara: { item: 1, nome: itens.vara.nome, Xp: 100 },
            enxada: { item: 1, nome: "Enxada", Xp: 100 },
            regador: { item: 1, nome: "Regador", Xp: 100, agua: 100 },
        });
        
        const embed = new EmbedBuilder()
        .setDescription(`${emoji.dinheiro} **|** ${user} ficou com a mochila cheia.`)
        .setColor(color.embed)
        
        return message.reply({ embeds: [embed] })
        
    } catch (error) {
      console.error(error);
      return message.error()
    }

  }
}