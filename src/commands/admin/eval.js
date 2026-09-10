
const { EmbedBuilder } = require('discord.js')
const functions = require('../../utils/functions.js');

var fs = require('fs');

function alert(content) {
  console.log(content)
};

function clean(text) {
    if (typeof(text) === "string")
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else
        return text;
}

module.exports = {
  name: "eval",
  aliases: ['e'],
  
  run: async(client, message, args, prefixo, color, database, emoji)=> {
  
    if (!(client.config.cargos.criador).includes(message.author.id)) {
      return false;
    }
    
    if (!args[0]) {
      message.delete().catch(e => { })
      return message.reply("Cade o código burrão");
    }

    let code = args.slice(0).join(' ');

    args = args.join(' ');
    
    try {

      var evaled = await eval(args);
      if (typeof evaled !== 'string') evaled = await require('util').inspect(evaled);  

      const embed1 = new EmbedBuilder()
      .setColor('FFFFFF')
      .setDescription(`
**entrada**
\`\`\`${code}\`\`\`
**Saida**
\`\`\`js\n${clean(evaled)}\n\`\`\``)

      return message.reply({ embeds: [embed1] })
      
    } 
    catch (err) {
      
      const embed2 = new EmbedBuilder()
      .setColor('FFFFFF')
      .setDescription(`
**Entrada**
\`\`\`${code}\`\`\`
**Saida**
\`\`\`js\n${clean(err)}\n\`\`\``)
      
      message.reply({ embeds: [embed2] })
    
}}
};
