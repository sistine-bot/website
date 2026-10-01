src/utils/
    ├── functions/                  # 🧩 Funções utilitárias modularizadas por domínio
    │   ├── database.js             # Proxy resiliente com fallback para o Firebase Realtime DB
    │   ├── formatters.js           # Format, ParseDuration, FormatDuration, NumberConvert, sendError
    │   ├── economy.js              # getUserMoney, getUserInventory, UpdateMoneyWallet, UpdateMoneyBank,
  TransactionUpdate
    │   ├── users.js                # getUser, isStaff, getUserReps, ReputationUpdate, Cooldowns, AntiRoubo,
  Casamento, XpUpdate
    │   ├── moderation.js           # CheckUserVip, CheckUserBlacklisted, setUserBlacklist, removeUserBlacklist
    │   ├── badges.js               # getUserGlobalRank, getResolvedUserBadges, parseFirebaseList
    │   ├── logging.js              # eventLog (auditoria no terminal do painel e Discord)
    │   └── index.js                # Consolidador de todas as funções
    │
    ├── managers/                   # ⚙️ Gerenciadores e motores de sistemas
    │   ├── badgeManager.js         # Gerenciamento de insígnias e regras no Firebase
    │   ├── experienceManager.js    # Sistema de XP, níveis e recompensas
    │   ├── transactionManager.js   # Histórico e registro de transações econômicas
    │   ├── punishmentHandler.js    # Execução e log de punições (Warn, Mute, Kick, Ban)
    │   ├── shiftEngine.js          # Sistema de plantões/turnos de trabalho
    │   ├── commandBridge.js        # Ponte entre comandos de barra (slash) e prefixo
    │   └── index.js
    │
    ├── rendering/                  # 🎨 Motores de renderização de imagens e layouts
    │   ├── satoriProfile.js        # Geração de cartões de perfil via Satori e Resvg
    │   ├── satoriMinigames.js      # Geração de imagens para minigames (roleta, dados, etc.)
    │   ├── satoriItemTemplates.js  # Templates visuais de itens e pacotes
    │   ├── ProfileTemplates.js     # Templates legados de canvas
    │   ├── layoutSvgEngine.js      # Motor vetorial de geração de SVG dinâmico por paleta
    │   ├── imagePreloader.ts       # Pré-carregamento otimizado de imagens no browser
    │   └── index.js
    │
    ├── shop/                       # 🛍️ Catálogos e mapeamentos
    │   ├── shopCatalog.js          # Catálogo completo de wallpapers, layouts dinâmicos e loja diária
    │   ├── shopCatalog.ts          # Tipagens e exports TypeScript para o frontend Vite
    │   ├── badgesMap.js            # Mapeamento oficial de flags, casas e níveis de badges
    │   └── index.js
    │
    ├── data/                       # 📄 Arquivos e configurações JSON
    │   ├── itens.json              # Lista de itens da economia, colheitas, ferramentas e preços
    │   ├── IdComandos.json         # IDs registrados de slash commands
    │   └── index.js
    │
    ├── core/                       # 🔤 Configurações centrais
    │   ├── emoji.js                # Dicionário central de emojis do bot
    │   └── index.js
    │
    ├── assets/                     # 🖼️ Recursos estáticos (backgrounds, badges, layouts SVG, fontes)
    ├── market/                     # 🏪 Módulo de mercado da economia
    │
    └── index.js                    # 🌐 Barrel raiz unificado da pasta src/utils