const { PermissionsBitField } = require('discord.js');
const { isStaff } = require('./functions.js');
const { grantSlashCommandXp } = require('./experienceManager.js');

/**
 * Função utilitária para normalizar strings removendo diacríticos/acentos e em minúsculas
 */
function normalize(str) {
  return str ? String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
}

/**
 * Mapa de aliases frequentes para comandos Slash quando chamados via prefixo
 */
const SLASH_ALIASES = {
  // --- Economia & Finanças ---
  'transacoes': 'transações',
  'transacao': 'transações',
  'transacão': 'transações',
  'extrato': 'transações',
  'historico': 'transações',
  'bal': 'saldo',
  'money': 'saldo',
  'carteira': 'saldo',
  'banco': 'saldo',
  'inv': 'inventário',
  'inventario': 'inventário',
  'mochila': 'inventário',
  'profile': 'perfil',
  'p': 'perfil',
  'diario': 'daily',
  'diário': 'daily',
  'd': 'daily',
  'semanal': 'semanal',
  'weekly': 'semanal',
  'dep': 'depositar',
  'deposito': 'depositar',
  'depósito': 'depositar',
  'saque': 'sacar',
  'with': 'sacar',
  'withdraw': 'sacar',
  'pay': 'transferir',
  'pagar': 'transferir',
  'pix': 'transferir',
  'doar': 'transferir',
  'shop': 'loja',
  'store': 'loja',
  'mercado': 'market',
  'mkt': 'market',
  'sell': 'vender',
  'top': 'top',
  'ranking': 'top',
  'ranks': 'top',
  'leaderboard': 'top',

  // --- Submundo & Módulos ---
  'crime': 'crime',
  'delito': 'crime',
  'roubar': 'assaltar',
  'rob': 'assaltar',
  'assalto': 'assaltar',
  'farm': 'fazenda',
  'plantacao': 'plantação',
  'plantar': 'plantação',
  'repair': 'recuperar',
  'reparar': 'recuperar',
  'consertar': 'recuperar',
  'namoro': 'namorar',
  'casar': 'casamento',
  'casados': 'casamento',
  'matrimonio': 'casamento',
  'matrimônio': 'casamento',
  'rep': 'reputação',
  'reputacao': 'reputação',
  'nivel': 'nível',
  'rank': 'nível',
  'xp': 'nível',
  'vips': 'vip',
  'beneficios': 'vip',
  'work': 'trabalhar',
  'trampar': 'trabalhar',
  'trampo': 'trabalhar',
  'empregos': 'emprego',
  'jobs': 'emprego',
  'job': 'emprego',
  'stats': 'estatísticas',
  'estatisticas': 'estatísticas',
  'cooldowns': 'tempo',
  'cd': 'tempo',
  'lembretes': 'lembrete',
  'remind': 'lembrete',
  'cacar': 'caçar',
  'hunt': 'caçar',
  'pesca': 'pescar',
  'fish': 'pescar',

  // --- Apostas & Cassino ---
  'aposta': 'apostar',
  'bet': 'apostar',
  'jkp': 'jokenpo',
  'ppt': 'jokenpo',
  'slot': 'slotmachine',
  'slots': 'slotmachine',
  'cacaniquel': 'slotmachine',
  'caça-níquel': 'slotmachine',
  'raspar': 'raspadinha',
  'race': 'corrida',
  'bj': 'blackjack',
  '21': 'blackjack',

  // --- Utilidades ---
  'ajuda': 'help',
  'comandos': 'help',
  'info': 'botinfo',
  'bot': 'botinfo',
  'server': 'servidor',
  'user': 'usuário',
  'usuario': 'usuário',
  'emojis': 'emoji',
};

/**
 * Adaptador / Shim que emula a interface de CommandInteraction para uma Message do Discord.
 * Permite que qualquer comando slash execute via prefixo sem alterar sua lógica interna.
 */
