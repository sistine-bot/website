const client = require("../../index.js");
const firebase = require("firebase");
const database = firebase.database();
const emoji = require("../../src/utils/emoji.js");
const { CheckUserBlacklisted, XpUpdate } = require('../../src/utils/functions.js');
const LevelXP = new Set();

client.on("messageCreate", async (message) => {
  try {

    if (message.author.bot || message.webhookID || !message.guild) return;
    
    // Puxa os dados do servidor no Firebase de forma segura
    const serverSnap = await database.ref(`servers/${message.guild.id}`).once('value');
    const serverData = serverSnap.val() || {};
  
    // Extrai as configurações com valores padrão (fallbacks) garantidos
    const prefixo = serverData.config?.prefix || serverData.config?.prefixo || '!';
    const embedColor = serverData.color?.embed || '#831396';
    const commandsChannel = serverData.config?.commandsChannel || null;
  
    // Objeto 'color' no formato exigido pelos seus comandos/eventos
    const color = {
      embed: embedColor
    };
  
    message.error = async function({ content, ephemeral, components }) {
      return await message.reply({ content: `${emoji.negativo} **|** ${content ? content : `Nenhuma mensagem definida - *${this.Comando}*`}`, ephemeral, components }).catch(error => { 
        console.error(`[FUNCTIONS - message.error] - ${error}`);
        return message.reply({ content: `${emoji.negativo} **|** ${error}.`, ephemeral: false });
      });
    };
  
    message.aviso = async function({ content, ephemeral, components }) {
      return await message.reply({ content: `${emoji.aviso} **|** ${content ? content : `Nenhuma mensagem definida - *${this.Comando}*`}`, ephemeral, components }).catch(error => { 
        console.error(`[FUNCTIONS - message.aviso] - ${error}`);
        return message.reply({ content: `${emoji.negativo} **|** ${error}.`, ephemeral: false });
      });
    };
  
    const args = message.content.slice(prefixo.length).trim().split(/ +/g);
    let cmd = args.shift().toLowerCase();
    if (!message.content.startsWith(prefixo)) return;
    
    let command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));
    
    if (command) {
      try {
  
        // =============================================================
        // VERIFICAÇÃO DE COMANDOS DESATIVADOS PELO DASHBOARD
        // =============================================================
        const disabledSnap = await database.ref(`servers/${message.guild.id}/disabled_commands`).once('value');
        const disabledCommands = disabledSnap.val() || [];
  
        if (disabledCommands.includes(command.name)) {
          return message.reply({ 
            content: `${emoji.negativo} **|** O comando \`${prefixo}${command.name}\` foi desativado pelos administradores no painel do servidor.` 
          });
        }
        // =============================================================
  
        const { blacklisted, blacklistedMensagem } = await CheckUserBlacklisted(message.author);
        if (blacklisted) return message.reply({ content: blacklistedMensagem, ephemeral: true });
      
        if (!LevelXP.has(message.author.id)) { 
          XpUpdate(message, message.author);
          
          LevelXP.add(message.author.id);
          setTimeout(() => {
            LevelXP.delete(message.author.id);
          }, 30 * 1e3);
        }
  
        console.log(`${emoji.positivo} Comando utilizado | ${message.author.username} (${message.author.id}) | ${message.channel.name} (${message.channel.id})\nComando:\n${command.name} ${args.slice(0).join(' ')}\n`);
        
        return command.run(client, message, args, prefixo, color, database, emoji);
      } catch(error) {
        console.error(error);
        return message.reply({ content: `${emoji.negativo} **|** Ocorreu um erro inesperado na utilização deste comando.` });
      }
      
    } else {
      if (!cmd || cmd === prefixo) return;
      return message.reply({ content: `${emoji.negativo} **|** Não encontrei este comando.` });
    }

  } catch(error) {
    console.error(error);
    return message.reply({ content: `${emoji.negativo} **|** Ocorreu um erro inesperado na utilização deste comando.` });
  }
  
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  
  if (!LevelXP.has(message.author.id)) { 
    if (message.content.length <= 2) return;
    
    XpUpdate(message, message.author);
    
    LevelXP.add(message.author.id);
    setTimeout(() => {
      LevelXP.delete(message.author.id);
    }, 30 * 1e3);
  }
});