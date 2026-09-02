import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Save, Terminal, Shield, Check, Settings, Trash2 } from 'lucide-react';

interface DiscordChannel {
  id: string;
  name: string;
}

interface EventRegistryTabProps {
  dbState: any;
  discordChannels: DiscordChannel[];
  onUpdateDb: (key: string, value: any) => Promise<void>;
  onTriggerSaveStatus: (type: 'success' | 'error', message: string) => void;
}

export default function EventRegistryTab({ dbState, discordChannels, onUpdateDb, onTriggerSaveStatus }: EventRegistryTabProps) {
  
  const getInitialState = () => ({
    status: dbState?.events?.status ?? false,
    channel: dbState?.events?.channel ?? "",
    trackMessageDelete: dbState?.events?.trackMessageDelete ?? true,
    trackMessageEdit: dbState?.events?.trackMessageEdit ?? true,
    trackVoiceStatus: dbState?.events?.trackVoiceStatus ?? true,
    trackMemberJoinLeave: dbState?.events?.trackMemberJoinLeave ?? true,
    trackRoleUpdate: dbState?.events?.trackRoleUpdate ?? true,
    trackChannelUpdate: dbState?.events?.trackChannelUpdate ?? true
  });

  const [status, setStatus] = useState(getInitialState().status);
  const [channel, setChannel] = useState(getInitialState().channel);
  const [trackMessageDelete, setTrackMessageDelete] = useState(getInitialState().trackMessageDelete);
  const [trackMessageEdit, setTrackMessageEdit] = useState(getInitialState().trackMessageEdit);
  const [trackVoiceStatus, setTrackVoiceStatus] = useState(getInitialState().trackVoiceStatus);
  const [trackMemberJoinLeave, setTrackMemberJoinLeave] = useState(getInitialState().trackMemberJoinLeave);
  const [trackRoleUpdate, setTrackRoleUpdate] = useState(getInitialState().trackRoleUpdate);
  const [trackChannelUpdate, settrackChannelUpdate] = useState(getInitialState().trackChannelUpdate);

  const [isSaving, setIsSaving] = useState(false);

  const terminalLogs = dbState?.logs ? Object.values(dbState.logs).reverse() : [];

  useEffect(() => {
    const data = getInitialState();
    setStatus(data.status);
    setChannel(data.channel);
    setTrackMessageDelete(data.trackMessageDelete);
    setTrackMessageEdit(data.trackMessageEdit);
    setTrackVoiceStatus(data.trackVoiceStatus);
    setTrackMemberJoinLeave(data.trackMemberJoinLeave);
    setTrackRoleUpdate(data.trackRoleUpdate);
    settrackChannelUpdate(data.trackChannelUpdate);
  }, [dbState?.events]);

  const hasChanges = useMemo(() => {
    const current = { status, channel, trackMessageDelete, trackMessageEdit, trackVoiceStatus, trackMemberJoinLeave, trackRoleUpdate, trackChannelUpdate };
    return JSON.stringify(getInitialState()) !== JSON.stringify(current);
  }, [status, channel, trackMessageDelete, trackMessageEdit, trackVoiceStatus, trackMemberJoinLeave, trackRoleUpdate, trackChannelUpdate, dbState?.events]);

  const handleDiscard = () => {
    const data = getInitialState();
    setStatus(data.status);
    setChannel(data.channel);
    setTrackMessageDelete(data.trackMessageDelete);
    setTrackMessageEdit(data.trackMessageEdit);
    setTrackVoiceStatus(data.trackVoiceStatus);
    setTrackMemberJoinLeave(data.trackMemberJoinLeave);
    setTrackRoleUpdate(data.trackRoleUpdate);
    settrackChannelUpdate(data.trackChannelUpdate);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = {
        status, channel, trackMessageDelete, trackMessageEdit, trackVoiceStatus, trackMemberJoinLeave, trackRoleUpdate, trackChannelUpdate
      };
      await onUpdateDb('events', updated);
      onTriggerSaveStatus('success', 'Configurações do Registro de Eventos atualizadas!');
    } catch (e: any) {
      onTriggerSaveStatus('error', 'Erro ao salvar registro de eventos.');
    } finally {
      setIsSaving(false);
    }
  };

  const checkboxes = [
    { state: trackMessageDelete, set: setTrackMessageDelete, label: 'Mensagens Excluídas', desc: 'Registra quando alguém apaga alguma mensagem no chat.' },
    { state: trackMessageEdit, set: setTrackMessageEdit, label: 'Mensagens Editadas', desc: 'Registra o antes e depois das mensagens editadas por membros.' },
    { state: trackVoiceStatus, set: setTrackVoiceStatus, label: 'Mudanças em Voz', desc: 'Registra entradas, saídas e trocas de salas de áudio.' },
    { state: trackMemberJoinLeave, set: setTrackMemberJoinLeave, label: 'Acesso de Membros', desc: 'Registra entradas e saídas de usuários no servidor.' },
    { state: trackRoleUpdate, set: setTrackRoleUpdate, label: 'Alteração de Cargos', desc: 'Registra criação, remoção ou edição de cargos.' },
    { state: trackChannelUpdate, set: settrackChannelUpdate, label: 'Gerenciamento de Canais', desc: 'Registra criação, deleção e mudança de canais de texto/voz.' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-28 relative">
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-900/30 p-6 rounded-2xl border border-zinc-900">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Activity className="text-teal-400" size={22} />
            Registro de Eventos (Audit Log)
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            Siga de perto todas as ações e eventos que ocorrem em tempo real no seu servidor. Ideal para auditar incidentes e apoiar sua equipe de moderadores.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <span className="text-xs font-semibold text-zinc-400">Ativar Registro:</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={status} onChange={(e) => setStatus(e.target.checked)} />
              <div className={`w-11 h-6 rounded-full transition-colors ${status ? 'bg-teal-500' : 'bg-zinc-800'}`}></div>
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${status ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </label>
        </div>
      </div>

      {!status && (
        <div className="bg-zinc-900/10 border border-zinc-800/40 rounded-2xl p-8 text-center text-zinc-500">
          <p className="text-sm">O sistema de rastreamento e auditoria de eventos está desativado no momento.</p>
        </div>
      )}

      {status && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold text-white block border-b border-zinc-900 pb-2">Canal de Envio</span>
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 mb-1.5">Canal de Logs do Bot</label>
                <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl px-3 py-2 text-xs text-white cursor-pointer">
                  <option value="">Selecione um canal...</option>
                  {Array.isArray(discordChannels) && discordChannels.map(ch => (
                    <option key={ch.id} value={ch.id}>#{ch.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold text-white block border-b border-zinc-900 pb-2">Ações a Monitorar</span>
              <div className="space-y-3">
                {checkboxes.map((box, idx) => (
                  <label key={idx} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-zinc-950/30 transition cursor-pointer select-none">
                    <input type="checkbox" checked={box.state} onChange={(e) => box.set(e.target.checked)} className="mt-1 rounded border-zinc-800 bg-zinc-950 text-teal-500 focus:ring-teal-500/20 focus:ring-offset-zinc-950 cursor-pointer" />
                    <div>
                      <span className="text-xs font-bold text-zinc-200 block">{box.label}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{box.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4.5 font-mono text-xs flex flex-col h-[520px]">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-teal-400" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Registro de eventos</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                {terminalLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-xs italic">
                    <span>Nenhum evento recente registrado no banco de dados.</span>
                  </div>
                ) : (
                  terminalLogs.map((log: any, idx) => (
                    <div key={idx} className="hover:bg-zinc-900/30 p-1.5 rounded transition flex items-start gap-2 leading-relaxed">
                      <span className="text-zinc-600 font-semibold shrink-0 text-[10px]">[{log.time || new Date().toLocaleTimeString()}]</span>
                      <span className="shrink-0 text-xs">{log.emoji || "🔔"}</span>
                      <div className="min-w-0">
                        <strong className={`font-extrabold text-[10px] mr-1.5 uppercase ${log.color || "text-teal-400"}`}>{log.event || "LOG"}</strong>
                        <span className="text-zinc-400 text-xs">{log.text || JSON.stringify(log)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BARRA FLUTUANTE DE SALVAMENTO (EVENT LOGS) */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 shadow-2xl rounded-2xl px-6 py-4 flex items-center justify-between gap-8 z-50 transition-all duration-300 w-[90%] max-w-xl ${
        hasChanges ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></div>
          <span className="text-xs font-medium text-zinc-200">Você tem alterações não salvas.</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleDiscard} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs transition cursor-pointer">
            Descartar
          </button>
          <button type="button" onClick={handleSave} disabled={isSaving} className="px-5 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-teal-500/15">
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}