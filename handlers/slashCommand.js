const fs = require('fs');
const { PermissionsBitField } = require('discord.js');
const { Routes } = require('discord-api-types/v9');
const { REST } = require('@discordjs/rest');

module.exports = async (client, token) => {
	const TOKEN = token || client?.config?.TOKEN || process.env.DISCORD_TOKEN || process.env.TOKEN;
	const CLIENT_ID = client?.config?.CLIENT_ID || process.env.CLIENT_ID;
	const rest = new REST({ version: '9' }).setToken(TOKEN || '');
	const slashCommands = [];

	fs.readdirSync('./src/SlashCommand/').forEach(async dir => {
		const files = fs.readdirSync(`./src/SlashCommand/${dir}/`).filter(file => file.endsWith('.js'));

		for (const file of files) {
			try {
				const slashCommand = require(`../src/SlashCommand/${dir}/${file}`);
				slashCommands.push({
					name: slashCommand.name,
					description: slashCommand.description,
					type: slashCommand.type,
					options: slashCommand.options ? slashCommand.options : null,
					default_permission: slashCommand.default_permission ? slashCommand.default_permission : null,
					default_member_permissions: slashCommand.default_member_permissions ? PermissionsBitField.resolve(slashCommand.default_member_permissions).toString() : null
				});
        
				if (slashCommand.name) {
					client.slashCommands.set(slashCommand.name, slashCommand);
					console.log(`[ ✅ Command loaded ] - ${slashCommand.name}`);
				} else {
					console.error(`[ ❌ Command error ] - ${file}`);
				}
			} catch (error) {
				console.error(`[ ❌ Command error ] - ${file}`);
				console.error(error);
			}
		}
	});
  
	if (TOKEN && CLIENT_ID) {
		try {
			await rest.put(
				process.env.GUILD_ID ?
				Routes.applicationGuildCommands(CLIENT_ID, process.env.GUILD_ID) :
				Routes.applicationCommands(CLIENT_ID),
				{ body: slashCommands }
			);
			console.log('[ ✅ Todos os slashs registrados ]');
		} catch (error) {
			console.error('[ ❌ Erro ao carregar os slashs ]');
			console.error(error);
		}
	} else {
		console.log('[Sistine Bot] Skipping Slash Command API registration: Discord TOKEN or CLIENT_ID is empty.');
	}
};
