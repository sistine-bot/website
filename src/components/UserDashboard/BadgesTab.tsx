// src/components/tabs/BadgesTab.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Award, Sparkles, Lock, Layers } from 'lucide-react';
import { 
  DISCORD_FLAGS_MAP, 
  HYPESQUAD_HOUSES, 
  BADGE_LEVELS_CONFIG, 
  BOT_CUSTOM_BADGES_MAP 
} from '../../utils/badgesMap';

const OWNER_IDS = ['1443828312936812554'];

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

export default function BadgesTab({ user, dbState, onUpdateDb, onTriggerSaveStatus }: BadgesTabProps) {
  // Mapa com o status booleano explícito (true = exibir, false = ocultar) de cada badge
  const [badgeStatuses, setBadgeStatuses] = useState<Record<string, boolean>>({});
  const [savedBadgeStatuses, setSavedBadgeStatuses] = useState<Record<string, boolean>>({});
  
  const [selectedLevels, setSelectedLevels] = useState<Record<string, number>>({});
  const [savedSelectedLevels, setSavedSelectedLevels] = useState<Record<string, number>>({});

  const [selectedHypeSquad, setSelectedHypeSquad] = useState<string>('HypeSquadOnlineHouse1');
  const [savedSelectedHypeSquad, setSavedSelectedHypeSquad] = useState<string>('HypeSquadOnlineHouse1');

  const [isSaving, setIsSaving] = useState(false);

  const isOwnerOrDev = useMemo(() => {
    if (!user?.id) return false;
    return OWNER_IDS.includes(String(user.id));
  }, [user]);

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
    if (typeof badgeStatuses[badgeId] === 'boolean') return badgeStatuses[badgeId];
    if (houseKey && typeof badgeStatuses[houseKey] === 'boolean') return badgeStatuses[houseKey];
    // Se o usuário ainda não configurou, o padrão é true (ativa)
    return true;
  };

  // Processa a lista final de Badges
  const userBadgesList = useMemo(() => {
    const userId = user?.id;
    if (!userId) return [];

    const badgeData = dbState?.Perfil?.Badges || dbState?.economia?.[userId]?.Perfil?.Badges || dbState?.Badges || {};
    const vipData = dbState?.vip || dbState?.economia?.[userId]?.vip || {};
    const customUnlocked = parseFirebaseList(badgeData.customUnlocked);

    const list: any[] = [];

    // 1. INSÍGNIAS ESTÁTICAS NATIVAS DO DISCORD
    Object.values(DISCORD_FLAGS_MAP).forEach((item) => {
      const isUnlocked = userFlags.includes(item.id) || isOwnerOrDev;
      list.push({
        ...item,
        isGroup: false,
        unlocked: isUnlocked,
        active: isUnlocked ? getIsBadgeActive(item.id) : false
      });
    });

    // 2. HYPESQUAD DINÂMICO
    let ownedHouseId = userFlags.find((f: string) => HYPESQUAD_HOUSES[f]);
    if (!ownedHouseId && isOwnerOrDev) {
      ownedHouseId = selectedHypeSquad;
    }

    if (ownedHouseId || isOwnerOrDev) {
      const houseId = ownedHouseId || selectedHypeSquad;
      const houseInfo = HYPESQUAD_HOUSES[houseId] || HYPESQUAD_HOUSES['HypeSquadOnlineHouse1'];
      const isUnlocked = Boolean(ownedHouseId || isOwnerOrDev);

      list.push({
        id: 'hypesquad_house',
        houseKey: houseId,
        name: houseInfo.name,
        description: houseInfo.description,
        icon: houseInfo.icon,
        type: 'discord',
        isHypeSquad: true,
        canChangeHouse: isOwnerOrDev, // Apenas Dev/Owner altera a casa se não tiver flag
        unlocked: isUnlocked,
        active: isUnlocked ? getIsBadgeActive(houseInfo.id, houseId) : false
      });
    }

    // 3. INSÍGNIAS COM NÍVEIS SELECIONÁVEIS (Bug Hunter, Booster, VIP e Dinâmicas)
    Object.values(BADGE_LEVELS_CONFIG).forEach((config) => {
      let maxLevel = 0;

      if (isOwnerOrDev) {
        maxLevel = Math.max(...config.levels.map((l) => l.level));
      } else if (config.id === 'booster') {
        const hasBooster = customUnlocked.includes('booster') || customUnlocked.includes('server_booster');
        maxLevel = hasBooster ? (Number(badgeData.boosterLevel) || 1) : 0;
      } else if (config.id === 'vip') {
        const isVipOuro = vipData.vip === 'ouro' || vipData.vip === 2 || customUnlocked.includes('vip_ouro');
        const isVipPrata = vipData.vip === 'prata' || vipData.vip === 1 || customUnlocked.includes('vip_prata') || isVipOuro;
        maxLevel = isVipOuro ? 2 : (isVipPrata ? 1 : 0);
      } else {
        // Verificação genérica para as demais badges com níveis (bug_hunter, gifting, streamer, account_age, etc.)
        const sortedLevels = [...config.levels].sort((a, b) => b.level - a.level);
        for (const lvl of sortedLevels) {
          const isUnlocked =
            (lvl.flagId && userFlags.includes(lvl.flagId)) ||
            (lvl.id && customUnlocked.includes(lvl.id)) ||
            customUnlocked.includes(`${config.id}_${lvl.level}`);
          
          if (isUnlocked) {
            maxLevel = lvl.level;
            break; // Já encontramos o nível mais alto
          }
        }
      }

      const chosenLevel = Math.min(selectedLevels[config.id] || maxLevel, maxLevel || 1);
      const levelInfo = config.levels.find((l) => l.level === chosenLevel) || config.levels[0];

      list.push({
        id: config.id,
        name: levelInfo.name,
        description: levelInfo.description,
        icon: levelInfo.icon,
        type: config.type,
        isGroup: true,
        groupKey: config.id,
        maxLevel: maxLevel,
        currentLevel: chosenLevel,
        availableLevels: config.levels.filter((l) => l.level <= maxLevel),
        unlocked: maxLevel > 0,
        active: maxLevel > 0 ? getIsBadgeActive(config.id) : false
      });
    });

    // 4. INSÍGNIAS CUSTOMIZADAS DO BOT
    Object.values(BOT_CUSTOM_BADGES_MAP).forEach((badge) => {
      const isUnlocked = isOwnerOrDev || customUnlocked.includes(badge.id);

      list.push({
        ...badge,
        isGroup: false,
        unlocked: isUnlocked,
        active: isUnlocked ? getIsBadgeActive(badge.id) : false
      });
    });

    return list;
  }, [user, dbState, badgeStatuses, selectedLevels, selectedHypeSquad, userFlags, isOwnerOrDev]);

  const hasChanges = useMemo(() => {
    const statusChanged = JSON.stringify(badgeStatuses) !== JSON.stringify(savedBadgeStatuses);
    const levelsChanged = JSON.stringify(selectedLevels) !== JSON.stringify(savedSelectedLevels);
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
        ...displayBooleans // Salva chaves booleanas diretamente no nó Badges
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

  const unlockedCount = userBadgesList.filter((b) => b.unlocked).length;
  const activeCount = userBadgesList.filter((b) => b.active).length;

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
            Configure níveis, ative ou desative insígnias para exibição no cartão do perfil. O status de exibição é salvo diretamente como booleano na database.
          </p>
        </div>
        <div className="flex flex-col gap-1.5 items-end">
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl font-mono text-xs text-zinc-400">
            <Sparkles size={14} className="text-amber-400" />
            <span>{activeCount} / {unlockedCount} Ativas</span>
          </div>
        </div>
      </div>

      {/* GRADE DE BADGES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {userBadgesList.map((badge) => (
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
                          badge.type === 'discord'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}
                      >
                        {badge.type}
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

            {/* SELETOR DE NÍVEL (BUG HUNTER, BOOSTER, VIP) */}
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

            {/* SELETOR DE HYPESQUAD (SE FOR DEV/OWNER E NÃO TIVER FLAG NATIVA) */}
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
        ))}
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