// =========================================================
// MAIN ENTRY & DISCORD CLIENT
// =========================================================
const { Client, Collection, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const express = require('express');
const cookieParser = require('cookie-parser');
const { z } = require('zod');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { BACKGROUNDS_CATALOG, LAYOUTS_CATALOG, getBackgroundById, getLayoutById } = require('./src/utils/shopCatalog.js');

let client = new Client({
  partials: [],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildModeration,
  ]
});

module.exports = client;
client.commands = new Collection();
client.slashCommands = new Collection();
client.aliases = new Collection();

let configKeys = { TOKEN: "", CLIENT_ID: "" };
try {
  configKeys = require('./src/config.js');
} catch (e) {
  console.warn("Could not load config.js. Generating default in-memory configs.");
}
client.config = configKeys;

// =========================================================
// FIREBASE INITIALIZATION
// =========================================================
let db = null;
try {
  const firebaseApp = require("firebase/app");
  require("firebase/database");
  const dbCreds = require("./databases.json");
  
  if (dbCreds && dbCreds.apiKey && dbCreds.apiKey.trim() !== "") {
    firebaseApp.initializeApp(dbCreds);
    db = firebaseApp.database();
    console.log("[Firebase] Banco de dados conectado com sucesso.");
  } else {
    console.warn("[Firebase] AVISO: Banco de dados não configurado (databases.json vazio ou sem apiKey). O Dashboard não poderá salvar dados.");
  }
} catch (error) {
  console.error("[Firebase] ERRO CRÍTICO ao inicializar:", error.message);
}

// Load commands locally to list in dashboard and populate simulator
try {
  // Load message-based commands
  fs.readdirSync('./src/commands/').forEach(dir => {
    try {
      const files = fs.readdirSync(`./src/commands/${dir}/`).filter(file => file.endsWith('.js'));
      files.forEach((file) => {
        try {
          const command = require(`./src/commands/${dir}/${file}`);
          if (command && command.name) {
            command.category = dir;
            client.commands.set(command.name, command);
            if (command.aliases && Array.isArray(command.aliases)) {
              command.aliases.forEach(alias => {
                client.aliases.set(alias, command.name);
              });
            }
          }
        } catch (e) {}
      });
    } catch (e) {}
  });

  // Load Slash Commands
  fs.readdirSync('./src/SlashCommand/').forEach(dir => {
    try {
      const files = fs.readdirSync(`./src/SlashCommand/${dir}/`).filter(file => file.endsWith('.js'));
      files.forEach((file) => {
        try {
          const slashCommand = require(`./src/SlashCommand/${dir}/${file}`);
          if (slashCommand && slashCommand.name) {
            slashCommand.category = dir;
            client.slashCommands.set(slashCommand.name, slashCommand);
          }
        } catch (e) {}
      });
    } catch (e) {}
  });

  console.log(`[Sistine Bot] Loaded ${client.commands.size} Prefix Commands and ${client.slashCommands.size} Slash Commands.`);
} catch (err) {
  console.error("Error loading commands list:", err);
}

// Optional real client login
if (configKeys.TOKEN) {
  console.log("[Sistine Bot] Attempting Discord login...");
  try {
    fs.readdirSync('./handlers').forEach((handler) => {
      try {
        require(`./handlers/${handler}`)(client, configKeys.TOKEN);
      } catch (err) {
        console.warn(`Error running handler ${handler}:`, err.message);
      }
    });
    client.login(configKeys.TOKEN).catch(err => {
      console.warn("[Sistine Bot] Failed to log in with Discord token:", err.message);
    });
  } catch (error) {
    console.warn("[Sistine Bot] Login handler failed:", error.message);
  }
} else {
  console.log("[Sistine Bot] No Discord TOKEN found in config. Bot online state is MOCKED on port 3000.");
}

