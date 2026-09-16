const client = require("../../index");
const { EmbedBuilder } = require("discord.js");

// Inicializa client.Canal com fallbacks seguros para evitar erros de propriedade indefinida
// Canal 920743390944043089 = #novo-servidor
// Canal 920743415598166077 = #saida-servidor
client.Canal = client.Canal || {};
if (!client.Canal.novoservidor) client.Canal.novoservidor = '920743390944043089';
if (!client.Canal.saidaservidor) client.Canal.saidaservidor = '920743415598166077';

/**
 * Envia uma mensagem de log para o canal especificado (via Webhook ou diretamente no canal).
 * @param {string} channelId ID do canal do Discord (string snowflake)
 * @param {any} context Objeto de contexto (interaction, guild ou client) ou mensagem se omitido
 * @param {string} mensagem Texto do Embed de log
 * @param {string} content Conteúdo de texto simples da mensagem
 * @param {string} função Nome da função/evento que disparou o log
 */
async function LOG(channelId, context, mensagem, content, função) {
  // Suporte flexível para assinatura sem context: LOG(channelId, mensagem, content, função)
  if (typeof context === 'string') {
    função = content;
    content = mensagem;
    mensagem = context;
    context = null;
  }

  if (!channelId) {
    return console.warn(`[LOGS] - [WARN] (${função || 'GERAL'}): Canal de LOG não definido`);
  }

  const idStr = String(channelId).trim();
  const discordClient = context?.client || client;

  // Busca o canal no cache local ou faz fetch diretamente na API do Discord
  let channel = discordClient.channels?.cache?.get(idStr);
  if (!channel && discordClient.channels?.fetch) {
    try {
      channel = await discordClient.channels.fetch(idStr).catch(() => null);
    } catch (err) {
      channel = null;
    }
  }

  if (!channel) {
    return console.warn(`[LOGS] - [WARN] (${função || 'GERAL'}): Canal de LOG (${idStr}) não encontrado no Discord`);
  }

  const embed = new EmbedBuilder()
    .setColor('#DDA0DD')
    .setDescription(mensagem)
    .setTimestamp();

  // 1. Tenta enviar via Webhook se o canal possuir webhooks e o bot tiver permissão
  let sentViaWebhook = false;
  try {
    if (typeof channel.fetchWebhooks === 'function') {
      const webhooks = await channel.fetchWebhooks().catch(() => null);
      if (webhooks && typeof webhooks.find === 'function') {
        const webhook = webhooks.find(wh => wh.token);
        if (webhook) {
          await webhook.send({
            content: content ? String(content) : undefined,
            username: `[LOG] - ${função || 'Sistema'}`,
            avatarURL: discordClient.user?.displayAvatarURL?.({ extension: 'png' }) || undefined,
            embeds: [embed],
          });
          sentViaWebhook = true;
        }
      }
    }
  } catch (whError) {
    console.warn(`[LOGS] - [WARN] (${função}): Falha ao enviar via Webhook (${whError.message || whError}). Tentando envio direto no canal.`);
  }

  // 2. Fallback para envio direto no canal caso não haja webhook ou o envio tenha falhado
  if (!sentViaWebhook) {
    try {
      if (typeof channel.send === 'function') {
        await channel.send({
          content: content ? String(content) : undefined,
          embeds: [embed]
        });
        sentViaWebhook = true;
      } else {
        console.warn(`[LOGS] - [WARN] (${função}): O canal (${idStr}) não suporta envio de mensagens.`);
      }
    } catch (sendError) {
      console.error(`[LOGS] - [ERROR] (${função}): Erro ao enviar mensagem no canal (${idStr}):`, sendError);
      return sendError;
    }
  }
}

function checkBots(guild) {
  if (!guild || !guild.members || !guild.members.cache) return 0;
  let botCount = 0;
  guild.members.cache.forEach(member => {
    if (member.user?.bot) botCount++;
  });
  return botCount;
}

function checkMembers(guild) {
  if (!guild || !guild.members || !guild.members.cache) return 0;
  let memberCount = 0;
  guild.members.cache.forEach(member => {
    if (!member.user?.bot) memberCount++;
  });
  return memberCount;
}

client.on("guildDelete", async (guild) => {
  if (!guild) return;

  try {
    const bots = checkBots(guild);
    const humans = checkMembers(guild);
    const total = guild.memberCount || (bots + humans);
    const channelId = client.Canal?.saidaservidor || '920743415598166077';

    await LOG(
      channelId,
      guild,
      `**Saída de servidor**\n` +
      `**Servidor:** ${guild.name || 'Desconhecido'} (\`${guild.id}\`)\n` +
      `**Total de Membros:** ${total}\n` +
      `**Membros:**\n` +
      `> 🤖 Bots: ${bots}\n` +
      `> 👤 Humanos: ${humans}`,
      `${guild.name || 'Servidor'} | ${guild.id}`,
      'guildDelete'
    );
  } catch (error) {
    console.error(`[LOGS] - [ERROR] (guildDelete):`, error);
  }
});

client.on("guildCreate", async (guild) => {
  if (!guild) return;

  try {
    let ownerInfo = 'Não identificado';
    if (guild.ownerId) {
      try {
        const owner = (await guild.fetchOwner?.().catch(() => null)) || (await client.users?.fetch?.(guild.ownerId).catch(() => null));
        if (owner) {
          const user = owner.user || owner;
          const tag = user.discriminator && user.discriminator !== '0'
            ? `${user.username}#${user.discriminator}`
            : user.username;
          ownerInfo = `${tag} (\`${guild.ownerId}\`)`;
        } else {
          ownerInfo = `ID: \`${guild.ownerId}\``;
        }
      } catch (e) {
        ownerInfo = `ID: \`${guild.ownerId}\``;
      }
    }

    const bots = checkBots(guild);
    const humans = checkMembers(guild);
    const total = guild.memberCount || (bots + humans);
    const channelId = client.Canal?.novoservidor || '920743390944043089';

    await LOG(
      channelId,
      guild,
      `**Novo servidor**\n` +
      `**Servidor:** ${guild.name || 'Desconhecido'} (\`${guild.id}\`)\n` +
      `**Dono:** ${ownerInfo}\n` +
      `**Total de Membros:** ${total}\n` +
      `**Membros:**\n` +
      `> 🤖 Bots: ${bots}\n` +
      `> 👤 Humanos: ${humans}`,
      `${guild.name || 'Servidor'} | ${guild.id}`,
      'guildCreate'
    );
  } catch (error) {
    console.error(`[LOGS] - [ERROR] (guildCreate):`, error);
  }
});

module.exports = { LOG, checkBots, checkMembers };