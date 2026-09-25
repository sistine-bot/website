const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, MessageFlags } = require('discord.js');
const { getUserMoney, Format, CheckUserBlacklisted} = require('../../utils/functions.js');

module.exports =  {
  "name": "saldo",
  "description": `⌊💸 Economia⌉ Veja a quantia de dinheiro que você possui atualmente.`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "usuário",
      "type": ApplicationCommandOptionType.User,
      "description": "Mencione alguém para saber o dinheiro dela",
      "required": false,
    }
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    
    try {
      
      const user = interaction.options.getUser("usuário") || interaction.user;
      
      const { blacklisted, blacklistedMensagem } = await CheckUserBlacklisted(user);
      if (blacklisted) return await interaction.followUp({ content: blacklistedMensagem, flags: MessageFlags.Ephemeral });
      
      const { carteira, banco } = await getUserMoney(user);
      
      const embed = new EmbedBuilder()
      .setColor(color.embed)
      .setDescription(`💸 **|** Carteira: ${Format(carteira)}\n🏦 **|** Banco: ${Format(banco)}`);
      
      return await interaction.followUp({ content: `${user}`, embeds: [embed] });
      
    } catch (error) {
      console.error(error);
      return await interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
}