// =========================================================
// EXPRESS SERVER & VITE INTEGRATION
// =========================================================
async function startFullStackApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  const sessions = {}; // sessionID -> { userId, username, avatar, guilds, accessToken, csrfToken, expiresAt }

  // Rate Limiting: 100 requests / minute
  const ipRequestCounts = {};
  setInterval(() => {
    for (const ip in ipRequestCounts) {
      delete ipRequestCounts[ip];
    }
  }, 60000);

  function rateLimiter(req, res, next) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    ipRequestCounts[ip] = (ipRequestCounts[ip] || 0) + 1;
    if (ipRequestCounts[ip] > 100) {
      return res.status(429).json({ error: "Limite de requisições excedido. Tente novamente em um minuto." });
    }
    next();
  }

  // Apply rate limiting to all api endpoints
  app.use('/api/', rateLimiter);

  // XSS Sanitizer
  function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }
    const sanitized = {};
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'string') {
        sanitized[key] = sanitizeString(val);
      } else if (typeof val === 'object' && val !== null) {
        sanitized[key] = sanitizeObject(val);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }

  // Input validation schemas
  const configEconomySchema = z.object({
    saldo_inicial: z.number().int().min(0).max(100000000),
    taxa_assalto: z.number().min(0).max(1),
    cooldown_daily: z.number().int().min(0),
    cooldown_crime: z.number().int().min(0),
    cooldown_pescar: z.number().int().min(0),
    cooldown_caçar: z.number().int().min(0),
    cooldown_trabalhar: z.number().int().min(0),
    recompensa_daily: z.number().int().min(0),
    recompensa_weekly: z.number().int().min(0),
  });

  const userEconomySchema = z.object({
    saldo: z.object({
      carteira: z.number().int().min(0),
      banco: z.number().int().min(0),
    }),
    inventario: z.object({
      itens: z.object({
        Consumíveis: z.record(z.string(), z.number().int().min(0)).optional(),
        Equipamentos: z.record(z.string(), z.number().int().min(0)).optional()
      }).optional()
    }).optional(),
    vip: z.object({
      vip: z.number().int().min(0).max(1),
      tempo: z.number().int().min(0)
    }).optional()
  });

  const configUpdateSchema = z.object({
    botConfig: z.object({
      TOKEN: z.string().optional(),
      CLIENT_ID: z.string().optional(),
      SUPPORT_GUILD: z.string().optional(),
      SUPPORT_LINK: z.string().url().or(z.string().length(0)).optional(),
      cargos: z.object({
        criador: z.array(z.string()).optional(),
        developer: z.array(z.string()).optional(),
        booster: z.array(z.string()).optional()
      }).optional()
    }).optional(),
    firebaseConfig: z.object({
      apiKey: z.string().optional(),
      authDomain: z.string().optional(),
      databaseURL: z.string().optional(),
      projectId: z.string().optional(),
      storageBucket: z.string().optional(),
      messagingSenderId: z.string().optional(),
      appId: z.string().optional()
    }).optional()
  });

  // requireAuth middleware for user-specific actions without server requirement
  function requireAuth(req, res, next) {
    const sessionId = req.cookies?.session_id;
    if (!sessionId || !sessions[sessionId]) {
      return res.status(401).json({ error: "Sessão inválida ou expirada. Por favor, faça login novamente." });
    }

    const session = sessions[sessionId];
    if (session.expiresAt < Date.now()) {
      delete sessions[sessionId];
      res.clearCookie('session_id');
      return res.status(401).json({ error: "Sessão expirada. Por favor, faça login novamente." });
    }

    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      const csrfHeader = req.headers['x-csrf-token'];
      if (!csrfHeader || csrfHeader !== session.csrfToken) {
        return res.status(403).json({ error: "Ação rejeitada por falha na verificação de CSRF." });
      }
    }

    req.session = session;
    next();
  }

  // requireAdmin middleware - Validação de permissões em tempo real diretamente do cache/API do Discord
  async function requireAdmin(req, res, next) {
    const sessionId = req.cookies?.session_id;
    if (!sessionId || !sessions[sessionId]) {
      return res.status(401).json({ error: "Sessão inválida ou expirada. Por favor, faça login novamente." });
    }

    const session = sessions[sessionId];
    if (session.expiresAt < Date.now()) {
      delete sessions[sessionId];
      res.clearCookie('session_id');
      return res.status(401).json({ error: "Sessão expirada. Por favor, faça login novamente." });
    }

    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      const csrfHeader = req.headers['x-csrf-token'];
      if (!csrfHeader || csrfHeader !== session.csrfToken) {
        return res.status(403).json({ error: "Ação rejeitada por falha na verificação de CSRF." });
      }
    }

    const selectedServerId = req.headers['x-selected-server'];
    if (!selectedServerId) {
      return res.status(400).json({ error: "Nenhum servidor selecionado." });
    }

    const isBotCreator = client.config?.cargos?.criador?.includes(session.userId) || 
                          client.config?.cargos?.developer?.includes(session.userId) ||
                          session.isDevSession;

    // Se for sessão de teste/dev ou criador/developer
    if (session.isDevSession || (isBotCreator && selectedServerId === '1234567890')) {
      req.session = session;
      req.guildId = selectedServerId;
      return next();
    }

    try {
      // 1. Busca o servidor em tempo real diretamente no cache/API do Discord
      let guild = client.guilds.cache.get(selectedServerId);
      if (!guild) {
        guild = await client.guilds.fetch(selectedServerId).catch(() => null);
      }

      if (!guild) {
        return res.status(404).json({ error: "O bot não está presente neste servidor." });
      }

      // Se for criador/dev global do bot
      if (isBotCreator) {
        req.session = session;
        req.guildId = selectedServerId;
        req.guild = guild;
        return next();
      }

      // 2. Busca o membro em tempo real diretamente do Discord (com force: true para forçar dados atualizados)
      let member = await guild.members.fetch({ user: session.userId, force: true }).catch(() => null);
      if (!member) {
        member = guild.members.cache.get(session.userId);
      }

      if (!member) {
        return res.status(403).json({ 
          error: "Acesso negado: você não foi encontrado como membro deste servidor no Discord.",
          code: "NOT_A_MEMBER"
        });
      }

      // 3. Validação estrita de permissões em tempo real diretamente das propriedades do membro
      const isOwner = guild.ownerId === session.userId || member.id === guild.ownerId;
      const hasAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator) || 
                       member.permissions.has(PermissionsBitField.Flags.ManageGuild) ||
                       member.permissions.has('Administrator') ||
                       member.permissions.has('ManageGuild');

      if (!isOwner && !hasAdmin) {
        return res.status(403).json({ 
          error: "Permissão negada: suas permissões de Administrador ou Gerenciar Servidor foram revogadas no Discord.",
          code: "INSUFFICIENT_PERMISSIONS"
        });
      }

      req.session = session;
      req.guildId = selectedServerId;
      req.guild = guild;
      req.member = member;
      next();
    } catch (err) {
      console.error("[requireAdmin] Erro na verificação de permissões do Discord:", err);
      return res.status(403).json({ 
        error: "Erro ao validar permissões no Discord: " + err.message,
        code: "PERMISSION_CHECK_FAILED"
      });
    }
  }

  // Validador de Hierarquia de Cargos (Autorole / Welcome / etc.)
  async function validateRoleHierarchy(guild, roleIdentifiers) {
    if (!guild || !roleIdentifiers || !Array.isArray(roleIdentifiers) || roleIdentifiers.length === 0) return;

    await guild.roles.fetch().catch(() => {});
    const botMember = guild.members.me || await guild.members.fetch(client.user.id).catch(() => null);
    
    if (!botMember) {
      throw new Error("Não foi possível carregar as informações do bot no servidor para validar a hierarquia.");
    }

    const hasManageRoles = botMember.permissions.has(PermissionsBitField.Flags.ManageRoles) || 
                           botMember.permissions.has(PermissionsBitField.Flags.Administrator) ||
                           botMember.permissions.has('ManageRoles') ||
                           botMember.permissions.has('Administrator');
    
    if (!hasManageRoles) {
      throw new Error("O bot não possui a permissão 'Gerenciar Cargos' no Discord para poder atribuir cargos.");
    }

    const botHighestRole = botMember.roles.highest;
    const botHighestPos = botHighestRole ? botHighestRole.position : 0;

    for (const identifier of roleIdentifiers) {
      if (!identifier || typeof identifier !== 'string') continue;

      const role = guild.roles.cache.get(identifier) || 
                   guild.roles.cache.find(r => r.name === identifier) ||
                   await guild.roles.fetch(identifier).catch(() => null);

      if (!role) continue;

      if (role.name === '@everyone') {
        throw new Error("O cargo @everyone não pode ser configurado.");
      }

      if (role.managed) {
        throw new Error(`O cargo @${role.name} é gerenciado por uma integração ou bot externo e não pode ser atribuído.`);
      }

      if (role.position >= botHighestPos) {
        throw new Error(`Bloqueio de Hierarquia: O cargo @${role.name} (posição ${role.position}) está acima ou no mesmo nível do cargo mais alto do bot (@${botHighestRole?.name || 'Sistine'} - posição ${botHighestPos}). Mova o cargo do bot para cima na lista de cargos do Discord.`);
      }
    }
  }

  // Audit Logs persistence helper unificado
  async function writeAuditLog({ userId, username, guildId, action, oldValue, newValue, ip }) {
    if (!db) return;
    const logEntry = {
      userId,
      username,
      guildId,
      action,
      oldValue: oldValue ? JSON.stringify(oldValue) : "",
      newValue: newValue ? JSON.stringify(newValue) : "",
      ip,
      date: new Date().toISOString()
    };
    try {
      await db.ref(`servers/${guildId}/audit_logs`).push(logEntry);
    } catch (e) {
      console.error("Failed to write audit log to database:", e);
    }
  }

  // Dev Mock/Bypass Login
  app.post('/api/auth/dev-login', (req, res) => {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const csrfToken = crypto.randomBytes(24).toString('hex');

    const devGuilds = [
      {
        id: "1234567890",
        name: "Sistine Sandbox Server",
        icon: "https://i.postimg.cc/9QYx00L8/avatar.png",
        owner: true,
        permissions: "8",
        mockActive: true,
        mockMembers: 1420,
        mockPremium: true
      }
    ];

    sessions[sessionId] = {
      userId: "1234567890",
      username: "DevTester",
      avatar: "https://i.postimg.cc/9QYx00L8/avatar.png",
      guilds: devGuilds,
      accessToken: "mock-dev-token",
      csrfToken,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      isDevSession: true
    };

    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, csrfToken });
  });

  // Discord Auth - Login URL
  app.get('/api/auth/url', (req, res) => {
    const host = req.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/auth/callback`;

    const clientId = client.config.CLIENT_ID || process.env.CLIENT_ID;
    if (!clientId) {
      return res.status(400).json({ error: "CLIENT_ID não configurado no servidor (.env)." });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify guilds'
    });

    const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  // Discord Auth - OAuth Callback Endpoint
  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.send(`<html><body><script>window.close();</script><p>Erro: Código não recebido.</p></body></html>`);
    }

    const host = req.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/auth/callback`;

    const clientId = process.env.CLIENT_ID || "1515783670403956826";
    const clientSecret = process.env.CLIENT_SECRET || "cF4wcN6_OV4bqeqyBw1ssQHXGFg-BWAM";

    if (!clientId || !clientSecret) {
      return res.send(`<html><body><p>Erro: CLIENT_ID ou CLIENT_SECRET não configurados.</p></body></html>`);
    }

    try {
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri
        })
      });

      if (!tokenResponse.ok) {
        throw new Error(`Falha no intercâmbio de token`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!userResponse.ok) throw new Error('Falha ao obter dados do usuário do Discord.');
      const userData = await userResponse.json();

      const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      let guildsData = [];
      if (guildsResponse.ok) guildsData = await guildsResponse.json();

      const sessionId = crypto.randomBytes(32).toString('hex');
      const csrfToken = crypto.randomBytes(24).toString('hex');

      const MANAGE_GUILD_BIT = 0x20;
      const ADMINISTRATOR_BIT = 0x8;
      const filteredGuilds = guildsData.filter(guild => {
        const permissions = BigInt(guild.permissions);
        return (permissions & BigInt(ADMINISTRATOR_BIT)) === BigInt(ADMINISTRATOR_BIT) ||
               (permissions & BigInt(MANAGE_GUILD_BIT)) === BigInt(MANAGE_GUILD_BIT) ||
               guild.owner === true;
      }).map(g => ({
        id: g.id,
        name: g.name,
        icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : "https://i.postimg.cc/9QYx00L8/avatar.png",
        owner: g.owner,
        permissions: g.permissions
      }));

      sessions[sessionId] = {
        userId: userData.id,
        username: userData.username,
        global_name: userData.global_name || userData.username,
        avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : "https://i.postimg.cc/9QYx00L8/avatar.png",
        flags: userData.flags,
        public_flags: userData.public_flags,
        guilds: filteredGuilds,
        accessToken,
        csrfToken,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
      };

      res.cookie('session_id', sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Autenticação bem-sucedida! Esta janela fechará automaticamente.</p>
          </body>
        </html>
      `);
    } catch (err) {
      console.error("Erro no callback do OAuth:", err);
      res.send(`<html><body><p>Erro durante a autenticação: ${err.message}</p></body></html>`);
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    const sessionId = req.cookies?.session_id;
    if (!sessionId || !sessions[sessionId]) return res.status(401).json({ authenticated: false });
    const session = sessions[sessionId];
    if (session.expiresAt < Date.now()) {
      delete sessions[sessionId];
      res.clearCookie('session_id');
      return res.status(401).json({ authenticated: false });
    }

    let flagsArray = [];
    if (client && client.users) {
      try {
        const discordUser = await client.users.fetch(session.userId, { force: true }).catch(() => null);
        if (discordUser && discordUser.flags) {
          flagsArray = typeof discordUser.flags.toArray === 'function' ? discordUser.flags.toArray() : [];
        }
      } catch (e) {}
    }
    if (flagsArray.length === 0 && (session.flags || session.public_flags)) {
      try {
        const { UserFlagsBitField } = require('discord.js');
        const bitfield = new UserFlagsBitField(session.flags || session.public_flags);
        flagsArray = bitfield.toArray();
      } catch (e) {}
    }

    res.json({
      authenticated: true,
      user: { 
        id: session.userId, 
        username: session.username, 
        global_name: session.global_name || session.username,
        avatar: session.avatar,
        flagsArray 
      },
      csrfToken: session.csrfToken
    });
  });

  // Helper para estruturar os dados completos do usuário para o Dashboard e Lojas
  function buildUserDbResponse(userId, userEcoData, flagsArray = []) {
    const perfil = userEcoData.Perfil || {};
    const info = perfil.Informações || perfil.Informacoes || {};
    const equipados = perfil.Equipados || {};
    const badges = perfil.Badges || perfil.BadgesConfig || {};
    const layoutsObj = perfil.Layouts || {};
    const backgroundsObj = perfil.Backgrounds || {};
    const inventario = userEcoData.inventario || userEcoData.inventory || {};

    const sobremimFinal = info.sobremim || userEcoData.sobremim || "Sou uma linda borboleta!";
    const backgroundFinal = equipados.background || info.imagemperfil || "/src/utils/assets/backgrounds/wallhaven-1kp5jv.png";
    const backgroundIdFinal = equipados.backgroundId || (BACKGROUNDS_CATALOG.find(b => b.url === backgroundFinal)?.id) || 'default_bg';
    const layoutFinal = equipados.layout || equipados.layoutId || "classic_azul";

    // Monta lista de IDs de backgrounds que o usuário possui
    const ownedBgSet = new Set(['default_bg']);
    if (Array.isArray(inventario.wallpapers)) inventario.wallpapers.forEach(id => ownedBgSet.add(id));
    if (Array.isArray(inventario.backgrounds)) inventario.backgrounds.forEach(id => ownedBgSet.add(id));
    if (typeof backgroundsObj === 'object') {
      Object.keys(backgroundsObj).forEach(k => {
        if (backgroundsObj[k]) ownedBgSet.add(k);
      });
    }
    const matchedCatalogBg = BACKGROUNDS_CATALOG.find(b => b.url === backgroundFinal || b.id === backgroundFinal);
    if (matchedCatalogBg) ownedBgSet.add(matchedCatalogBg.id);

    // Monta lista de IDs de layouts que o usuário possui
    const ownedLayoutSet = new Set(['classic_azul']);
    if (Array.isArray(inventario.layouts)) inventario.layouts.forEach(id => ownedLayoutSet.add(id));
    if (typeof layoutsObj === 'object') {
      Object.keys(layoutsObj).forEach(k => {
        if (layoutsObj[k] && !k.endsWith('_log')) ownedLayoutSet.add(k);
        if (k.startsWith('tema_') && k.endsWith('_log') && layoutsObj[k] > 0) {
          const color = k.replace('tema_', '').replace('_log', '');
          ownedLayoutSet.add(`classic_${color}`);
        }
      });
    }
    if (layoutFinal) ownedLayoutSet.add(layoutFinal);

    const ownedBackgrounds = Array.from(ownedBgSet);
    const ownedLayouts = Array.from(ownedLayoutSet);

    return {
      userId,
      flagsArray,
      ...userEcoData,
      Perfil: {
        ...perfil,
        Informações: {
          sobremim: sobremimFinal,
          imagemperfil: backgroundFinal,
          ...info
        },
        Informacoes: {
          sobremim: sobremimFinal,
          imagemperfil: backgroundFinal,
          ...info
        },
        Equipados: {
          background: backgroundFinal,
          backgroundId: backgroundIdFinal,
          layout: layoutFinal,
          ...equipados
        },
        Badges: {
          disabled: badges.disabled || [],
          selectedLevels: badges.selectedLevels || {},
          selectedHypeSquad: badges.selectedHypeSquad || "HypeSquadOnlineHouse1",
          customUnlocked: badges.customUnlocked || [],
          ...badges
        },
        Layouts: layoutsObj,
        Backgrounds: backgroundsObj
      },
      saldo: userEcoData.saldo || { carteira: 0, banco: 0 },
      vip: userEcoData.vip || { vip: 0, tempo: 0, data: null },
      inventario: {
        ...inventario,
        wallpapers: ownedBackgrounds,
        backgrounds: ownedBackgrounds,
        layouts: ownedLayouts
      },
      inventory: {
        ...inventario,
        wallpapers: ownedBackgrounds,
        backgrounds: ownedBackgrounds,
        layouts: ownedLayouts
      },
      ownedBackgrounds,
      ownedLayouts,
      equippedBackground: {
        id: backgroundIdFinal,
        url: backgroundFinal
      },
      equippedLayout: {
        id: layoutFinal
      },
      catalog: {
        backgrounds: BACKGROUNDS_CATALOG,
        layouts: LAYOUTS_CATALOG
      }
    };
  }

  // Endpoint para buscar todos os dados do Usuário (Perfil, Badges, Economia, etc.) da Database
  app.get('/api/user/database', requireAuth, async (req, res) => {
    const userId = req.session.userId;

    let flagsArray = [];
    if (client && client.users) {
      try {
        const discordUser = await client.users.fetch(userId, { force: true }).catch(() => null);
        if (discordUser && discordUser.flags) {
          flagsArray = typeof discordUser.flags.toArray === 'function' ? discordUser.flags.toArray() : [];
        }
      } catch (e) {}
    }
    if (flagsArray.length === 0 && (req.session.flags || req.session.public_flags)) {
      try {
        const { UserFlagsBitField } = require('discord.js');
        const bitfield = new UserFlagsBitField(req.session.flags || req.session.public_flags);
        flagsArray = bitfield.toArray();
      } catch (e) {}
    }

    if (!db) {
      return res.json(buildUserDbResponse(userId, {}, flagsArray));
    }

    try {
      const snap = await db.ref(`economia/${userId}`).once('value');
      const userEcoData = snap.val() || {};
      res.json(buildUserDbResponse(userId, userEcoData, flagsArray));
    } catch (e) {
      console.error("Erro ao ler banco de dados do usuário:", e);
      res.status(500).json({ error: "Erro ao buscar dados do usuário na base de dados." });
    }
  });

  // Endpoint para Obter o Catálogo Oficial de Wallpapers e Layouts
  app.get('/api/user/shop/catalog', (req, res) => {
    res.json({
      backgrounds: BACKGROUNDS_CATALOG,
      layouts: LAYOUTS_CATALOG
    });
  });

  // Endpoint para Comprar Backgrounds (Wallpapers)
  app.post('/api/user/shop/buy-background', requireAuth, async (req, res) => {
    if (!db) return res.status(503).json({ error: "Banco de dados indisponível." });

    const userId = req.session.userId;
    const { backgroundId } = req.body;

    const bgItem = BACKGROUNDS_CATALOG.find(b => b.id === backgroundId);
    if (!bgItem) {
      return res.status(404).json({ error: "Background não encontrado no catálogo." });
    }

    try {
      const snap = await db.ref(`economia/${userId}`).once('value');
      const userEcoData = snap.val() || {};
      const saldo = userEcoData.saldo || { carteira: 0, banco: 0 };
      const carteira = Number(saldo.carteira || 0);
      const vipData = userEcoData.vip || { vip: 0 };
      const isVip = Number(vipData.vip || 0) > 0;

      if (bgItem.vipOnly && !isVip) {
        return res.status(403).json({ error: "Este wallpaper é exclusivo para membros com plano VIP ativo." });
      }

      const backgroundsObj = userEcoData.Perfil?.Backgrounds || {};
      const inventario = userEcoData.inventario || userEcoData.inventory || {};
      const currentWallpapers = Array.isArray(inventario.wallpapers) ? inventario.wallpapers : [];

      if (backgroundsObj[bgItem.id] || currentWallpapers.includes(bgItem.id) || bgItem.id === 'default_bg') {
        return res.status(400).json({ error: "Você já possui este wallpaper no seu inventário!" });
      }

      if (bgItem.price > 0) {
        if (carteira < bgItem.price) {
          return res.status(400).json({ 
            error: `Saldo insuficiente na carteira! Preço: R$ ${bgItem.price.toLocaleString('pt-BR')} (Carteira: R$ ${carteira.toLocaleString('pt-BR')})` 
          });
        }
        const newCarteira = carteira - bgItem.price;
        await db.ref(`economia/${userId}/saldo/carteira`).set(newCarteira);
      }

      // Adiciona ao inventário permanente do usuário no Firebase
      await db.ref(`economia/${userId}/Perfil/Backgrounds/${bgItem.id}`).set(true);
      const updatedWallpapers = [...new Set([...currentWallpapers, bgItem.id])];
      await db.ref(`economia/${userId}/inventario/wallpapers`).set(updatedWallpapers);
      await db.ref(`economia/${userId}/inventario/backgrounds`).set(updatedWallpapers);
      await db.ref(`economia/${userId}/inventory/wallpapers`).set(updatedWallpapers);

      const updatedSnap = await db.ref(`economia/${userId}`).once('value');
      const updatedData = updatedSnap.val() || {};

      res.json({
        success: true,
        message: `Wallpaper "${bgItem.name}" adquirido com sucesso!`,
        userDb: buildUserDbResponse(userId, updatedData)
      });
    } catch (e) {
      console.error("Erro ao comprar wallpaper:", e);
      res.status(500).json({ error: e.message || "Erro ao processar compra de wallpaper." });
    }
  });

  // Endpoint para Comprar Layouts (Molduras/Temas de Perfil)
  app.post('/api/user/shop/buy-layout', requireAuth, async (req, res) => {
    if (!db) return res.status(503).json({ error: "Banco de dados indisponível." });

    const userId = req.session.userId;
    const { layoutId } = req.body;

    const layoutItem = LAYOUTS_CATALOG.find(l => l.id === layoutId);
    if (!layoutItem) {
      return res.status(404).json({ error: "Layout não encontrado no catálogo." });
    }

    try {
      const snap = await db.ref(`economia/${userId}`).once('value');
      const userEcoData = snap.val() || {};
      const saldo = userEcoData.saldo || { carteira: 0, banco: 0 };
      const carteira = Number(saldo.carteira || 0);
      const vipData = userEcoData.vip || { vip: 0 };
      const isVip = Number(vipData.vip || 0) > 0;

      if (layoutItem.vipOnly && !isVip) {
        return res.status(403).json({ error: "Este layout é exclusivo para membros com plano VIP ativo." });
      }

      const layoutsObj = userEcoData.Perfil?.Layouts || {};
      const inventario = userEcoData.inventario || userEcoData.inventory || {};
      const currentLayouts = Array.isArray(inventario.layouts) ? inventario.layouts : [];

      if (layoutsObj[layoutItem.id] || currentLayouts.includes(layoutItem.id) || layoutItem.id === 'classic_azul') {
        return res.status(400).json({ error: "Você já possui este layout no seu inventário!" });
      }

      if (layoutItem.price > 0) {
        if (carteira < layoutItem.price) {
          return res.status(400).json({ 
            error: `Saldo insuficiente na carteira! Preço: R$ ${layoutItem.price.toLocaleString('pt-BR')} (Carteira: R$ ${carteira.toLocaleString('pt-BR')})` 
          });
        }
        const newCarteira = carteira - layoutItem.price;
        await db.ref(`economia/${userId}/saldo/carteira`).set(newCarteira);
      }

      await db.ref(`economia/${userId}/Perfil/Layouts/${layoutItem.id}`).set(true);
      const updatedLayouts = [...new Set([...currentLayouts, layoutItem.id])];
      await db.ref(`economia/${userId}/inventario/layouts`).set(updatedLayouts);
      await db.ref(`economia/${userId}/inventory/layouts`).set(updatedLayouts);

      const updatedSnap = await db.ref(`economia/${userId}`).once('value');
      const updatedData = updatedSnap.val() || {};

      res.json({
        success: true,
        message: `Layout "${layoutItem.name}" adquirido com sucesso!`,
        userDb: buildUserDbResponse(userId, updatedData)
      });
    } catch (e) {
      console.error("Erro ao comprar layout:", e);
      res.status(500).json({ error: e.message || "Erro ao processar compra de layout." });
    }
  });

  // Endpoint para Equipar Background ou Layout
  app.post('/api/user/shop/equip', requireAuth, async (req, res) => {
    if (!db) return res.status(503).json({ error: "Banco de dados indisponível." });

    const userId = req.session.userId;
    const { type, id, customUrl } = req.body;

    try {
      if (type === 'background') {
        let finalUrl = customUrl || '';
        let finalId = id || 'custom';

        if (id && id !== 'custom') {
          const bgItem = BACKGROUNDS_CATALOG.find(b => b.id === id);
          if (!bgItem) return res.status(404).json({ error: "Background não encontrado." });
          finalUrl = bgItem.url;
          finalId = bgItem.id;
        }

        await db.ref(`economia/${userId}/Perfil/Equipados`).update({
          background: finalUrl,
          backgroundId: finalId
        });
        await db.ref(`economia/${userId}/Perfil/Informações/imagemperfil`).set(finalUrl);
        await db.ref(`economia/${userId}/Perfil/Informacoes/imagemperfil`).set(finalUrl);

      } else if (type === 'layout') {
        const layoutItem = LAYOUTS_CATALOG.find(l => l.id === id) || LAYOUTS_CATALOG[0];
        
        await db.ref(`economia/${userId}/Perfil/Equipados`).update({
          layout: layoutItem.id,
          layoutId: layoutItem.id
        });

        const themeName = layoutItem.id.replace('classic_', '').replace('layout_', '').replace('embaixo_', '');
        const themeUpdate = {
          tema_azul_log: 0,
          tema_branco_log: 0,
          tema_laranja_log: 0,
          tema_preto_log: 0,
          tema_verde_log: 0,
          tema_vermelho_log: 0,
          tema_roxo_log: 0
        };
        if (themeUpdate[`tema_${themeName}_log`] !== undefined) {
          themeUpdate[`tema_${themeName}_log`] = 1;
        }
        await db.ref(`economia/${userId}/Perfil/Layouts`).update(themeUpdate);
      } else {
        return res.status(400).json({ error: "Tipo inválido. Use 'background' ou 'layout'." });
      }

      const updatedSnap = await db.ref(`economia/${userId}`).once('value');
      const updatedData = updatedSnap.val() || {};

      res.json({
        success: true,
        message: `${type === 'background' ? 'Wallpaper' : 'Layout'} equipado com sucesso!`,
        userDb: buildUserDbResponse(userId, updatedData)
      });
    } catch (e) {
      console.error("Erro ao equipar item:", e);
      res.status(500).json({ error: e.message || "Erro ao equipar item." });
    }
  });

  // Endpoint para Salvar alterações do Usuário (Perfil, Badges, etc.) na Database
  app.post('/api/user/database/update', requireAuth, async (req, res) => {
    if (!db) return res.status(503).json({ error: "Banco de dados indisponível." });

    const userId = req.session.userId;
    const { key, value } = req.body;

    console.log(`[USER DB UPDATE] Salvando '${key}' para o usuário ${userId}`);

    try {
      if (key === 'profile' || key === 'Perfil') {
        const sobremim = value.sobremim !== undefined 
          ? value.sobremim 
          : (value.Informações?.sobremim || value.Informacoes?.sobremim || "");
          
        const background = value.background !== undefined 
          ? value.background 
          : (value.backgroundUrl || value.imagemperfil || value.Equipados?.background || value.Informações?.imagemperfil || "");
        
        const backgroundId = value.backgroundId || value.equippedWallpaper || (BACKGROUNDS_CATALOG.find(b => b.url === background)?.id) || 'default_bg';
          
        let theme = value.theme || value.layout || value.Equipados?.layout || value.layoutId || "classic_azul";
        const matchedLayout = LAYOUTS_CATALOG.find(l => l.id === theme) || LAYOUTS_CATALOG.find(l => l.id === `classic_${theme}`);
        if (matchedLayout) {
          theme = matchedLayout.id;
        }

        await db.ref(`economia/${userId}/Perfil/Informações`).update({
          sobremim: sobremim,
          imagemperfil: background
        });
        await db.ref(`economia/${userId}/Perfil/Informacoes`).update({
          sobremim: sobremim,
          imagemperfil: background
        });
        await db.ref(`economia/${userId}/Perfil/Equipados`).update({
          background: background,
          backgroundId: backgroundId,
          layout: theme,
          layoutId: theme
        });

        const themeName = theme.replace('classic_', '').replace('layout_', '').replace('embaixo_', '');
        const themeUpdate = {
          tema_azul_log: 0,
          tema_branco_log: 0,
          tema_laranja_log: 0,
          tema_preto_log: 0,
          tema_verde_log: 0,
          tema_vermelho_log: 0,
          tema_roxo_log: 0
        };
        if (themeUpdate[`tema_${themeName}_log`] !== undefined) {
          themeUpdate[`tema_${themeName}_log`] = 1;
        }
        await db.ref(`economia/${userId}/Perfil/Layouts`).update(themeUpdate);

      } else if (key === 'Badges' || key === 'Perfil/Badges' || key === `economia/${userId}/Perfil/Badges`) {
        const badgesData = {
          ...value,
          display: value.display || {},
          active: value.active || value.display || {},
          disabled: value.disabled || [],
          selectedLevels: value.selectedLevels || {},
          selectedHypeSquad: value.selectedHypeSquad || "HypeSquadOnlineHouse1"
        };
        if (value.customUnlocked) badgesData.customUnlocked = value.customUnlocked;

        await db.ref(`economia/${userId}/Perfil/Badges`).set(badgesData);
        await db.ref(`economia/${userId}/Perfil/BadgesConfig`).set(badgesData);

      } else if (key.startsWith(`economia/${userId}/`)) {
        await db.ref(key).set(value);
      } else if (key.startsWith('Perfil/')) {
        await db.ref(`economia/${userId}/${key}`).set(value);
      } else {
        await db.ref(`economia/${userId}/${key}`).set(value);
      }

      const snap = await db.ref(`economia/${userId}`).once('value');
      const updatedData = snap.val() || {};

      res.json({
        success: true,
        userDb: buildUserDbResponse(userId, updatedData)
      });
    } catch (e) {
      console.error("Erro ao atualizar dados do usuário:", e);
      res.status(500).json({ error: e.message || "Erro interno ao salvar dados no banco." });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const sessionId = req.cookies?.session_id;
    if (sessionId) delete sessions[sessionId];
    res.clearCookie('session_id');
    res.json({ success: true });
  });

  app.get('/api/servers', async (req, res) => {
    const sessionId = req.cookies?.session_id;
    if (!sessionId || !sessions[sessionId]) return res.status(401).json({ error: "Sessão inválida" });

    const session = sessions[sessionId];

    const isBotCreator = client.config?.cargos?.criador?.includes(session.userId) || 
                          client.config?.cargos?.developer?.includes(session.userId) ||
                          session.isDevSession;

    // Puxar a lista de servidores premium reais da Database
    let premiumData = {};
    if (db) {
      try {
        const snap = await db.ref('premium_servers').once('value');
        premiumData = snap.val() || {};
      } catch (e) {
        console.warn("Aviso: Não foi possível checar os servidores premium no Firebase.");
      }
    }

    const verifiedServersList = [];

    for (const guild of session.guilds) {
      const cachedGuild = client.guilds.cache.get(guild.id);
      const botActive = !!cachedGuild || !!guild.mockActive;

      // Se o bot estiver no servidor e não for sessão dev/creator, valida se o usuário AINDA é admin em tempo real
      if (cachedGuild && !isBotCreator && !session.isDevSession) {
        const isOwner = cachedGuild.ownerId === session.userId;
        let member = cachedGuild.members.cache.get(session.userId);
        if (!member) {
          member = await cachedGuild.members.fetch(session.userId).catch(() => null);
        }

        const hasAdmin = member ? (
          member.permissions.has(PermissionsBitField.Flags.Administrator) ||
          member.permissions.has(PermissionsBitField.Flags.ManageGuild) ||
          member.permissions.has('Administrator') ||
          member.permissions.has('ManageGuild')
        ) : false;

        // Se o usuário perdeu as permissões e não for o dono, filtra para fora da lista
        if (!isOwner && !hasAdmin) {
          continue;
        }
      }

      const iconUrl = guild.icon && !guild.icon.includes('postimg') ? guild.icon : null;

      verifiedServersList.push({
        id: guild.id,
        name: guild.name,
        icon: iconUrl,
        botActive: botActive,
        members: botActive ? (cachedGuild ? cachedGuild.memberCount : 1) : 0,
        premium: !!premiumData[guild.id]
      });
    }

    res.json(verifiedServersList);
  });

  // Rota para verificar permissões em tempo real do usuário no servidor selecionado
  app.get('/api/check-permissions', requireAdmin, (req, res) => {
    res.json({
      valid: true,
      userId: req.session.userId,
      guildId: req.guildId
    });
  });

  // Rota para Reordenar as posições dos cargos no Discord
  app.post('/api/update-role-positions', requireAdmin, async (req, res) => {
    const { rolePositions } = req.body; // Array de { id, position }
    const guildId = req.guildId;

    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return res.status(400).json({ error: "Servidor não encontrado." });

      if (!guild.members.me.permissions.has('ManageRoles')) {
        return res.status(403).json({ error: "O bot não possui a permissão 'Gerenciar Cargos'." });
      }

      // O Discord.js aplica as novas posições em lote de forma segura
      await guild.roles.setPositions(rolePositions);

      await writeAuditLog({ 
        userId: req.session.userId, username: req.session.username, guildId: req.guildId, 
        action: "Reordenou a hierarquia dos cargos do servidor", 
        oldValue: "", newValue: "Nova Hierarquia Sincronizada", ip: req.ip 
      });

      res.json({ success: true });
    } catch (e) {
      console.error("Erro ao reordenar cargos no Discord:", e);
      res.status(500).json({ error: e.message || "Erro interno ao reordenar cargos." });
    }
  });
  
  app.get('/api/status', (req, res) => {
    // Rota pública para a tela de login conseguir puxar a foto
    res.json({
      status: "online",
      discordBot: client.ws?.status === 0 ? "connected" : "offline",
      firebase: db ? "connected" : "disconnected",
      loadedPrefix: client.commands.size,
      loadedSlash: client.slashCommands.size,
      uptime: process.uptime(),
      // Puxa os dados reais do bot, ou um fallback se ele ainda não estiver logado
      botName: client.user?.username || "Sistine",
      botAvatar: client.user?.displayAvatarURL({ dynamic: true, size: 256 }) || ""
    });
  });

  app.get('/api/channels', requireAdmin, async (req, res) => {
    try {
      const guild = req.guild || client.guilds.cache.get(req.guildId) || await client.guilds.fetch(req.guildId).catch(() => null);
      if (!guild) return res.status(404).json({ error: "Servidor não encontrado." });

      await guild.channels.fetch();
      const textChannels = guild.channels.cache
        .filter(channel => channel.type === 0)
        .map(channel => ({ id: channel.id, name: channel.name }));
      res.json(textChannels);
    } catch (error) {
      console.error("🚨 Erro na API de canais:", error);
      res.status(500).json({ error: "Erro ao buscar canais." });
    }
  });

  app.get('/api/roles', requireAdmin, async (req, res) => {
    try {
      const guild = req.guild || client.guilds.cache.get(req.guildId) || await client.guilds.fetch(req.guildId).catch(() => null);
      if (!guild) return res.status(404).json({ error: "Servidor não encontrado." });

      await guild.roles.fetch();

      const botMember = guild.members.me || await guild.members.fetch(client.user.id).catch(() => null);
      const botHighestRolePosition = botMember?.roles?.highest?.position || 0;
      const botHasManageRoles = botMember 
        ? (botMember.permissions.has('ManageRoles') || botMember.permissions.has(PermissionsBitField.Flags.ManageRoles) || botMember.permissions.has(PermissionsBitField.Flags.Administrator))
        : false;

      const serverRoles = guild.roles.cache
        .filter(role => role.name !== '@everyone' && !role.managed)
        .sort((a, b) => b.position - a.position) // Ordena idêntico ao Discord (Maior pro Menor)
        .map(role => ({
          id: role.id,
          name: role.name,
          color: role.hexColor === '#000000' ? '#94a3b8' : role.hexColor,
          permissions: role.permissions.toArray(),
          position: role.position, // Envia a posição
          editableByBot: botHasManageRoles && role.position < botHighestRolePosition
        }));
        
      res.json(serverRoles);
    } catch (error) {
      console.error("🚨 Erro na API de cargos:", error);
      res.status(500).json({ error: "Erro ao buscar cargos." });
    }
  });

  app.get('/api/members', requireAdmin, async (req, res) => {
    try {
      const guild = req.guild || client.guilds.cache.get(req.guildId) || await client.guilds.fetch(req.guildId).catch(() => null);
      if (!guild) return res.status(404).json({ error: "Servidor não encontrado." });

      const serverMembers = guild.members.cache.map(member => ({
        id: member.user.id,
        name: member.user.username,
        avatar: member.user.displayAvatarURL({ dynamic: true }) || 'https://i.postimg.cc/9QYx00L8/avatar.png'
      }));
      res.json(serverMembers);
    } catch (error) {
      console.error("🚨 Erro na API de membros:", error);
      res.status(500).json({ error: "Erro ao buscar membros." });
    }
  });

  app.get('/api/commands', (req, res) => {
    const list = [];

    if (client.slashCommands) {
      client.slashCommands.forEach((cmd) => {
        const name = cmd.name || cmd.data?.name;
        list.push({ 
          id: `slash-${name}`,
          name: name, 
          description: cmd.description || cmd.data?.description || "Sem descrição", 
          category: cmd.category || "Geral", 
          options: cmd.options || cmd.data?.options || [], 
          type: "slash" 
        });
      });
    }

    if (client.commands) {
      client.commands.forEach((cmd) => {
        list.push({ 
          id: `prefix-${cmd.name}`,
          name: cmd.name, 
          description: cmd.description || "Sem descrição", 
          category: cmd.category || "Geral", 
          aliases: cmd.aliases || [], 
          type: "prefix" 
        });
      });
    }

    res.json(list);
  });

  app.get('/api/database', requireAdmin, async (req, res) => {
    if (!db) return res.status(503).json({ error: "Banco de dados indisponível." });

    const guildId = req.guildId;
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      try {
        await guild.memberCount;
      } catch (e) {
        console.warn("Failed to fetch guild members cache:", e.message);
      }
    }

    try {
      const snap = await db.ref(`servers/${guildId}`).once('value');
      const data = snap.val() || {};

      const filteredEconomia = {};
      if (guild && data.economia) {
        for (const userId in data.economia) {
          if (guild.members.cache.has(userId)) {
            filteredEconomia[userId] = data.economia[userId];
          }
        }
      }

      // Converte os audit_logs do Firebase para array ordenado
      const auditLogsList = [];
      if (data.audit_logs) {
        for (const key in data.audit_logs) {
          auditLogsList.push({ id: key, ...data.audit_logs[key] });
        }
        auditLogsList.reverse();
      }

      res.json({
        config: data.config || {},
        economia: filteredEconomia,
        welcome: data.welcome || {},
        autorole: data.autorole || {},
        permissions: data.permissions || [],
        invite_blocker: data.invite_blocker || {},
        punishments: data.punishments || [],
        warn_punishments: data.warn_punishments || {},
        events: data.events || {},
        logs: data.logs || null,
        disabled_commands: data.disabled_commands || [],
        audit_logs: auditLogsList
      });
    } catch (error) {
      console.error("Erro ao ler banco de dados:", error);
      res.status(500).json({ error: "Erro interno ao ler dados do servidor." });
    }
  });

  // Rota para Aplicar Punições e Registrar Logs
  app.post('/api/execute-punishment', requireAdmin, async (req, res) => {
    const applyPunishment = require('./src/utils/punishmentHandler.js');
    
    const { targetId, type, reason, duration } = req.body;
    
    try {
      const result = await applyPunishment({
        client: client, // Seu client global do Discord
        guildId: req.guildId,
        targetId: targetId,
        moderatorId: req.session.userId, // ID do admin logado no painel
        type: type,
        reason: reason,
        durationMs: duration
      });

      res.json({
        success: true,
        user: result.user,
        moderator: { id: req.session.userId, name: req.session.username, avatar: req.session.avatar }
      });
    } catch (e) {
      res.status(500).json({ error: e.message || "Erro ao executar punição." });
    }
  });
  
  app.post('/api/database/update', requireAdmin, async (req, res) => {
    if (!db) return res.status(503).json({ error: "Banco de dados indisponível." });

    // Puxa as variáveis direto do body
    const { key, value } = req.body;
    const guildId = req.guildId;

    // AVISO NO CONSOLE PARA DEBUG:
    console.log(`[API UPDATE] Tentando salvar a chave: '${key}' no servidor: ${guildId}`);

    const allowedKeys = [
      'welcome', 
      'invite_blocker', 
      'events', 
      'punishments', 
      'permissions', 
      'punishments_config', 
      'disabled_commands', 
      'color',  // <-- OBRIGATÓRIO ESTAR AQUI
      'config',
      'autorole',
      'Badges'
    ];

    try {
      // Validação de Hierarquia de Cargos (Autorole / Welcome)
      if (key === 'autorole' && value) {
        const guild = req.guild || client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
        if (guild) {
          const rolesToValidate = [
            ...(Array.isArray(value.roles) ? value.roles : []),
            ...(Array.isArray(value.botRoles) ? value.botRoles : [])
          ];
          await validateRoleHierarchy(guild, rolesToValidate);
        }
      } else if (key === 'welcome' && value) {
        const guild = req.guild || client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
        if (guild) {
          const rolesToValidate = [];
          if (value.role) rolesToValidate.push(value.role);
          if (value.roles && Array.isArray(value.roles)) rolesToValidate.push(...value.roles);
          if (value.autorole) rolesToValidate.push(value.autorole);
          if (value.welcomeRole) rolesToValidate.push(value.welcomeRole);
          if (rolesToValidate.length > 0) {
            await validateRoleHierarchy(guild, rolesToValidate);
          }
        }
      }

      if (key === "config") {
        if (value && value.economia) {
          const parsedValue = configEconomySchema.safeParse(value.economia);
          if (!parsedValue.success) return res.status(400).json({ error: "Dados inválidos: " + parsedValue.error.message });
        }

        const dbPath = `servers/${guildId}/config`;
        const oldValue = (await db.ref(dbPath).once('value')).val();
        
        await db.ref(dbPath).set(value); // Salvando no local correto
        await writeAuditLog({ userId: req.session.userId, username: req.session.username, guildId: req.guildId, action: "Update Guild Config", oldValue, newValue: value, ip: req.ip });
      
      } else if (allowedKeys.includes(key)) {
        
        const dbPath = `servers/${guildId}/${key}`;

        if (value === null) {
          await db.ref(dbPath).remove();
        } else {
          const oldValue = (await db.ref(dbPath).once('value')).val();
          await db.ref(dbPath).set(value);
          await writeAuditLog({ userId: req.session.userId, username: req.session.username, guildId: req.guildId, action: `Update ${key} Config`, oldValue, newValue: value, ip: req.ip });
        }

      } else if (key && key.startsWith("economia/")) {
        const targetUserId = key.split('/')[1];
        const guild = client.guilds.cache.get(guildId);

        if (!guild) return res.status(400).json({ error: "Servidor não ativo no bot." });
        if (!guild.members.cache.has(targetUserId)) return res.status(403).json({ error: "Usuário não pertence a este servidor." });

        const parsedValue = userEconomySchema.safeParse(value);
        if (!parsedValue.success) return res.status(400).json({ error: "Dados inválidos: " + parsedValue.error.message });

        const dbPath = `servers/${guildId}/${key}`;
        const oldValue = (await db.ref(dbPath).once('value')).val();
        await db.ref(dbPath).set(value);
        await writeAuditLog({ userId: req.session.userId, username: req.session.username, guildId: req.guildId, action: `Edit Economy (${targetUserId})`, oldValue, newValue: value, ip: req.ip });
      } else {
        // Log extra para sabermos quem bloqueou
        console.log(`[API UPDATE - ERRO] A chave '${key}' foi bloqueada pelo sistema!`);
        return res.status(400).json({ error: `Gravação proibida para a chave: ${key}` });
      }

      // Retorna a Store atualizada
      const snap = await db.ref(`servers/${guildId}`).once('value');
      const data = snap.val() || {};
      const guild = client.guilds.cache.get(req.guildId);
      
      const filteredEconomia = {};
      if (guild && data.economia) {
        for (const userId in data.economia) {
          if (guild.members.cache.has(userId)) filteredEconomia[userId] = data.economia[userId];
        }
      }

      const auditLogsList = [];
      if (data.audit_logs) {
        for (const logKey in data.audit_logs) {
          auditLogsList.push({ id: logKey, ...data.audit_logs[logKey] });
        }
        auditLogsList.reverse();
      }

      res.json({
        success: true,
        store: {
          config: data.config || {},
          color: data.color || {}, // <-- Mantém a cor no painel após salvar
          punishments_config: data.punishments_config || {},
          economia: filteredEconomia,
          welcome: data.welcome || {},
          autorole: data.autorole || {},
          permissions: data.permissions || [],
          invite_blocker: data.invite_blocker || {},
          punishments: data.punishments || [],
          warn_punishments: data.warn_punishments || {},
          events: data.events || {},
          logs: data.logs || null,
          disabled_commands: data.disabled_commands || [], 
          audit_logs: auditLogsList
        }
      });
    } catch (e) {
      console.error("Error updating database:", e);
      res.status(500).json({ error: e.message });
    }
});

  app.get('/api/config', requireAdmin, (req, res) => {
    let databasesConfig = {};
    let clientConfig = {};
    try { databasesConfig = require('./databases.json'); } catch (e) {}
    try { clientConfig = require('./src/config.js'); } catch (e) {}

    const isBotCreator = client.config?.cargos?.criador?.includes(req.session.userId) || 
                          client.config?.cargos?.developer?.includes(req.session.userId);

    const maskedDatabases = { ...databasesConfig };
    if (!isBotCreator && maskedDatabases.apiKey) maskedDatabases.apiKey = "••••••••••••••••••••••••••••••••";

    const maskedConfig = {
      TOKEN: isBotCreator ? (process.env.TOKEN || "") : "••••••••••••••••••••••••••••••••",
      CLIENT_ID: process.env.CLIENT_ID || "",
      SUPPORT_GUILD: process.env.SUPPORT_GUILD || "",
      SUPPORT_LINK: process.env.SUPPORT_LINK || ""
    };

    res.json({ databases: maskedDatabases, config: maskedConfig });
  });

  app.post('/api/config/update', requireAdmin, async (req, res) => {
    const isBotCreator = client.config?.cargos?.criador?.includes(req.session.userId) || 
                          client.config?.cargos?.developer?.includes(req.session.userId);
    if (!isBotCreator) return res.status(403).json({ error: "Apenas criadores podem alterar chaves." });

    const sanitizedBody = sanitizeObject(req.body);
    const parsedBody = configUpdateSchema.safeParse(sanitizedBody);
    if (!parsedBody.success) return res.status(400).json({ error: "Dados inválidos: " + parsedBody.error.message });

    const { botConfig, firebaseConfig } = parsedBody.data;
    try {
      if (botConfig) {
        const botConfigContent = `module.exports = {
  "cargos": {
    "criador": ${JSON.stringify(botConfig.cargos?.criador || [''])},
    "developer": ${JSON.stringify(botConfig.cargos?.developer || [''])},
    "booster": ${JSON.stringify(botConfig.cargos?.booster || [''])},
  },
  "TOKEN": ${JSON.stringify(botConfig.TOKEN || "")},
  "CLIENT_ID": ${JSON.stringify(botConfig.CLIENT_ID || "")},
  "SUPPORT_GUILD": ${JSON.stringify(botConfig.SUPPORT_GUILD || "")},
  "SUPPORT_LINK": ${JSON.stringify(botConfig.SUPPORT_LINK || "https://discord.gg/...")}
};`;
        fs.writeFileSync('./src/config.js', botConfigContent);
      }

      if (firebaseConfig) fs.writeFileSync('./databases.json', JSON.stringify(firebaseConfig, null, 2));

      delete require.cache[require.resolve('./src/config.js')];
      delete require.cache[require.resolve('./databases.json')];
      res.json({ success: true, message: "Configurações salvas." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/audit-logs', requireAdmin, async (req, res) => {
    if (!db) return res.status(503).json({ error: "Banco offline." });
    try {
      const snapshot = await db.ref(`servers/${req.guildId}/audit_logs`).once('value');
      const logs = [];
      snapshot.forEach(child => { logs.push({ id: child.key, ...child.val() }); });
      logs.reverse();
      res.json(logs);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Rota para Sincronizar Permissões Diretamente no Discord
  app.post('/api/update-role-permissions', requireAdmin, async (req, res) => {
    const { changedRoles } = req.body;
    const guildId = req.guildId;

    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return res.status(400).json({ error: "Servidor não encontrado na memória do bot." });

      if (!guild.members.me.permissions.has('ManageRoles')) {
        return res.status(403).json({ error: "O bot não possui a permissão 'Gerenciar Cargos' no servidor." });
      }

      // Mapeamento das chaves do painel para o formato exato que o Discord.js (v14) exige
      const permMap = {
        ADMINISTRATOR: 'Administrator',
        MANAGE_GUILD: 'ManageGuild',
        BAN_MEMBERS: 'BanMembers',
        KICK_MEMBERS: 'KickMembers',
        SEND_MESSAGES: 'SendMessages',
        VIEW_CHANNEL: 'ViewChannel',
        MANAGE_MESSAGES: 'ManageMessages'
      };

      for (const roleData of changedRoles) {
        const role = await guild.roles.fetch(roleData.id).catch(() => null);
        if (!role) continue;
        
        // Verifica a hierarquia para evitar que o bot tente alterar um cargo maior que o dele e crashar
        if (role.position >= guild.members.me.roles.highest.position) {
           throw new Error(`Não posso alterar o cargo @${role.name} pois ele é superior ou igual ao meu cargo no servidor.`);
        }

        // Obtém as permissões atuais como um BitField mutável
        let currentPerms = role.permissions;
        
        // Liga ou desliga apenas as permissões enviadas pela Dashboard
        for (const [key, djsKey] of Object.entries(permMap)) {
          if (roleData[key] === true) {
            currentPerms = currentPerms.add(djsKey);
          } else if (roleData[key] === false) {
            currentPerms = currentPerms.remove(djsKey);
          }
        }

        // Salva diretamente no Discord
        await role.setPermissions(currentPerms);

        // Gera o Log Automático de Auditoria do Painel
        await writeAuditLog({ 
          userId: req.session.userId, 
          username: req.session.username, 
          guildId: req.guildId, 
          action: `Alterou as permissões do cargo @${role.name} no Discord`, 
          oldValue: "Permissões Antigas", 
          newValue: "Novas Permissões Sincronizadas", 
          ip: req.ip 
        });
      }

      res.json({ success: true });
    } catch (e) {
      console.error("Erro ao atualizar cargos no Discord:", e);
      res.status(500).json({ error: e.message || "Erro interno ao atualizar cargos no Discord." });
    }
  });

  // Rota para Testar Mensagens de Boas-Vindas/Saída
  app.post('/api/test-welcome', requireAdmin, async (req, res) => {
    const { type } = req.body; // 'join' ou 'leave'
    const guildId = req.guildId;

    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return res.status(400).json({ error: "Servidor não encontrado na memória do bot." });

      // Busca o membro que apertou o botão para ele se ver no teste (se não achar, usa o próprio bot)
      let member = await guild.members.fetch(req.session.userId).catch(() => null);
      if (!member) member = guild.members.me;

      if (type === 'join') {
        client.emit('guildMemberAdd', member);
      } else if (type === 'leave') {
        client.emit('guildMemberRemove', member);
      } else {
        return res.status(400).json({ error: "Tipo de teste inválido." });
      }

      res.json({ success: true });
    } catch (e) {
      console.error("Erro ao testar sistema de welcome:", e);
      res.status(500).json({ error: e.message || "Erro interno ao executar teste." });
    }
  });

  // Servir imagens locais dos assets diretamente para a dashboard e API
  app.use('/src/utils/assets', express.static(path.join(__dirname, 'src/utils/assets')));
  app.use('/src/assets', express.static(path.join(__dirname, 'src/utils/assets')));
  app.use('/assets', express.static(path.join(__dirname, 'src/utils/assets')));

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = require("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => { res.sendFile(path.join(distPath, 'index.html')); });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Sistine Fullstack] Web Dashboard listening at http://localhost:${PORT}`);
  });
}

// Start the unified backend
startFullStackApp().catch((err) => {
  console.error("Failed to start fullstack application:", err);
});
