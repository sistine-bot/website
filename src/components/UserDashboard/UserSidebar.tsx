import React from 'react';
import { User, Crown, Coins, Image, Award, BookOpen, Server, LogOut, RefreshCw, Wallet } from 'lucide-react';

interface UserSidebarProps {
  user: { id: string; username: string; avatar: string, global_name?: string; } | null;
  userDb?: any;
  activeSection: string;
  setActiveSection: (section: string) => void;
  onLogout: () => void;
  onRefreshUserDb?: () => void;
  isUserDbLoading?: boolean;
}

export default function UserSidebar({ user, userDb, activeSection, setActiveSection, onLogout, onRefreshUserDb, isUserDbLoading = false}: UserSidebarProps) {
  const getAvatarUrl = () => {
    if (!user) return 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    // 1. Se o usuário tiver um avatar customizado (Suporta PNG e GIF)
    if (user.avatar && user.avatar !== 'null') {
      const isGif = user.avatar.startsWith('a_');
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${isGif ? 'gif' : 'png'}?size=128`;
    }
    
    // 2. Se o usuário NÃO tiver avatar, calcula a cor padrão oficial do Discord
    try {
      // Usa BigInt para não perder precisão com o ID gigante do Discord
      const defaultIndex = user.id ? Number((BigInt(user.id) >> 22n) % 6n) : 0;
      return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
    } catch {
      return 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
  };

  const menuItems = [
    { id: 'profile_config', label: 'Editar /perfil', icon: User, color: 'text-purple-400' },
    { id: 'wallpaper_shop', label: 'Loja de Wallpapers', icon: Image, color: 'text-blue-400' },
    { id: 'badges', label: 'Minhas Insígnias', icon: Award, color: 'text-amber-400' },
    { id: 'vip_shop', label: 'Comprar VIP', icon: Crown, color: 'text-yellow-400' },
    { id: 'coin_shop', label: 'Comprar Moedas', icon: Coins, color: 'text-emerald-400' },
    { id: 'guidelines', label: 'Diretrizes de Uso', icon: BookOpen, color: 'text-rose-400' },
  ];

  const carteira = userDb?.saldo?.carteira || 0;
  const banco = userDb?.saldo?.banco || 0;
  const isVip = (userDb?.vip?.vip || 0) > 0;

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between h-screen sticky top-0 z-30 shrink-0">
      
      {/* CABEÇALHO DO USUÁRIO */}
      <div className="p-5 border-b border-zinc-900">
        <div className="flex flex-col items-center text-center gap-3">
          
          <div className="relative">
            <img 
              src={getAvatarUrl()} 
              alt="User Avatar" 
              onError={(e) => {
                // Se o link do Discord falhar por qualquer motivo, força uma imagem padrão
                (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
              }}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/30 shadow-lg shadow-purple-500/20"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-zinc-950 rounded-full"></div>
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-white truncate max-w-[180px]">
              {user?.global_name || user?.username || 'Usuário'}
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono block truncate mt-0.5">
              @{user?.username || 'usuario'}
            </span>
          </div>
        </div>

        {/* RESUMO DE SALDO RÁPIDO & SINCRONIZAÇÃO */}
        <div className="mt-4 p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={14} className="text-emerald-400 shrink-0" />
            <div className="text-left">
              <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Saldo Total</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                R$ {(Number(carteira) + Number(banco)).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          {onRefreshUserDb && (
            <button
              onClick={onRefreshUserDb}
              disabled={isUserDbLoading}
              className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition cursor-pointer"
              title="Sincronizar com o Banco de Dados"
            >
              <RefreshCw size={12} className={isUserDbLoading ? 'animate-spin text-purple-400' : ''} />
            </button>
          )}
        </div>

        {/* BOTÃO GERENCIAR SERVIDORES */}
        <button
          onClick={() => setActiveSection('servers')}
          className={`w-full mt-3 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSection === 'servers'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/20'
          }`}
        >
          <Server size={14} />
          <span>Gerenciar Servidores</span>
        </button>
      </div>

      {/* MENUS DE NAVEGAÇÃO DA CONTA */}
      <div className="p-4 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 mb-3 block">
          Painel da Conta
        </span>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isActive ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-white' : item.color} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* LOGOUT */}
      <div className="p-4 border-t border-zinc-900">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-zinc-900/60 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 rounded-xl text-xs font-semibold transition cursor-pointer border border-zinc-800/80"
        >
          <LogOut size={14} />
          <span>Desconectar Conta</span>
        </button>
      </div>
    </aside>
  );
}