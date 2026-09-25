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
const { Format, getUserInventory } = require('../../utils/functions.js');
const { generateUserProfileImage } = require('../../utils/satoriProfile.js');

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

      // Se o perfil for do próprio usuário que executou o comando, exibe o botão de edição
      const isSelf = user.id === interaction.user.id;
      let components = [];

      if (isSelf) {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('edit_profile_btn')
            .setLabel('Editar Perfil')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('✏️')
        );
        components = [row];
      }

      // Envia a imagem do perfil renderizada
      const profileMsg = await interaction.editReply({
        content: null,
        files: [attachment],
        components: components
      });

      // Se for o próprio perfil, ativa o collector para o botão de edição
      if (isSelf) {
        const filter = (i) => i.customId === 'edit_profile_btn' && i.user.id === interaction.user.id;
        const coletor = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        coletor.on('collect', async (i) => {
          try {
            await i.deferUpdate();

            // Verifica se o usuário possui ticket de background no inventário
            const inv = await getUserInventory(user) || {};
            const possuiTicketOuVip = (inv.backgroundticket || 0) <= 0;

            const row2 = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('edit-profile-layout')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('✏️'),
              new ButtonBuilder()
                .setCustomId('edit-profile-background')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🖼️')
                .setDisabled(possuiTicketOuVip),
              new ButtonBuilder()
                .setCustomId('edit-profile-Sobremim')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('💬')
            );

            const embed = new EmbedBuilder()
              .setColor('#AC28AE')
              .setDescription(`**Editar perfil:**\n✏️ **|** Layout\n🖼️ **|** Background\n💬 **|** Sobremim`);

            const msg2 = await interaction.followUp({ embeds: [embed], components: [row2], ephemeral: true });
            setTimeout(() => { msg2.delete().catch(() => {}); }, 30000);
          } catch (e) {
            console.error('[SlashCommand/perfil] Erro no collector de edição:', e);
          }
        });

        coletor.on('end', () => {
          // Remove os botões de interatividade após expirar o tempo (60s)
          interaction.editReply({ components: [] }).catch(() => {});
        });
      }

    } catch (error) {
      console.error("❌ Erro no comando /perfil (Satori):", error);
      return interaction.followUp({ content: `Ocorreu um erro inesperado ao gerar a imagem do perfil.` }).catch(() => {});
    }
  }
};