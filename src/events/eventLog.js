const { EmbedBuilder } = require('discord.js');
const client = require("../../index.js"); // Adapte para o caminho do seu index
const firebase = require("firebase");
const database = firebase.database();

// Função auxiliar para pegar a hora no formato correto
const getTime = () => new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const formatDate = date => moment.tz(date, 'America/Sao_Paulo').format("DD/MM/YYYY HH:mm:ss");

// =======================================================
// EVENTO 1: MENSAGENS APAGADAS (trackMessageDelete)
// =======================================================
client.on('messageDelete', async (message) => {
  if (!message.guild || message.author?.bot) return;

  try {
    const dbSnap = await database.ref(`servers/${message.guild.id}/events`).once('value');
    const config = dbSnap.val();

    if (!config || !config.status || !config.trackMessageDelete || !config.channel) return;

    const logChannel = message.guild.channels.cache.get(config.channel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Mensagem Apagada')
        .setColor('#f43f5e') // rose-500
        .setDescription(`**Autor:** ${message.author}\n**Canal:** ${message.channel}\n**Conteúdo:**\n\`\`\`${message.content || 'Sem texto/Mídia'}\`\`\``)
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    await database.ref(`servers/${message.guild.id}/logs`).push({
      time: getTime(), emoji: '🗑️', event: 'MENSAGEM APAGADA', color: 'text-rose-500',
      text: `Mensagem de ${message.author.username} apagada em #${message.channel.name}.`
    });
  } catch (error) { console.error(error); }
});

// =======================================================
// EVENTO 2: MENSAGENS EDITADAS (trackMessageEdit)
// =======================================================
client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (!newMessage.guild || newMessage.author?.bot || oldMessage.content === newMessage.content) return;

  try {
    const dbSnap = await database.ref(`servers/${newMessage.guild.id}/events`).once('value');
    const config = dbSnap.val();

    if (!config || !config.status || !config.trackMessageEdit || !config.channel) return;

    const logChannel = newMessage.guild.channels.cache.get(config.channel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('✏️ Mensagem Editada')
        .setColor('#f59e0b') // amber-500
        .setDescription(`**Autor:** ${newMessage.author}\n**Canal:** ${newMessage.channel}\n\n**Antes:**\n\`\`\`${oldMessage.content || 'Vazio'}\`\`\`\n**Depois:**\n\`\`\`${newMessage.content || 'Vazio'}\`\`\`\n[Ir para a mensagem](${newMessage.url})`)
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    await database.ref(`servers/${newMessage.guild.id}/logs`).push({
      time: getTime(), emoji: '✏️', event: 'MENSAGEM EDITADA', color: 'text-amber-500',
      text: `${newMessage.author.username} editou uma mensagem em #${newMessage.channel.name}.`
    });
  } catch (error) { console.error(error); }
});

