const client = require("../../index");
const { EmbedBuilder } = require("discord.js");

async function LOG(channelId, interaction, mensagem, content, função) {

  const embed = new EmbedBuilder()
    .setColor('#DDA0DD')
    .setDescription(mensagem)
  // .setFooter({ text: `AA`, iconURL: interaction.guild.iconURL({ dynamic: true })})

  const channel = interaction.client.channels.cache.get(channelId);
  if (!channel) return console.warn(`[LOGS] - [WARN] (Canal de LOG não definido)`);
  
  try {

    const webhooks = await channel.fetchWebhooks();
    const webhook = webhooks.find(wh => wh.token);

    if (!webhook) {
      // console.warn(`[LOGS] - [DETAILS_NOT_PROVIDED] (${função}): Webhook não foi criado`);
      await channel.send({ content: content, embeds: [embed] })
    } else {

      await webhook.send({
        content: content,
        username: `[LOG] - ${função}`,
        avatarURL: 'https://media.discordapp.net/attachments/926180205247201321/934206907030331392/index.jpeg',
        embeds: [embed],
      });
    }

  } catch (error) {
    console.error(`[LOGS] - [ERROR] (${função}):`, error);
    return error;
  }
}

client.on("guildDelete", async (guild) => {

  function checkBots(guild) {
    let botCount = 0;
    guild.members.cache.forEach(member => {
      if (member.user.bot) botCount++;
    });
    return botCount;
  }

  function checkMembers(guild) {
    let memberCount = 0;
    guild.members.cache.forEach(member => {
      if (!member.user.bot) memberCount++;
    });
    return memberCount;
  }

  LOG(client.Canal['saidaservidor'], guild, `**Saída de servidor**
**Servidor:** ${guild.name} (${guild.id})
**Membros:**
Bots: ${checkBots(guild)}
Humanos: ${checkMembers(guild)}`, `${guild.name} | ${guild.id}`, 'guildDelete')

});

client.on("guildCreate", async (guild) => {

  function checkBots(guild) {
    let botCount = 0;
    guild.members.cache.forEach(member => {
      if (member.user.bot) botCount++;
    });
    return botCount;
  }

  function checkMembers(guild) {
    let memberCount = 0;
    guild.members.cache.forEach(member => {
      if (!member.user.bot) memberCount++;
    });
    return memberCount;
  }

  const owner = client.users.cache.get(guild.ownerId);

  LOG(client.Canal['novoservidor'], guild, `**Novo servidor**
**Servidor:** ${guild.name} (${guild.id})
**Dono:** ${owner.name}#${owner.discriminator} (${guild.ownerID})
**Membros:**
Bots: ${checkBots(guild)}
Humanos: ${checkMembers(guild)}`, `${guild.name} | ${guild.id}`, 'guildCreate')

});