// src/utils/badgesMap.js

// Mapeamento completo de links legados de badges para suporte retroativo a dados salvos
export const LEGACY_BADGE_URL_MAP = {
  // Discord Flags / Insígnias Nativas
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/active-developer.svg': '/src/utils/assets/badges/discord/active-developer.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discord-early-supporter.svg': '/src/utils/assets/badges/discord/discord-early-supporter.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discord-bot-dev.svg': '/src/utils/assets/badges/discord/discord-bot-dev.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discord-staff.svg': '/src/utils/assets/badges/discord/discord-staff.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discord-partner.svg': '/src/utils/assets/badges/discord/discord-partner.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discord-mod.svg': '/src/utils/assets/badges/discord/discord-mod.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hype-squad-events.svg': '/src/utils/assets/badges/discord/hype-squad-events.svg',

  // HypeSquad Houses
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hype-squad-bravery.svg': '/src/utils/assets/badges/discord/hype-squad-bravery.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hype-squad-brilliance.svg': '/src/utils/assets/badges/discord/hype-squad-brilliance.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hype-squad-balance.svg': '/src/utils/assets/badges/discord/hype-squad-balance.svg',

  // Bug Hunter (Níveis 1 e 2)
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discord-bug-hunter-green.svg': '/src/utils/assets/badges/discord/discord-bug-hunter-green.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discord-bug-hunter-gold.svg': '/src/utils/assets/badges/discord/discord-bug-hunter-gold.svg',

  // Boosts (Níveis 1 a 9 e base)
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boosts/discord-boost-1.svg': '/src/utils/assets/badges/boosts/discord-boost-1.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boosts/discord-boost-2.svg': '/src/utils/assets/badges/boosts/discord-boost-2.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boosts/discord-boost-3.svg': '/src/utils/assets/badges/boosts/discord-boost-3.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boosts/discord-boost-4.svg': '/src/utils/assets/badges/boosts/discord-boost-4.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boosts/discord-boost-5.svg': '/src/utils/assets/badges/boosts/discord-boost-5.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boosts/discord-boost-6.svg': '/src/utils/assets/badges/boosts/discord-boost-6.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boosts/discord-boost-7.svg': '/src/utils/assets/badges/boosts/discord-boost-7.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boosts/discord-boost-8.svg': '/src/utils/assets/badges/boosts/discord-boost-8.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boosts/discord-boost-9.svg': '/src/utils/assets/badges/boosts/discord-boost-9.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/booster.png': '/src/utils/assets/badges/booster.png',

  // VIP
  'https://i.postimg.cc/44N94jrm/silver-badge.png': '/src/utils/assets/badges/vip_prata.png',
  'https://i.postimg.cc/85M02G5F/gold-badge.png': '/src/utils/assets/badges/vip_ouro_badge.png',
  'https://i.postimg.cc/QxxzXvmd/219c3fff-4ddc-4ce8-b39d-05d29313a8e1.png': '/src/utils/assets/badges/vip_ouro_badge.png',
  'https://i.postimg.cc/7YsWbXtM/6dd09a91-0531-422e-839e-df43d0f426e2.png': '/src/utils/assets/badges/vipDiamante.png',

  // Insígnias Customizadas / Bot
  'https://i.postimg.cc/Y08y6xr7/173584f2-5ca6-460f-935c-5d43c0bfce40.png': '/src/utils/assets/badges/owner.png',
  'https://i.postimg.cc/1RKT1ypd/9782d81a-d6dc-4085-8bc7-cd0b66de7640.png': '/src/utils/assets/badges/dev.png',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discord-nitro.svg': '/src/utils/assets/badges/discord/discord-nitro.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/quest.png': '/src/utils/assets/badges/discord/quest.png',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/automod.svg': '/src/utils/assets/badges/discord/automod.svg',
  'https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/supports-commands.svg': '/src/utils/assets/badges/discord/supports-commands.svg',
  'https://i.postimg.cc/mgVCT6dB/casado.png': '/src/utils/assets/badges/married.png',
  'https://i.postimg.cc/TPwsFDps/wedding-rings.png': '/src/utils/assets/wedding_rings.png'
};

