import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Coins, ShoppingBag, CheckCircle2, Crown, Eye, RotateCcw } from 'lucide-react';
import { BACKGROUNDS_CATALOG, LAYOUTS_CATALOG, WallpaperItem, LayoutItem, getBackgroundById, getLayoutById } from '../../utils/shopCatalog';

// Limite configurável de itens que aparecem diariamente na loja (padrão de testes: 99)
export const DAILY_SHOP_LIMIT = 99;

interface WallpaperShopProps {
  dbState: any;
  csrfToken?: string;
  onUpdateDb: (key: string, value: any) => Promise<void>;
  onTriggerSaveStatus: (type: 'success' | 'error', message: string) => void;
  onRefreshDb?: () => Promise<void>;
}

export { BACKGROUNDS_CATALOG, LAYOUTS_CATALOG };
export type { WallpaperItem, LayoutItem };

export type ShopCatalogItem = (WallpaperItem & { itemType: 'background' }) | (LayoutItem & { itemType: 'layout' });

const getCsrfToken = () => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta) return meta.getAttribute('content');
  const match = document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : '';
};

export default function WallpaperShop({
  dbState,
  csrfToken,
  onUpdateDb,
  onTriggerSaveStatus,
  onRefreshDb
}: WallpaperShopProps) {
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{url: string, name: string, isVip?: boolean} | null>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const userBalance = Number(dbState?.saldo?.carteira ?? dbState?.eco?.coins ?? 0);
  const userVip = Number(dbState?.vip?.vip ?? 0);
  
  // INVENTÁRIOS UNIFICADOS
  const userBgInventory: string[] = useMemo(() => {
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

  const equippedBgId = dbState?.Perfil?.Equipados?.backgroundId || (BACKGROUNDS_CATALOG.find(b => b.url === dbState?.Perfil?.Equipados?.background)?.id) || 'default_bg';
  const equippedLayoutId = dbState?.Perfil?.Equipados?.layout || dbState?.Perfil?.Equipados?.layoutId || 'classic_azul';

  const dailyShopItems = useMemo<ShopCatalogItem[]>(() => {
    const today = new Date();
    const dateSeed = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    let hash = 0;
    for (let i = 0; i < dateSeed.length; i++) hash = Math.imul(31, hash) + dateSeed.charCodeAt(i) | 0;
    hash = Math.abs(hash);

    const allItems: ShopCatalogItem[] = [
      ...BACKGROUNDS_CATALOG.filter(b => !b.isDefault).map(b => ({ ...b, itemType: 'background' as const })),
      ...LAYOUTS_CATALOG.filter(l => !l.isDefault).map(l => ({ ...l, itemType: 'layout' as const }))
    ];

    const shuffled = [...allItems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      hash = (hash * 9301 + 49297) % 233280;
      const j = Math.floor((hash / 233280) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, DAILY_SHOP_LIMIT);
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = Math.max(0, midnight.getTime() - now.getTime());
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // AÇÕES (COMPRA E EQUIPA)
  const handleAction = async (type: 'background' | 'layout', item: any, action: 'buy' | 'equip') => {
    if (isProcessingId) return;

    if (action === 'buy') {
      if (item.vipOnly && userVip <= 0) {
        onTriggerSaveStatus('error', 'Item exclusivo para assinantes VIP!');
        return;
      }
      if (userBalance < item.price) {
        onTriggerSaveStatus('error', `Saldo insuficiente!`);
        return;
      }
    }

    setIsProcessingId(item.id);
    try {
      let activeCsrfToken = csrfToken || getCsrfToken();
      if (!activeCsrfToken) {
        try {
          const resAuth = await fetch('/api/auth/me', { credentials: 'include' });
          const dataAuth = await resAuth.json();
          if (dataAuth?.csrfToken) activeCsrfToken = dataAuth.csrfToken;
        } catch (err) {}
      }

      const endpoint = action === 'buy' ? `/api/user/shop/buy-${type}` : `/api/user/shop/equip`;
      
      const payload = action === 'buy' 
        ? { [`${type}Id`]: item.id } 
        : { type, id: item.id };

      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': activeCsrfToken || '',
          'csrf-token': activeCsrfToken || ''
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Erro ao processar a ação.`);

      const message = action === 'buy' ? 'adquirido com sucesso!' : 'equipado no perfil!';
      onTriggerSaveStatus('success', `Item ${message}`);
      if (onRefreshDb) await onRefreshDb();
    } catch (e: any) {
      onTriggerSaveStatus('error', e.message || 'Ocorreu um erro.');
    } finally {
      setIsProcessingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 backdrop-blur-md">
        <div className="flex items-center gap-2 text-white font-bold text-xl">
          <ShoppingBag size={22} className="text-zinc-400" /> Loja do Servidor
        </div>

        <div className="flex items-center gap-4 text-sm font-bold">
          <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg">
            <Clock size={16} /> {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg">
            <Coins size={16} /> R$ {userBalance.toLocaleString('pt-BR')}
          </div>
        </div>
      </div>

      {/* GRID DA LOJA UNIFICADA */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {dailyShopItems.map((item) => {
          const isBackground = item.itemType === 'background';
          const isOwned = isBackground
            ? userBgInventory.includes(item.id)
            : userLayoutInventory.includes(item.id);
          const isEquipped = isBackground
            ? (equippedBgId === item.id || dbState?.Perfil?.Equipados?.background === item.url || dbState?.Perfil?.Informações?.imagemperfil === item.url || dbState?.Perfil?.Informacoes?.imagemperfil === item.url)
            : (equippedLayoutId === item.id);
          const isProcessing = isProcessingId === item.id;
          const imageSrc = ('previewUrl' in item && item.previewUrl) ? item.previewUrl : item.url;

          return (
            <div
              key={item.id}
              className={`relative aspect-square sm:aspect-video rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ${
                isEquipped ? 'border-2 border-emerald-500 ring-4 ring-emerald-500/20' : isOwned ? 'border-2 border-zinc-800 opacity-80' : 'border-2 border-zinc-800 hover:border-zinc-500'
              }`}
            >
              <img src={imageSrc} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-80" />

              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
                {isEquipped ? (
                  <span className="bg-emerald-500 text-zinc-950 px-2 py-1 text-[10px] font-black rounded-lg flex items-center gap-1 shadow-lg"><CheckCircle2 size={12} /> EQUIPADO</span>
                ) : isOwned ? (
                  <span className="bg-zinc-950/80 backdrop-blur-md text-zinc-400 px-2 py-1 text-[10px] font-black rounded-lg flex items-center gap-1"><CheckCircle2 size={12} /> ADQUIRIDO</span>
                ) : (
                  <span className="bg-zinc-950/90 text-white px-2.5 py-1 text-xs font-bold rounded-lg border border-zinc-800 shadow-xl drop-shadow-md">R$ {item.price.toLocaleString('pt-BR')}</span>
                )}
                {item.vipOnly && <span className="bg-amber-500 text-zinc-950 px-2 py-0.5 text-[10px] font-black rounded-md flex items-center gap-1 w-max shadow"><Crown size={11} /> VIP</span>}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); setPreviewImage({ url: imageSrc, name: item.name, isVip: item.vipOnly }); }}
                className="absolute top-2 right-2 p-1.5 bg-zinc-950/60 hover:bg-zinc-950 text-white rounded-lg backdrop-blur-sm transition border border-zinc-700 z-20"
              >
                <Eye size={14} />
              </button>

              <div className="absolute bottom-2 left-2 right-2 z-10">
                <h3 className="font-bold text-xs text-white line-clamp-1 drop-shadow-md flex items-center gap-1.5">
                  {'themeColor' in item && item.themeColor && (
                    <span className="w-2 h-2 rounded-full block shadow-sm shrink-0" style={{ backgroundColor: item.themeColor }}></span>
                  )}
                  {item.name}
                </h3>
                {item.category && <p className="text-[10px] text-zinc-300 line-clamp-1">{item.category}</p>}
              </div>

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm z-10">
                {isEquipped ? (
                  <span className="px-4 py-2 bg-zinc-800 text-zinc-400 font-bold rounded-xl text-sm cursor-default">Ativo</span>
                ) : isOwned ? (
                  <button onClick={() => handleAction(item.itemType, item, 'equip')} disabled={isProcessing} className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg transition cursor-pointer">
                    {isProcessing ? <RotateCcw size={16} className="animate-spin" /> : 'Equipar'}
                  </button>
                ) : (
                  <button onClick={() => handleAction(item.itemType, item, 'buy')} disabled={isProcessing} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg transition cursor-pointer">
                    {isProcessing ? <RotateCcw size={16} className="animate-spin" /> : <><Coins size={16} /> Comprar</>}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE PREVIEW UNIFICADO */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl space-y-4 p-5" onClick={e => e.stopPropagation()}>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
              <img src={previewImage.url} alt={previewImage.name} className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {previewImage.name} 
                  {previewImage.isVip && <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold">VIP</span>}
                </h2>
              </div>
              <button onClick={() => setPreviewImage(null)} className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-bold rounded-xl transition cursor-pointer">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}