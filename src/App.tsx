import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, RefreshCw, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
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
import VipShop from './components/UserDashboard/VipShop';
import CoinShop from './components/UserDashboard/CoinShop';

// Componentes da Landing Page / Rotas
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { RuralShowcase } from './components/RuralShowcase';
import { Capabilities } from './components/Capabilities';
import { CommandSearch } from './components/CommandSearch';
import { SectionCards } from './components/SectionCards';
import { WikiSupport } from './components/WikiSupport';
import { Footer } from './components/Footer';
import { ShopView } from './components/ShopView';

type AppView = 'landing' | 'login' | 'user_dashboard' | 'dashboard' | 'shop' | 'premium' | 'wiki' | 'commands' | 'support' | 'team';

// --- 1. COMPONENTES REUTILIZÁVEIS EXTRAÍDOS ---

const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white font-sans">
    <div className="flex flex-col items-center gap-4">
      <RefreshCw className="animate-spin text-purple-500" size={32} />
      <p className="text-sm text-zinc-400 font-mono">Carregando aplicação...</p>
    </div>
  </div>
);

// Tipo para facilitar (opcional, mas recomendado)
type UserType = { id: string; username: string; avatar: string; global_name?: string } | null;

const PublicLayout = ({ 
  children, 
  onLogin, 
  onNavigate, 
  user // 1. Adicionamos o user aqui
}: { 
  children: React.ReactNode, 
  onLogin: () => void, 
  onNavigate: (view: AppView) => void,
  user: UserType // 2. Tipamos o user
}) => (
  <div className="h-screen w-full bg-paper text-ink font-body antialiased overflow-y-auto selection:bg-berry/20 selection:text-ink">
    
    {/* 3. Passamos o user para o Header */}
    <Header onLogin={onLogin} onNavigate={onNavigate} user={user} />
    
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
      {children}
    </motion.div>
    <Footer />
  </div>
);

