const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, } = require('discord.js');

module.exports =  {
  "name": "help",
  "description": `⌊🛠️ Utilidades⌉ Veja informações detalhadas sobre um comando`,
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      "name": "comando",
      "type": ApplicationCommandOptionType.String,
      "description": "Digite o nome do comando.",
      "required": false,
    }
  ],

  run: async (client, interaction, args, color, database, emoji) => {
    
    try {

      let comando = interaction.options.getString("comando")
      
      if (!comando) {
        
        const embed = new EmbedBuilder()
        .setDescription(`Olá, ${interaction.user}, eu sou a ${client.user.username}, um bot integrado que separa seu servidor dos outros!.

**Problemas, dúvidas? entre no meu Discord:**
> ${client.config?.SUPPORT_LINK || "https://discord.gg/sistine"}

**Você pode ver informações detalhadas sobre um comando utilizando:**
> \`/help comando:[NOME]\`
        `)
        .setTimestamp()
        .setColor(color.embed);
        
        return interaction.followUp({ embeds: [embed] });
      } 
      else {
        comando = comando.split(/ +/g);

        const command = client.slashCommands.get(comando[0].toLowerCase()) ||
          client.slashCommands.find(
            (c) => c.aliases && c.aliases.includes(comando[0].toLowerCase())
          )
        
        if (!command) {
          const embed = new EmbedBuilder()
            .setTitle(`Não consegui encontrar o comando: \`${comando[0].toLowerCase()}\`, utilize: \`/\` para ver a lista de comandos.`)
            .setColor(color.embed);
          return interaction.followUp({ embeds: [embed] });
        }
        
        function LimpDesc(mensagem) {
          return mensagem.replace('⌊⚙️ Módulos⌉', '').replace('⌊🛠️ Utilidades⌉', '').replace('⌊😂 Diversão⌉', '').replace('⌊🎰 Apostas⌉', '').replace('⌊💸 Economia⌉', '')
        }
        
        const ComandoGDescrição = await LimpDesc(command.description)
        
        const embed = new EmbedBuilder()
        .setTitle(command.description.split(' ')[0].slice(1) + " - Detalhes do comando:")
        .addFields(
          { name: "Comando:", value: command.name ? `\`${command.name}\`` : "Nenhum nome para este comando."},
          { name: "Uso:", value: command.options ? `${command.options.map(C => ` \`/${command.name} ${C.name}\` - ${LimpDesc(C.description)}`).join('\n')}` : `\`/${command.name}\``},
          { name: "Descrição:", value: ComandoGDescrição ? ComandoGDescrição : "Nenhuma descrição para este comando." },
        )
        .setTimestamp()
        .setColor(color.embed);
        
        return interaction.followUp({ embeds: [embed] });
      }
      
    } catch (error) {
      console.error(error)
      return interaction.error({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  
  }
}