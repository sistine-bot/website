import React from 'react';
import { 
  User, 
  Crown, 
  Coins, 
  Image, 
  Award, 
  BookOpen, 
  Server, 
  LogOut, 
  RefreshCw, 
  Wallet,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const DEFAULT_BANNER = '/src/utils/assets/banner.png';

interface UserSidebarProps {
  user: { id: string; username: string; avatar: string; global_name?: string } | null;
  userDb?: any;
  activeSection: string;
  setActiveSection: (section: string) => void;
  onLogout: () => void;
  onRefreshUserDb?: () => void;
  isUserDbLoading?: boolean;
  botAvatar?: string;
  botName?: string;
}

export default function UserSidebar({
  user,
  userDb,
  activeSection,
  setActiveSection,
  onLogout,
  onRefreshUserDb,
  isUserDbLoading = false,
  botAvatar,
  botName
}: UserSidebarProps) {
  const getAvatarUrl = () => {
    if (!user) return 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    // 1. Se já for uma URL completa
    if (typeof user.avatar === 'string' && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://'))) {
      return user.avatar;
    }
    
    // 2. Se o usuário tiver um hash customizado do Discord
    if (user.avatar && user.avatar !== 'null' && user.avatar !== 'undefined') {
      const isGif = user.avatar.startsWith('a_');
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${isGif ? 'gif' : 'png'}?size=128`;
    }
    
    // 3. Fallback oficial do Discord
    try {
      const defaultIndex = user.id ? Number((BigInt(user.id) >> 22n) % 6n) : 0;
      return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
    } catch {
      return 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
  };

  const carteira = userDb?.saldo?.carteira || 0;
  const banco = userDb?.saldo?.banco || 0;

  const vipData = userDb?.vip || {};
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
  const vipTierName = vipLevel >= 2 ? 'VIP Ouro' : 'VIP Prata';

  // Menus organizados em categorias estéticas correspondentes ao Sidebar do servidor
  const profileItems = [
    { id: 'profile_config', label: 'Editar /perfil', icon: User, color: 'text-purple-400' },
    { id: 'wallpaper_shop', label: 'Loja de Wallpapers', icon: Image, color: 'text-blue-400' },
    { id: 'badges', label: 'Minhas Insígnias', icon: Award, color: 'text-amber-400' },
  ];

  const storeItems = [
    { 
      id: 'vip_shop', 
      label: isVipActive ? 'Benefícios VIP' : 'Comprar VIP', 
      icon: Crown, 
      color: isVipActive ? 'text-amber-400' : 'text-yellow-400',
      badge: isVipActive ? (vipLevel >= 2 ? 'Ouro' : 'Prata') : null
    },
    { id: 'coin_shop', label: 'Comprar Moedas', icon: Coins, color: 'text-emerald-400' },
    { id: 'guidelines', label: 'Diretrizes de Uso', icon: BookOpen, color: 'text-rose-400' },
  ];

  const renderNavButtons = (items: any[]) => {
    return items.map((item) => {
      const IconComponent = item.icon;
      const isActive = activeSection === item.id;
      return (
        <button
          key={item.id}
          onClick={() => setActiveSection(item.id)}
          className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-medium transition cursor-pointer ${
            isActive
              ? 'bg-purple-600/10 text-purple-400 border border-purple-500/15 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <IconComponent size={16} className={isActive ? 'text-purple-400' : item.color} />
            <span className="truncate">{item.label}</span>
          </div>

          {item.badge && (
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {item.badge}
            </span>
          )}
        </button>
      );
    });
  };

  return (
    <aside className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between h-screen sticky top-0 z-30 shrink-0 select-none">
      
      {/* TOPO: LOGO DA SISTINE PARA VOLTAR AO INÍCIO DO DASHBOARD */}
      <div className="h-16 flex items-center px-5 border-b border-zinc-800 shrink-0 bg-zinc-900">
        <button
          onClick={() => setActiveSection('servers')}
          className="w-full flex items-center gap-3 hover:opacity-90 transition group cursor-pointer text-left"
          title="Voltar para o início do Dashboard (Servidores)"
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/70 flex items-center justify-center shadow-lg overflow-hidden shrink-0 group-hover:scale-105 group-hover:border-purple-500/50 transition-all">
            <img 
              src={botAvatar || DEFAULT_BANNER} 
              alt="Sistine Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_BANNER;
              }}
            />
          </div>

          <div className="overflow-hidden leading-tight flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white tracking-wide text-sm truncate group-hover:text-purple-400 transition-colors">
                {botName ? botName.toUpperCase() : "SISTINE"}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20 font-bold">
                USER
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono block truncate mt-0.5">
              PAINEL DA CONTA
            </span>
          </div>

          <ChevronRight size={14} className="text-zinc-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>
      </div>

      {/* ÁREA DE PERFIL & SALDO */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/40 relative space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold block">
            Conta Conectada
          </label>
          {isVipActive && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
              vipLevel >= 2
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-zinc-300/15 text-zinc-200 border-zinc-400/30'
            }`}>
              <Crown size={10} className={vipLevel >= 2 ? 'text-amber-400' : 'text-zinc-300'} />
              {vipTierName}
            </span>
          )}
        </div>

        {/* Card do Usuário com Avatar Oficial */}
        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-3">
          <div className="relative shrink-0">
            <img 
              src={getAvatarUrl()} 
              alt={user?.username || 'Avatar'}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('embed/avatars')) {
                  target.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                }
              }}
              className="w-10 h-10 rounded-full object-cover border border-zinc-800 bg-zinc-900 shadow-sm"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-950 rounded-full"></div>
          </div>

          <div className="overflow-hidden leading-tight flex-1">
            <h4 className="font-bold text-white text-xs truncate">
              {user?.global_name || user?.username || 'Usuário'}
            </h4>
            <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">
              @{user?.username || 'usuario'}
            </p>
          </div>
        </div>

        {/* Resumo de Saldo & Botão de Sincronização */}
        <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <Wallet size={13} className="text-emerald-400 shrink-0" />
            <div className="leading-none">
              <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Saldo Total</span>
              <span className="text-xs font-mono font-bold text-emerald-400 block mt-0.5">
                R$ {(Number(carteira) + Number(banco)).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          {onRefreshUserDb && (
            <button
              onClick={onRefreshUserDb}
              disabled={isUserDbLoading}
              className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition cursor-pointer shrink-0"
              title="Sincronizar com o Banco de Dados"
            >
              <RefreshCw size={12} className={isUserDbLoading ? 'animate-spin text-purple-400' : ''} />
            </button>
          )}
        </div>

        {/* Botão Gerenciar Servidores (Voltar ao Início) */}
        <button
          onClick={() => setActiveSection('servers')}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSection === 'servers'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/20'
          }`}
        >
          <Server size={14} />
          <span>Gerenciar Servidores</span>
        </button>
      </div>

      {/* MENUS DE NAVEGAÇÃO ORGANIZADOS POR SEÇÃO */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
        
        {/* SEÇÃO: CONFIGURAÇÃO DO PERFIL */}
        <div className="space-y-1">
          <span className="px-3 text-[9px] uppercase tracking-wider font-mono text-zinc-500 font-semibold block mb-2">
            Personalização do Perfil
          </span>
          {renderNavButtons(profileItems)}
        </div>

        {/* SEÇÃO: LOJAS & VANTAGENS */}
        <div className="space-y-1">
          <span className="px-3 text-[9px] uppercase tracking-wider font-mono text-zinc-500 font-semibold block mb-2">
            Lojas & Benefícios
          </span>
          {renderNavButtons(storeItems)}
        </div>

      </nav>

      {/* FOOTER DO USUÁRIO & LOGOUT */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/20 text-xs text-zinc-400 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img
            src={getAvatarUrl()}
            alt={user?.username || "Guest"}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('embed/avatars')) {
                target.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
              }
            }}
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-zinc-800 bg-zinc-900"
          />
          <div className="overflow-hidden leading-tight">
            <p className="font-bold text-white truncate text-xs">{user?.username || 'Usuário'}</p>
            <p className="text-[9px] text-zinc-500 font-mono truncate">ID: {user?.id || '...'}</p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="p-2 hover:bg-zinc-800 hover:text-rose-400 rounded-lg text-zinc-500 transition cursor-pointer shrink-0"
          title="Desconectar Conta"
        >
          <LogOut size={15} />
        </button>
      </div>

    </aside>
  );
}