// 1. INSÍGNIAS NATIVAS INDIVIDUAIS DO DISCORD
export const DISCORD_FLAGS_MAP = {
  ActiveDeveloper: {
    id: 'ActiveDeveloper',
    name: 'Desenvolvedor Ativo',
    description: 'Concedida a desenvolvedores que possuem pelo menos um aplicativo ativo.',
    icon: '/src/utils/assets/badges/discord/active-developer.svg',
    type: 'discord'
  },
  PremiumEarlySupporter: {
    id: 'PremiumEarlySupporter',
    name: 'Apoiador Inicial',
    description: 'Usuários que apoiaram o Discord nos estágios iniciais.',
    icon: '/src/utils/assets/badges/discord/discord-early-supporter.svg',
    type: 'discord'
  },
  VerifiedDeveloper: {
    id: 'VerifiedDeveloper',
    name: 'Desenvolvedor Pioneiro',
    description: 'Desenvolvedor de bot pioneiro verificado no Discord.',
    icon: '/src/utils/assets/badges/discord/discord-bot-dev.svg',
    type: 'discord'
  },
  Staff: {
    id: 'Staff',
    name: 'Equipe do Discord',
    description: 'Membro oficial da equipe de funcionários do Discord.',
    icon: '/src/utils/assets/badges/discord/discord-staff.svg',
    type: 'discord'
  },
  Partner: {
    id: 'Partner',
    name: 'Dono de Servidor Parceiro',
    description: 'Proprietário de um servidor parceiro do Discord.',
    icon: '/src/utils/assets/badges/discord/discord-partner.svg',
    type: 'discord'
  },
  CertifiedModerator: {
    id: 'CertifiedModerator',
    name: 'Moderador Certificado',
    description: 'Moderador certificado oficial do Discord Alumni.',
    icon: '/src/utils/assets/badges/discord/discord-mod.svg',
    type: 'discord'
  },
  Hypesquad: {
    id: 'Hypesquad',
    name: 'HypeSquad Events',
    description: 'Representante oficial de eventos do HypeSquad do Discord.',
    icon: '/src/utils/assets/badges/discord/hype-squad-events.svg',
    type: 'discord'
  }
};

// 2. CASAS DO HYPESQUAD
export const HYPESQUAD_HOUSES = {
  HypeSquadOnlineHouse1: {
    id: 'HypeSquadOnlineHouse1',
    name: 'HypeSquad Bravery',
    description: 'Membro da casa Bravery do HypeSquad.',
    icon: '/src/utils/assets/badges/discord/hype-squad-bravery.svg'
  },
  HypeSquadOnlineHouse2: {
    id: 'HypeSquadOnlineHouse2',
    name: 'HypeSquad Brilliance',
    description: 'Membro da casa Brilliance do HypeSquad.',
    icon: '/src/utils/assets/badges/discord/hype-squad-brilliance.svg'
  },
  HypeSquadOnlineHouse3: {
    id: 'HypeSquadOnlineHouse3',
    name: 'HypeSquad Balance',
    description: 'Membro da casa Balance do HypeSquad.',
    icon: '/src/utils/assets/badges/discord/hype-squad-balance.svg'
  }
};

