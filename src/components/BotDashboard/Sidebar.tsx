import React from 'react';
import { Bot, Server, ChevronDown, Check, LogOut, MessageSquare, Shield, Key, Octagon, History, AlertCircle, Activity, Eye, Sparkles, Bell, Terminal, ShieldAlert } from 'lucide-react';
import type { DiscordServer } from '../../types';

interface SidebarProps {
  servers: DiscordServer[];
  selectedServer: DiscordServer | null;
  onSelectServer: (server: DiscordServer) => void;
  activeSection: string;
  onChangeSection: (section: string) => void;
  user: { id: string; username: string; avatar: string } | null;
  onLogout: () => void;
  botAvatar?: string;
  botName?: string;
}

export default function Sidebar({
  servers,
  selectedServer,
  onSelectServer,
  activeSection,
  onChangeSection,
  user,
  onLogout,
  botAvatar,
  botName
}: SidebarProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // 1. Novos menus organizados por categorias!
  const configItems = [
    { id: 'overview', label: 'Visão Geral', icon: Eye, color: 'text-emerald-400' },
    { id: 'welcome', label: 'Entrada & Saída', icon: MessageSquare, color: 'text-purple-400' },
    { id: 'autorole', label: 'Cargo Automático', icon: Shield, color: 'text-amber-400' },
    // { id: 'permissions', label: 'Permissões de Cargos', icon: Key, color: 'text-rose-400' },
    { id: 'commands', label: 'Comandos do Bot', icon: Terminal, color: 'text-blue-400' }
  ];

  const moderationItems = [
    { id: 'invite_blocker', label: 'Bloqueador de Convites', icon: Octagon, color: 'text-red-400' },
    { id: 'punishment_logs', label: 'Logs de Punições', icon: History, color: 'text-blue-400' },
    // { id: 'warn_punishments', label: 'Punições de Avisos', icon: AlertCircle, color: 'text-amber-400' },
    { id: 'event_registry', label: 'Registro de Eventos', icon: Activity, color: 'text-teal-400' },
    // { id: 'reminders', label: 'Segurança & Avisos', icon: Bell, color: 'text-yellow-400' },
    { id: 'audit_logs', label: 'Registro de Auditoria', icon: ShieldAlert, color: 'text-amber-400' },
    // { id: 'settings', label: 'settings tab', icon: ShieldAlert, color: 'text-amber-400' },
  ];

  // const economyItems = [
  // ];

  const getInitials = (name: string) => {
    if (!name) return 'SV';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const sortedServers = [...servers].sort((a, b) => {
    if (a.botActive === b.botActive) return 0;
    return a.botActive ? -1 : 1;
  });

  // Função auxiliar para renderizar os botões
  const renderNavButtons = (items: any[]) => {
    return items.map((item) => {
      const IconComponent = item.icon;
      const isActive = activeSection === item.id;
      return (
        <button
          key={item.id}
          onClick={() => onChangeSection(item.id)}
          className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-medium transition cursor-pointer ${
            isActive
              ? 'bg-purple-600/10 text-purple-400 border border-purple-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <IconComponent size={16} className={`${isActive ? 'text-purple-400' : item.color}`} />
          <span>{item.label}</span>
        </button>
      );
    });
  };

  return (
    <aside className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 select-none">
     <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-900 shrink-0">
        <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
          {botAvatar ? (
            <img src={botAvatar} alt="Bot" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-5 h-5 text-zinc-500 fill-current" viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.45-5c.87-.64,1.72-1.31,2.53-2a75.46,75.46,0,0,0,72.78,0c.81.69,1.66,1.36,2.53,2a68.43,68.43,0,0,1-10.45,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.93,50.54,124,27.6,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
            </svg>
          )}
        </div>

        <span className="font-extrabold text-white tracking-wide text-sm truncate">
          {botName ? botName.toUpperCase() : "SISTINE"} DASHBOARD
        </span>
      </div> 

      {/* Dynamic Guild Selector */}
      <div className="p-4 border-b border-zinc-800 relative">
        <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block mb-1.5 font-semibold">
          Gerenciar Servidor
        </label>
        
        {selectedServer ? (
          <div>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between p-2.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 rounded-xl transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {selectedServer.icon ? (
                  <img src={selectedServer.icon} alt={selectedServer.name} className="w-7 h-7 rounded-full object-cover shrink-0 bg-zinc-800" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {getInitials(selectedServer.name)}
                  </div>
                )}
                
                <div className="text-left overflow-hidden">
                  <p className="text-xs font-bold text-white truncate leading-tight">{selectedServer.name}</p>
                  <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
                    <span>👥 {selectedServer.members} membros</span>
                    {selectedServer.premium && (
                      <span className="text-[9px] text-purple-400 font-bold font-sans">★ PREMIUM</span>
                    )}
                  </p>
                </div>
              </div>
              <ChevronDown size={14} className={`text-zinc-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute left-4 right-4 mt-1 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-zinc-900 max-h-64 overflow-y-auto custom-scrollbar">
                {sortedServers.map((guild) => (
                  <button
                    key={guild.id}
                    onClick={() => {
                      onSelectServer(guild);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 hover:bg-zinc-900 transition flex items-center justify-between cursor-pointer ${
                      selectedServer.id === guild.id ? 'bg-zinc-900/50' : ''
                    } ${!guild.botActive ? 'opacity-50 hover:opacity-100' : ''}`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {guild.icon ? (
                        <img src={guild.icon} alt={guild.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                          {getInitials(guild.name)}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-white truncate">{guild.name}</p>
                        <p className="text-[9px] text-zinc-500">{guild.botActive ? `${guild.members} membros` : 'Bot ausente'}</p>
                      </div>
                    </div>
                    {selectedServer.id === guild.id && <Check size={12} className="text-purple-400 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-zinc-950 border border-dashed border-zinc-800 rounded-xl text-center">
            <Server size={18} className="text-zinc-600 mx-auto mb-1" />
            <span className="text-xs text-zinc-500">Nenhum servidor ativo</span>
          </div>
        )}
      </div>

      {/* Navigation Options */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
        
        {/* CONFIGURAÇÃO SECTION */}
        <div className="space-y-1">
          <span className="px-3 text-[9px] uppercase tracking-wider font-mono text-zinc-500 font-semibold block mb-2">
            Configurações Gerais
          </span>
          {renderNavButtons(configItems)}
        </div>

        {/* ECONOMIA SECTION */}
        {/* <div className="space-y-1">
          <span className="px-3 text-[9px] uppercase tracking-wider font-mono text-zinc-500 font-semibold block mb-2">
            Economia & Diversão
          </span>
          {renderNavButtons(economyItems)}
        </div> */}

        {/* MODERAÇÃO SECTION */}
        <div className="space-y-1">
          <span className="px-3 text-[9px] uppercase tracking-wider font-mono text-zinc-500 font-semibold block mb-2">
            Moderação & Proteção
          </span>
          {renderNavButtons(moderationItems)}
        </div>

      </nav>

      {/* Footer Admin Info */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/20 text-xs text-zinc-400 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img
            src={user?.avatar || "https://i.postimg.cc/9QYx00L8/avatar.png"}
            alt={user?.username || "Guest"}
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-zinc-800 bg-zinc-900"
          />
          <div className="overflow-hidden leading-tight">
            <p className="font-bold text-white truncate text-xs">{user?.username || 'Usuário'}</p>
            <p className="text-[9px] text-zinc-500 font-mono truncate">ID: {user?.id || '...'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="p-2 hover:bg-zinc-850 hover:text-rose-400 rounded-lg text-zinc-500 transition cursor-pointer shrink-0"
          title="Sair do Dashboard"
        >
          <LogOut size={15} />
        </button>
      </div>

    </aside>
  );
}