// =======================================================
// EVENTO 3: ENTRADA E SAÍDA DE MEMBROS (trackMemberJoinLeave)
// =======================================================
client.on('guildMemberAdd', async (member) => {
  try {
    const dbSnap = await database.ref(`servers/${member.guild.id}/events`).once('value');
    const config = dbSnap.val();

    if (!config || !config.status || !config.trackMemberJoinLeave || !config.channel) return;

    const logChannel = member.guild.channels.cache.get(config.channel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('📥 Novo Membro Entrou')
        .setColor('#10b981') // emerald-500
        .setDescription(`**Usuário:** ${member.user.tag}\n**ID:** ${member.id}\n**Conta criada em:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    await database.ref(`servers/${member.guild.id}/logs`).push({
      time: getTime(), emoji: '📥', event: 'MEMBRO ENTROU', color: 'text-emerald-500', 
      text: `${member.user.username} acabou de entrar no servidor.`
    });
  } catch (error) { console.error(error); }
});

client.on('guildMemberRemove', async (member) => {
  try {
    const dbSnap = await database.ref(`servers/${member.guild.id}/events`).once('value');
    const config = dbSnap.val();

    if (!config || !config.status || !config.trackMemberJoinLeave || !config.channel) return;

    const logChannel = member.guild.channels.cache.get(config.channel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('📤 Membro Saiu')
        .setColor('#f43f5e') // rose-500
        .setDescription(`**Usuário:** ${member.user.tag}\n**ID:** ${member.id}`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    await database.ref(`servers/${member.guild.id}/logs`).push({
      time: getTime(), emoji: '📤', event: 'MEMBRO SAIU', color: 'text-rose-500', 
      text: `${member.user.username} saiu do servidor.`
    });
  } catch (error) { console.error(error); }
});

// =======================================================
// EVENTO 4: ALTERAÇÕES DE CARGOS E NOME (trackRoleUpdate)
// =======================================================
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  // if (oldMember.user.bot) return;

  try {
    const dbSnap = await database.ref(`servers/${newMember.guild.id}/events`).once('value');
    const config = dbSnap.val();

    if (!config || !config.status || !config.trackRoleUpdate || !config.channel) return;
    const logChannel = newMember.guild.channels.cache.get(config.channel);

    // 4.1 ALTERAÇÃO DE NOME (NICKNAME)
    if (oldMember.nickname !== newMember.nickname) {
      const oldNick = oldMember.nickname || oldMember.user.username;
      const newNick = newMember.nickname || newMember.user.username;

      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('🏷️ Apelido Alterado')
          .setColor('#3b82f6') // blue-500
          .setDescription(`**Usuário:** ${newMember.user}\n\n**Antigo:** ${oldNick}\n**Novo:** ${newNick}`)
          .setTimestamp();
        logChannel.send({ embeds: [embed] }).catch(() => {});
      }

      await database.ref(`servers/${newMember.guild.id}/logs`).push({
        time: getTime(), emoji: '🏷️', event: 'APELIDO ALTERADO', color: 'text-blue-500', 
        text: `${oldMember.user.username} mudou o apelido para ${newNick}.`
      });
    }

    // 4.2 ADIÇÃO OU REMOÇÃO DE CARGOS
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    if (oldRoles.size !== newRoles.size) {
      let roleAction = '';
      let roleChange = null;
      let logColor = '';
      let logColorTailwind = '';

      if (oldRoles.size < newRoles.size) {
        roleAction = 'Ganhou o cargo';
        roleChange = newRoles.difference(oldRoles).first();
        logColor = '#10b981'; // emerald
        logColorTailwind = 'text-emerald-400';
      } else {
        roleAction = 'Perdeu o cargo';
        roleChange = oldRoles.difference(newRoles).first();
        logColor = '#f43f5e'; // rose
        logColorTailwind = 'text-rose-400';
      }

      if (roleChange) {
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setTitle('🛡️ Cargo Atualizado')
            .setColor(logColor)
            .setDescription(`**Usuário:** ${newMember.user}\n**Ação:** ${roleAction} ${roleChange}`)
            .setTimestamp();
          logChannel.send({ embeds: [embed] }).catch(() => {});
        }

        await database.ref(`servers/${newMember.guild.id}/logs`).push({
          time: getTime(), emoji: '🛡️', event: 'CARGO ALTERADO', color: logColorTailwind, 
          text: `${newMember.user.username} ${roleAction.toLowerCase()} @${roleChange.name}.`
        });
      }
    }
  } catch (error) { console.error(error); }
});

// =======================================================
// EVENTO 5: CANAL DE VOZ (trackVoiceStatus)
// =======================================================
client.on('voiceStateUpdate', async (oldState, newState) => {
  if (newState.member.user.bot) return;

  try {
    const dbSnap = await database.ref(`servers/${newState.guild.id}/events`).once('value');
    const config = dbSnap.val();

    if (!config || !config.status || !config.trackVoiceStatus || !config.channel) return;
    const logChannel = newState.guild.channels.cache.get(config.channel);

    let actionStr = '';
    let emojiStr = '';
    let colorHex = '';
    let colorTailwind = '';

    // Entrou em um canal
    if (!oldState.channelId && newState.channelId) {
      actionStr = `Entrou no canal de voz **${newState.channel.name}**`;
      emojiStr = '🔊'; colorHex = '#10b981'; colorTailwind = 'text-emerald-500';
    } 
    // Saiu de um canal
    else if (oldState.channelId && !newState.channelId) {
      actionStr = `Saiu do canal de voz **${oldState.channel.name}**`;
      emojiStr = '🔇'; colorHex = '#f43f5e'; colorTailwind = 'text-rose-500';
    } 
    // Trocou de canal
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      actionStr = `Mudou do canal **${oldState.channel.name}** para **${newState.channel.name}**`;
      emojiStr = '🔃'; colorHex = '#f59e0b'; colorTailwind = 'text-amber-500';
    }

    if (actionStr !== '') {
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle(`${emojiStr} Atualização de Voz`)
          .setColor(colorHex)
          .setDescription(`**Usuário:** ${newState.member.user}\n**Ação:** ${actionStr}`)
          .setTimestamp();
        logChannel.send({ embeds: [embed] }).catch(() => {});
      }

      await database.ref(`servers/${newState.guild.id}/logs`).push({
        time: getTime(), emoji: emojiStr, event: 'STATUS DE VOZ', color: colorTailwind, 
        text: `${newState.member.user.username} ${actionStr.replace(/\*\*/g, '')}.` // Remove os negritos para o React
      });
    }
  } catch (error) { console.error(error); }
});

// =======================================================
// EVENTO 6: CRIAÇÃO, EXCLUSÃO E EDIÇÃO DE CARGOS (trackRoleUpdate)
// =======================================================

// 6.1 CARGO CRIADO
client.on('roleCreate', async (role) => {
  try {
    const dbSnap = await database.ref(`servers/${role.guild.id}/events`).once('value');
    const config = dbSnap.val();

    if (!config || !config.status || !config.trackRoleUpdate || !config.channel) return;

    const logChannel = role.guild.channels.cache.get(config.channel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('📥 Cargo Criado')
        .setColor('#10b981') // emerald-500
        .setDescription(`**Cargo:** ${role}\n**Nome:** ${role.name}\n**Cor:** ${role.hexColor}\n**ID:** ${role.id}`)
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    await database.ref(`servers/${role.guild.id}/logs`).push({
      time: getTime(), emoji: '📥', event: 'CARGO CRIADO', color: 'text-emerald-500', 
      text: `Um novo cargo foi criado: @${role.name}.`
    });
  } catch (error) { console.error(error); }
});


// 6.2 CARGO DELETADO
client.on('roleDelete', async (role) => {
  try {
    const dbSnap = await database.ref(`servers/${role.guild.id}/events`).once('value');
    const config = dbSnap.val();

    if (!config || !config.status || !config.trackRoleUpdate || !config.channel) return;

    const logChannel = role.guild.channels.cache.get(config.channel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('📤 Cargo Deletado')
        .setColor('#f43f5e') // rose-500
        .setDescription(`**Nome do Cargo:** ${role.name}\n**Cor:** ${role.hexColor}\n**ID:** ${role.id}`)
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    await database.ref(`servers/${role.guild.id}/logs`).push({
      time: getTime(), emoji: '📤', event: 'CARGO DELETADO', color: 'text-rose-500', 
      text: `O cargo @${role.name} foi apagado do servidor.`
    });
  } catch (error) { console.error(error); }
});


// 6.3 CARGO ATUALIZADO (Nome, Cor ou Permissão)
client.on('roleUpdate', async (oldRole, newRole) => {
  try {
    // 1. Descobre exatamente o que mudou no cargo
    const nameChanged = oldRole.name !== newRole.name;
    const colorChanged = oldRole.hexColor !== newRole.hexColor;
    const permsChanged = oldRole.permissions.bitfield !== newRole.permissions.bitfield;

    // Se a mudança for algo ignorável (ex: posição na lista que não queremos spam), ele cancela
    if (!nameChanged && !colorChanged && !permsChanged) return;

    const dbSnap = await database.ref(`servers/${newRole.guild.id}/events`).once('value');
    const config = dbSnap.val();

    if (!config || !config.status || !config.trackRoleUpdate || !config.channel) return;

    // 2. Prepara os textos de acordo com o que foi alterado
    let changesText = `**Cargo:** ${newRole} (${newRole.id})\n\n`;
    let dashboardText = `O cargo @${newRole.name} foi editado: `;
    let changesArr = [];

    if (nameChanged) {
      changesText += `**Nome:** \`${oldRole.name}\` ➔ \`${newRole.name}\`\n`;
      changesArr.push('Nome');
    }
    if (colorChanged) {
      changesText += `**Cor:** \`${oldRole.hexColor}\` ➔ \`${newRole.hexColor}\`\n`;
      changesArr.push('Cor');
    }
    if (permsChanged) {
      changesText += `**Permissões:** As permissões de administrador/acesso do cargo foram modificadas.\n`;
      changesArr.push('Permissões');
    }

    dashboardText += changesArr.join(', ') + ' atualizado(a).';

    // 3. Envia para o Discord
    const logChannel = newRole.guild.channels.cache.get(config.channel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('🔄 Cargo Atualizado')
        .setColor('#f59e0b') // amber-500
        .setDescription(changesText)
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    // 4. Salva no Firebase para o Terminal Web
    await database.ref(`servers/${newRole.guild.id}/logs`).push({
      time: getTime(), emoji: '🔄', event: 'CARGO EDITADO', color: 'text-amber-500', 
      text: dashboardText
    });
  } catch (error) { console.error(error); }
});

// =======================================================
// EVENTO 7: MENSAGENS APAGADAS EM MASSA (Nativo)
// =======================================================
client.on("messageDeleteBulk", async (messages) => {
  const message = messages.first();
  if (!message || !message.guild || message.channel.type === "dm") return;

  try {
    const dbSnap = await database.ref(`servers/${message.guild.id}/events`).once('value');
    const config = dbSnap.val();

    if (!config || !config.status || !config.trackMessageDelete || !config.channel) return;

    // Gera um arquivo .txt nativo ao invés de depender de sites externos (SourceBin)
    const logText = messages.map(m => `[${formatDate(m.createdAt)}] (${m.author.id}) ${m.author.tag} : ${m.cleanContent}`).join('\n');
    const attachment = new AttachmentBuilder(Buffer.from(logText, 'utf-8'), { name: 'mensagens-apagadas.txt' });

    const logChannel = message.guild.channels.cache.get(config.channel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Mensagens Apagadas em Massa')
        .setColor('#f43f5e')
        .setDescription(`**Canal:** <#${message.channel.id}>\n**Quantidade:** ${messages.size} mensagens apagadas.\n\n*Baixe o arquivo de texto anexado para ler o histórico.*`)
        .setTimestamp();
      
      logChannel.send({ embeds: [embed], files: [attachment] }).catch(() => {});
    }

    await database.ref(`servers/${message.guild.id}/logs`).push({
      time: getTime(), emoji: '🗑️', event: 'DELETE EM MASSA', color: 'text-rose-500',
      text: `${messages.size} mensagens foram apagadas simultaneamente em #${message.channel.name}.`
    });
  } catch (error) { 
    console.error("Erro no messageDeleteBulk:", error); 
  }
});

// =======================================================
// EVENTO 8: EMOJIS CRIADOS E DELETADOS (trackEmojiUpdate)
// =======================================================
client.on("emojiCreate", async (emoji) => {
  if (!emoji.guild) return;
  try {
    const dbSnap = await database.ref(`servers/${emoji.guild.id}/events`).once('value');
    const config = dbSnap.val();

    if (!config || !config.status || !config.trackEmojiUpdate || !config.channel) return;

    const logChannel = emoji.guild.channels.cache.get(config.channel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('📥 Emoji Adicionado')
        .setColor('#10b981') // emerald-500
        .setDescription(`**Emoji:** ${emoji}\n**Nome:** \`${emoji.name}\`\n**Animado:** ${emoji.animated ? 'Sim' : 'Não'}\n**ID:** ${emoji.id}`)
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    await database.ref(`servers/${emoji.guild.id}/logs`).push({
      time: getTime(), emoji: '📥', event: 'EMOJI ADICIONADO', color: 'text-emerald-500',
      text: `O emoji :${emoji.name}: foi adicionado ao servidor.`
    });
  } catch (error) { console.error(error); }
});

client.on("emojiDelete", async (emoji) => {
  if (!emoji.guild) return;
  try {
    const dbSnap = await database.ref(`servers/${emoji.guild.id}/events`).once('value');
    const config = dbSnap.val();

    if (!config || !config.status || !config.trackEmojiUpdate || !config.channel) return;

    const logChannel = emoji.guild.channels.cache.get(config.channel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('📤 Emoji Deletado')
        .setColor('#f43f5e') // rose-500
        .setDescription(`**Nome:** \`${emoji.name}\`\n**Animado:** ${emoji.animated ? 'Sim' : 'Não'}\n**ID:** ${emoji.id}`)
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    await database.ref(`servers/${emoji.guild.id}/logs`).push({
      time: getTime(), emoji: '📤', event: 'EMOJI DELETADO', color: 'text-rose-500',
      text: `O emoji :${emoji.name}: foi deletado do servidor.`
    });
  } catch (error) { console.error(error); }
});

// =======================================================
// EVENTO 9: CANAIS (trackChannelUpdate)
// =======================================================
const logChannelAction = async (channel, type, colorHex, colorTailwind, emoji, eventName, textAction) => {
  if (!channel.guild) return;
  try {
    const dbSnap = await database.ref(`servers/${channel.guild.id}/events`).once('value');
    const config = dbSnap.val();

    if (!config || !config.status || !config.trackChannelUpdate || !config.channel) return;

    // Puxa o log de auditoria para saber quem criou/deletou
    const auditType = type === 'criado' ? channel.ChannelCreate : channel.ChannelDelete;
    const logs = await channel.guild.fetchAuditLogs({ type: auditType, limit: 1 }).catch(() => null);
    const entry = logs?.entries?.first();
    const executor = entry?.target?.id === channel.id ? entry.executor : null;
    const authorTag = executor ? `${executor.username} (${executor.id})` : '*Desconhecido*';

    const logChannel = channel.guild.channels.cache.get(config.channel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle(`${emoji} Canal ${type.charAt(0).toUpperCase() + type.slice(1)}`)
        .setColor(colorHex)
        .setDescription(`**Nome do Canal:** ${type === 'criado' ? channel : `\`${channel.name}\``}\n**ID:** ${channel.id}\n**Ação por:** ${authorTag}`)
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    await database.ref(`servers/${channel.guild.id}/logs`).push({
      time: getTime(), emoji: emoji, event: eventName, color: colorTailwind,
      text: `Canal #${channel.name} foi ${type} por ${executor?.username || 'um administrador'}.`
    });
  } catch (error) { console.error(error); }
};

client.on("channelCreate", channel => logChannelAction(channel, 'criado', '#10b981', 'text-emerald-500', '📥', 'CANAL CRIADO'));
client.on("channelDelete", channel => logChannelAction(channel, 'deletado', '#f43f5e', 'text-rose-500', '📤', 'CANAL DELETADO'));

client.on("channelUpdate", async (oldChannel, newChannel) => {
  if (!newChannel.guild) return;
  try {
    const nameChanged = oldChannel.name !== newChannel.name;
    const topicChanged = oldChannel.topic !== newChannel.topic;
    
    if (!nameChanged && !topicChanged) return;

    const dbSnap = await database.ref(`servers/${newChannel.guild.id}/events`).once('value');
    const config = dbSnap.val();
    if (!config || !config.status || !config.trackChannelUpdate || !config.channel) return;

    let desc = `**Canal:** ${newChannel} (${newChannel.id})\n\n`;
    let changesArr = [];

    if (nameChanged) {
      desc += `**Nome:** \`${oldChannel.name}\` ➔ \`${newChannel.name}\`\n`;
      changesArr.push('Nome');
    }
    if (topicChanged) {
      desc += `**Tópico:** \`${oldChannel.topic || 'Nenhum'}\` ➔ \`${newChannel.topic || 'Nenhum'}\`\n`;
      changesArr.push('Tópico');
    }

    const logChannel = newChannel.guild.channels.cache.get(config.channel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('🔄 Canal Atualizado')
        .setColor('#f59e0b') // amber-500
        .setDescription(desc)
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    await database.ref(`servers/${newChannel.guild.id}/logs`).push({
      time: getTime(), emoji: '🔄', event: 'CANAL ATUALIZADO', color: 'text-amber-500',
      text: `O canal #${newChannel.name} teve propriedades (${changesArr.join(', ')}) alteradas.`
    });
  } catch (error) { console.error(error); }
});

// =======================================================
// EVENTO 10: BANIMENTOS (trackBan)
// =======================================================
client.on('guildBanAdd', async (ban) => {
  try {
    const dbSnap = await database.ref(`servers/${ban.guild.id}/events`).once('value');
    const config = dbSnap.val();

    if (!config || !config.status || !config.trackBan || !config.channel) return;

    const logChannel = ban.guild.channels.cache.get(config.channel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('🔨 Usuário Banido')
        .setColor('#f43f5e') // rose-500
        .setDescription(`**Usuário:** ${ban.user.tag}\n**ID:** ${ban.user.id}`)
        .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    await database.ref(`servers/${ban.guild.id}/logs`).push({
      time: getTime(), emoji: '🔨', event: 'USUÁRIO BANIDO', color: 'text-rose-500',
      text: `${ban.user.username} foi banido do servidor.`
    });
  } catch (error) { console.error(error); }
});