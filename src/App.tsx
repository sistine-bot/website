import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, AlertCircle, CheckCircle, Bot, ArrowLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import type { DiscordServer, BotCommand } from './types';

// Paineis de Configuração do Bot (Servidor)
import Sidebar from './components/BotDashboard/Sidebar';
import WelcomeTab from './components/BotDashboard/WelcomeTab';
import AutoroleTab from './components/BotDashboard/AutoroleTab';
import PermissionsTab from './components/BotDashboard/PermissionsTab';
import InviteBlockerTab from './components/BotDashboard/InviteBlockerTab';
import PunishmentLogsTab from './components/BotDashboard/PunishmentLogsTab';
import WarnPunishmentsTab from './components/BotDashboard/WarnPunishmentsTab';
import EventRegistryTab from './components/BotDashboard/EventRegistryTab';
import OverviewTab from './components/BotDashboard/OverviewTab';
import CommandsTab from './components/BotDashboard/CommandsTab';
import AuditLogsTab from './components/BotDashboard/AuditLogsTab';

// Paineis de Configuração do Usuário
import UserSidebar from './components/UserDashboard/UserSidebar';
import UserSettingsTabs from './components/UserDashboard/UserSettingsTabs';
import ServerSelectionTab from './components/UserDashboard/ServerSelectionTab';

type AppView = 'landing' | 'login' | 'user_dashboard' | 'dashboard';

