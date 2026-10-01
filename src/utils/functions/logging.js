const { database } = require('./database.js');

async function eventLog(entity, Descrição, Footer, ConsoleLog, eventType = null) {
  if (!Descrição) Descrição = 'Nada definido';
  if (!Footer) Footer = 'Nada definido';

  console.log(ConsoleLog);
  
  // Descobre o servidor a partir da entidade (mensagem, canal, cargo, membro, etc)
  const guild = entity.guild || entity;
  if (!guild || !guild.id) return;

  const guildId = guild.id;

  try {
    const snapshot = await database.ref(`servers/${guildId}/events`).once('value');
    const config = snapshot.val() || {}; // Previne erro se estiver vazio

    // 1. Se o botão principal de Status estiver desligado, cancela tudo
    if (config.status === false) return;

    // 2. Filtro dos botões (Checkboxes individuais)
    if (eventType) {
      if (eventType === 'messageDelete' && config.trackMessageDelete === false) return;
      if (eventType === 'messageEdit' && config.trackMessageEdit === false) return;
      if (eventType === 'memberJoinLeave' && config.trackMemberJoinLeave === false) return;
      if (eventType === 'roleUpdate' && config.trackRoleUpdate === false) return;
      if (eventType === 'channelUpdate' && config.trackChannelCreateDelete === false) return;
      if (eventType === 'voiceStatus' && config.trackVoiceStatus === false) return;
    }

    // 3. REGISTRA NO TERMINAL DO PAINEL (Sempre registra se estiver ativado)
    let emojiStr = '🔔';
    let colorStr = 'text-teal-400';
    
    // Cores baseadas no tipo de ação
    if (ConsoleLog.includes('criado') || ConsoleLog.includes('entrou')) { emojiStr = '🟢'; colorStr = 'text-emerald-400'; }
    else if (ConsoleLog.includes('deletad') || ConsoleLog.includes('apagado') || ConsoleLog.includes('saiu') || ConsoleLog.includes('banido')) { emojiStr = '🔴'; colorStr = 'text-rose-400'; }
    else if (ConsoleLog.includes('editad') || ConsoleLog.includes('atualizado') || ConsoleLog.includes('alterado')) { emojiStr = '🔄'; colorStr = 'text-amber-400'; }

    const textStr = ConsoleLog.split('): ')[1] || ConsoleLog;
    const eventNameStr = ConsoleLog.split(' - (')[1]?.split(')')[0] || 'EVENTO';
    
    // Data nativa (sem precisar do moment.js para evitar crash)
    const timeStr = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    await database.ref(`servers/${guildId}/logs`).push({
      time: timeStr,
      emoji: emojiStr,
      event: eventNameStr,
      text: textStr,
      color: colorStr
    });

    // 4. ENVIA PARA O DISCORD (Somente se o usuário configurou um canal específico)
    if (config.channel) {
      let channel = guild.channels?.cache?.get?.(config.channel);
      
      // Validações de segurança antes de tentar mandar
      if (channel && channel.viewable && guild.members?.me?.permissions?.has(['SendMessages', 'EmbedLinks'])) {
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
          .setDescription(Descrição)
          .setColor('#2b2d31') // Fundo escuro invisível
          .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL?.({ dynamic: true }) })
          .setTimestamp(Date.now());

        channel.send({ embeds: [embed] }).catch(() => { });
      }
    }

  } catch (error) {
    console.error('[eventLog] Erro ao processar sistema de logs:', error);
  }
}

module.exports = {
  eventLog
};