export default function App() {
  const [appView, setAppView] = useState<AppView>('landing');
  const [userActiveSection, setUserActiveSection] = useState<string>('servers');
  const [activeSection, setActiveSection] = useState<string>('overview');
  
  const [status, setStatus] = useState({
    status: "loading", discordBot: "offline", firebase: "disconnected",
    loadedPrefix: 0, loadedSlash: 0, uptime: 0, botName: "", botAvatar: ""
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

  // --- MÉTODOS DE ESTADO E FETCH (MANTIDOS) ---
  
  const triggerToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => { setToast({ type: null, message: '' }); }, 3500);
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user); setCsrfToken(data.csrfToken);
        await fetchStatus(); await fetchServers(); await fetchUserDatabase();
      } else setUser(null);
    } catch (e) { setUser(null); } finally { setAuthChecking(false); }
  };

  useEffect(() => {
    fetchStatus(); checkAuth(); fetchCommands();
    const retryAvatar = setInterval(() => {
      setStatus(current => {
        if (!current.botAvatar || current.botAvatar === "") fetchStatus();
        return current;
      });
    }, 3000);
    return () => clearInterval(retryAvatar);
  }, []);

  const handleEnterDashboardClick = () => {
    if (user) { setAppView('user_dashboard'); setUserActiveSection('servers'); } 
    else { setAppView('login'); }
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
            setAuthChecking(true); await checkAuth();
            setAppView('user_dashboard'); setUserActiveSection('servers');
            triggerToast('success', 'Autenticado com sucesso via Discord!');
            window.removeEventListener('message', messageListener);
          }
        };
        window.addEventListener('message', messageListener);
      } else { triggerToast('error', 'Erro ao obter URL de autenticação.'); }
    } catch (e: any) { triggerToast('error', e.message || 'Falha ao iniciar login.'); }
  };

  const handleDevLogin = async () => {
    try {
      setAuthChecking(true);
      const res = await fetch('/api/auth/dev-login', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await checkAuth(); setAppView('user_dashboard'); setUserActiveSection('servers');
        triggerToast('success', 'Modo de testes ativado!');
      } else {
        triggerToast('error', 'Falha ao ativar login de testes.'); setAuthChecking(false);
      }
    } catch (e: any) { triggerToast('error', e.message); setAuthChecking(false); }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null); setServers([]); setSelectedServer(null); setAppView('landing');
      triggerToast('success', 'Sessão encerrada.');
    } catch (e) {}
  };

  const fetchStatus = async () => {
    try { const res = await fetch('/api/status'); const data = await res.json(); setStatus(prev => ({ ...prev, ...data })); } catch (e) {}
  };

  const fetchServers = async () => {
    try { const res = await fetch('/api/servers'); const data = await res.json(); setServers(data); } catch (e) {}
  };

  const handleSelectServer = async (srv: DiscordServer) => {
    setAppView('dashboard'); setIsServerLoading(true); setSelectedServer(srv);
    triggerToast('success', `Acessando: ${srv.name}`);
    await fetchDatabase(srv.id); await fetchCommands(); await fetchConfig(srv.id); await fetchChannels(srv.id); await fetchRoles(srv.id); await fetchMembers(srv.id);
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

  const fetchCommands = async () => {
    try {
      const res = await fetch('/api/commands');
      const data = await res.json();
      setCommands(Array.isArray(data) ? data : (data?.commands || []));
    } catch (e) { console.error("Erro ao buscar comandos:", e); }
  };

  const fetchUserDatabase = async () => {
    setIsUserDbLoading(true);
    try {
      const res = await fetch('/api/user/database');
      if (!res.ok) throw new Error('Não autorizado');
      const data = await res.json();
      setUserDatabase(data);
      if (data.flagsArray && user) setUser(prev => prev ? { ...prev, flagsArray: data.flagsArray } : prev);
    } catch (e: any) { console.warn("Erro ao ler banco de dados do usuário:", e); } 
    finally { setIsUserDbLoading(false); }
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
          setSelectedServer(null); setAppView('user_dashboard'); setUserActiveSection('servers'); fetchServers();
          return;
        }
        throw new Error(data.error || 'Não autorizado');
      }
      setDatabase(data);
    } catch (e: any) { console.warn("Erro ao ler banco de dados:", e.message); }
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
          setSelectedServer(null); setAppView('user_dashboard'); setUserActiveSection('servers'); fetchServers();
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
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ key, value })
      });
      const data = await res.json();
      if (data.success && data.userDb) setUserDatabase(data.userDb);
      else if (data.error) throw new Error(data.error);
    } catch (e: any) { throw e; }
  };


  // --- 2. NOVA LÓGICA DE ROTEAMENTO VISUAL ---

  const renderDashboardTabs = () => {
    switch (activeSection) {
      case 'overview': return <OverviewTab dbState={database} channels={channels} serverId={selectedServer!.id} csrfToken={csrfToken} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} botAvatar={status.botAvatar} botName={status.botName} user={user} />;
      case 'welcome': return <WelcomeTab dbState={database} channels={channels} serverId={selectedServer!.id} csrfToken={csrfToken} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} botAvatar={status.botAvatar} botName={status.botName} user={user} />;
      case 'autorole': return <AutoroleTab dbState={database} discordRoles={roles} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} />;
      case 'permissions': return <PermissionsTab dbState={database} discordRoles={roles} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} serverId={selectedServer!.id} csrfToken={csrfToken} />;
      case 'invite_blocker': return <InviteBlockerTab dbState={database} discordChannels={channels} discordRoles={roles} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} botAvatar={status.botAvatar} botName={status.botName} />;
      case 'punishment_logs': return <PunishmentLogsTab dbState={database} discordMembers={members} discordChannels={channels} serverId={selectedServer!.id} csrfToken={csrfToken} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} />;
      case 'warn_punishments': return <WarnPunishmentsTab dbState={database} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} />;
      case 'event_registry': return <EventRegistryTab dbState={database} discordChannels={channels} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} />;
      case 'commands': return <CommandsTab dbState={database} commands={commands} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast}/>;
      case 'audit_logs': return <AuditLogsTab dbState={database} onUpdateDb={handleUpdateDbKey} onTriggerSaveStatus={triggerToast} />;
      default: return null;
    }
  };

  const renderActiveView = () => {
    switch (appView) {
      case 'landing':
        return (
          <PublicLayout user={user} onLogin={handleEnterDashboardClick} onNavigate={(view) => setAppView(view as AppView)}>
            <main>
              <Hero onLogin={handleEnterDashboardClick} />
              <RuralShowcase botName={status.botName} botAvatar={status.botAvatar} />
              <Capabilities />
              <CommandSearch commands={commands} />
            </main>
          </PublicLayout>
        );
      
      case 'premium':
        return (
          <PublicLayout user={user} onLogin={handleEnterDashboardClick} onNavigate={(view) => setAppView(view as AppView)}>
            <div className="min-h-screen p-8"><div className="max-w-4xl mx-auto"><VipShop user={user} /></div></div>
          </PublicLayout>
        );
      
      case 'shop':
        return (
          <PublicLayout user={user} onLogin={handleEnterDashboardClick} onNavigate={(view) => setAppView(view as AppView)}>
            <div className="min-h-screen p-8"><div className="max-w-4xl mx-auto"><CoinShop/></div></div>
          </PublicLayout>
        );

      // case 'wiki':
      case 'support':
        return (
          <PublicLayout user={user} onLogin={handleEnterDashboardClick} onNavigate={(view) => setAppView(view as AppView)}>
            <div className="py-12"><WikiSupport /></div>
          </PublicLayout>
        );

      case 'commands':
        return (
          <PublicLayout user={user} onLogin={handleEnterDashboardClick} onNavigate={(view) => setAppView(view as AppView)}>
            <div className="py-12">
              <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-900/30 p-6 rounded-2xl border border-zinc-900">
                <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <Terminal className="text-blue-400" size={22} /> Comandos da Sistine
                </h2>
                <p className="text-xs text-zinc-500 mt-1 max-w-xl">Controle quais comandos estão disponíveis no seu servidor!</p>
              </div>
              <div className='mt-6'><CommandSearch commands={commands} /></div>
            </div>
          </PublicLayout>
        );

      case 'team':
        return (
          <PublicLayout user={user} onLogin={handleEnterDashboardClick} onNavigate={(view) => setAppView(view as AppView)}>
            <div className="py-12"><SectionCards onLogin={handleEnterDashboardClick} /></div>
          </PublicLayout>
        );

      case 'login':
        return (
          <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-paper text-ink w-full h-screen">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f12_1px,transparent_1px),linear-gradient(to_bottom,#0f0f12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70"></div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative max-w-md w-full mx-4 p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl text-center">
              <div className="flex items-center justify-center mb-6">
                <button onClick={() => setAppView('landing')} className="absolute left-6 top-6 text-zinc-500 hover:text-white transition"><ArrowLeft size={20} /></button>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2 mt-4">Autenticação Necessária</h2>
              <p className="text-sm text-zinc-400 mb-8 max-w-xs mx-auto leading-relaxed">Faça login com sua conta do Discord para gerenciar os servidores.</p>
              <div className="flex flex-col gap-3">
                <button onClick={handleLogin} className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#5865F2]/20 text-sm">Entrar com Discord</button>
                <button onClick={handleDevLogin} className="w-full bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white font-medium py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 border border-zinc-700/50 text-xs">Modo Demonstração (Dev Bypass)</button>
              </div>
            </motion.div>
          </div>
        );

      case 'user_dashboard':
        return (
          <div className="flex h-screen w-full bg-zinc-950 text-white overflow-hidden">
            <UserSidebar 
              user={user} 
              userDb={userDatabase} 
              activeSection={userActiveSection} 
              setActiveSection={(sec) => { setUserActiveSection(sec); if (sec !== 'servers') fetchUserDatabase(); }} 
              onRefreshUserDb={fetchUserDatabase} 
              isUserDbLoading={isUserDbLoading} 
              onLogout={handleLogout}
              botAvatar={status.botAvatar}
              botName={status.botName}
            />
            <main className="flex-1 overflow-y-auto relative">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f12_1px,transparent_1px),linear-gradient(to_bottom,#0f0f12_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none"></div>
              <div className="relative z-10 w-full max-w-6xl mx-auto p-8 md:p-12">
                {userActiveSection === 'servers' ? (
                  <ServerSelectionTab servers={servers} onSelectServer={handleSelectServer} onTriggerToast={triggerToast} />
                ) : (
                  <UserSettingsTabs user={user} activeSection={userActiveSection} userDb={userDatabase} csrfToken={csrfToken} onUpdateUserDb={handleUpdateUserDbKey} onRefreshUserDb={fetchUserDatabase} onTriggerSaveStatus={triggerToast} isLoadingUserDb={isUserDbLoading} />
                )}
              </div>
            </main>
          </div>
        );

      case 'dashboard':
        return (
          <>
            <Sidebar servers={servers} selectedServer={selectedServer} onSelectServer={handleSelectServer} activeSection={activeSection} onChangeSection={async (sec) => { setActiveSection(sec); if (selectedServer) { try { const res = await fetch('/api/check-permissions', { headers: { 'x-selected-server': selectedServer.id } }); if (!res.ok) { const data = await res.json().catch(() => ({})); triggerToast('error', data.error || 'Suas permissões neste servidor foram revogadas.'); setSelectedServer(null); setAppView('user_dashboard'); setUserActiveSection('servers'); fetchServers(); } } catch (e) {} } }} user={user} onLogout={handleLogout} botAvatar={status.botAvatar} botName={status.botName} />
            <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-hidden">
              <header className="px-6 py-4 bg-zinc-900/40 border-b border-zinc-900 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <button onClick={() => { setAppView('user_dashboard'); setUserActiveSection('servers'); fetchUserDatabase(); }} className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-lg"><ArrowLeft size={14} /> Trocar Servidor</button>
                  <div className="w-px h-5 bg-zinc-800"></div>
                  <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-bold">PAINEL DE CONTROLE DO SERVIDOR</span>
                </div>
              </header>

              <main className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  <motion.div key={activeSection + (selectedServer?.id || '')} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.15 }} className="h-full">
                    {selectedServer && (
                      hasBot ? (
                        isServerLoading ? (
                          <div className="flex h-full flex-col items-center justify-center text-zinc-500 gap-4"><RefreshCw className="animate-spin text-purple-500" size={36} /><span className="text-sm font-medium animate-pulse">Sincronizando banco de dados...</span></div>
                        ) : ( <>{renderDashboardTabs()}</> )
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
        );

      default: return null;
    }
  };

  if (authChecking) return <LoadingScreen />;

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <AnimatePresence>
        {toast.type && (
          <motion.div initial={{ opacity: 0, y: -50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl ${ toast.type === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30' : 'bg-rose-950/90 text-rose-300 border-rose-500/30' }`}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {renderActiveView()}
    </div>
  );
}