class MessageInteractionShim {
  constructor(message, slashCommand, rawArgs, client, emoji, color) {
    this.message = message;
    this.slashCommand = slashCommand;
    this.rawArgs = [...rawArgs];
    this.client = client;
    this.emoji = emoji || {};
    this.color = color || { embed: '#831396' };

    this.id = message.id;
    this.guild = message.guild;
    this.guildId = message.guild?.id || null;
    this.channel = message.channel;
    this.channelId = message.channel.id;
    this.user = message.author;
    this.member = message.member;
    this.commandName = slashCommand.name;
    this.type = 1; // ChatInput
    this.createdTimestamp = message.createdTimestamp;
    this.createdAt = message.createdAt;
    this.locale = 'pt-BR';
    this.guildLocale = 'pt-BR';

    this.replied = false;
    this.deferred = false;
    this.replyMessage = null;

    this.options = {
      _subcommand: null,
      _group: null,
      data: [],
      _values: {},
      getString: (name) => {
        const val = this.options._values[name.toLowerCase()];
        return (val !== undefined && val !== null) ? String(val) : null;
      },
      getUser: (name) => {
        const val = this.options._values[name.toLowerCase()];
        if (val && typeof val === 'object' && val.id) return val;
        return null;
      },
      getMember: (name) => {
        const user = this.options.getUser(name);
        if (!user) return null;
        return this.guild?.members.cache.get(user.id) || null;
      },
      getNumber: (name) => {
        const val = this.options._values[name.toLowerCase()];
        if (val !== undefined && val !== null && !isNaN(Number(val))) return Number(val);
        return null;
      },
      getInteger: (name) => {
        const val = this.options._values[name.toLowerCase()];
        if (val !== undefined && val !== null && !isNaN(parseInt(val, 10))) return parseInt(val, 10);
        return null;
      },
      getBoolean: (name) => {
        const val = this.options._values[name.toLowerCase()];
        if (val === true || val === 'true' || val === 'sim' || val === '1') return true;
        if (val === false || val === 'false' || val === 'nao' || val === 'não' || val === '0') return false;
        return null;
      },
      getChannel: (name) => {
        const val = this.options._values[name.toLowerCase()];
        if (val && typeof val === 'object' && val.id) return val;
        return null;
      },
      getRole: (name) => {
        const val = this.options._values[name.toLowerCase()];
        if (val && typeof val === 'object' && val.id) return val;
        return null;
      },
      getSubcommand: (required = true) => {
        return this.options._subcommand;
      },
      getSubcommandGroup: (required = false) => {
        return this.options._group;
      },
      get: (name) => {
        const val = this.options._values[name.toLowerCase()];
        if (val === undefined) return null;
        return {
          name,
          value: (typeof val === 'object' && val.id) ? val.id : val,
          user: (typeof val === 'object' && val.id) ? val : null,
          channel: (typeof val === 'object' && val.isTextBased) ? val : null,
          role: (typeof val === 'object' && val.color !== undefined) ? val : null
        };
      }
    };

    this.positivo = async ({ content, ephemeral, components }) => {
      return await this.followUp({
        content: `${this.emoji.positivo || '✅'} **|** ${content || 'Ação executada com sucesso.'}`,
        components
      });
    };

    this.error = async ({ content, ephemeral, components }) => {
      return await this.followUp({
        content: `${this.emoji.negativo || '❌'} **|** ${content || 'Ocorreu um erro ao executar este comando.'}`,
        components
      });
    };
  }

  inGuild() {
    return !!this.guild;
  }

  isCommand() {
    return true;
  }

  isChatInputCommand() {
    return true;
  }

  isRepliable() {
    return true;
  }

  isButton() {
    return false;
  }

  isStringSelectMenu() {
    return false;
  }

  async deferReply(options = {}) {
    this.deferred = true;
    this.channel.sendTyping().catch(() => {});
    return Promise.resolve();
  }

  async reply(options) {
    if (this.replied || this.replyMessage) {
      return await this.channel.send(options);
    }
    this.replyMessage = await this.message.reply(options);
    this.replied = true;
    return this.replyMessage;
  }

  async editReply(options) {
    if (this.replyMessage) {
      return await this.replyMessage.edit(options);
    }
    // Se ainda não havia mensagem enviada, responde a mensagem inicial
    this.replyMessage = await this.message.reply(options);
    this.replied = true;
    return this.replyMessage;
  }

  async followUp(options) {
    if (!this.replyMessage) {
      this.replyMessage = await this.message.reply(options);
      this.replied = true;
      return this.replyMessage;
    }
    return await this.message.reply(options).catch(() => this.channel.send(options));
  }

  async fetchReply() {
    return this.replyMessage || this.message;
  }

  async deleteReply() {
    if (this.replyMessage && this.replyMessage.deletable) {
      await this.replyMessage.delete().catch(() => {});
      this.replyMessage = null;
    }
  }

