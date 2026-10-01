const { 
  EmbedBuilder, 
  ApplicationCommandType, 
  ApplicationCommandOptionType, 
  AttachmentBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionsBitField 
} = require('discord.js');
const moment = require('moment-timezone');
const { Format, getUserInventory } = require('../../utils/functions/index.js');
const { generateUserProfileImage } = require('../../utils/rendering/satoriProfile.js');

module.exports = {
  name: "perfil",
  description: "⌊⚙️ Módulos⌉ Veja seu perfil e informações sobre você.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "usuário",
      type: ApplicationCommandOptionType.User,
      description: "Mencione alguém para ver o perfil dela",
      required: false,
    }
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    try {
      // Define o usuário alvo (mencionado ou quem executou o comando)
      const user = interaction.options.getUser("usuário") || interaction.user;

      // Mensagem de carregamento inicial
      await interaction.followUp({ 
        content: `<a:loading:929931026589954128> **|** Carregando perfil de **${user.username}**...` 
      });

      // Validação de permissão do bot para anexar arquivos no canal
      if (interaction.inGuild && interaction.inGuild()) {
        const botPerms = interaction.guild.members.me.permissionsIn(interaction.channel);
        if (!botPerms.has(PermissionsBitField.Flags.AttachFiles)) {
          return interaction.editReply({ 
            content: `❌ **|** Eu não tenho permissão para enviar anexos/imagens neste canal.` 
          });
        }
      }

      // Renderiza a imagem do perfil via Satori Engine
      // (O satoriProfile.js chama getResolvedUserBadges e filtra apenas as badges ativas)
      const { buffer } = await generateUserProfileImage(user, interaction.user.id, client, database);

      // Cria o anexo da imagem
      const attachment = new AttachmentBuilder(buffer, { name: 'perfil.png' });

      // Envia a imagem do perfil renderizada
      await interaction.editReply({
        content: `${user}`,
        files: [attachment],
      });
      
    } catch (error) {
      console.error("❌ Erro no comando /perfil (Satori):", error);
      return interaction.followUp({ content: `Ocorreu um erro inesperado ao gerar a imagem do perfil.` }).catch(() => {});
    }
  }
};