// 3. INSÍGNIAS COM NÍVEIS SELECIONÁVEIS (Bug Hunter, Booster, VIP)
export const BADGE_LEVELS_CONFIG = {
  bug_hunter: {
    id: 'bug_hunter',
    groupName: 'Caçador de Bugs',
    type: 'discord',
    levels: [
      {
        level: 1,
        flagId: 'BugHunterLevel1',
        name: 'Caçador de Bugs I',
        description: 'Encontrou e reportou bugs na plataforma do Discord.',
        icon: '/src/utils/assets/badges/discord/discord-bug-hunter-green.svg'
      },
      {
        level: 2,
        flagId: 'BugHunterLevel2',
        name: 'Caçador de Bugs II',
        description: 'Caçador de bugs de nível avançado do Discord.',
        icon: '/src/utils/assets/badges/discord/discord-bug-hunter-gold.svg'
      }
    ]
  },
  booster: {
    id: 'booster',
    groupName: 'Impulsionador de Servidor',
    type: 'bot',
    levels: [
      { level: 1, id: 'boost_1', name: 'Server Booster (Nível 1)', description: 'Impulsionando há 1 mês.', icon: '/src/utils/assets/badges/boosts/discord-boost-1.svg' },
      { level: 2, id: 'boost_2', name: 'Server Booster (Nível 2)', description: 'Impulsionando há 2 meses.', icon: '/src/utils/assets/badges/boosts/discord-boost-2.svg' },
      { level: 3, id: 'boost_3', name: 'Server Booster (Nível 3)', description: 'Impulsionando há 3 meses.', icon: '/src/utils/assets/badges/boosts/discord-boost-3.svg' },
      { level: 4, id: 'boost_4', name: 'Server Booster (Nível 4)', description: 'Impulsionando há 6 meses.', icon: '/src/utils/assets/badges/boosts/discord-boost-4.svg' },
      { level: 5, id: 'boost_5', name: 'Server Booster (Nível 5)', description: 'Impulsionando há 9 meses.', icon: '/src/utils/assets/badges/boosts/discord-boost-5.svg' },
      { level: 6, id: 'boost_6', name: 'Server Booster (Nível 6)', description: 'Impulsionando há 12 meses.', icon: '/src/utils/assets/badges/boosts/discord-boost-6.svg' },
      { level: 7, id: 'boost_7', name: 'Server Booster (Nível 7)', description: 'Impulsionando há 15 meses.', icon: '/src/utils/assets/badges/boosts/discord-boost-7.svg' },
      { level: 8, id: 'boost_8', name: 'Server Booster (Nível 8)', description: 'Impulsionando há 18 meses.', icon: '/src/utils/assets/badges/boosts/discord-boost-8.svg' },
      { level: 9, id: 'boost_9', name: 'Server Booster (Nível 9)', description: 'Impulsionando há 24 meses ou mais.', icon: '/src/utils/assets/badges/boosts/discord-boost-9.svg' }
    ]
  },
  vip: {
    id: 'vip',
    groupName: 'Assinante VIP',
    type: 'bot',
    levels: [
      { level: 1, id: 'vip_prata', name: 'VIP Prata', description: 'Apoiador com plano Prata ativo no bot.', icon: '/src/utils/assets/badges/vip_prata.png' },
      { level: 2, id: 'vip_ouro', name: 'VIP Ouro', description: 'Apoiador com plano Ouro ativo no bot.', icon: '/src/utils/assets/badges/vip_ouro_badge.png' }
    ]
  },
  gifting: {
    id: 'gifting',
    groupName: 'Presenteador',
    type: 'discord',
    levels: [
      { level: 1, id: 'gifting_patron', name: 'Presenteador Patrono', description: 'Presenteou amigos e servidores com assinaturas.', icon: '/src/utils/assets/badges/gifting/patron.png' },
      { level: 2, id: 'gifting_hero', name: 'Presenteador Herói', description: 'Herói generoso com histórico de presentes na comunidade.', icon: '/src/utils/assets/badges/gifting/hero.png' },
      { level: 3, id: 'gifting_champion', name: 'Presenteador Campeão', description: 'Campeão da generosidade no Discord.', icon: '/src/utils/assets/badges/gifting/champion.png', },
      { level: 4, id: 'gifting_legend', name: 'Presenteador Lendário', description: 'Lenda viva em apoiar amigos com presentes.', icon: '/src/utils/assets/badges/gifting/legend.png' },
      { level: 5, id: 'gifting_icon', name: 'Presenteador Ícone', description: 'Ícone máximo da comunidade em suporte e presentes.', icon: '/src/utils/assets/badges/gifting/icon.png'},
      { level: 6, id: 'gifting_luminary', name: 'Presenteador Iluminado', description: 'Grau iluminado supremo em doações e presentes.', icon: '/src/utils/assets/badges/gifting/luminary.png' }
    ]
  },
  streamer: {
    id: 'streamer',
    groupName: 'streamer',
    type: 'discord',
    levels: [
      { level: 1, id: 'game_casual', name: 'Gamer Casual', description: 'Joga com frequência e se diverte em comunidades de jogos.', icon: '/src/utils/assets/badges/game-time/casual.svg',},
      { level: 2, id: 'game_dedicated', name: 'Gamer Dedicado', description: 'Horas intensas dedicadas aos seus jogos favoritos.', icon: '/src/utils/assets/badges/game-time/dedicated.svg', },
      { level: 3, id: 'game_eternal', name: 'Gamer Eterno', description: 'Mestre supremo dos games e veterano incansável.', icon: '/src/utils/assets/badges/game-time/eternal.svg',},
      { level: 4, id: 'game_adventurer', name: 'Aventureiro dos Jogos', description: 'Explora uma ampla variedade de mundos e jogos.', icon: '/src/utils/assets/badges/game-variety/adventurer.svg',},
      { level: 5, id: 'game_explorer', name: 'Explorador dos Jogos', description: 'Desbravador experiente de novidades do mundo gamer.', icon: '/src/utils/assets/badges/game-variety/explorer.svg',},
      { level: 6, id: 'stream_star', name: 'Streamer Estrela', description: 'Transmite gameplays e entretenimento ao vivo com brilho.', icon: '/src/utils/assets/badges/streaming/star.svg' },
      { level: 7, id: 'stream_visionary', name: 'Streamer Visionário', description: 'Criador de conteúdo ao vivo que redefine transmissões.', icon: '/src/utils/assets/badges/streaming/visionary.svg',},
    ]
  },
  account_age: {
    id: 'account_age',
    groupName: 'account_age',
    type: 'discord',
    levels: [
      { level: 1, id: 'age_seed', name: 'Conta Semente', description: 'Conta recém-plantada no ecossistema.', icon: '/src/utils/assets/badges/account-age/seed.svg',},
      { level: 2, id: 'age_sprout', name: 'Conta Broto', description: 'Conta jovem florescendo no Discord.', icon: '/src/utils/assets/badges/account-age/sprout.svg', },
      { level: 3, id: 'age_sapling', name: 'Conta Muda', description: 'Conta crescendo em maturidade e atividade.', icon: '/src/utils/assets/badges/account-age/sapling.svg',},
      { level: 4, id: 'age_redwood', name: 'Conta Redwood', description: 'Conta veterana forte e duradoura como uma sequoia.', icon: '/src/utils/assets/badges/account-age/redwood.svg',},
      { level: 5, id: 'age_primordial', name: 'Conta Primordial', description: 'Conta ancestral dos primórdios da plataforma.', icon: '/src/utils/assets/badges/account-age/primordial.svg',},
    ]
  }
};

