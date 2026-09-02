import React, { useState, useEffect, useMemo } from 'react';
import { History, Search, Filter, Trash2, Plus, Ban, Shield, AlertCircle, VolumeX, ShieldAlert, Hash } from 'lucide-react';

interface Punishment {
  id: string;
  target: string;
  targetId: string;
  targetAvatar: string;
  avatar?: string; 
  moderator: string;
  moderatorId?: string; 
  moderatorAvatar?: string; 
  type: 'Warn' | 'Mute' | 'Kick' | 'Ban';
  reason: string;
  date: string;
}

interface DiscordMember {
  id: string;
  name: string;
  avatar: string;
}

interface DiscordChannel {
  id: string;
  name: string;
}

interface PunishmentLogsTabProps {
  dbState: any;
  discordMembers: DiscordMember[];
  channels: DiscordChannel[]; // Padronizado igual ao WelcomeTab!
  serverId: string;
  csrfToken: string;
  onUpdateDb: (key: string, value: any) => Promise<void>;
  onTriggerSaveStatus: (type: 'success' | 'error', message: string) => void;
}

export default function PunishmentLogsTab({ dbState, discordMembers, channels, serverId, csrfToken, onUpdateDb, onTriggerSaveStatus }: PunishmentLogsTabProps) {
  
  const punishmentList: Punishment[] = Array.isArray(dbState?.punishments) 
    ? dbState.punishments 
    : (dbState?.punishments ? Object.values(dbState.punishments) : []);

  const [punishments, setPunishments] = useState<Punishment[]>(punishmentList);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  // Inicialização direta igual ao WelcomeTab
  const getInitialLogChannel = () => {
    const config = dbState?.punishments_config;
    if (typeof config === 'string') return config;
    return config?.logChannel ?? "";
  };

  const [savedChannel, setSavedChannel] = useState(getInitialLogChannel());
  const [logChannel, setLogChannel] = useState(getInitialLogChannel());
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Form de Punição
  const [simMemberId, setSimMemberId] = useState('');
  const [manualId, setManualId] = useState('');
  const [simType, setSimType] = useState<'Warn' | 'Mute' | 'Kick' | 'Ban'>('Warn');
  const [muteDuration, setMuteDuration] = useState('86400000'); 
  const [simReason, setSimReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (dbState?.punishments) {
      setPunishments(Array.isArray(dbState.punishments) ? dbState.punishments : Object.values(dbState.punishments));
    }
  }, [dbState?.punishments]);

  useEffect(() => {
    const initial = getInitialLogChannel();
    setSavedChannel(initial);
    setLogChannel(initial);
  }, [dbState?.punishments_config]);

  const hasChanges = useMemo(() => {
    return String(logChannel) !== String(savedChannel);
  }, [logChannel, savedChannel]);

  const handleDiscard = () => {
    setLogChannel(savedChannel);
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const channelStr = String(logChannel || '');
      await onUpdateDb('punishments_config', { logChannel: channelStr });
      setSavedChannel(channelStr);
      onTriggerSaveStatus('success', 'Canal de logs salvo com sucesso!');
    } catch (e: any) {
      onTriggerSaveStatus('error', e.message || 'Erro ao salvar o canal de logs.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCreatePunishment = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTargetId = manualId.trim() || simMemberId;

    if (!finalTargetId || !simReason.trim()) {
      onTriggerSaveStatus('error', 'Preencha o usuário e o motivo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/execute-punishment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-selected-server': serverId, 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          targetId: finalTargetId,
          type: simType,
          reason: simReason.trim(),
          duration: simType === 'Mute' ? Number(muteDuration) : null 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao aplicar punição no Discord.');

      const fallbackMember = discordMembers?.find(m => m.id === finalTargetId);
      const resolvedAvatar = data.user?.avatar || data.user?.displayAvatarURL || fallbackMember?.avatar || "";
      const resolvedName = data.user?.name || data.user?.username || fallbackMember?.name || "Usuário";

      const newId = Date.now().toString();
      const added: Punishment = {
        id: newId,
        target: resolvedName,
        targetId: finalTargetId,
        targetAvatar: resolvedAvatar,
        moderator: data.moderator?.name || "Admin",
        moderatorId: data.moderator?.id || "",
        moderatorAvatar: data.moderator?.avatar || "",
        type: simType,
        reason: simReason.trim(),
        date: new Date().toISOString()
      };

      const updatedList = [added, ...punishments];
      await onUpdateDb('punishments', updatedList);
      setPunishments(updatedList);
      
      onTriggerSaveStatus('success', `Sucesso! ${simType} executado e registrado.`);
      
      setSimMemberId('');
      setManualId('');
      setSimReason('');
    } catch (e: any) {
      onTriggerSaveStatus('error', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePunishment = async (id: string) => {
    try {
      const updatedList = punishments.filter(p => p.id !== id);
      await onUpdateDb('punishments', updatedList);
      setPunishments(updatedList);
      onTriggerSaveStatus('success', 'Registro removido do histórico.');
    } catch (e: any) {
      onTriggerSaveStatus('error', 'Erro ao apagar registro.');
    }
  };

  const getAvatarUrl = (targetId: string, avatarData?: string) => {
    if (!avatarData) return `https://cdn.discordapp.com/embed/avatars/${Math.abs(Number(targetId || '0')) % 5}.png`;
    let cleanUrl = avatarData;
    while (cleanUrl.includes('&amp;')) cleanUrl = cleanUrl.replace(/&amp;/g, '&');
    cleanUrl = cleanUrl.replace(/&#x2F;/gi, '/');
    if (cleanUrl.startsWith('http')) return cleanUrl;
    return `https://cdn.discordapp.com/avatars/${targetId}/${cleanUrl}.png?size=128`;
  };

  const getBadgeStyles = (type: Punishment['type']) => {
    switch (type) {
      case 'Ban': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Kick': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Mute': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Warn': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getIcon = (type: Punishment['type']) => {
    switch (type) {
      case 'Ban': return <Ban size={10} className="shrink-0 text-red-400" />;
      case 'Kick': return <ShieldAlert size={10} className="shrink-0 text-orange-400" />;
      case 'Mute': return <VolumeX size={10} className="shrink-0 text-blue-400" />;
      case 'Warn': return <AlertCircle size={10} className="shrink-0 text-amber-400" />;
      default: return <Shield size={10} className="shrink-0 text-zinc-400" />;
    }
  };

  const filtered = punishments.filter(p => {
    const matchesSearch = (p.target || '').toLowerCase().includes(search.toLowerCase()) || (p.targetId || '').includes(search);
    const matchesFilter = filterType === 'All' || p.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-28 relative">
      
      <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <History className="text-rose-400" size={22} />
            Logs e Gestão de Punições
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            Aplique punições instantâneas e visualize a assinatura do administrador responsável por cada ação.
          </p>
        </div>
      </div>

      {/* Configuração do Canal de Logs */}
      <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 flex flex-col items-start gap-3">
        <div className="w-full">
          <label className="flex items-center gap-2 text-[11px] font-semibold text-zinc-400 mb-1.5">
            <Hash size={13} className="text-rose-400"/> Canal de Relatório de Punições do Discord
          </label>
          <select
            value={logChannel}
            onChange={(e) => setLogChannel(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3 py-2.5 text-xs text-white cursor-pointer"
          >
            <option value="">Não enviar no Discord (Apenas manter no painel)</option>
            {Array.isArray(channels) && channels.map((canal) => (
              <option key={canal.id} value={canal.id}>#{canal.name}</option>
            ))}
          </select>
          <p className="text-[10px] text-zinc-500 mt-1.5 ml-1">Sempre que uma punição for aplicada pelo painel ou pelo Discord, enviaremos um Embed detalhado neste canal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <form onSubmit={handleCreatePunishment} className="lg:col-span-4 bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-4 h-fit">
          <span className="text-xs font-bold text-white block border-b border-zinc-900 pb-2">Aplicar Nova Punição</span>
          
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1.5">Membro (Lista Rápida)</label>
            <select value={simMemberId} onChange={(e) => { setSimMemberId(e.target.value); setManualId(''); }} className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white">
              <option value="">Selecione um membro...</option>
              {Array.isArray(discordMembers) && discordMembers.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-px bg-zinc-800 flex-1"></div>
            <span className="text-[10px] text-zinc-600 font-mono">OU</span>
            <div className="h-px bg-zinc-800 flex-1"></div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1.5">Colar ID Manualmente</label>
            <input type="text" value={manualId} onChange={(e) => { setManualId(e.target.value); setSimMemberId(''); }} className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white font-mono" placeholder="Ex: 123456789012345678" />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1.5 mt-2">Tipo de Punição</label>
            <select value={simType} onChange={(e) => setSimType(e.target.value as any)} className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white">
              <option value="Warn">⚠️ Advertência (Apenas Log)</option>
              <option value="Mute">🔇 Silenciamento (Timeout)</option>
              <option value="Kick">👢 Expulsão (Kick)</option>
              <option value="Ban">🔨 Banimento (Ban)</option>
            </select>
          </div>

          {simType === 'Mute' && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
              <label className="block text-[10px] font-semibold text-blue-400 mb-1.5">Duração do Silenciamento</label>
              <select value={muteDuration} onChange={(e) => setMuteDuration(e.target.value)} className="w-full bg-[#1e2330] border border-blue-900/50 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-blue-200">
                <option value="60000">60 Segundos</option>
                <option value="300000">5 Minutos</option>
                <option value="600000">10 Minutos</option>
                <option value="3600000">1 Hora</option>
                <option value="86400000">1 Dia</option>
                <option value="604800000">1 Semana</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1.5 mt-1">Motivo / Razão</label>
            <textarea required value={simReason} onChange={(e) => setSimReason(e.target.value)} rows={3} className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-700" placeholder="Motivo detalhado para a punição..." />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/15 mt-2">
            <Plus size={14} />
            <span>{isSubmitting ? 'Executando...' : 'Aplicar Punição Agora'}</span>
          </button>
        </form>

        <div className="lg:col-span-8 bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-zinc-500" size={14} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-600" placeholder="Pesquisar por usuário ou ID..." />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="text-zinc-500" size={14} />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-1.5 text-xs text-zinc-300">
                <option value="All">Todos os tipos</option>
                <option value="Warn">Warns</option>
                <option value="Mute">Mutes</option>
                <option value="Kick">Kicks</option>
                <option value="Ban">Bans</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-600 text-xs">
                Nenhum registro de punição encontrado.
              </div>
            ) : (
              filtered.map((pun) => (
                <div key={pun.id} className="bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-900 rounded-lg p-3 flex items-center justify-between gap-3 transition group">
                  
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img 
                      src={getAvatarUrl(pun.targetId, pun.targetAvatar || pun.avatar)} 
                      alt="User" 
                      className="w-8 h-8 rounded-full shrink-0 border border-zinc-800 object-cover bg-zinc-900" 
                      onError={(e) => { 
                        const img = e.currentTarget as HTMLImageElement;
                        if (!img.src.includes('embed/avatars')) {
                          img.src = `https://cdn.discordapp.com/embed/avatars/${Math.abs(Number(pun.targetId || '0')) % 5}.png`; 
                        }
                      }}
                    />
                    
                    <div className="min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white truncate max-w-[120px] sm:max-w-xs">{pun.target || "Desconhecido"}</span>
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold border ${getBadgeStyles(pun.type)}`}>
                          {getIcon(pun.type)}
                          <span>{(pun.type || 'Punição').toUpperCase()}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5 w-full pr-4" title={pun.reason}>
                        <strong className="text-zinc-500">Motivo:</strong> {pun.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden md:flex flex-col items-end">
                      <div className="flex items-center gap-1.5">
                        <Shield size={10} className="text-emerald-400" />
                        <span className="text-[9px] text-zinc-500">por</span>
                        {pun.moderatorAvatar && (
                          <img src={getAvatarUrl(pun.moderatorId || '', pun.moderatorAvatar)} alt="Mod" className="w-3.5 h-3.5 rounded-full object-cover" />
                        )}
                        <span className="text-[10px] text-emerald-100 font-bold truncate max-w-[80px]">{pun.moderator}</span>
                      </div>
                      <span className="text-[9px] text-zinc-600 font-mono mt-0.5">
                        {pun.date ? new Date(pun.date).toLocaleDateString('pt-BR') : '--/--/----'} às {pun.date ? new Date(pun.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                    </div>

                    {/* <button 
                      onClick={() => handleDeletePunishment(pun.id)} 
                      className="p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded transition cursor-pointer md:opacity-0 md:group-hover:opacity-100" 
                      title="Remover do histórico"
                    >
                      <Trash2 size={14} />
                    </button> */}
                  </div>
                  
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* BARRA FLUTUANTE DE SALVAMENTO */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 shadow-2xl rounded-2xl px-6 py-4 flex items-center justify-between gap-8 z-50 transition-all duration-300 w-[90%] max-w-xl ${
        hasChanges ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
          <span className="text-xs font-medium text-zinc-200">Você tem alterações não salvas.</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleDiscard} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs transition cursor-pointer">
            Descartar
          </button>
          <button type="button" onClick={handleSaveConfig} disabled={isSavingConfig} className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-rose-600/15">
            <span>{isSavingConfig ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}