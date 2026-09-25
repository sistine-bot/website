const client = require("../../index.js");
const firebase = require("firebase");
const database = firebase.database();
const emoji = require("../../src/utils/emoji.js");
const { CheckUserBlacklisted, isStaff } = require('../../src/utils/functions.js');
const { grantSlashCommandXp } = require('../../src/utils/experienceManager.js');
const { MessageFlags } = require('discord.js');

function normalizeInteractionOptions(options) {
  if (!options) return options;
  if (typeof options === 'string') return { content: options };
  const opts = { ...options };
  if ('ephemeral' in opts) {
    if (opts.ephemeral) {
      opts.flags = MessageFlags.Ephemeral;
    }
    delete opts.ephemeral;
  }
  return opts;
}

client.on("interactionCreate", async (interaction) => { 
  try {
    if (!interaction || !interaction.user) return;

    // Normaliza métodos de resposta para eliminar avisos de depreciação e prevenir InteractionNotReplied
    if (interaction.isRepliable()) {
      const origReply = interaction.reply.bind(interaction);
      const origDefer = interaction.deferReply.bind(interaction);
      const origFollowUp = interaction.followUp.bind(interaction);
      const origEditReply = interaction.editReply.bind(interaction);

      interaction.deferReply = async function(opts = {}) {
        if (this.deferred || this.replied) return;
        return await origDefer(normalizeInteractionOptions(opts));
      };

      interaction.reply = async function(opts) {
        const normalized = normalizeInteractionOptions(opts);
        if (this.deferred) {
          return await this.editReply(normalized).catch(() => this.followUp(normalized));
        }
        if (this.replied) {
          return await this.followUp(normalized);
        }
        return await origReply(normalized);
      };

      interaction.followUp = async function(opts) {
        const normalized = normalizeInteractionOptions(opts);
        if (!this.deferred && !this.replied) {
          if (this.isRepliable()) {
            return await this.reply(normalized).catch(() => {
              return this.channel?.send(normalized).catch(() => {});
            });
          }
          return await this.channel?.send(normalized).catch(() => {});
        }
        return await origFollowUp(normalized).catch(err => {
          return this.channel?.send(normalized).catch(() => {});
        });
      };

      interaction.editReply = async function(opts) {
        const normalized = normalizeInteractionOptions(opts);
        return await origEditReply(normalized).catch(err => {
          return this.channel?.send(normalized).catch(() => {});
        });
      };
    }

    // Defer imediato para comandos slash: responde ao Discord nos primeiros ~20ms,
    // garantindo que consultas assíncronas ao Firebase não estourem o limite estrito de 3 segundos do Discord.
    if (interaction.isCommand()) {
      await interaction.deferReply().catch(() => {});
    }

    // 0. TRAVA GLOBAL DE BLACKLIST: Bloqueia qualquer interação de usuários banidos
    const { blacklisted, blacklistedMensagem } = await CheckUserBlacklisted(interaction.user);
    if (blacklisted) {
      if (interaction.isRepliable()) {
        return await interaction.reply({ content: blacklistedMensagem, flags: MessageFlags.Ephemeral }).catch(() => {});
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
          return await interaction.reply({ content: msgManutencao, flags: MessageFlags.Ephemeral }).catch(() => {});
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
      
      interaction.positivo = async function({ content, ephemeral, flags, components }) {
        const resolvedFlags = flags || (ephemeral ? MessageFlags.Ephemeral : undefined);
        return await interaction.followUp({ 
          content: `${emoji.positivo} **|** ${content ? content : `Nenhuma mensagem definida - *${this.Comando}*`}`, 
          flags: resolvedFlags, 
          components 
        }).catch(error => { 
          console.log(`[FUNCTIONS - interaction.error] - ${error}`);
          return interaction.followUp({ content: `${emoji.aviso} **|** ${error}.` });
        });
      };
  
      interaction.error = async function({ content, ephemeral, flags, components }) {
        const resolvedFlags = flags || (ephemeral ? MessageFlags.Ephemeral : undefined);
        return await interaction.followUp({ 
          content: `${emoji.negativo} **|** ${content ? content : `Nenhuma mensagem definida - *${this.Comando}*`}`, 
          flags: resolvedFlags, 
          components 
        }).catch(error => { 
          console.log(`[FUNCTIONS - interaction.error] - ${error}`);
          return interaction.followUp({ content: `${emoji.aviso} **|** ${error}.` });
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
      if (!cmd) {
        return await interaction.reply({ 
          content: `${emoji.negativo} **|** Ocorreu um erro inesperado na utilização deste comando.`, 
          flags: MessageFlags.Ephemeral 
        });
      }
  
      // =============================================================
      // VERIFICAÇÃO DE COMANDOS DESATIVADOS PELO DASHBOARD
      // =============================================================
      try {
        const disabledSnap = await database.ref(`servers/${interaction.guildId}/disabled_commands`).once('value');
        const disabledCommands = disabledSnap.val() || [];
  
        // Checa se o comando principal ("servidor") ou subcomando ("servidor info") está bloqueado
        if (disabledCommands.includes(interaction.commandName) || disabledCommands.includes(fullCommandName)) {
          return await interaction.reply({
            content: `${emoji.negativo} **|** Este comando foi desativado pelos administradores no painel do servidor.`,
            flags: MessageFlags.Ephemeral
          });
        }
      } catch (err) {
        console.error("[DISABLED_COMMANDS] Erro ao verificar comandos no banco:", err);
      }
      // =============================================================
      
      try {
        // Processa ganho de XP para comandos slash gerais (10 a 15 XP com cooldown de 30s)
        await grantSlashCommandXp(interaction);
  
        console.log(`${emoji.positivo} Comando utilizado | ${interaction.user.tag} (${interaction.user.id}) | ${interaction.channelId}\nComando:\n${interaction.commandName} ${args.slice(0).join(' ')}\n`);
  
        return await cmd.run(client, interaction, args, color, database, emoji);
      } catch (error) {
        console.error(error);
        return await interaction.followUp({ content: `${emoji.negativo} **|** Ocorreu um erro inesperado na utilização deste comando.` });
      }
    }
  } catch(error) {
    console.error(error);
    if (interaction.isRepliable()) {
      return await interaction.reply({ content: `${emoji.negativo} **|** Ocorreu um erro inesperado na utilização deste comando.` }).catch(() => {});
    }
  }
});