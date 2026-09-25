const client = require("../../index.js");
const firebase = require("firebase");
const database = firebase.database();
const emoji = require("../../src/utils/emoji.js");
const { CheckUserBlacklisted, isStaff } = require('../../src/utils/functions.js');
const { grantChatXp } = require('../../src/utils/experienceManager.js');

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
  
    message.error = async function({ content, components }) {
      return await message.reply({ content: `${emoji.negativo} **|** ${content ? content : `Nenhuma mensagem definida - *${this.Comando}*`}`, components }).catch(error => { 
        console.error(`[FUNCTIONS - message.error] - ${error}`);
        return message.reply({ content: `${emoji.negativo} **|** ${error}.` });
      });
    };
  
    message.aviso = async function({ content, components }) {
      return await message.reply({ content: `${emoji.aviso} **|** ${content ? content : `Nenhuma mensagem definida - *${this.Comando}*`}`, components }).catch(error => { 
        console.error(`[FUNCTIONS - message.aviso] - ${error}`);
        return message.reply({ content: `${emoji.negativo} **|** ${error}.` });
      });
    };
  
    // 0. TRAVA GLOBAL DE BLACKLIST: Bloqueia qualquer interação e ganho de XP de usuários banidos
    const { blacklisted, blacklistedMensagem } = await CheckUserBlacklisted(message.author);
    if (blacklisted) {
      if (message.content.startsWith(prefixo)) {
        return message.reply({ content: blacklistedMensagem }).catch(() => {});
      }
      return; // Usuário banido: ignora mensagens de chat sem conceder XP
    }

    // Se não começar com o prefixo, processa como mensagem de chat comum para o sistema de XP
    if (!message.content.startsWith(prefixo)) {
      await grantChatXp(message);
      return;
    }

    // 0.1 TRAVA GLOBAL DE MANUTENÇÃO: Bloqueia comandos de prefixo quando a manutenção estiver ativa
    const isStaffMember = isStaff(client, message.author.id);
    const maintSnap = await database.ref('Administração/Manutencao').once('value');
    const maintData = maintSnap.val();

    if (maintData?.ativa && !isStaffMember) {
      return message.reply({
        content: `🛠️ **| O bot Sistine está em manutenção técnica no momento!**\n> 📋 **Motivo:** *${maintData.motivo || 'Melhorias nos sistemas'}*\n> ⏳ **Previsão:** *${maintData.previsao || 'Em breve'}*`
      }).catch(() => {});
    }

    const { findSlashCommand, executeSlashAsPrefix } = require('../../src/utils/commandBridge.js');

    const args = message.content.slice(prefixo.length).trim().split(/ +/g);
    let cmd = args.shift().toLowerCase();
    if (!cmd || cmd === prefixo) return;
    
    let command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));
    const disabledSnap = await database.ref(`servers/${message.guild.id}/disabled_commands`).once('value');
    const disabledCommands = disabledSnap.val() || [];

    // 1. Se for um comando de administração tradicional (ex: !addbanco, !drop, !manutencao), executa diretamente
    if (command && command.category === 'admin') {
      try {
        if (disabledCommands.includes(command.name)) {
          return message.reply({ 
            content: `${emoji.negativo} **|** O comando \`${prefixo}${command.name}\` foi desativado pelos administradores no painel do servidor.` 
          });
        }
      
        console.log(`${emoji.positivo} Comando Admin utilizado | ${message.author.username} (${message.author.id}) | ${message.channel.name} (${message.channel.id})\nComando:\n${command.name} ${args.slice(0).join(' ')}\n`);
        
        return command.run(client, message, args, prefixo, color, database, emoji);
      } catch(error) {
        console.error(error);
        return message.reply({ content: `${emoji.negativo} **|** Ocorreu um erro inesperado na utilização deste comando.` });
      }
    }

    // 2. Verifica se o comando digitado corresponde a um Slash Command (da pasta src/SlashCommand/)
    const slashCommand = findSlashCommand(cmd, client);
    if (slashCommand) {
      try {
        if (disabledCommands.includes(slashCommand.name)) {
          return message.reply({ 
            content: `${emoji.negativo} **|** O comando \`${prefixo}${slashCommand.name}\` foi desativado pelos administradores no painel do servidor.` 
          });
        }

        return await executeSlashAsPrefix(client, message, slashCommand, args, prefixo, color, database, emoji);
      } catch (error) {
        console.error(`[messageCreate - Slash Command via Prefix] Error:`, error);
        return message.reply({ content: `${emoji.negativo} **|** Ocorreu um erro inesperado na utilização deste comando.` });
      }
    }

    // 3. Fallback: Se for qualquer outro comando de prefixo registrado legado
    if (command) {
      try {
        if (disabledCommands.includes(command.name)) {
          return message.reply({ 
            content: `${emoji.negativo} **|** O comando \`${prefixo}${command.name}\` foi desativado pelos administradores no painel do servidor.` 
          });
        }
      
        console.log(`${emoji.positivo} Comando utilizado | ${message.author.username} (${message.author.id}) | ${message.channel.name} (${message.channel.id})\nComando:\n${command.name} ${args.slice(0).join(' ')}\n`);
        
        return command.run(client, message, args, prefixo, color, database, emoji);
      } catch(error) {
        console.error(error);
        return message.reply({ content: `${emoji.negativo} **|** Ocorreu um erro inesperado na utilização deste comando.` });
      }
    }

    // 4. Comando não encontrado
    return message.reply({ content: `${emoji.negativo} **|** Não encontrei este comando.` });

  } catch(error) {
    console.error(error);
    return message.reply({ content: `${emoji.negativo} **|** Ocorreu um erro inesperado na utilização deste comando.` });
  }
});