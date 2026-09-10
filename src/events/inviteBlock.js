const { EmbedBuilder } = require("discord.js");
const client = require("../../index.js"); 
const firebase = require("firebase");
const database = firebase.database();

// Regex para detectar qualquer variação de link de convite do Discord
const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9]+/ig;

// =======================================================
// FUNÇÃO CENTRAL: VERIFICAR E BLOQUEAR CONVITES
// =======================================================
async function handleInviteBlocker(message) {
  // Ignora DMs, mensagens de bots e mensagens vazias
  if (!message.guild || message.author.bot || !message.content) return;

  // IMPORTANTE: Reseta a memória do Regex global para evitar falhas ao ler vários links seguidos
  inviteRegex.lastIndex = 0;

  // Se a mensagem NÃO contém um convite, encerra a função rapidamente para não pesar o bot
  if (!inviteRegex.test(message.content)) return;

  // Ignora automaticamente administradores do servidor (comentado conforme seu código original)
  if (message.member.permissions.has('Administrator')) return;

  try {
      // 1. Puxa as configurações do Dashboard
      const dbSnap = await database.ref(`servers/${message.guild.id}/invite_blocker`).once('value');
      const config = dbSnap.val();

      // 2. Se estiver desligado, não faz nada
      if (!config || config.status === false) return;

      // 3. Verifica Canais e Cargos ignorados (Whitelisted) configurados no painel
      if (config.whitelistedChannels && config.whitelistedChannels.includes(message.channel.id)) return;
      if (config.whitelistedRoles && message.member.roles.cache.some(role => config.whitelistedRoles.includes(role.id))) return;
      
      // Imunidade nativa (Admins e Moderação - comentado conforme seu código original)
      if (message.member.permissions.has('ManageMessages') || message.member.permissions.has('Administrator')) return;

      // 4. Se a opção "Apagar mensagem original" estiver ativada, apaga
      if (config.deleteMessage) {
        await message.delete().catch(() => {});
      }

      // 5. FUNÇÃO INTERNA: Envia o aviso suportando o Embed e as cores do Dashboard
      const sendWarning = async () => {
          if (!config.customMessage || config.customMessage.trim() === '') return; // Se vazio, não envia nada
          
          // Prepara a mensagem usando replaceAll para suportar múltiplas repetições das variáveis
          let replyMessage = config.customMessage
            .replaceAll("{user}", `<@${message.author.id}>`)
            .replaceAll("{server}", message.guild.name);

          // Verifica se o admin ativou o formato Embed no painel
          if (config.embed) {
              const embed = new EmbedBuilder()
                .setTitle(config.embedTitle || "Aviso do Sistema")
                .setColor(config.embedColor || "#ef4444")
                .setDescription(replyMessage);
              
              if (config.thumbnail) embed.setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

              await message.channel.send({ embeds: [embed] }).catch(() => {});
          } else {
              // Se o Embed estiver desligado, envia como texto normal
              await message.channel.send({ content: replyMessage }).catch(() => {});
          }
      };

      // 6. Aplica a ação escolhida pelo administrador (warn, mute, kick, ban, none)
      const action = config.action || 'warn';

      if (action === 'none') {
        return sendWarning();
      }

      if (action === 'warn') {
        return sendWarning();
      }

      if (action === 'mute') {
        await sendWarning();
        
        // Pega o tempo em segundos escolhido no painel e converte para milissegundos
        const timeInSeconds = Number(config.muteTime) || 3600;
        const timeInMs = timeInSeconds * 1000;
        
        await message.member.timeout(timeInMs, "Sistema Anti-Convites: Link não autorizado").catch(() => {});
      }

      if (action === 'kick') {
        await sendWarning();
        await message.member.kick("Sistema Anti-Convites: Link não autorizado").catch(() => {});
      }

      if (action === 'ban') {
        await sendWarning();
        await message.member.ban({ reason: "Sistema Anti-Convites: Link não autorizado" }).catch(() => {});
      }

    } catch (error) {
    console.error("[ANTI-INVITE] Erro ao verificar convite:", error);
  }
}

// =======================================================
// EVENTOS DISPARADORES
// =======================================================

// 1. Quando uma NOVA mensagem é enviada
client.on('messageCreate', async (message) => {
  await handleInviteBlocker(message);
});

// 2. Quando o usuário tenta ser espertinho e EDITA uma mensagem antiga para colocar o link
client.on('messageUpdate', async (oldMessage, newMessage) => {
  // Só verifica de novo se o texto da mensagem realmente foi alterado
  if (oldMessage.content !== newMessage.content) {
    await handleInviteBlocker(newMessage);
  }
});