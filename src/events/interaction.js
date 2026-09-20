const client = require("../../index.js");
const firebase = require("firebase");
const database = firebase.database();
const emoji = require("../../src/utils/emoji.js");
const { CheckUserBlacklisted, isStaff } = require('../../src/utils/functions.js');
const { grantSlashCommandXp } = require('../../src/utils/experienceManager.js');

client.on("interactionCreate", async (interaction) => { 
  try {
    if (!interaction || !interaction.user) return;

    // 0. TRAVA GLOBAL DE BLACKLIST: Bloqueia qualquer interação de usuários banidos
    const { blacklisted, blacklistedMensagem } = await CheckUserBlacklisted(interaction.user);
    if (blacklisted) {
      if (interaction.isRepliable()) {
        if (interaction.deferred || interaction.replied) {
          return await interaction.followUp({ content: blacklistedMensagem, ephemeral: true }).catch(() => {});
        } else {
          return await interaction.reply({ content: blacklistedMensagem, ephemeral: true }).catch(() => {});
        }
      }
      return;
    }

    // 0.1 TRAVA GLOBAL DE MANUTENÇÃO: Bloqueia comandos quando a manutenção estiver ativa
    if (interaction.isCommand()) {
      const isStaffMember = isStaff(client, interaction.user.id);
      const maintSnap = await database.ref('Administração/Manutencao').once('value');
      const maintData = maintSnap.val();

      if (maintData?.ativa && !isStaffMember) {
        const msgManutencao = `🛠️ **| O bot Sistine está em manutenção técnica no momento!**\n> 📋 **Motivo:** *${maintData.motivo || 'Melhorias nos sistemas'}*\n> ⏳ **Previsão:** *${maintData.previsao || 'Em breve'}*`;
        if (interaction.isRepliable()) {
          if (interaction.deferred || interaction.replied) {
            return await interaction.followUp({ content: msgManutencao, ephemeral: true }).catch(() => {});
          } else {
            return await interaction.reply({ content: msgManutencao, ephemeral: true }).catch(() => {});
          }
        }
        return;
      }
    }

    // Puxa os dados do servidor no Firebase de forma segura
    const serverSnap = interaction.guild ? await database.ref(`servers/${interaction.guild.id}`).once('value') : null;
    const serverData = serverSnap ? (serverSnap.val() || {}) : {};
  
    // Extrai as configurações com valores padrão (fallbacks) garantidos
    const prefix = serverData.config?.prefix || serverData.config?.prefixo || '!';
    const embedColor = serverData.color?.embed || '#831396';
    const commandsChannel = serverData.config?.commandsChannel || null;
  
    // Objeto 'color' no formato exigido pelos seus comandos/eventos
    const color = {
      embed: embedColor
    };
  
    if (interaction.isCommand()) {
  
      const args = [];
      
      interaction.positivo = async function({ content, ephemeral, components }) {
        return await interaction.followUp({ content: `${emoji.positivo} **|** ${content ? content : `Nenhuma mensagem definida - *${this.Comando}*`}`, ephemeral, components }).catch(error => { 
          console.log(`[FUNCTIONS - interaction.error] - ${error}`);
          return interaction.followUp({ content: `${emoji.aviso} **|** ${error}.`, ephemeral: false });
        });
      };
  
      interaction.error = async function({ content, ephemeral, components }) {
        return await interaction.followUp({ content: `${emoji.negativo} **|** ${content ? content : `Nenhuma mensagem definida - *${this.Comando}*`}`, ephemeral, components }).catch(error => { 
          console.log(`[FUNCTIONS - interaction.error] - ${error}`);
          return interaction.followUp({ content: `${emoji.aviso} **|** ${error}.`, ephemeral: false });
        });
      };
  
      // Monta o nome completo do comando (Trata comandos simples e subcomandos)
      let fullCommandName = interaction.commandName;
      const subCommand = interaction.options.getSubcommand(false);
      if (subCommand) {
        fullCommandName = `${interaction.commandName} ${subCommand}`;
      }
      
      for (let option of interaction.options.data) {
          if (option.type === "SUB_COMMAND") {
              if (option.name) args.push(option.name);
              option.options.forEach((x) => {
                  if (x.value) args.push(x.value);
              });
          } else if (option.value) args.push(option.value);
      }
      
      const cmd = client.slashCommands.get(interaction.commandName);
      if (!cmd) return interaction.reply({ content: `${emoji.negativo} **|** Ocorreu um erro inesperado na utilização deste comando.`, ephemeral: true });
  
      // =============================================================
      // VERIFICAÇÃO DE COMANDOS DESATIVADOS PELO DASHBOARD
      // =============================================================
      try {
        const disabledSnap = await database.ref(`servers/${interaction.guildId}/disabled_commands`).once('value');
        const disabledCommands = disabledSnap.val() || [];
  
        // Checa se o comando principal ("servidor") ou subcomando ("servidor info") está bloqueado
        if (disabledCommands.includes(interaction.commandName) || disabledCommands.includes(fullCommandName)) {
          return interaction.reply({
            content: `${emoji.negativo} **|** Este comando foi desativado pelos administradores no painel do servidor.`,
            ephemeral: true
          });
        }
      } catch (err) {
        console.error("[DISABLED_COMMANDS] Erro ao verificar comandos no banco:", err);
      }
      // =============================================================
        
      await interaction.deferReply({ ephemeral: false }).catch(e => { });
      
      try {
        // Processa ganho de XP para comandos slash gerais (10 a 15 XP com cooldown de 30s)
        await grantSlashCommandXp(interaction);
  
        console.log(`${emoji.positivo} Comando utilizado | ${interaction.user.tag} (${interaction.user.id}) | ${interaction.channelId}\nComando:\n${interaction.commandName} ${args.slice(0).join(' ')}\n`);
  
        return cmd.run(client, interaction, args, color, database, emoji);
      } catch (error) {
        console.error(error);
        return interaction.followUp({ content: `${emoji.negativo} **|** Ocorreu um erro inesperado na utilização deste comando.` });
      }
    }
  } catch(error) {
    console.error(error);
    return interaction.reply({ content: `${emoji.negativo} **|** Ocorreu um erro inesperado na utilização deste comando.` });
  }
});