export default function App() {
  const [appView, setAppView] = useState<AppView>('landing');
  const [userActiveSection, setUserActiveSection] = useState<string>('servers');
  const [activeSection, setActiveSection] = useState<string>('overview');
  
  const [status, setStatus] = useState({
    status: "loading",
    discordBot: "offline",
    firebase: "disconnected",
    loadedPrefix: 0,
    loadedSlash: 0,
    uptime: 0,
    botName: "",
    botAvatar: ""
  });

  const [user, setUser] = useState<{ id: string; username: string; avatar: string; global_name?: string } | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  const [servers, setServers] = useState<DiscordServer[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const [selectedServer, setSelectedServer] = useState<DiscordServer | null>(null);
  const [commands, setCommands] = useState<BotCommand[]>([]);
  
  const [database, setDatabase] = useState<any>(null);
  const [userDatabase, setUserDatabase] = useState<any>(null);
  const [isUserDbLoading, setIsUserDbLoading] = useState<boolean>(false);
  const [hasBot, setHasBot] = useState<boolean>(true);
  const [isServerLoading, setIsServerLoading] = useState<boolean>(false);
  
  const [config, setConfig] = useState({ TOKEN: '', CLIENT_ID: '', SUPPORT_GUILD: '', SUPPORT_LINK: '' });
  const [toast, setToast] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const triggerToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => { setToast({ type: null, message: '' }); }, 3500);
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
        setCsrfToken(data.csrfToken);
        await fetchStatus();
        await fetchServers();
        await fetchUserDatabase();
      } else {
        setUser(null);
      }
    } catch (e) { setUser(null); } 
    finally { setAuthChecking(false); }
  };

  useEffect(() => {
    fetchStatus();
    checkAuth();
    const retryAvatar = setInterval(() => {
      setStatus(current => {
        if (!current.botAvatar || current.botAvatar === "") fetchStatus();
        return current;
      });
    }, 3000);
    return () => clearInterval(retryAvatar);
  }, []);

  const handleEnterDashboardClick = () => {
    if (user) {
      setAppView('user_dashboard');
      setUserActiveSection('servers');
    } else {
      setAppView('login');
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/url');
      const data = await res.json();
      if (data.url) {
        const width = 550, height = 800;
        const left = window.screen.width / 2 - width / 2, top = window.screen.height / 2 - height / 2;
        const popup = window.open(data.url, 'Discord Auth', `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`);
        if (!popup) return triggerToast('error', 'Permita popups para este site.');

        const messageListener = async (event: MessageEvent) => {
          if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
            setAuthChecking(true);
            await checkAuth();
            setAppView('user_dashboard');
            setUserActiveSection('servers');
            triggerToast('success', 'Autenticado com sucesso via Discord!');
            window.removeEventListener('message', messageListener);
          }
        };
        window.addEventListener('message', messageListener);
      } else {
        triggerToast('error', 'Erro ao obter URL de autenticação.');
      }
    } catch (e: any) { triggerToast('error', e.message || 'Falha ao iniciar login.'); }
  };

  const handleDevLogin = async () => {
    try {
      setAuthChecking(true);
      const res = await fetch('/api/auth/dev-login', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await checkAuth();
        setAppView('user_dashboard');
        setUserActiveSection('servers');
        triggerToast('success', 'Modo de testes ativado!');
      } else {
        triggerToast('error', 'Falha ao ativar login de testes.');
        setAuthChecking(false);
      }
    } catch (e: any) {
      triggerToast('error', e.message);
      setAuthChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setServers([]);
      setSelectedServer(null);
      setAppView('landing');
      triggerToast('success', 'Sessão encerrada.');
    } catch (e) {}
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(prev => ({ ...prev, ...data }));
    } catch (e) {}
  };

  const fetchServers = async () => {
    try {
      const res = await fetch('/api/servers');
      const data = await res.json();
      setServers(data);
    } catch (e) {}
  };

  const handleSelectServer = async (srv: DiscordServer) => {
    setAppView('dashboard');
    setIsServerLoading(true);
    setSelectedServer(srv);
    triggerToast('success', `Acessando: ${srv.name}`);
    
    await fetchDatabase(srv.id);
    await fetchCommands(srv.id);
    await fetchConfig(srv.id);
    await fetchChannels(srv.id);
    await fetchRoles(srv.id);
    await fetchMembers(srv.id);
    
    setIsServerLoading(false);
  };

  const fetchChannels = async (serverIdOverride?: string) => {
    const targetServerId = serverIdOverride || selectedServer?.id;
    if (!targetServerId) return;
    try {
      const res = await fetch('/api/channels', { headers: { 'x-selected-server': targetServerId } });
      const data = await res.json();
      if (!res.ok || data.error) { setChannels([]); setHasBot(false); return; }
      setChannels(data); setHasBot(true);
    } catch (e) { setChannels([]); setHasBot(false); }
  };
  
  const fetchRoles = async (serverIdOverride?: string) => {
    const targetServerId = serverIdOverride || selectedServer?.id;
    if (!targetServerId) return;
    try {
      const res = await fetch('/api/roles', { headers: { 'x-selected-server': targetServerId } });
      const data = await res.json();
      if (!res.ok || data.error) return setRoles([]);
      setRoles(data);
    } catch (e) { setRoles([]); }
  };

  const fetchMembers = async (serverIdOverride?: string) => {
    const targetServerId = serverIdOverride || selectedServer?.id;
    if (!targetServerId) return;
    try {
      const res = await fetch('/api/members', { headers: { 'x-selected-server': targetServerId } });
      const data = await res.json();
      if (!res.ok || data.error) return setMembers([]);
      setMembers(data);
    } catch (e) { setMembers([]); }
  };

  const fetchCommands = async (serverIdOverride?: string) => {
    const targetServerId = serverIdOverride || selectedServer?.id;
    if (!targetServerId) return;
    try {
      const res = await fetch('/api/commands', { headers: { 'x-selected-server': targetServerId } });
      const data = await res.json();
      setCommands(data);
    } catch (e) {}
  };

  const fetchUserDatabase = async () => {
    setIsUserDbLoading(true);
    try {
      const res = await fetch('/api/user/database');
      if (!res.ok) throw new Error('Não autorizado');
      const data = await res.json();
      setUserDatabase(data);
      if (data.flagsArray && user) {
        setUser(prev => prev ? { ...prev, flagsArray: data.flagsArray } : prev);
      }
    } catch (e: any) {
      console.warn("Erro ao ler banco de dados do usuário:", e);
    } finally {
      setIsUserDbLoading(false);
    }
  };

  const fetchDatabase = async (serverIdOverride?: string) => {
    const targetServerId = serverIdOverride || selectedServer?.id;
    if (!targetServerId) return;
    try {
      const res = await fetch('/api/database', { headers: { 'x-selected-server': targetServerId } });
      const data = await res.json();
      if (!res.ok || data.error) {
        if (res.status === 403) {
          triggerToast('error', data.error || "Permissões revogadas neste servidor.");
          setSelectedServer(null);
          setAppView('user_dashboard');
          setUserActiveSection('servers');
          fetchServers();
          return;
        }
        throw new Error(data.error || 'Não autorizado');
      }
      setDatabase(data);
    } catch (e: any) { 
      console.warn("Erro ao ler banco de dados:", e.message); 
    }
  };

  const fetchConfig = async (serverIdOverride?: string) => {
    const targetServerId = serverIdOverride || selectedServer?.id;
    if (!targetServerId) return;
    try {
      const res = await fetch('/api/config', { headers: { 'x-selected-server': targetServerId } });
      const data = await res.json();
      if (data.config) setConfig(data.config);
    } catch (e) {}
  };

  const handleUpdateDbKey = async (key: string, value: any) => {
    if (!selectedServer) return;
    try {
      const res = await fetch('/api/database/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken, 'x-selected-server': selectedServer.id },
        body: JSON.stringify({ key, value })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        if (res.status === 403) {
          triggerToast('error', data.error || "Suas permissões foram revogadas no Discord.");
          setSelectedServer(null);
          setAppView('user_dashboard');
          setUserActiveSection('servers');
          fetchServers();
          throw new Error(data.error || "Permissão negada");
        }
        throw new Error(data.error || "Erro ao salvar dados.");
      }
      if (data.success) setDatabase(data.store);
    } catch (e: any) { throw e; }
  };

  const handleUpdateUserDbKey = async (key: string, value: any) => {
    try {
      const res = await fetch('/api/user/database/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-csrf-token': csrfToken 
        },
        body: JSON.stringify({ key, value })
      });
      const data = await res.json();
      if (data.success && data.userDb) {
        setUserDatabase(data.userDb);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (e: any) { 
      throw e; 
    }
  };

  if (authChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-purple-500" size={32} />
          <p className="text-sm text-zinc-400 font-mono">Carregando aplicação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      <AnimatePresence>
        {toast.type && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl ${
              toast.type === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30' : 'bg-rose-950/90 text-rose-300 border-rose-500/30'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TELA 1: LANDING PAGE */}
      {appView === 'landing' && (
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f12_1px,transparent_1px),linear-gradient(to_bottom,#0f0f12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70"></div>
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 text-center max-w-2xl px-6"
          >
            <div className="w-24 h-24 bg-zinc-800 rounded-3xl mx-auto flex items-center justify-center text-white mb-6 shadow-xl overflow-hidden shadow-purple-500/20 border border-zinc-800">
              {status.botAvatar ? (
                <img src={status.botAvatar} alt="Bot" className="w-full h-full object-cover rounded-3xl" />
              ) : (
                <Bot size={48} className="text-zinc-500" />
              )}
            </div>
            
            <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4 font-display">
              {status.botName || 'Sistine Bot'}
            </h1>
            <p className="text-lg text-zinc-400 mb-10 leading-relaxed max-w-lg mx-auto">
              Gerencie economia, proteja seu servidor com automoderação e construa comunidades engajadas. Tudo em um painel simples e poderoso.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={`https://discord.com/oauth2/authorize?client_id=${config.CLIENT_ID || '123'}&permissions=8&scope=bot`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 border border-zinc-700"
              >
                <Bot size={18} />
                Adicionar ao Servidor
              </a>
              <button
                onClick={handleEnterDashboardClick}
                className="w-full sm:w-auto bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-lg shadow-[#5865F2]/20 flex items-center justify-center gap-2"
              >
                <LayoutDashboard size={18} />
                Entrar no Painel
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* TELA 2: LOGIN */}
      {appView === 'login' && (
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f12_1px,transparent_1px),linear-gradient(to_bottom,#0f0f12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative max-w-md w-full mx-4 p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <button onClick={() => setAppView('landing')} className="absolute left-6 top-6 text-zinc-500 hover:text-white transition">
                <ArrowLeft size={20} />
              </button>
            </div>
            
            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2 mt-4">Autenticação Necessária</h2>
            <p className="text-sm text-zinc-400 mb-8 max-w-xs mx-auto leading-relaxed">
              Faça login com sua conta do Discord para gerenciar os servidores.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogin}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#5865F2]/20 text-sm"
              >
                Entrar com Discord
              </button>
              <button
                onClick={handleDevLogin}
                className="w-full bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white font-medium py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 border border-zinc-700/50 text-xs"
              >
                Modo Demonstração (Dev Bypass)
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* TELA 3: PAINEL DO USUÁRIO & SERVIDORES */}
      {appView === 'user_dashboard' && (
        <div className="flex h-screen w-full bg-zinc-950 text-white overflow-hidden">
          
          <UserSidebar
            user={user}
            userDb={userDatabase}
            activeSection={userActiveSection}
            setActiveSection={(sec) => {
              setUserActiveSection(sec);
              if (sec !== 'servers') {
                fetchUserDatabase();
              }
            }}
            onRefreshUserDb={fetchUserDatabase}
            isUserDbLoading={isUserDbLoading}
            onLogout={handleLogout}
          />
          
          <main className="flex-1 overflow-y-auto relative">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f12_1px,transparent_1px),linear-gradient(to_bottom,#0f0f12_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none"></div>
            
            <div className="relative z-10 w-full max-w-6xl mx-auto p-8 md:p-12">
              {userActiveSection === 'servers' ? (
                <ServerSelectionTab 
                  servers={servers}
                  onSelectServer={handleSelectServer}
                  onTriggerToast={triggerToast}
                />
              ) : (
                <UserSettingsTabs
                  user={user}
                  activeSection={userActiveSection}
                  userDb={userDatabase}
                  csrfToken={csrfToken}
                  onUpdateUserDb={handleUpdateUserDbKey}
                  onRefreshUserDb={fetchUserDatabase}
                  onTriggerSaveStatus={triggerToast}
                  isLoadingUserDb={isUserDbLoading}
                />
              )}
            </div>
          </main>
        </div>
      )}

      {/* TELA 4: DASHBOARD DO SERVIDOR (MÓDULOS) */}
      {appView === 'dashboard' && (
        <>
          <Sidebar
            servers={servers}
            selectedServer={selectedServer}
            onSelectServer={handleSelectServer}
            activeSection={activeSection}
            onChangeSection={async (sec) => {
              setActiveSection(sec);
              if (selectedServer) {
                try {
                  const res = await fetch('/api/check-permissions', { headers: { 'x-selected-server': selectedServer.id } });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    triggerToast('error', data.error || 'Suas permissões neste servidor foram revogadas.');
                    setSelectedServer(null);
                    setAppView('user_dashboard');
                    setUserActiveSection('servers');
                    fetchServers();
                  }
                } catch (e) {}
              }
            }}
            user={user}
            onLogout={handleLogout}
            botAvatar={status.botAvatar}
            botName={status.botName}
          />

          <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-hidden">
            
            <header className="px-6 py-4 bg-zinc-900/40 border-b border-zinc-900 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { setAppView('user_dashboard'); setUserActiveSection('servers'); fetchUserDatabase(); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-lg"
                >
                  <ArrowLeft size={14} /> Trocar Servidor
                </button>
                <div className="w-px h-5 bg-zinc-800"></div>
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-bold">PAINEL DE CONTROLE DO SERVIDOR</span>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection + (selectedServer?.id || '')}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  {selectedServer && (
                    hasBot ? (
                      isServerLoading ? (
                        <div className="flex h-full flex-col items-center justify-center text-zinc-500 gap-4">
                          <RefreshCw className="animate-spin text-purple-500" size={36} />
                          <span className="text-sm font-medium animate-pulse">Sincronizando banco de dados...</span>
                        </div>
                      ) : (
                      <>
                        {activeSection === 'overview' && (
                          <OverviewTab dbState={database} channels={channels} serverId={selectedServer.id} csrfToken={csrfToken} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} botAvatar={status.botAvatar} botName={status.botName} />
                        )}
                        {activeSection === 'welcome' && (
                          <WelcomeTab dbState={database} channels={channels} serverId={selectedServer.id} csrfToken={csrfToken} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} botAvatar={status.botAvatar} botName={status.botName} />
                        )}
                        {activeSection === 'autorole' && (
                          <AutoroleTab dbState={database} discordRoles={roles} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} />
                        )}
                        {activeSection === 'permissions' && (
                          <PermissionsTab dbState={database} discordRoles={roles} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} serverId={selectedServer.id} csrfToken={csrfToken} />
                        )}
                        {activeSection === 'invite_blocker' && (
                          <InviteBlockerTab dbState={database} discordChannels={channels} discordRoles={roles} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} botAvatar={status.botAvatar} botName={status.botName} />
                        )}
                        {activeSection === 'punishment_logs' && (
                          <PunishmentLogsTab dbState={database} discordMembers={members} discordChannels={channels} serverId={selectedServer.id} csrfToken={csrfToken} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} />
                        )}
                        {activeSection === 'warn_punishments' && (
                          <WarnPunishmentsTab dbState={database} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} />
                        )}
                        {activeSection === 'event_registry' && (
                          <EventRegistryTab dbState={database} discordChannels={channels} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} />
                        )}
                        {activeSection === 'commands' && (
                          <CommandsTab dbState={database} commands={commands} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast}/>
                        )}
                        {activeSection === 'audit_logs' && (
                          <AuditLogsTab dbState={database} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} />
                        )}
                      </>
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center flex-col text-center">
                        <div className="bg-zinc-900/50 border border-rose-500/20 p-8 rounded-3xl max-w-md w-full shadow-2xl">
                          <div className="w-16 h-16 bg-rose-500/10 rounded-2xl mx-auto flex items-center justify-center text-rose-500 mb-6"><AlertCircle size={32} /></div>
                          <h2 className="text-xl font-bold text-white mb-2">Bot Ausente</h2>
                          <p className="text-sm text-zinc-400 mb-8 leading-relaxed">O Sistine não foi encontrado no servidor <strong className="text-white">{selectedServer.name}</strong>.</p>
                        </div>
                      </div>
                    )
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </>
      )}

    </div>
  );
}