import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Layout, ImageIcon, RotateCcw, Sparkles, Link as LinkIcon, Crown, Rocket, ShieldCheck } from 'lucide-react';
import { BACKGROUNDS_CATALOG, LAYOUTS_CATALOG, WallpaperItem, LayoutItem, getBackgroundById, getLayoutById, getLayoutConfig } from '../../utils/shopCatalog';
import OptimizedShopImage from './OptimizedShopImage';
import { preloadImagesInBatches } from '../../utils/imagePreloader';

interface ProfileConfigProps {
  user: any;
  dbState: any;
  csrfToken?: string;
  onUpdateDb: (key: string, value: any) => Promise<void>;
  onTriggerSaveStatus: (type: 'success' | 'error', message: string) => void;
  onRefreshDb?: () => Promise<void>;
}

export default function ProfileConfig({
  user,
  dbState,
  onUpdateDb,
  onTriggerSaveStatus,
  onRefreshDb
}: ProfileConfigProps) {
  const [sobremim, setSobremim] = useState('');
  const [savedSobremim, setSavedSobremim] = useState('');

  const [selectedLayoutId, setSelectedLayoutId] = useState('classic_azul');
  const [savedLayoutId, setSavedLayoutId] = useState('classic_azul');

  const [selectedWallpaperId, setSelectedWallpaperId] = useState('default_bg');
  const [savedWallpaperId, setSavedWallpaperId] = useState('default_bg');

  const [customBgUrl, setCustomBgUrl] = useState('');
  const [savedCustomBgUrl, setSavedCustomBgUrl] = useState('');

  const [isUsingCustomUrl, setIsUsingCustomUrl] = useState(false);
  const [savedIsUsingCustomUrl, setSavedIsUsingCustomUrl] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [scale, setScale] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const userBalance = Number(dbState?.saldo?.carteira ?? dbState?.eco?.coins ?? 0);

  // Validação de Permissão para 'Usar Imagem por URL' (VIPs, Boosters, Devs, etc.)
  const { canUseCustomUrl, perkBadge } = useMemo(() => {
    const userId = String(user?.id || dbState?.userId || '');
    const OWNER_IDS = ['1443828312936812554'];

    // 1. Desenvolvedores, Criadores e Equipe Oficial
    const isDevOrOwner = 
      OWNER_IDS.includes(userId) ||
      Boolean(user?.isDeveloper || user?.isDev || user?.isCreator || user?.isOwner) ||
      Boolean(dbState?.isOwnerOrDev || dbState?.isDeveloper || dbState?.isDev || dbState?.isCreator);

    // 2. VIPs (VIP Ativo, VIP Prata, VIP Ouro)
    const vipData = dbState?.vip || user?.vip || {};
    let rawVip = vipData.vip;
    let vipLevel = 0;
    if (typeof rawVip === 'string') {
      const low = rawVip.toLowerCase();
      if (low === 'ouro' || low === 'diamante' || low === 'premium+') vipLevel = 2;
      else if (low === 'prata' || low === 'premium') vipLevel = 1;
      else vipLevel = parseInt(rawVip) || 0;
    } else {
      vipLevel = Number(rawVip || 0);
    }
    const vipTime = Number(vipData.tempo || 0);
    const vipDate = Number(vipData.data || 0);
    const isVipActive = vipLevel > 0 && (vipDate === 0 || vipTime === 0 || vipTime - (Date.now() - vipDate) > 0);

    // 3. Badges e Custom Unlocked
    const badgesData = dbState?.Perfil?.Badges || dbState?.Badges || {};
    const customUnlockedRaw = badgesData.customUnlocked || [];
    const customUnlocked: string[] = Array.isArray(customUnlockedRaw)
      ? customUnlockedRaw
      : typeof customUnlockedRaw === 'object'
        ? Object.keys(customUnlockedRaw)
        : [];

    const isVipUnlocked = 
      isVipActive || 
      customUnlocked.includes('vip') || 
      customUnlocked.includes('vip_prata') || 
      customUnlocked.includes('vip_ouro') || 
      Boolean(dbState?.isVip || user?.isVip);

    // 4. Boosters (Nível de booster ou badge ativa)
    const boosterLevel = Number(badgesData.boosterLevel || 0);
    const isBooster = 
      boosterLevel > 0 ||
      customUnlocked.includes('booster') ||
      customUnlocked.includes('server_booster') ||
      Boolean(dbState?.isBooster || user?.isBooster);

    // 5. Permissões explícitas / Whitelist
    const isExplicitlyAllowed = 
      Boolean(dbState?.canUseCustomBgUrl || user?.canUseCustomBgUrl) ||
      Boolean(dbState?.Perfil?.allowCustomBgUrl || dbState?.Perfil?.allowUrlBg || dbState?.Perfil?.customBgUrlAllowed) ||
      customUnlocked.includes('custom_bg') ||
      customUnlocked.includes('url_bg') ||
      Boolean(dbState?.Perfil?.Equipados?.backgroundId === 'custom');

    const allowed = isDevOrOwner || isVipUnlocked || isBooster || isExplicitlyAllowed;

    let perk = null;
    if (isDevOrOwner) {
      perk = { label: 'Desenvolvedor', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', type: 'dev' as const };
    } else if (isBooster) {
      perk = { label: 'Server Booster', color: 'bg-pink-500/15 text-pink-300 border-pink-500/30', type: 'booster' as const };
    } else if (isVipUnlocked) {
      perk = { label: vipLevel >= 2 ? 'VIP Ouro' : 'VIP', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', type: 'vip' as const };
    } else if (isExplicitlyAllowed) {
      perk = { label: 'Permitido', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', type: 'custom' as const };
    }

    return { canUseCustomUrl: allowed, perkBadge: perk };
  }, [user, dbState]);

  // Inventários Unificados
  const userWallpaperInventory: string[] = useMemo(() => {
    const fromInv = dbState?.inventario?.wallpapers || dbState?.inventario?.backgrounds || dbState?.inventory?.wallpapers || [];
    const fromBg = Object.keys(dbState?.Perfil?.Backgrounds || {}).filter(k => dbState?.Perfil?.Backgrounds[k]);
    const equipped = dbState?.Perfil?.Equipados?.backgroundId ? [dbState.Perfil.Equipados.backgroundId] : [];
    return Array.from(new Set(['default_bg', ...fromInv, ...fromBg, ...equipped]));
  }, [dbState]);

  const userLayoutInventory: string[] = useMemo(() => {
    const fromInv = dbState?.inventario?.layouts || dbState?.inventory?.layouts || [];
    const layoutsObj = dbState?.Perfil?.Layouts || {};
    const fromObj: string[] = [];
    Object.keys(layoutsObj).forEach(k => {
      if (layoutsObj[k] && !k.endsWith('_log')) fromObj.push(k);
      if (k.startsWith('tema_') && k.endsWith('_log') && layoutsObj[k] > 0) {
        fromObj.push(`classic_${k.replace('tema_', '').replace('_log', '')}`);
      }
    });
    const equipped = dbState?.Perfil?.Equipados?.layout ? [dbState.Perfil.Equipados.layout] : (dbState?.Perfil?.Equipados?.layoutId ? [dbState.Perfil.Equipados.layoutId] : []);
    return Array.from(new Set(['classic_azul', ...fromInv, ...fromObj, ...equipped]));
  }, [dbState]);

  // Itens disponíveis para o usuário configurar (Apenas os que ele possui)
  const availableWallpapers = useMemo(() => {
    return BACKGROUNDS_CATALOG.filter(w => userWallpaperInventory.includes(w.id));
  }, [userWallpaperInventory]);

  const availableLayouts = useMemo(() => {
    return LAYOUTS_CATALOG.filter(l => userLayoutInventory.includes(l.id));
  }, [userLayoutInventory]);

  // Pré-carrega de forma não-bloqueante as imagens do inventário do usuário
  useEffect(() => {
    const urlsToPreload: string[] = [];
    availableWallpapers.forEach(w => {
      if (w.url) urlsToPreload.push(w.url);
    });
    availableLayouts.forEach(l => {
      if (l.previewUrl) urlsToPreload.push(l.previewUrl);
      if (l.overlay) urlsToPreload.push(l.overlay);
    });
    if (urlsToPreload.length > 0) {
      preloadImagesInBatches(urlsToPreload, 3);
    }
  }, [availableWallpapers, availableLayouts]);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) setScale(containerRef.current.offsetWidth / 1200);
    };
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    updateScale();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (dbState?.Perfil || dbState?.profile) {
      const info = dbState.Perfil?.Informações || dbState.Perfil?.Informacoes || {};
      const equipados = dbState.Perfil?.Equipados || {};
      
      const currentSobremim = info.sobremim || dbState.profile?.sobremim || '';
      const currentLayout = equipados.layout || equipados.layoutId || dbState.profile?.layout || 'classic_azul';
      const currentBg = equipados.background || info.imagemperfil || dbState.profile?.backgroundUrl || '';
      const currentBgId = equipados.backgroundId || dbState.profile?.equippedWallpaper || '';

      setSobremim(currentSobremim);
      setSavedSobremim(currentSobremim);

      setSelectedLayoutId(currentLayout);
      setSavedLayoutId(currentLayout);

      if (currentBgId && currentBgId !== 'custom') {
        setSelectedWallpaperId(currentBgId);
        setSavedWallpaperId(currentBgId);
        setIsUsingCustomUrl(false);
        setSavedIsUsingCustomUrl(false);
        setCustomBgUrl('');
        setSavedCustomBgUrl('');
      } else if (currentBg) {
        const matched = BACKGROUNDS_CATALOG.find(b => b.url === currentBg || b.id === currentBg);
        if (matched) {
          setSelectedWallpaperId(matched.id);
          setSavedWallpaperId(matched.id);
          setIsUsingCustomUrl(false);
          setSavedIsUsingCustomUrl(false);
          setCustomBgUrl('');
          setSavedCustomBgUrl('');
        } else {
          setSelectedWallpaperId('custom');
          setSavedWallpaperId('custom');
          setCustomBgUrl(currentBg);
          setSavedCustomBgUrl(currentBg);
          setIsUsingCustomUrl(true);
          setSavedIsUsingCustomUrl(true);
        }
      } else {
        setSelectedWallpaperId('default_bg');
        setSavedWallpaperId('default_bg');
        setIsUsingCustomUrl(false);
        setSavedIsUsingCustomUrl(false);
        setCustomBgUrl('');
        setSavedCustomBgUrl('');
      }
    }
  }, [dbState]);

  const currentWallpaper = useMemo(() => {
    if (isUsingCustomUrl && customBgUrl.trim()) {
      return { id: 'custom', url: customBgUrl.trim() } as WallpaperItem;
    }
    return getBackgroundById(selectedWallpaperId) || BACKGROUNDS_CATALOG[0];
  }, [selectedWallpaperId, isUsingCustomUrl, customBgUrl]);

  const currentLayout = useMemo(() => {
    return getLayoutById(selectedLayoutId) || LAYOUTS_CATALOG[0];
  }, [selectedLayoutId]);

  const layoutConfig = useMemo(() => {
    return getLayoutConfig(selectedLayoutId);
  }, [selectedLayoutId]);

  const isModernLayout = useMemo(() => {
    return layoutConfig.templateType === 'modern' || selectedLayoutId.startsWith('embaixo_');
  }, [layoutConfig, selectedLayoutId]);

  const hasChanges = useMemo(() => {
    const sobremimChanged = sobremim !== savedSobremim;
    const layoutChanged = selectedLayoutId !== savedLayoutId;
    const isUsingCustomUrlChanged = isUsingCustomUrl !== savedIsUsingCustomUrl;
    const wallpaperChanged = selectedWallpaperId !== savedWallpaperId;
    const customBgUrlChanged = customBgUrl !== savedCustomBgUrl;

    if (isUsingCustomUrl) {
      return sobremimChanged || layoutChanged || isUsingCustomUrlChanged || customBgUrlChanged;
    }
    return sobremimChanged || layoutChanged || isUsingCustomUrlChanged || wallpaperChanged;
  }, [
    sobremim, savedSobremim,
    selectedLayoutId, savedLayoutId,
    selectedWallpaperId, savedWallpaperId,
    customBgUrl, savedCustomBgUrl,
    isUsingCustomUrl, savedIsUsingCustomUrl
  ]);

  const handleDiscard = () => {
    setSobremim(savedSobremim);
    setSelectedLayoutId(savedLayoutId);
    setSelectedWallpaperId(savedWallpaperId);
    setCustomBgUrl(savedCustomBgUrl);
    setIsUsingCustomUrl(savedIsUsingCustomUrl);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      if (isUsingCustomUrl && !canUseCustomUrl) {
        onTriggerSaveStatus('error', 'Apenas usuários VIP, Boosters ou Desenvolvedores podem utilizar imagens de fundo por URL.');
        setIsSaving(false);
        return;
      }

      const finalBgUrl = isUsingCustomUrl && customBgUrl.trim() ? customBgUrl.trim() : currentWallpaper.url;
      const finalBgId = isUsingCustomUrl && customBgUrl.trim() ? 'custom' : currentWallpaper.id;

      await onUpdateDb('profile', {
        sobremim: sobremim,
        layout: selectedLayoutId,
        layoutId: selectedLayoutId,
        theme: selectedLayoutId,
        equippedWallpaper: finalBgId,
        backgroundId: finalBgId,
        backgroundUrl: finalBgUrl,
        background: finalBgUrl
      });

      setSavedSobremim(sobremim);
      setSavedLayoutId(selectedLayoutId);
      setSavedWallpaperId(selectedWallpaperId);
      setSavedCustomBgUrl(customBgUrl);
      setSavedIsUsingCustomUrl(isUsingCustomUrl);

      onTriggerSaveStatus('success', 'Perfil e aparência salvos com sucesso!');
      if (onRefreshDb) await onRefreshDb();
    } catch (e: any) {
      onTriggerSaveStatus('error', e.message || 'Erro ao salvar alterações no perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  // Cores dinâmicas para o preview 3D baseadas no layout selecionado
  const textDefs = layoutConfig.textos || {};
  const globalTextColor = layoutConfig.textColor || (layoutConfig.themeMode === 'light' ? '#000000' : '#ffffff');
  const globalTextShadow = layoutConfig.textShadow && layoutConfig.textShadow !== 'none' 
    ? String(layoutConfig.textShadow) 
    : (layoutConfig.themeMode === 'light' ? 'none' : '2px 2px 4px rgba(0,0,0,0.8)');

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8 pb-28">
      
      <div className="flex items-center justify-between bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-purple-400" /> Configuração do Perfil
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">Equipe os itens que você possui no inventário.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* --- COLUNA ESQUERDA (7/12) --- */}
        <div className="lg:col-span-7 space-y-8 order-2 lg:order-1">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layout size={18} className="text-zinc-400" /> Layouts Adquiridos
              </h2>
              <span className="text-xs text-zinc-400 font-mono">
                {availableLayouts.length} no Inventário
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableLayouts.map((layout) => {
                const isSelected = selectedLayoutId === layout.id;

                return (
                  <div
                    key={layout.id}
                    onClick={() => setSelectedLayoutId(layout.id)}
                    className={`relative aspect-video rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'ring-[3px] ring-white border-none shadow-xl shadow-white/10 scale-105 z-10'
                        : 'border-2 border-zinc-800 opacity-60 hover:opacity-100 grayscale hover:grayscale-0'
                    }`}
                  >
                    <OptimizedShopImage
                      src={layout.previewUrl || layout.overlay || ''}
                      alt={layout.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <hr className="border-zinc-800/50" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon size={18} className="text-zinc-400" /> Planos de Fundo
              </h2>
              <span className="text-xs text-zinc-400 font-mono">
                {availableWallpapers.length} no Inventário
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableWallpapers.map((wp) => {
                const isSelected = !isUsingCustomUrl && selectedWallpaperId === wp.id;

                return (
                  <div
                    key={wp.id}
                    onClick={() => {
                      setIsUsingCustomUrl(false);
                      setSelectedWallpaperId(wp.id);
                    }}
                    className={`relative aspect-video rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'ring-[3px] ring-white border-none scale-105 z-10 shadow-xl shadow-white/10'
                        : 'border-2 border-zinc-800 opacity-60 hover:opacity-100 grayscale hover:grayscale-0'
                    }`}
                  >
                    <OptimizedShopImage
                      src={wp.url}
                      alt={wp.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                );
              })}
            </div>

            {canUseCustomUrl && (
              <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800 space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <LinkIcon size={14} className="text-zinc-400" /> Usar Imagem por URL
                    </span>
                    {perkBadge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${perkBadge.color}`}>
                        {perkBadge.type === 'vip' && <Crown size={11} />}
                        {perkBadge.type === 'booster' && <Rocket size={11} />}
                        {perkBadge.type === 'dev' && <ShieldCheck size={11} />}
                        {perkBadge.type === 'custom' && <Sparkles size={11} />}
                        <span>{perkBadge.label}</span>
                      </span>
                    )}
                  </div>
                  {isUsingCustomUrl && (
                    <span className="text-[10px] bg-white text-black px-2 py-0.5 rounded font-bold">Ativado</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://exemplo.com/imagem.png"
                    value={customBgUrl}
                    onChange={(e) => {
                      setCustomBgUrl(e.target.value);
                      if (e.target.value.trim()) setIsUsingCustomUrl(true);
                    }}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition font-mono"
                  />
                  {isUsingCustomUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUsingCustomUrl(false);
                        setCustomBgUrl('');
                      }}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Resetar
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Insira uma URL direta de imagem (PNG, JPG, WEBP ou GIF) para exibir no fundo do seu cartão de perfil.
                </p>
              </div>
            )}
          </div>

          <hr className="border-zinc-800/50" />

          <div className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Sobre Mim
            </h2>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1 focus-within:border-zinc-500 transition-colors">
              <textarea
                value={sobremim}
                onChange={(e) => setSobremim(e.target.value)}
                maxLength={150}
                rows={4}
                placeholder="Escreva uma breve biografia para aparecer no seu cartão do Discord..."
                className="w-full bg-transparent rounded-xl p-4 text-sm text-white focus:outline-none resize-none placeholder:text-zinc-600"
              />
            </div>
            <p className="text-xs text-zinc-500 text-right font-mono">{sobremim.length}/150 caracteres</p>
          </div>

        </div>

        {/* --- COLUNA DIREITA: PREVIEW 3D (5/12) --- */}
        <div className="lg:col-span-5 order-1 lg:order-2 lg:sticky lg:top-28">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 text-center lg:text-left font-mono">
            Preview 3D do Cartão
          </h2>
          
          <div 
            className="relative w-full transition-all duration-500 ease-out hover:scale-[1.02]"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'perspective(2000px) rotateX(12deg) rotateY(-12deg) rotateZ(2deg)',
              boxShadow: '-25px 35px 60px -15px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5) inset',
              borderRadius: '1.75rem',
              border: '4px solid #27272a',
              backgroundColor: '#09090b'
            }}
          >
            <div ref={containerRef} className="w-full relative overflow-hidden rounded-[1.5rem]" style={{ height: 670 * scale }}>
              <div
                style={{
                  width: 1200,
                  height: 670,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  fontFamily: 'sans-serif',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 0 100px rgba(255,255,255,0.1)'
                }}
              >
                <img src={currentWallpaper.url} decoding="async" style={{ position: 'absolute', width: 1200, height: 670, objectFit: 'cover' }} alt="Background" />
                <img src={currentLayout.previewUrl || currentLayout.overlay || ''} decoding="async" style={{ position: 'absolute', width: 1200, height: 670, objectFit: 'cover' }} alt="Overlay" />

                {isModernLayout ? (
                  <>
                    <img src={user?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} style={{ position: 'absolute', top: (layoutConfig.avatar?.y || 536) - (layoutConfig.avatar?.radius || 78), left: (layoutConfig.avatar?.x || 89) - (layoutConfig.avatar?.radius || 78), width: (layoutConfig.avatar?.radius || 78) * 2, height: (layoutConfig.avatar?.radius || 78) * 2, borderRadius: layoutConfig.avatar?.borderRadius || '50%', objectFit: 'cover' }} alt="Avatar" />
                    <div style={{ position: 'absolute', top: 450, left: 165, fontSize: 45, fontWeight: 'bold', color: textDefs.username?.color || globalTextColor, textShadow: textDefs.username?.textShadow !== undefined ? String(textDefs.username.textShadow) : globalTextShadow }}>{user?.username || 'Username'}</div>
                    <div style={{ position: 'absolute', top: 520, left: 180, width: 750, fontSize: 24, color: textDefs.sobremim?.color || globalTextColor, lineHeight: '30px', textShadow: textDefs.sobremim?.textShadow !== undefined ? String(textDefs.sobremim.textShadow) : globalTextShadow, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'hidden'}}>{sobremim || 'Sou uma linda borboleta'}</div>
                    <div style={{ position: 'absolute', top: 445, left: 1040, fontSize: 45, fontWeight: 'bold', color: textDefs.reputacao?.color || globalTextColor, textShadow: textDefs.reputacao?.textShadow !== undefined ? String(textDefs.reputacao.textShadow) : globalTextShadow }}>0 reps</div>
                    
                    <div style={{ position: 'absolute', top: 510, left: 1010, fontSize: 23, color: textDefs.carteira?.color || globalTextColor, textShadow: textDefs.carteira?.textShadow !== undefined ? String(textDefs.carteira.textShadow) : globalTextShadow }}>Carteira: R$ 0</div>
                    <div style={{ position: 'absolute', top: 535, left: 1010, fontSize: 23, color: textDefs.banco?.color || globalTextColor, textShadow: textDefs.banco?.textShadow !== undefined ? String(textDefs.banco.textShadow) : globalTextShadow }}>Banco: R$ 0</div>
                    <div style={{ position: 'absolute', top: 565, left: 1010, fontSize: 23, color: textDefs.rankBanco?.color || globalTextColor, textShadow: textDefs.rankBanco?.textShadow !== undefined ? String(textDefs.rankBanco.textShadow) : globalTextShadow }}>Ranking: #1</div>
                  </>
                ) : (
                  <>
                    <img src={user?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} style={{ position: 'absolute', top: (layoutConfig.avatar?.y || 125) - (layoutConfig.avatar?.radius || 100), left: (layoutConfig.avatar?.x || 125) - (layoutConfig.avatar?.radius || 100), width: (layoutConfig.avatar?.radius || 100) * 2, height: (layoutConfig.avatar?.radius || 100) * 2, borderRadius: layoutConfig.avatar?.borderRadius || '50%', objectFit: 'cover' }} alt="Avatar" />
                    <div style={{ position: 'absolute', top: 20, left: 220, fontSize: 35, fontWeight: 'bold', color: textDefs.username?.color || globalTextColor, textShadow: textDefs.username?.textShadow !== undefined ? String(textDefs.username.textShadow) : globalTextShadow }}>{user?.username || 'Username'}</div>
                    <div style={{ position: 'absolute', top: 75, left: 244, fontSize: 23, color: textDefs.carteira?.color || globalTextColor, textShadow: textDefs.carteira?.textShadow !== undefined ? String(textDefs.carteira.textShadow) : globalTextShadow }}>Carteira: R$ 0</div>
                    <div style={{ position: 'absolute', top: 98, left: 244, fontSize: 23, color: textDefs.banco?.color || globalTextColor, textShadow: textDefs.banco?.textShadow !== undefined ? String(textDefs.banco.textShadow) : globalTextShadow }}>Banco: R$ 0</div>
                    <div style={{ position: 'absolute', top: 121, left: 244, fontSize: 23, color: textDefs.rankBanco?.color || globalTextColor, textShadow: textDefs.rankBanco?.textShadow !== undefined ? String(textDefs.rankBanco.textShadow) : globalTextShadow }}>Ranking: #1</div>
                    <div style={{ position: 'absolute', top: 90, left: 895, fontSize: 40, fontWeight: 'bold', color: textDefs.reputacao?.color || globalTextColor, textShadow: textDefs.reputacao?.textShadow !== undefined ? String(textDefs.reputacao.textShadow) : globalTextShadow }}>0 reputações</div>
                    <div style={{ position: 'absolute', top: 610, left: 20, width: 1160, fontSize: 26, fontWeight: 'bold', color: textDefs.sobremim?.color || globalTextColor, textShadow: textDefs.sobremim?.textShadow !== undefined ? String(textDefs.sobremim.textShadow) : globalTextShadow, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'hidden' }}>{sobremim || 'Sou uma linda borboleta | Utilize /sobremim'}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

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
            onClick={handleSaveProfile}
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