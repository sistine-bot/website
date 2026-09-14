const { EmbedBuilder } = require('discord.js')
const { getUserInventory, getUser } = require('../../utils/functions.js');
const itensAPI = require(`../../utils/itens.json`);

module.exports = {
  name: "inventário",
  aliases: ['inv', 'inventario'],
  
  run: async (client, message, args, prefixo, color, database, emoji) => {
    
    try {
      
      const user = getUser(message, args[0]);

      let inv = await getUserInventory(user);
      
      const Embed = new EmbedBuilder()
      .setColor(color.embed)
      .setTitle("Seu inventário")
      .setDescription(`
${inv.armacaça?.item ? `<:armacaca:1002636342557155370> **|** ${itensAPI.armacaça.nome[0]}: ${inv.armacaça.Xp ? `✅ (${inv.armacaça.Xp}%)` : '❌'}\n` : ''}${inv.arma?.item ? `🔫 **|** ${inv.arma.nome}: ${inv.arma.Xp ? `✅ (${inv.arma.Xp}%)` : '❌'}\n` : ''}${inv.vara?.item ? `🎣 **|** ${inv.vara.nome[0]}: ${inv.vara.Xp ? `✅ (${inv.vara.Xp}%)` : '❌'}\n` : ''}${inv.enxada?.item ? `⛏️ **|** ${itensAPI.enxada.nome[0]}: ${inv.enxada.Xp ? `✅ (${inv.enxada.Xp}%)` : '❌'}\n` : ''}${inv.regador?.item ? `🚿 **|** ${itensAPI.regador.nome[0]}: ${inv.regador.Xp ? `✅ (${inv.regador.Xp}%)` : '❌'} (💧${inv.regador.agua || 0}%)\n` : ''}${inv.porte?.item ? `📜 **|** ${inv.porte.nome}: ✅\n` : ''}${inv.anelcasamento?.item ? `💍 **|** ${inv.anelcasamento.nome}: ✅\n` : ''}${inv.munição ? `<:bullet:1002628038778961981> **|** ${itensAPI.munição.nome[0]}: ${inv.munição}\n` : ''}${inv.semente_trigo ? `🌾 **|** ${itensAPI.semente_trigo.nome[0]}: ${inv.semente_trigo}\n` : ''}${inv.semente_milho ? `🌽 **|** ${itensAPI.semente_milho.nome[0]}: ${inv.semente_milho}\n` : ''}${inv.semente_feijao ? `🫘 **|** ${itensAPI.semente_feijao.nome[0]}: ${inv.semente_feijao}\n` : ''}${inv.semente_cana ? `🎋 **|** ${itensAPI.semente_cana.nome[0]}: ${inv.semente_cana}\n` : ''}${inv.semente_cenoura ? `🥕 **|** ${itensAPI.semente_cenoura.nome[0]}: ${inv.semente_cenoura}\n` : ''}${inv.semente_abobora ? `🎃 **|** ${itensAPI.semente_abobora.nome[0]}: ${inv.semente_abobora}\n` : ''}${inv.Trigo ? `<:trigo:994604784571125770> **|** ${itensAPI.Trigo.nome[0]}: ${inv.Trigo}\n` : ''}${inv.Milho ? `<:milho:994602871511334912> **|** ${itensAPI.Milho.nome[0]}: ${inv.Milho}\n` : ''}${inv.Feijão ? `<:feijo:994608694375497798> **|** ${itensAPI.Feijão.nome[0]}: ${inv.Feijão}\n` : ''}${inv.CanaDeAçucar ? `<:canadeacucar:994610951884128347> **|** ${itensAPI.CanaDeAçucar.nome[0]}: ${inv.CanaDeAçucar}\n` : ''}${inv.Cenoura ? `<:cenoura:948417146273275915> **|** ${itensAPI.Cenoura.nome[0]}: ${inv.Cenoura}\n` : ''}${inv.Abóbora ? `<:abobora:994611617264308344> **|** ${itensAPI.Abóbora.nome[0]}: ${inv.Abóbora}\n` : ''}${inv.planta_podre ? `🥀 **|** Planta Podre: ${inv.planta_podre}\n` : ''}${inv.Ovo ? `<:ovo:1002603609139187733> **|** ${itensAPI.Ovo.nome[0]}: ${inv.Ovo}\n` : ''}${inv.Leite ? `<:leite:1002603490536853595> **|** ${itensAPI.Leite.nome[0]}: ${inv.Leite}\n` : ''}${inv.Bacon ? `<:bacon:1002603721227767848> **|** ${itensAPI.Bacon.nome[0]}: ${inv.Bacon}\n` : ''}${inv.ração_animal ? `<:comidaAnimal:1060974202980671508> **|** ${itensAPI.ração_animal.nome[0]}: ${inv.ração_animal}\n` : ''}${inv.isca ? `🦐 **|** ${itensAPI.isca.nome[0]}: ${inv.isca}\n` : ''}${inv.carne ? `🥩 **|** ${itensAPI.carne.nome[0]}: ${inv.carne}\n` : ''}${inv.peixe ? `🐟 **|** ${itensAPI.peixe.nome[0]}: ${inv.peixe}\n` : ''}${inv.adubo ? `💩 **|** Adubo: ${inv.adubo}\n` : ''}${inv.backgroundticket ? `🎟️ **|** ${itensAPI.backgroundticket.nome[0]}: ${inv.backgroundticket}\n` : ''}
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