  /**
   * Converte argumentos da mensagem em opções estruturadas do Slash Command
   */
  async initializeOptions() {
    const optionsDefs = this.slashCommand.options || [];
    const tokens = [...this.rawArgs];

    // 1. Detecção de Subcomandos
    const subcmdDefs = optionsDefs.filter(opt => 
      opt.type === 1 || // ApplicationCommandOptionType.Subcommand
      opt.type === 'SUB_COMMAND' ||
      (opt.options && Array.isArray(opt.options))
    );

    let activeOptions = optionsDefs;

    if (subcmdDefs.length > 0) {
      const firstToken = tokens[0] ? tokens[0].toLowerCase() : null;
      const normalizedFirst = firstToken ? normalize(firstToken) : null;

      const matchedSub = subcmdDefs.find(sub => 
        sub.name.toLowerCase() === firstToken || 
        normalize(sub.name) === normalizedFirst
      );

      if (matchedSub) {
        this.options._subcommand = matchedSub.name;
        tokens.shift(); // Consome o token do subcomando
        activeOptions = matchedSub.options || [];
      } else {
        // Se o usuário não forneceu o subcomando explicitamente mas chamou o comando principal,
        // assume o primeiro subcomando padrão (ex: 'lista', 'global', 'ver')
        this.options._subcommand = subcmdDefs[0].name;
        activeOptions = subcmdDefs[0].options || [];
      }
    }

    const parsedValues = {};

    // 2.1 Passagem 1: Menções / Usuários (Type 6 ou nome contendo usuario/usuário)
    for (const opt of activeOptions) {
      const isUserType = opt.type === 6 || opt.name.toLowerCase() === 'usuário' || opt.name.toLowerCase() === 'usuario';
      if (!isUserType) continue;

      let userFound = null;
      let tokenIndexFound = -1;

      // Procura menção direta (<@123>) ou snowflake ID no array de tokens
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const mentionMatch = token.match(/^<@!?(\d+)>$/);
        const rawIdMatch = token.match(/^(\d{17,20})$/);

        const id = mentionMatch ? mentionMatch[1] : (rawIdMatch ? rawIdMatch[1] : null);
        if (id) {
          userFound = this.client.users.cache.get(id) || await this.client.users.fetch(id).catch(() => null);
          if (userFound) {
            tokenIndexFound = i;
            break;
          }
        }
      }

      // Se não encontrou por ID/menção no texto, verifica se há menções nativas na mensagem
      if (!userFound && this.message.mentions.users.size > 0) {
        const firstMention = this.message.mentions.users.first();
        if (firstMention) {
          userFound = firstMention;
        }
      }

      if (userFound) {
        parsedValues[opt.name.toLowerCase()] = userFound;
        if (tokenIndexFound !== -1) {
          tokens.splice(tokenIndexFound, 1);
        }
      }
    }

    // 2.2 Passagem 2: Canais (Type 7)
    for (const opt of activeOptions) {
      if (opt.type !== 7 && opt.name.toLowerCase() !== 'canal') continue;

      let channelFound = null;
      let tokenIndexFound = -1;

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const match = token.match(/^<#(\d+)>$/) || token.match(/^(\d{17,20})$/);
        if (match) {
          const ch = this.guild?.channels.cache.get(match[1]);
          if (ch) {
            channelFound = ch;
            tokenIndexFound = i;
            break;
          }
        }
      }

      if (channelFound) {
        parsedValues[opt.name.toLowerCase()] = channelFound;
        if (tokenIndexFound !== -1) tokens.splice(tokenIndexFound, 1);
      }
    }

    // 2.3 Passagem 3: Cargos (Type 8)
    for (const opt of activeOptions) {
      if (opt.type !== 8 && opt.name.toLowerCase() !== 'cargo') continue;

      let roleFound = null;
      let tokenIndexFound = -1;

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const match = token.match(/^<@&(\d+)>$/) || token.match(/^(\d{17,20})$/);
        if (match) {
          const r = this.guild?.roles.cache.get(match[1]);
          if (r) {
            roleFound = r;
            tokenIndexFound = i;
            break;
          }
        }
      }

