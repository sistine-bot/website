// src/components/UserDashboard/BadgesTab.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Award, Sparkles, Lock, Layers, Bot, Gamepad2, Search } from 'lucide-react';
import { 
  DISCORD_FLAGS_MAP, 
  HYPESQUAD_HOUSES, 
  BADGE_LEVELS_CONFIG, 
  BOT_CUSTOM_BADGES_MAP 
} from '../../utils/badgesMap';

// Conjunto definitivo de insígnias que pertencem à categoria do Bot
const BOT_BADGE_IDS = new Set([
  'owner',
  'dev',
  'vip',
  'booster',
  'married',
  'topmoney_badge',
  'diamond_badge'
]);

// Ordem prioritária de exibição das badges do bot
const BOT_PRIORITY_ORDER = [
  'owner',
  'dev',
  'vip',
  'booster',
  'married',
  'topmoney_badge',
  'diamond_badge'
];

interface BadgesTabProps {
  user: any;
  dbState: any;
  onUpdateDb: (key: string, value: any) => Promise<void>;
  onTriggerSaveStatus: (type: 'success' | 'error', message: string) => void;
}

const parseFirebaseList = (rawData: any): string[] => {
  if (!rawData) return [];
  if (Array.isArray(rawData)) return rawData.filter(Boolean).map(String);
  if (typeof rawData === 'object') {
    const values = Object.values(rawData);
    if (values.every((v) => typeof v === 'string')) return values as string[];
    return Object.keys(rawData).filter((k) => Boolean(rawData[k]));
  }
  if (typeof rawData === 'string') return [rawData];
  return [];
};

