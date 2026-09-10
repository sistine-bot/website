const { EmbedBuilder } = require('discord.js')
const { getUserInventory, getUser } = require('../../utils/functions.js');
const itensAPI = require(`../../utils/itens.json`);

module.exports = {
  name: "inventário",
  aliases: ['inv', 'inventario'],
  
  run: async (client, message, args, prefixo, color, database, emoji) => {
    
    try {
      
      const user = getUser(message, args[0]);

      let {
        Trigo, Milho, Feijão, Cenoura, Abóbora, CanaDeAçucar,
      
        Ovo, Leite, Bacon, ração_animal, isca, peixe, carne,
      
        munição, armacaça, arma,
      
        porte, anelcasamento, vara, adubo, backgroundticket
      } = await getUserInventory(user)
      
      const Embed = new EmbedBuilder()
      .setColor(color.embed)
      .setTitle("Seu inventário")
      .setDescription(`
${armacaça.item ? `<:armacaca:1002636342557155370> **|** ${itensAPI.armacaça.nome[0]}: ${armacaça.Xp ? `✅ (${armacaça.Xp}%)` : '❌'}\n` : 
''}${arma.item ? `🔫 **|** ${arma.nome}: ${arma.Xp ? `✅ (${arma.Xp}%)` : '❌'}\n` : 
''}${vara.item ? `🎣 **|** ${vara.nome}: ${vara.Xp ? `✅ (${vara.Xp}%)` : '❌'}\n` : 
''}${porte.item ? `📜 **|** ${porte.nome}: ✅\n` : 
''}${anelcasamento.item ? `💍 **|** ${anelcasamento.nome}: ✅\n` :
''}${munição ? `<:bullet:1002628038778961981> **|** ${itensAPI.munição.nome[0]}: ${munição}\n` :
''}${Trigo ? `<:trigo:994604784571125770> **|** ${itensAPI.Trigo.nome[0]}: ${Trigo}\n` :
''}${Milho ? `<:milho:994602871511334912> **|** ${itensAPI.Milho.nome[0]}: ${Milho}\n` : 
''}${Feijão ? `<:feijo:994608694375497798> **|** ${itensAPI.Feijão.nome[0]}: ${Feijão}\n` : 
''}${CanaDeAçucar ? `<:canadeacucar:994610951884128347> **|** ${itensAPI.CanaDeAçucar.nome[0]}: ${CanaDeAçucar}\n` : 
''}${Cenoura ? `<:cenoura:948417146273275915> **|** ${itensAPI.Cenoura.nome[0]}: ${Cenoura}\n` : 
''}${Abóbora ? `<:abobora:994611617264308344> **|** ${itensAPI.Abóbora.nome[0]}: ${Abóbora}\n` : 
''}${Ovo ? `<:ovo:1002603609139187733> **|** ${itensAPI.Ovo.nome[0]}: ${Ovo}\n` : 
''}${Leite ? `<:leite:1002603490536853595> **|** ${itensAPI.Leite.nome[0]}: ${Leite}\n` : 
''}${Bacon ? `<:bacon:1002603721227767848> **|** ${itensAPI.Bacon.nome[0]}: ${Bacon}\n` : 
''}${ração_animal ? `<:comidaAnimal:1060974202980671508> **|** ${itensAPI.ração_animal.nome[0]}: ${ração_animal}\n` : 
''}${isca ? `🦐 **|** ${itensAPI.isca.nome[0]}: ${isca}\n` : 
''}${carne ? `🥩 **|** ${itensAPI.ração_animal.nome[0]}: ${carne}\n` : 
''}${peixe ? `🐟 **|** ${itensAPI.ração_animal.nome[0]}: ${peixe}\n` : 
''}${adubo ? `💩 **|** ${itensAPI.ração_animal.nome[0]}: ${adubo}\n` : 
''}${backgroundticket ? `🎟️ **|** ${itensAPI.backgroundticket.nome[0]}: ${backgroundticket}\n` : ''}
      `)
      .setThumbnail("https://lh3.googleusercontent.com/aGdLFdcg3a_wIW1KXy38qsYhQ0BE6pemI1R0XRq-zbp7zwyUjmqXlY2N6WiPtyz8KghMLR9bAvx6u5IoWTlCMw=s400")
      .setTimestamp()
      .setFooter({ text: 'Inventário', iconURL: user.displayAvatarURL({ format: 'png' }) });
      
      return message.reply({ ephemeral: true, embeds: [Embed] })
      
    } catch (error) {
      console.error(error)
      return message.error()
    }
    
  }
};