// 4. INSÍGNIAS CUSTOMIZADAS E NOVAS BADGES DO DISCORD
export const BOT_CUSTOM_BADGES_MAP = {
  // Principais do Bot
  owner: {
    id: 'owner',
    name: 'Criador do Bot',
    description: 'Insígnia concedida aos criadores e fundadores do bot.',
    icon: '/src/utils/assets/badges/owner.png',
    type: 'bot'
  },
  dev: {
    id: 'dev',
    name: 'Desenvolvedor Oficial',
    description: 'Seja o vortex, desenvolvedor oficial da sistine!',
    icon: '/src/utils/assets/badges/dev.png',
    type: 'bot'
  },
  discord_nitro: {
    id: 'discord_nitro',
    name: 'Discord Nitro',
    description: 'Assinante ativo do Discord Nitro.',
    icon: '/src/utils/assets/badges/discord/discord-nitro.svg',
    type: 'bot'
  },
  quests: {
    id: 'quests',
    name: 'Completou Missões',
    description: 'Usuário que completou uma Discord Quest com sucesso.',
    icon: '/src/utils/assets/badges/discord/quest.png',
    type: 'bot'
  },
  automod: {
    id: 'automod',
    name: 'AutoMod',
    description: 'Comunidade/Usuário protegido pelo AutoMod do Discord.',
    icon: '/src/utils/assets/badges/discord/automod.svg',
    type: 'bot'
  },
  supports_commands: {
    id: 'supports_commands',
    name: 'Slash Commands',
    description: 'Suporta e utiliza comandos Slash do Discord.',
    icon: '/src/utils/assets/badges/discord/supports-commands.svg',
    type: 'bot'
  },
  married: {
    id: 'married',
    name: 'Casado(a)',
    description: 'Usuário possui um relacionamento ativo no bot.',
    icon: '/src/utils/assets/badges/married.png',
    type: 'bot'
  },
  topmoney_badge: {
    id: 'topmoney_badge',
    name: 'Magnata da Economia',
    description: 'Um dos usuários mais ricos do ecossistema Sistine.',
    icon: '/src/utils/assets/badges/topmoney_badge.png',
    type: 'bot'
  },
  diamond_badge: {
    id: 'diamond_badge',
    name: 'Membro Diamante',
    description: 'Usuário com prestígio e nível diamante.',
    icon: '/src/utils/assets/badges/diamond_badge.png',
    type: 'bot'
  },

  // Novas Insígnias Especiais do Discord
  special_lootbox: {
    id: 'special_lootbox',
    name: 'Discord Lootbox',
    description: 'Desbloqueou a caixa especial de recompensas do Discord.',
    icon: '/src/utils/assets/badges/special/discord-lootbox.svg',
    type: 'discord'
  },
  special_beta: {
    id: 'special_beta',
    name: 'Beta Tester',
    description: 'Testador oficial das novidades beta do Discord.',
    icon: '/src/utils/assets/badges/special/beta.svg',
    type: 'discord'
  },
  // special_dark_ai: {
  //   id: 'special_dark_ai',
  //   name: 'Inteligência Artificial Dark',
  //   description: 'Pioneiro no uso de IA e robótica no Discord.',
  //   icon: '/src/utils/assets/badges/special/dark-ai.svg',
  //   type: 'discord'
  // },
  // special_light_ai: {
  //   id: 'special_light_ai',
  //   name: 'Inteligência Artificial Light',
  //   description: 'Entusiasta de modelos inteligentes e automações.',
  //   icon: '/src/utils/assets/badges/special/light-ai.svg',
  //   type: 'discord'
  // },
  // special_op: {
  //   id: 'special_op',
  //   name: 'Autor Original (OP)',
  //   description: 'Criador e autor original do tópico/discussão.',
  //   icon: '/src/utils/assets/badges/special/original-poster.svg',
  //   type: 'discord'
  // },
  // special_verified_app: {
  //   id: 'special_verified_app',
  //   name: 'Aplicativo Verificado',
  //   description: 'Criador ou gestor de aplicativo oficial verificado.',
  //   icon: '/src/utils/assets/badges/special/verified-app.svg',
  //   type: 'discord'
  // },
  // special_verified_bot: {
  //   id: 'special_verified_bot',
  //   name: 'Bot Verificado',
  //   description: 'Bot com verificação de alta escala no Discord.',
  //   icon: '/src/utils/assets/badges/special/verified-bot.svg',
  //   type: 'discord'
  // },
  // special_system: {
  //   id: 'special_system',
  //   name: 'Sistema Discord',
  //   description: 'Mensagens e comunicações do sistema oficial.',
  //   icon: '/src/utils/assets/badges/special/system.svg',
  //   type: 'discord'
  // },
  // special_official: {
  //   id: 'special_official',
  //   name: 'Oficial Discord',
  //   description: 'Recurso ou membro oficialmente autenticado.',
  //   icon: '/src/utils/assets/badges/special/official.svg',
  //   type: 'discord'
  // },

  // Novas Insígnias de Presenteador (Gifting)
  
  // Novas Insígnias de Gaming & Streaming
  
  // Novas Insígnias de Idade da Conta (Account Age)
  

  // Insígnias de Servidor & Variantes Especiais
  server_crown: {
    id: 'server_crown',
    name: 'Dono de Servidor',
    description: 'Líder e fundador soberano de uma comunidade no Discord.',
    icon: '/src/utils/assets/badges/server/crown.svg',
    type: 'discord'
  },
  server_partnered: {
    id: 'server_partnered',
    name: 'Servidor Parceiro',
    description: 'Comunidade parceira oficial do Discord.',
    icon: '/src/utils/assets/badges/server/partnered.svg',
    type: 'discord'
  },
  server_verified: {
    id: 'server_verified',
    name: 'Servidor Verificado',
    description: 'Comunidade verificada com autenticidade comprovada.',
    icon: '/src/utils/assets/badges/server/verified.svg',
    type: 'discord'
  },
  golden_hypesquad: {
    id: 'golden_hypesquad',
    name: 'Golden HypeSquad',
    description: 'Edição dourada de prestígio supremo do HypeSquad.',
    icon: '/src/utils/assets/badges/golden-hype-squad-balance.svg',
    type: 'discord'
  },
  koth_hypesquad: {
    id: 'koth_hypesquad',
    name: 'King of the Hill HypeSquad',
    description: 'Vencedor do evento King of the Hill do HypeSquad.',
    icon: '/src/utils/assets/badges/koth-hype-squad-balance.svg',
    type: 'discord'
  },
  last_meadow: {
    id: 'last_meadow',
    name: 'Last Meadow',
    description: 'Insígnia memorial especial Last Meadow.',
    icon: '/src/utils/assets/badges/last-meadow.png',
    type: 'discord'
  },
  orb: {
    id: 'orb',
    name: 'Orbe Celestial',
    description: 'Orbe mística misteriosa do ecossistema Discord.',
    icon: '/src/utils/assets/badges/orb.svg',
    type: 'discord'
  },
  username_badge: {
    id: 'username_badge',
    name: 'Novo Username',
    description: 'Pioneiro na migração do novo sistema de usernames do Discord.',
    icon: '/src/utils/assets/badges/username.png',
    type: 'discord'
  },
  old_discord_mod: {
    id: 'old_discord_mod',
    name: 'Antigo Moderador Discord',
    description: 'Veterano do programa clássico de moderadores do Discord.',
    icon: '/src/utils/assets/badges/old-discord-mod.svg',
    type: 'discord'
  },
  old_discord_partner: {
    id: 'old_discord_partner',
    name: 'Antigo Parceiro Discord',
    description: 'Veterano do programa clássico de parceiros do Discord.',
    icon: '/src/utils/assets/badges/old-discord-partner.png',
    type: 'discord'
  }
};