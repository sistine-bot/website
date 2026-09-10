const { 
  EmbedBuilder, 
  AttachmentBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionsBitField 
} = require('discord.js');
const { Format, getUser, getUserInventory } = require('../../utils/functions.js');
const { generateUserProfileImage } = require('../../utils/satoriProfile.js');

module.exports = {
  name: "perfil",
  aliases: ["profile", "p"],
  
  run: async (client, message, args, prefixo, color, database, emoji) => {
    try {
      const user = getUser(message, args[0]) || message.author;
      const msg = await message.reply({ 
        content: `<a:loading:929931026589954128> **|** Carregando perfil de **${user.username}**...` 
      });

      // Render profile using Satori engine
      const { buffer, data } = await generateUserProfileImage(user, message.author.id, client, database);

      // Check guild permissions for attachments
      if (message.guild) {
        const botPerms = message.channel?.permissionsFor(message.guild.members.me);
        if (botPerms && !botPerms.has(PermissionsBitField.Flags.AttachFiles)) {
          if (botPerms.has(PermissionsBitField.Flags.EmbedLinks)) {
            const fallbackEmbed = new EmbedBuilder()
              .setColor(color?.embed || '#831396')
              .setAuthor({ name: `Perfil de ${user.username}`, iconURL: user.displayAvatarURL({ extension: 'png' }) })
              .setThumbnail(user.displayAvatarURL({ extension: 'png', size: 256 }))
              .setDescription(`📝 **Sobre mim:**\n*${data.sobremim}*`)
              .addFields(
                { name: '💰 Economia', value: `**Carteira:** ${Format(data.carteira)}\n**Banco:** ${Format(data.banco)}`, inline: true },
                { name: '⭐ Reputação', value: `${data.reputacoes} recebidas`, inline: true }
              );

            if (data.conjuge) {
              fallbackEmbed.addFields({ 
                name: '💍 Casamento', 
                value: `Casado(a) com **${data.conjuge.nome}** (${data.conjuge.data})` 
              });
            }

            return await msg.edit({
              content: "⚠️ *Sem permissão para anexar imagens neste canal. Exibindo versão resumida:*",
              embeds: [fallbackEmbed]
            });
          }
        }
      }

      const attachment = new AttachmentBuilder(buffer, { name: `profile-${user.username}.png` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("edit-profile").setStyle(ButtonStyle.Secondary).setEmoji('✏️'),
      );

      const replyOptions = {
        content: `${user}`,
        files: [attachment]
      };

      if (user.id === message.author.id) {
        replyOptions.components = [row];
      }

      await msg.edit(replyOptions);

      // Interactive collector for profile edit button
      if (user.id === message.author.id) {
        const coletor = msg.createMessageComponentCollector({ 
          filter: x => x.user.id === message.author.id, 
          time: 120000 
        });

        coletor.on('collect', async (int) => {
          try {
            await int.deferUpdate();
            if (int.customId === 'edit-profile') {
              const inv = await getUserInventory(message.author) || {};
              const possuiTicketOuVip = (data.vip > 0) ? false : ((inv.backgroundticket || 0) > 0) ? false : true;

              const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('edit-profile-layout').setStyle(ButtonStyle.Primary).setEmoji('✏️'),
                new ButtonBuilder().setCustomId('edit-profile-background').setStyle(ButtonStyle.Primary).setEmoji('🖼️').setDisabled(possuiTicketOuVip),
                new ButtonBuilder().setCustomId('edit-profile-Sobremim').setStyle(ButtonStyle.Primary).setEmoji('💬'),
              );

              const embed = new EmbedBuilder()
                .setColor('#AC28AE')
                .setDescription(`**Editar perfil:**\n✏️ **|** Layout\n🖼️ **|** Background\n💬 **|** Sobremim`);

              const msg2 = await message.reply({ embeds: [embed], components: [row2] });
              setTimeout(() => { msg2.delete().catch(() => {}); }, 30000);
            }
          } catch (e) {
            console.error('[PrefixCommand/perfil] Collector error:', e);
          }
        });

        coletor.on('end', () => {
          const rowDesativada = ActionRowBuilder.from(row);
          rowDesativada.components.forEach(btn => btn.setDisabled(true));
          msg.edit({ components: [rowDesativada] }).catch(() => {});
        });
      }

    } catch (error) {
      console.error("❌ Erro no comando prefixo !perfil (Satori):", error);
      return message.reply({ content: `❌ Ocorreu um erro inesperado ao carregar seu perfil.` }).catch(() => {});
    }
  }
};