function areRecordEqual(a: Record<string, any>, b: Record<string, any>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

export default function BadgesTab({ user, dbState, onUpdateDb, onTriggerSaveStatus }: BadgesTabProps) {
  // Filtro de categoria selecionada: 'all' | 'bot' | 'discord'
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'bot' | 'discord'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mapa com o status booleano explícito (true = exibir, false = ocultar) de cada badge
  const [badgeStatuses, setBadgeStatuses] = useState<Record<string, boolean>>({});
  const [savedBadgeStatuses, setSavedBadgeStatuses] = useState<Record<string, boolean>>({});
  
  const [selectedLevels, setSelectedLevels] = useState<Record<string, number>>({});
  const [savedSelectedLevels, setSavedSelectedLevels] = useState<Record<string, number>>({});

  const [selectedHypeSquad, setSelectedHypeSquad] = useState<string>('HypeSquadOnlineHouse1');
  const [savedSelectedHypeSquad, setSavedSelectedHypeSquad] = useState<string>('HypeSquadOnlineHouse1');

  const [isSaving, setIsSaving] = useState(false);

  // Verificação de permissões de criador e desenvolvedor
  const isCreator = Boolean(
    user?.isCreator || 
    user?.isOwner || 
    dbState?.isCreator || 
    dbState?.isOwner
  );

  const isDev = Boolean(
    user?.isDeveloper || 
    user?.isDev || 
    dbState?.isDeveloper || 
    dbState?.isDev
  );

  // Carrega configurações da Database com valores booleanos explícitos
  useEffect(() => {
    const userId = user?.id;
    if (!userId || !dbState) return;

    const badgeData =
      dbState?.Perfil?.Badges ||
      dbState?.Perfil?.BadgesConfig ||
      dbState?.economia?.[userId]?.Perfil?.Badges ||
      dbState?.[userId]?.Perfil?.Badges ||
      dbState?.Badges ||
      {};

    // Extrai o mapa de booleans explícitos salvos na database
    const loadedStatuses: Record<string, boolean> = {
      ...(badgeData.display || {}),
      ...(badgeData.active && typeof badgeData.active === 'object' && !Array.isArray(badgeData.active) ? badgeData.active : {}),
    };

    // Lê chaves booleanas diretas na raiz do nó Badges (ex: { ActiveDeveloper: true, bug_hunter: false })
    Object.entries(badgeData).forEach(([k, v]) => {
      if (typeof v === 'boolean') {
        loadedStatuses[k] = v;
      }
    });

    // Compatibilidade com lista legada 'disabled'
    const disabledList = parseFirebaseList(badgeData.disabled);
    disabledList.forEach((id: string) => {
      if (loadedStatuses[id] === undefined) {
        loadedStatuses[id] = false;
      }
    });

    setBadgeStatuses(loadedStatuses);
    setSavedBadgeStatuses(loadedStatuses);

    const levels = badgeData.selectedLevels || {};
    setSelectedLevels(levels);
    setSavedSelectedLevels(levels);

    const hype = badgeData.selectedHypeSquad || 'HypeSquadOnlineHouse1';
    setSelectedHypeSquad(hype);
    setSavedSelectedHypeSquad(hype);
  }, [dbState, user]);

  // Flags nativas do Discord do usuário
  const userFlags = useMemo(() => {
    if (Array.isArray(user?.flagsArray)) return user.flagsArray;
    return parseFirebaseList(user?.flags);
  }, [user]);

  // Helper para obter o status de exibição booleano da badge (padrão: true para desbloqueadas)
  const getIsBadgeActive = (badgeId: string, houseKey?: string) => {
    if (houseKey && typeof badgeStatuses[houseKey] === 'boolean') return badgeStatuses[houseKey];
    if (typeof badgeStatuses[badgeId] === 'boolean') return badgeStatuses[badgeId];
    return true;
  };

  // Processa a lista final completa de Badges, com as badges do Bot ordenadas em cima
  const userBadgesList = useMemo(() => {
    const userId = user?.id;
    if (!userId) return [];

    const badgeData = dbState?.Perfil?.Badges || dbState?.economia?.[userId]?.Perfil?.Badges || dbState?.Badges || {};
    const vipData = dbState?.vip || dbState?.economia?.[userId]?.vip || user?.vip || {};
    const customUnlocked = parseFirebaseList(badgeData.customUnlocked);

    const list: any[] = [];

    // 1. INSÍGNIAS ESTÁTICAS NATIVAS DO DISCORD
    Object.values(DISCORD_FLAGS_MAP).forEach((item) => {
      const isUnlocked = userFlags.includes(item.id) || customUnlocked.includes(item.id);
      list.push({
        ...item,
        category: 'discord',
        isGroup: false,
        unlocked: isUnlocked,
        active: isUnlocked ? getIsBadgeActive(item.id) : false
      });
    });

    // 2. HYPESQUAD DINÂMICO
    let ownedHouseId = userFlags.find((f: string) => HYPESQUAD_HOUSES[f]);
    if (!ownedHouseId && customUnlocked.some(k => HYPESQUAD_HOUSES[k])) {
      ownedHouseId = selectedHypeSquad;
    }

    if (ownedHouseId || customUnlocked.some(k => HYPESQUAD_HOUSES[k])) {
      const houseId = ownedHouseId || selectedHypeSquad;
      const houseInfo = HYPESQUAD_HOUSES[houseId] || HYPESQUAD_HOUSES['HypeSquadOnlineHouse1'];
      const isUnlocked = Boolean(ownedHouseId || customUnlocked.some(k => HYPESQUAD_HOUSES[k]));

      list.push({
        id: 'hypesquad_house',
        houseKey: houseId,
        name: houseInfo.name,
        description: houseInfo.description,
        icon: houseInfo.icon,
        category: 'discord',
        type: 'discord',
        isHypeSquad: true,
        canChangeHouse: Boolean(customUnlocked.some(k => HYPESQUAD_HOUSES[k])),
        unlocked: isUnlocked,
        active: isUnlocked ? getIsBadgeActive(houseInfo.id, houseId) : false
      });
    }

    // 3. INSÍGNIAS COM NÍVEIS SELECIONÁVEIS
    Object.values(BADGE_LEVELS_CONFIG).forEach((config) => {
      let maxLevel = 0;
      const isBotCat = BOT_BADGE_IDS.has(config.id);

      if (config.id === 'booster') {
        const isBoosterUser = Boolean(
          dbState?.isBooster || 
          user?.isBooster || 
          customUnlocked.includes('booster') || 
          customUnlocked.includes('server_booster')
        );
        const storedLevel = Number(badgeData.boosterLevel) || 1;
        maxLevel = isBoosterUser ? storedLevel : 0;
      } else if (config.id === 'vip') {
        const rawVip = vipData?.vip ?? dbState?.isVip;
        let vipLvl = 0;
        if (typeof rawVip === 'string') {
          const low = rawVip.toLowerCase();
          if (low === 'ouro' || low === 'diamante' || low === 'premium+') vipLvl = 2;
          else if (low === 'prata' || low === 'premium') vipLvl = 1;
          else vipLvl = parseInt(rawVip) || 0;
        } else if (typeof rawVip === 'number') {
          vipLvl = rawVip;
        } else if (rawVip === true) {
          vipLvl = 1;
        }

        // Verifica expiração do VIP se aplicável
        const vipDate = Number(vipData?.data || 0);
        const vipTime = Number(vipData?.tempo || 0);
        const isExpired = vipDate > 0 && vipTime > 0 && (vipTime - (Date.now() - vipDate) <= 0);
        if (isExpired) vipLvl = 0;

        const isVipOuro = vipLvl >= 2 || customUnlocked.includes('vip_ouro') || customUnlocked.includes('vip_diamante');
        const isVipPrata = vipLvl >= 1 || customUnlocked.includes('vip_prata') || isVipOuro;
        maxLevel = isVipOuro ? 2 : (isVipPrata ? 1 : 0);
      } else {
        const sortedLevels = [...config.levels].sort((a, b) => b.level - a.level);
        for (const lvl of sortedLevels) {
          const isUnlocked =
            (lvl.flagId && userFlags.includes(lvl.flagId)) ||
            (lvl.id && customUnlocked.includes(lvl.id)) ||
            customUnlocked.includes(`${config.id}_${lvl.level}`);
          
          if (isUnlocked) {
            maxLevel = lvl.level;
            break;
          }
        }
      }

      const chosenLevel = maxLevel > 0 
        ? Math.min(selectedLevels[config.id] || maxLevel, maxLevel)
        : 1;
      const levelInfo = config.levels.find((l) => l.level === chosenLevel) || config.levels[0];

      list.push({
        id: config.id,
        name: levelInfo.name,
        description: levelInfo.description,
        icon: levelInfo.icon,
        category: isBotCat ? 'bot' : 'discord',
        type: isBotCat ? 'bot' : 'discord',
        isGroup: true,
        groupKey: config.id,
        maxLevel: maxLevel,
        currentLevel: chosenLevel,
        availableLevels: config.levels.filter((l) => l.level <= maxLevel),
        unlocked: maxLevel > 0,
        active: maxLevel > 0 ? getIsBadgeActive(config.id) : false
      });
    });

    // 4. INSÍGNIAS CUSTOMIZADAS E ESPECIAIS (BOT E DISCORD)
    Object.values(BOT_CUSTOM_BADGES_MAP).forEach((badge) => {
      let isUnlocked = customUnlocked.includes(badge.id);
      let badgeItem = { ...badge };

      // Verificações contextuais específicas
      if (badge.id === 'married') {
        const isMarried = Boolean(
          dbState?.Casamento?.casado ||
          dbState?.casamento?.casado ||
          dbState?.Perfil?.casamento?.casado ||
          customUnlocked.includes('married')
        );
        isUnlocked = isMarried;
      } else if (badge.id === 'topmoney_badge') {
        const rawRank = dbState?.rankBanco ?? dbState?.rank ?? dbState?.userRank;
        const userRank = Number(rawRank);
        const isTop5 = !isNaN(userRank) && userRank >= 1 && userRank <= 5;
        isUnlocked = isTop5 || customUnlocked.includes('topmoney_badge');
        if (!isNaN(userRank) && userRank > 0) {
          badgeItem.description = `Exclusivo para os 5 usuários mais ricos da Sistine. (Seu Rank: #${userRank})`;
        }
      } else if (badge.id === 'owner') {
        isUnlocked = isCreator || customUnlocked.includes('owner');
      } else if (badge.id === 'dev') {
        isUnlocked = isDev || customUnlocked.includes('dev');
      } else if (badge.id === 'supports_commands') {
        isUnlocked = user?.bot || customUnlocked.includes('supports_commands');
      } else if (badge.id === 'automod') {
        isUnlocked = user?.bot || customUnlocked.includes('automod');
      }

      const isBotCat = BOT_BADGE_IDS.has(badge.id);

      list.push({
        ...badgeItem,
        category: isBotCat ? 'bot' : 'discord',
        type: isBotCat ? 'bot' : 'discord',
        isGroup: false,
        unlocked: isUnlocked,
        active: isUnlocked ? getIsBadgeActive(badge.id) : false
      });
    });

    // 5. NOVAS INSÍGNIAS CUSTOMIZADAS CONFIGURADAS NO BANCO DE DADOS
    const dbBadgesCatalog = dbState?.catalog?.badges || {};
    const existingIds = new Set(list.map((b) => b.id));
    existingIds.add('hypesquad_house');
    existingIds.add('HypeSquadOnlineHouse1');
    existingIds.add('HypeSquadOnlineHouse2');
    existingIds.add('HypeSquadOnlineHouse3');

    Object.values(dbBadgesCatalog).forEach((dbBadge: any) => {
      if (!dbBadge || !dbBadge.id || existingIds.has(dbBadge.id)) return;
      if (dbBadge.enabled === false) return;

      const isUnlocked = customUnlocked.includes(dbBadge.id);
      const isBot = dbBadge.type === 'bot' || dbBadge.category === 'bot';

      list.push({
        ...dbBadge,
        category: isBot ? 'bot' : 'discord',
        type: isBot ? 'bot' : 'discord',
        isGroup: false,
        unlocked: isUnlocked,
        active: isUnlocked ? getIsBadgeActive(dbBadge.id) : false
      });
      existingIds.add(dbBadge.id);
    });

    // ORDENAÇÃO: Garante que as badges do bot fiquem SEMPRE em cima das badges do Discord
    list.sort((a, b) => {
      const isBotA = a.category === 'bot';
      const isBotB = b.category === 'bot';

      if (isBotA && !isBotB) return -1;
      if (!isBotA && isBotB) return 1;

      if (isBotA && isBotB) {
        const idxA = BOT_PRIORITY_ORDER.indexOf(a.id);
        const idxB = BOT_PRIORITY_ORDER.indexOf(b.id);
        const orderA = idxA === -1 ? 99 : idxA;
        const orderB = idxB === -1 ? 99 : idxB;
        return orderA - orderB;
      }

      return 0;
    });

    return list;
  }, [user, dbState, badgeStatuses, selectedLevels, selectedHypeSquad, userFlags, isCreator, isDev]);

  // Contadores por categoria
  const counts = useMemo(() => {
    const botBadges = userBadgesList.filter((b) => b.category === 'bot');
    const discordBadges = userBadgesList.filter((b) => b.category === 'discord');

    return {
      all: userBadgesList.length,
      allUnlocked: userBadgesList.filter((b) => b.unlocked).length,
      allActive: userBadgesList.filter((b) => b.active).length,
      bot: botBadges.length,
      botUnlocked: botBadges.filter((b) => b.unlocked).length,
      botActive: botBadges.filter((b) => b.active).length,
      discord: discordBadges.length,
      discordUnlocked: discordBadges.filter((b) => b.unlocked).length,
      discordActive: discordBadges.filter((b) => b.active).length,
    };
  }, [userBadgesList]);

  // Listas filtradas por categoria e busca
  const botBadgesList = useMemo(() => {
    let list = userBadgesList.filter((b) => b.category === 'bot');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.id.toLowerCase().includes(q));
    }
    return list;
  }, [userBadgesList, searchQuery]);

  const discordBadgesList = useMemo(() => {
    let list = userBadgesList.filter((b) => b.category === 'discord');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.id.toLowerCase().includes(q));
    }
    return list;
  }, [userBadgesList, searchQuery]);

  const hasChanges = useMemo(() => {
    const statusChanged = !areRecordEqual(badgeStatuses, savedBadgeStatuses);
    const levelsChanged = !areRecordEqual(selectedLevels, savedSelectedLevels);
    const hypeChanged = selectedHypeSquad !== savedSelectedHypeSquad;
    return statusChanged || levelsChanged || hypeChanged;
  }, [badgeStatuses, savedBadgeStatuses, selectedLevels, savedSelectedLevels, selectedHypeSquad, savedSelectedHypeSquad]);

  // Alterna o status booleano (true <-> false) da badge
  const handleToggleBadge = (badgeKey: string) => {
    setBadgeStatuses((prev) => {
      const currentVal = prev[badgeKey] !== undefined ? prev[badgeKey] : true;
      return {
        ...prev,
        [badgeKey]: !currentVal
      };
    });
  };

  const handleSelectLevel = (groupKey: string, levelNum: number) => {
    setSelectedLevels((prev) => ({
      ...prev,
      [groupKey]: levelNum
    }));
  };

  const handleSelectHypeSquad = (houseId: string) => {
    setSelectedHypeSquad(houseId);
  };

  // Salva no banco de dados com valores booleanos explícitos (true/false)
  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const currentBadges = dbState?.Perfil?.Badges || dbState?.economia?.[user.id]?.Perfil?.Badges || {};

      // Mapeia todas as badges do usuário para seus status booleanos explícitos
      const displayBooleans: Record<string, boolean> = {};
      userBadgesList.forEach((badge) => {
        const key = badge.isHypeSquad ? badge.houseKey : badge.id;
        displayBooleans[key] = Boolean(badge.active);
      });

      // Lista de desativadas para compatibilidade reversa
      const disabledList = Object.keys(displayBooleans).filter((k) => displayBooleans[k] === false);

      const payload = {
        ...currentBadges,
        display: displayBooleans,
        active: displayBooleans,
        disabled: disabledList,
        selectedLevels,
        selectedHypeSquad,
        ...displayBooleans
      };

      await onUpdateDb('Badges', payload);

      setSavedBadgeStatuses(badgeStatuses);
      setSavedSelectedLevels(selectedLevels);
      setSavedSelectedHypeSquad(selectedHypeSquad);

      onTriggerSaveStatus('success', 'Preferências de insígnias salvas com sucesso no banco de dados!');
    } catch (e: any) {
      onTriggerSaveStatus('error', e.message || 'Erro ao salvar preferências.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setBadgeStatuses(savedBadgeStatuses);
    setSelectedLevels(savedSelectedLevels);
    setSelectedHypeSquad(savedSelectedHypeSquad);
  };

  // Renderizador individual de card de badge (preserva exatamente o design dos botões/cards)
  const renderBadgeCard = (badge: any) => (
    <div
      key={badge.id}
      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
        !badge.unlocked
          ? 'bg-zinc-950/30 border-zinc-900/50 opacity-60 grayscale'
          : badge.active
          ? 'bg-zinc-900/60 border-zinc-800'
          : 'bg-zinc-950/60 border-zinc-900/70'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-center shrink-0 p-2 relative">
            <img
              src={badge.icon}
              alt={badge.name}
              className="w-7 h-7 object-contain"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-xs font-bold text-white truncate">{badge.name}</h4>
              {!badge.unlocked ? (
                <span className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase font-bold bg-zinc-800 text-zinc-400">
                  Bloqueada
                </span>
              ) : (
                <span
                  className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase font-bold border ${
                    badge.category === 'discord'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  }`}
                >
                  {badge.category === 'bot' ? 'Bot Sistine' : 'Discord'}
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
              {badge.description}
            </p>
          </div>
        </div>

        {/* TOGGLE BOOLEANO ON/OFF */}
        <div className="shrink-0">
          {!badge.unlocked ? (
            <div className="w-11 h-6 flex items-center justify-center bg-zinc-900 rounded-full border border-zinc-800/80">
              <Lock size={12} className="text-zinc-600" />
            </div>
          ) : (
            <label className="relative flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={Boolean(badge.active)}
                onChange={() => handleToggleBadge(badge.isHypeSquad ? badge.houseKey : badge.id)}
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${badge.active ? 'bg-purple-600' : 'bg-zinc-800'}`}></div>
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${badge.active ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </label>
          )}
        </div>
      </div>

      {/* SELETOR DE NÍVEL (BUG HUNTER, BOOSTER, VIP E OUTRAS) */}
      {badge.isGroup && badge.unlocked && badge.maxLevel > 1 && (
        <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between gap-2">
          <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
            <Layers size={12} className="text-amber-400" /> Nível Exibido:
          </span>
          <select
            value={badge.currentLevel}
            onChange={(e) => handleSelectLevel(badge.groupKey, Number(e.target.value))}
            className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2 py-1 outline-none focus:border-purple-500 cursor-pointer"
          >
            {badge.availableLevels.map((lvl: any) => (
              <option key={lvl.level} value={lvl.level}>
                {lvl.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* SELETOR DE HYPESQUAD (SE FOR DEV/OWNER OU TIVER ACESSO) */}
      {badge.isHypeSquad && badge.canChangeHouse && (
        <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between gap-2">
          <span className="text-[10px] text-zinc-400 font-medium">Trocar Casa (Dev Mode):</span>
          <select
            value={selectedHypeSquad}
            onChange={(e) => handleSelectHypeSquad(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2 py-1 outline-none focus:border-purple-500 cursor-pointer"
          >
            {Object.entries(HYPESQUAD_HOUSES).map(([key, item]) => (
              <option key={key} value={key}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-28">
      {/* CABEÇALHO */}
      <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Award className="text-amber-400" size={22} />
            Gerenciar Insígnias do /perfil
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            Configure níveis, ative ou desative insígnias para exibição no cartão do perfil. As badges do bot são exibidas com prioridade nos primeiros slots.
          </p>
        </div>
        <div className="flex flex-col gap-1.5 items-end">
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl font-mono text-xs text-zinc-400">
            <Sparkles size={14} className="text-amber-400" />
            <span>{counts.allActive} / {counts.allUnlocked} Ativas</span>
          </div>
        </div>
      </div>

      {/* BARRA DE NAVEGAÇÃO DE CATEGORIAS E BUSCA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/30 p-2 rounded-2xl border border-zinc-900">
        {/* ABAS DE CATEGORIA */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-zinc-900/70 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-zinc-800/50'
            }`}
          >
            <Layers size={14} />
            <span>Todas</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === 'all' ? 'bg-purple-700 text-white' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('bot')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              selectedCategory === 'bot'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-zinc-900/70 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-zinc-800/50'
            }`}
          >
            <Bot size={14} className={selectedCategory === 'bot' ? 'text-white' : 'text-purple-400'} />
            <span>Badges do Bot</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === 'bot' ? 'bg-purple-700 text-white' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {counts.bot}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('discord')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              selectedCategory === 'discord'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-zinc-900/70 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-zinc-800/50'
            }`}
          >
            <Gamepad2 size={14} className={selectedCategory === 'discord' ? 'text-white' : 'text-indigo-400'} />
            <span>Badges do Discord</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === 'discord' ? 'bg-purple-700 text-white' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {counts.discord}
            </span>
          </button>
        </div>

        {/* CAMPO DE BUSCA RÁPIDA */}
        <div className="relative shrink-0 sm:w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Filtrar insígnias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-purple-500 transition"
          />
        </div>
      </div>

      {/* EXIBIÇÃO ORGANIZADA: BADGES DO BOT EM CIMA, BADGES DO DISCORD EMBAIXO */}
      <div className="space-y-8">
        {/* SEÇÃO 1: BADGES DO BOT (SEMPRE EM CIMA) */}
        {(selectedCategory === 'all' || selectedCategory === 'bot') && botBadgesList.length > 0 && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-purple-500/10 text-purple-400">
                  <Bot size={16} />
                </div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Badges do Bot Sistine
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg">
                  {counts.botActive} / {counts.botUnlocked} ativas
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {botBadgesList.map(renderBadgeCard)}
            </div>
          </div>
        )}

        {/* SEÇÃO 2: BADGES DO DISCORD (EMBAIXO) */}
        {(selectedCategory === 'all' || selectedCategory === 'discord') && discordBadgesList.length > 0 && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Gamepad2 size={16} />
                </div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Badges da Plataforma Discord
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
                  {counts.discordActive} / {counts.discordUnlocked} ativas
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discordBadgesList.map(renderBadgeCard)}
            </div>
          </div>
        )}

        {/* FEEDBACK CASO NADA SEJA ENCONTRADO */}
        {((selectedCategory === 'bot' && botBadgesList.length === 0) ||
          (selectedCategory === 'discord' && discordBadgesList.length === 0) ||
          (selectedCategory === 'all' && botBadgesList.length === 0 && discordBadgesList.length === 0)) && (
          <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-12 text-center text-zinc-500">
            <p className="text-sm font-medium">Nenhuma insígnia encontrada com os filtros atuais.</p>
          </div>
        )}
      </div>

      {/* BARRA FLUTUANTE DE SALVAMENTO */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 shadow-2xl rounded-2xl px-6 py-4 flex items-center justify-between gap-8 z-50 transition-all duration-300 w-[90%] max-w-xl ${
          hasChanges ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
          <span className="text-xs font-medium text-zinc-200">Você possui alterações não salvas.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDiscard}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-purple-600/20"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}