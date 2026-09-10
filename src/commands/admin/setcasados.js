const { EmbedBuilder } = require('discord.js')
const { getUser } = require('../../utils/functions.js');
const moment = require("moment");

module.exports = {
  name: "setcasados",
  aliases: [],
  
  run: async (client, message, args, prefixo, color, database, emoji) => {
    
    try {
        
        if (!(client.config.cargos.criador).includes(message.author.id)) {
            return false;
        }

        if (!args[0] || !args[1]) {
            return message.reply(`Você esqueceu de mencionar alguém\n> ${prefixo}setcasados @user1 @user2`)
        }
    
        const user1 = getUser(message, args[0]);
        const user2 = getUser(message, args[1]);
    
        if (!user1 || !user2) return message.reply(`A Você esqueceu de mencionar alguém\n> ${prefixo}setcasados @user1 @user2`);

        database.ref(`economia/${user1.id}/Casamento`).set({
            casado: user2.id,
            dataCasamento: moment(Date.now()).format("DD-MM-YYYY"),
            datanow: Date.now()
        });

        database.ref(`economia/${user2.id}/Casamento/`).set({
            casado: user1.id,
            dataCasamento: moment(Date.now()).format("DD-MM-YYYY"),
            datanow: Date.now()
        });
    
        const embed = new EmbedBuilder()
        .setColor(color.embed)
        .setDescription(`${emoji.positivo} **|** ${user1} e ${user2} agora estão casados`)
      
        return message.reply({ embeds: [embed] })

    } catch (error) {
      console.error(error);
      return message.error()
    }
    
  }
};