      if (roleFound) {
        parsedValues[opt.name.toLowerCase()] = roleFound;
        if (tokenIndexFound !== -1) tokens.splice(tokenIndexFound, 1);
      }
    }

    // 2.4 Passagem 4: Opções com Escolhas Pré-definidas (Choices)
    for (const opt of activeOptions) {
      if (!Array.isArray(opt.choices) || opt.choices.length === 0) continue;

      let choiceMatch = null;
      let tokenIndexFound = -1;

      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        const normT = normalize(t);

        const foundChoice = opt.choices.find(c => 
          c.value.toLowerCase() === t.toLowerCase() ||
          normalize(c.name).includes(normT) ||
          normalize(c.value) === normT
        );

        if (foundChoice) {
          choiceMatch = foundChoice.value;
          tokenIndexFound = i;
          break;
        }
      }

      if (choiceMatch !== null) {
        parsedValues[opt.name.toLowerCase()] = choiceMatch;
        if (tokenIndexFound !== -1) tokens.splice(tokenIndexFound, 1);
      }
    }

    // 2.5 Passagem 5: Números e Strings Restantes
    const remainingOpts = activeOptions.filter(opt => 
      parsedValues[opt.name.toLowerCase()] === undefined
    );

    for (let idx = 0; idx < remainingOpts.length; idx++) {
      const opt = remainingOpts[idx];
      const isLast = (idx === remainingOpts.length - 1);

      if (tokens.length === 0) break;

      // Se for número
      if (opt.type === 4 || opt.type === 10) { // Integer ou Number
        const numToken = tokens.shift();
        const parsedNum = Number(numToken);
        if (!isNaN(parsedNum)) {
          parsedValues[opt.name.toLowerCase()] = parsedNum;
        }
      } else {
        // String ou genérico
        if (isLast) {
          // Se for a última opção, consome todo o restante do texto digitado
          parsedValues[opt.name.toLowerCase()] = tokens.join(' ');
          tokens.length = 0;
        } else {
          parsedValues[opt.name.toLowerCase()] = tokens.shift();
        }
      }
    }

    this.options._values = parsedValues;
    this.options.data = Object.entries(parsedValues).map(([name, value]) => ({
      name,
      value: (typeof value === 'object' && value.id) ? value.id : value
    }));
  }
}

/**
 * Resolve um comando digitado via prefixo verificando comandos de administração e comandos Slash
 */
function findSlashCommand(cmdName, client) {
  if (!cmdName || !client.slashCommands) return null;

  const exact = client.slashCommands.get(cmdName);
  if (exact) return exact;

  const normalized = normalize(cmdName);

  // Verifica no mapa de aliases
  const aliasTarget = SLASH_ALIASES[cmdName] || SLASH_ALIASES[normalized];
  if (aliasTarget && client.slashCommands.has(aliasTarget)) {
    return client.slashCommands.get(aliasTarget);
  }

  // Procura por normalização de nome de todos os comandos registrados
  for (const [sName, sCmd] of client.slashCommands.entries()) {
    if (normalize(sName) === normalized) {
      return sCmd;
    }
  }

  return null;
}

/**
 * Executa um comando Slash adaptado através de uma mensagem de prefixo
 */
async function executeSlashAsPrefix(client, message, slashCommand, args, prefixo, color, database, emoji) {
  try {
    // Cria o adaptador shim
    const shim = new MessageInteractionShim(message, slashCommand, args, client, emoji, color);
    await shim.initializeOptions();

    // Verifica se o comando principal ou o subcomando específico foi desativado no servidor
    const subcommand = shim.options._subcommand;
    const fullCommandName = subcommand ? `${slashCommand.name} ${subcommand}` : slashCommand.name;

    if (message.guild) {
      const disabledSnap = await database.ref(`servers/${message.guild.id}/disabled_commands`).once('value');
      const disabledCommands = disabledSnap.val() || [];
      const isBlocked = disabledCommands.some(d => 
        d.toLowerCase() === slashCommand.name.toLowerCase() ||
        d.toLowerCase() === fullCommandName.toLowerCase() ||
        normalize(d) === normalize(slashCommand.name) ||
        normalize(d) === normalize(fullCommandName)
      );

      if (isBlocked) {
        return message.reply({
          content: `${emoji.negativo || '❌'} **|** O comando \`${prefixo}${fullCommandName}\` foi desativado pelos administradores no painel do servidor.`
        });
      }
    }

    // Concede XP de comando slash de forma consistente
    await grantSlashCommandXp(shim).catch(() => {});

    console.log(`${emoji.positivo || '✅'} Comando Slash via Prefixo [${prefixo}${fullCommandName}] | ${message.author.username} (${message.author.id}) | #${message.channel.name}\n`);

    // Executa o comando
    return await slashCommand.run(client, shim, args, color, database, emoji);

  } catch (error) {
    console.error(`[commandBridge] Erro ao executar ${slashCommand.name} via prefixo:`, error);
    return message.reply({
      content: `${emoji.negativo || '❌'} **|** Ocorreu um erro inesperado na utilização deste comando.`
    }).catch(() => {});
  }
}

module.exports = {
  SLASH_ALIASES,
  normalize,
  findSlashCommand,
  executeSlashAsPrefix,
  MessageInteractionShim
};
