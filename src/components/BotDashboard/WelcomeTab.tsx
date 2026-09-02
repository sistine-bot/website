import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Eye, Save, Volume2, MessageSquare, Image, Trash2, Send } from 'lucide-react';

interface DiscordChannel {
  id: string;
  name: string;
  botAvatar?: string;
  botName?: string;
}

interface WelcomeTabProps {
  dbState: any;
  channels: DiscordChannel[];
  serverId: string; 
  csrfToken: string; 
  onUpdateDb: (key: string, value: any) => Promise<void>;
  onTriggerSaveStatus: (type: 'success' | 'error', message: string) => void;
  botAvatar?: string;
  botName?: string;
  user: { id: string; username: string; avatar: string } | null;
}

export default function WelcomeTab({ dbState, channels, serverId, csrfToken, onUpdateDb, onTriggerSaveStatus, botAvatar, botName, user }: WelcomeTabProps) {
  
  const getInitialState = () => ({
    status: dbState?.welcome?.status ?? false,
    
    joinStatus: dbState?.welcome?.joinStatus ?? true,
    joinChannel: dbState?.welcome?.joinChannel ?? "",
    joinMessage: dbState?.welcome?.joinMessage ?? "Seja muito bem-vindo(a) ao nosso servidor, {user}! 🎉 Atualmente somos {members} membros!",
    joinEmbed: dbState?.welcome?.joinEmbed ?? true,
    joinEmbedColor: dbState?.welcome?.joinEmbedColor ?? "#10b981",
    joinEmbedTitle: dbState?.welcome?.joinEmbedTitle ?? "Novo Membro Chegou!",
    joinThumbnail: dbState?.welcome?.joinThumbnail ?? true,
    
    leaveStatus: dbState?.welcome?.leaveStatus ?? true,
    leaveChannel: dbState?.welcome?.leaveChannel ?? "",
    leaveMessage: dbState?.welcome?.leaveMessage ?? "Ah poxa, o {user} nos deixou... 😢 Agora somos {members} membros.",
    leaveEmbed: dbState?.welcome?.leaveEmbed ?? true,
    leaveEmbedColor: dbState?.welcome?.leaveEmbedColor ?? "#f43f5e",
    leaveEmbedTitle: dbState?.welcome?.leaveEmbedTitle ?? "Membro Saiu",
    leaveThumbnail: dbState?.welcome?.leaveThumbnail ?? true
  });

  const [status, setStatus] = useState(getInitialState().status);
  
  const [joinStatus, setJoinStatus] = useState(getInitialState().joinStatus);
  const [joinChannel, setJoinChannel] = useState(getInitialState().joinChannel);
  const [joinMessage, setJoinMessage] = useState(getInitialState().joinMessage);
  const [joinEmbed, setJoinEmbed] = useState(getInitialState().joinEmbed);
  const [joinEmbedColor, setJoinEmbedColor] = useState(getInitialState().joinEmbedColor);
  const [joinEmbedTitle, setJoinEmbedTitle] = useState(getInitialState().joinEmbedTitle);
  const [joinThumbnail, setJoinThumbnail] = useState(getInitialState().joinThumbnail);

  const [leaveStatus, setLeaveStatus] = useState(getInitialState().leaveStatus);
  const [leaveChannel, setLeaveChannel] = useState(getInitialState().leaveChannel);
  const [leaveMessage, setLeaveMessage] = useState(getInitialState().leaveMessage);
  const [leaveEmbed, setLeaveEmbed] = useState(getInitialState().leaveEmbed);
  const [leaveEmbedColor, setLeaveEmbedColor] = useState(getInitialState().leaveEmbedColor);
  const [leaveEmbedTitle, setLeaveEmbedTitle] = useState(getInitialState().leaveEmbedTitle);
  const [leaveThumbnail, setLeaveThumbnail] = useState(getInitialState().leaveThumbnail);

  const [isSaving, setIsSaving] = useState(false);
  const [isTestingJoin, setIsTestingJoin] = useState(false);
  const [isTestingLeave, setIsTestingLeave] = useState(false);

  useEffect(() => {
    const data = getInitialState();
    setStatus(data.status);
    setJoinStatus(data.joinStatus);
    setJoinChannel(data.joinChannel);
    setJoinMessage(data.joinMessage);
    setJoinEmbed(data.joinEmbed);
    setJoinEmbedColor(data.joinEmbedColor);
    setJoinEmbedTitle(data.joinEmbedTitle);
    setJoinThumbnail(data.joinThumbnail);
    setLeaveStatus(data.leaveStatus);
    setLeaveChannel(data.leaveChannel);
    setLeaveMessage(data.leaveMessage);
    setLeaveEmbed(data.leaveEmbed);
    setLeaveEmbedColor(data.leaveEmbedColor);
    setLeaveEmbedTitle(data.leaveEmbedTitle);
    setLeaveThumbnail(data.leaveThumbnail);
  }, [dbState?.welcome]);

  const hasChanges = useMemo(() => {
    const current = { 
      status, joinStatus, joinChannel, joinMessage, joinEmbed, joinEmbedColor, joinEmbedTitle, joinThumbnail,
      leaveStatus, leaveChannel, leaveMessage, leaveEmbed, leaveEmbedColor, leaveEmbedTitle, leaveThumbnail 
    };
    return JSON.stringify(getInitialState()) !== JSON.stringify(current);
  }, [
    status, joinStatus, joinChannel, joinMessage, joinEmbed, joinEmbedColor, joinEmbedTitle, joinThumbnail,
    leaveStatus, leaveChannel, leaveMessage, leaveEmbed, leaveEmbedColor, leaveEmbedTitle, leaveThumbnail, dbState?.welcome
  ]);

  const handleDiscard = () => {
    const data = getInitialState();
    setStatus(data.status);
    setJoinStatus(data.joinStatus);
    setJoinChannel(data.joinChannel);
    setJoinMessage(data.joinMessage);
    setJoinEmbed(data.joinEmbed);
    setJoinEmbedColor(data.joinEmbedColor);
    setJoinEmbedTitle(data.joinEmbedTitle);
    setJoinThumbnail(data.joinThumbnail);
    setLeaveStatus(data.leaveStatus);
    setLeaveChannel(data.leaveChannel);
    setLeaveMessage(data.leaveMessage);
    setLeaveEmbed(data.leaveEmbed);
    setLeaveEmbedColor(data.leaveEmbedColor);
    setLeaveEmbedTitle(data.leaveEmbedTitle);
    setLeaveThumbnail(data.leaveThumbnail);
  };

  const replacePlaceholders = (text: string) => {
    if (!text) return "";
    return text.replace(/{user}/g, "@" + user?.username || "Guest").replace(/{members}/g, "1.420").replace(/{server}/g, "Sistine Server");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = { 
        status, joinStatus, joinChannel, joinMessage, joinEmbed, joinEmbedColor, joinEmbedTitle, joinThumbnail,
        leaveStatus, leaveChannel, leaveMessage, leaveEmbed, leaveEmbedColor, leaveEmbedTitle, leaveThumbnail 
      };
      await onUpdateDb('welcome', updated);
      onTriggerSaveStatus('success', 'Mensagens de Entrada e Saída salvas com sucesso!');
    } catch (e: any) {
      onTriggerSaveStatus('error', e.message || 'Erro ao salvar mensagens.');
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------
  // NOVA FUNÇÃO: Dispara a rota de simulação
  // ---------------------------------------------
  const handleTestDiscord = async (type: 'join' | 'leave') => {
    const setTesting = type === 'join' ? setIsTestingJoin : setIsTestingLeave;
    setTesting(true);

    try {
      // Se houver mudanças não salvas, exibe um alerta
      if (hasChanges) {
        onTriggerSaveStatus('error', 'Salve as alterações antes de testar para ver a versão mais recente!');
        setTesting(false);
        return;
      }

      const res = await fetch('/api/test-welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-selected-server': serverId,
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ type })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao executar teste.');

      onTriggerSaveStatus('success', `Teste de ${type === 'join' ? 'Entrada' : 'Saída'} enviado para o seu canal!`);
    } catch (e: any) {
      onTriggerSaveStatus('error', e.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-28 relative">
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-900/30 p-6 rounded-2xl border border-zinc-900">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <MessageSquare className="text-purple-400" size={22} />
            Mensagens de Entrada e Saída (Welcome/Goodbye)
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            Configure mensagens personalizadas enviadas no seu servidor quando membros entrarem ou saírem.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <span className="text-xs font-semibold text-zinc-400">Ativar Módulo:</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={status} onChange={(e) => setStatus(e.target.checked)} />
              <div className={`w-11 h-6 rounded-full transition-colors ${status ? 'bg-purple-600' : 'bg-zinc-800'}`}></div>
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${status ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </label>
        </div>
      </div>

      {!status && (
        <div className="bg-zinc-900/10 border border-zinc-800/40 rounded-2xl p-8 text-center text-zinc-500">
          <p className="text-sm">Este módulo está desativado. Ative-o acima para configurar as mensagens.</p>
        </div>
      )}

      {status && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            
            {/* ENTRADA (JOIN) */}
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Entrada (Boas-vindas)
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Botão de Teste (NOVO) */}
                  <button 
                    onClick={() => handleTestDiscord('join')}
                    disabled={isTestingJoin || !joinStatus || !joinChannel}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold uppercase transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <Send size={12} /> {isTestingJoin ? 'Enviando...' : 'Testar no Discord'}
                  </button>

                  <label className="relative flex items-center cursor-pointer">
                    <span className="mr-2 text-[10px] font-bold text-zinc-500 uppercase">Ativo</span>
                    <input type="checkbox" className="sr-only" checked={joinStatus} onChange={(e) => setJoinStatus(e.target.checked)} />
                    <div className={`w-9 h-5 rounded-full transition-colors ${joinStatus ? 'bg-emerald-500' : 'bg-zinc-800'}`}></div>
                    <div className={`absolute top-1 right-[18px] bg-white w-3 h-3 rounded-full transition-transform ${joinStatus ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </label>
                </div>
              </div>

              <div className={`space-y-4 transition-all duration-300 ${!joinStatus ? 'opacity-40 grayscale-[50%] pointer-events-none' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Canal de Envio</label>
                    
                    <select value={joinChannel} onChange={(e) => setJoinChannel(e.target.value)} className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-3 py-2 text-xs text-white">
                      <option value="">Selecione um canal...</option>
                      {Array.isArray(channels) && channels.map((canal) => (
                        <option key={canal.id} value={canal.id}>#{canal.name}</option>
                      ))}
                    </select>

                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Estilo da Mensagem</label>
                    <div className="flex items-center gap-2 h-9">
                      <button type="button" onClick={() => setJoinEmbed(true)} className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition cursor-pointer border ${joinEmbed ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-400'}`}>Embed Rico</button>
                      <button type="button" onClick={() => setJoinEmbed(false)} className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition cursor-pointer border ${!joinEmbed ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-400'}`}>Apenas Texto</button>
                    </div>
                  </div>
                </div>

                {joinEmbed && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4.5 bg-zinc-950/50 rounded-xl border border-zinc-800/60">
                    <div className="md:col-span-6">
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-1.5">Título do Embed</label>
                      <input type="text" value={joinEmbedTitle} onChange={(e) => setJoinEmbedTitle(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg px-3 py-1.5 text-xs text-white" placeholder="Ex: Novo Membro!"/>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-1.5">Cor Lateral</label>
                      <div className="flex gap-1.5">
                        <input type="color" value={joinEmbedColor} onChange={(e) => setJoinEmbedColor(e.target.value)} className="w-8 h-7 p-0 rounded border border-zinc-800 bg-transparent cursor-pointer shrink-0" />
                        <input type="text" value={joinEmbedColor} onChange={(e) => setJoinEmbedColor(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg px-2 text-xs text-white font-mono uppercase" maxLength={7} />
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-1.5">Foto do Usuário</label>
                      <div className="flex items-center gap-1.5 h-7">
                        <button type="button" onClick={() => setJoinThumbnail(true)} className={`flex-1 text-[10px] py-1 rounded transition border ${joinThumbnail ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' : 'border-zinc-800 text-zinc-500'}`}>Exibir</button>
                        <button type="button" onClick={() => setJoinThumbnail(false)} className={`flex-1 text-[10px] py-1 rounded transition border ${!joinThumbnail ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' : 'border-zinc-800 text-zinc-500'}`}>Ocultar</button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Texto da Mensagem</label>
                  <textarea value={joinMessage} onChange={(e) => setJoinMessage(e.target.value)} rows={3} className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-zinc-700" placeholder="Escreva sua mensagem aqui..."/>
                </div>
              </div>
            </div>

            {/* SAÍDA (LEAVE) */}
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Saída (Despedida)
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Botão de Teste (NOVO) */}
                  <button 
                    onClick={() => handleTestDiscord('leave')}
                    disabled={isTestingLeave || !leaveStatus || !leaveChannel}
                    className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-bold uppercase transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <Send size={12} /> {isTestingLeave ? 'Enviando...' : 'Testar no Discord'}
                  </button>

                  <label className="relative flex items-center cursor-pointer">
                    <span className="mr-2 text-[10px] font-bold text-zinc-500 uppercase">Ativo</span>
                    <input type="checkbox" className="sr-only" checked={leaveStatus} onChange={(e) => setLeaveStatus(e.target.checked)} />
                    <div className={`w-9 h-5 rounded-full transition-colors ${leaveStatus ? 'bg-rose-500' : 'bg-zinc-800'}`}></div>
                    <div className={`absolute top-1 right-[18px] bg-white w-3 h-3 rounded-full transition-transform ${leaveStatus ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </label>
                </div>
              </div>

              <div className={`space-y-4 transition-all duration-300 ${!leaveStatus ? 'opacity-40 grayscale-[50%] pointer-events-none' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Canal de Envio</label>
                    <select value={leaveChannel} onChange={(e) => setLeaveChannel(e.target.value)} className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-3 py-2 text-xs text-white">
                      <option value="">Selecione um canal...</option>
                      {Array.isArray(channels) && channels.map((canal) => (
                        <option key={canal.id} value={canal.id}>#{canal.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Estilo da Mensagem</label>
                    <div className="flex items-center gap-2 h-9">
                      <button type="button" onClick={() => setLeaveEmbed(true)} className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition cursor-pointer border ${leaveEmbed ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-400'}`}>Embed Rico</button>
                      <button type="button" onClick={() => setLeaveEmbed(false)} className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition cursor-pointer border ${!leaveEmbed ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-400'}`}>Apenas Texto</button>
                    </div>
                  </div>
                </div>

                {leaveEmbed && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4.5 bg-zinc-950/50 rounded-xl border border-zinc-800/60">
                    <div className="md:col-span-6">
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-1.5">Título do Embed</label>
                      <input type="text" value={leaveEmbedTitle} onChange={(e) => setLeaveEmbedTitle(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg px-3 py-1.5 text-xs text-white" placeholder="Ex: Membro Saiu"/>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-1.5">Cor Lateral</label>
                      <div className="flex gap-1.5">
                        <input type="color" value={leaveEmbedColor} onChange={(e) => setLeaveEmbedColor(e.target.value)} className="w-8 h-7 p-0 rounded border border-zinc-800 bg-transparent cursor-pointer shrink-0" />
                        <input type="text" value={leaveEmbedColor} onChange={(e) => setLeaveEmbedColor(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg px-2 text-xs text-white font-mono uppercase" maxLength={7} />
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-1.5">Foto do Usuário</label>
                      <div className="flex items-center gap-1.5 h-7">
                        <button type="button" onClick={() => setLeaveThumbnail(true)} className={`flex-1 text-[10px] py-1 rounded transition border ${leaveThumbnail ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' : 'border-zinc-800 text-zinc-500'}`}>Exibir</button>
                        <button type="button" onClick={() => setLeaveThumbnail(false)} className={`flex-1 text-[10px] py-1 rounded transition border ${!leaveThumbnail ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' : 'border-zinc-800 text-zinc-500'}`}>Ocultar</button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Texto da Mensagem</label>
                  <textarea value={leaveMessage} onChange={(e) => setLeaveMessage(e.target.value)} rows={3} className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-zinc-700" placeholder="Escreva sua mensagem aqui..."/>
                </div>
              </div>
            </div>

          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-5 sticky top-6">
              <h3 className="text-xs font-bold text-zinc-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Eye size={13} className="text-purple-400" />
                Discord Emulador
              </h3>

              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 mb-6">
                <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-wide mb-1.5">Tags de Formatação Suportadas</span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                  <p className="font-mono text-zinc-400"><span className="text-purple-400 font-semibold">{`{user}`}</span> : Menciona o membro</p>
                  <p className="font-mono text-zinc-400"><span className="text-purple-400 font-semibold">{`{members}`}</span> : Quantidade total</p>
                  <p className="font-mono text-zinc-400"><span className="text-purple-400 font-semibold">{`{server}`}</span> : Nome do servidor</p>
                  <p className="font-mono text-zinc-400"><span className="text-purple-400 font-semibold">\n</span> : Quebra de linha</p>
                </div>
              </div>

              <div className="space-y-4 font-sans text-sm">
                
                {/* Chat bubble BOAS-VINDAS */}
                {joinStatus ? (
                  <div className="bg-[#313338] rounded-xl p-4 border border-[#232428] text-white">
                    <div className="flex items-start gap-3">
                      {botAvatar ? (
                        <img src={botAvatar} alt="Bot" className="w-10 h-10 object-cover rounded-xl" />
                      ) : (
                        <img src="https://i.postimg.cc/MpgXCXRh/aaa.png" alt="Sistine Bot" className="w-10 h-10 p-1.5 rounded-full bg-purple-700 shrink-0 object-contain"/>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#f2f3f5] text-xs">{botName ? botName.toUpperCase() : "Sistine"}</span>
                          <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1 rounded uppercase">BOT</span>
                          <span className="text-[10px] text-zinc-400 font-mono">hoje às 20:30</span>
                        </div>
                        {joinEmbed ? (
                          <div className="mt-2 border-l-4 rounded-r-md bg-[#2b2d31] p-3 max-w-sm flex gap-3" style={{ borderLeftColor: joinEmbedColor }}>
                            <div className="flex-1">
                              <h4 className="font-bold text-xs text-[#f2f3f5]">{joinEmbedTitle}</h4>
                              <p className="text-xs text-[#dbdee1] mt-1 whitespace-pre-wrap">{replacePlaceholders(joinMessage)}</p>
                            </div>
                            {joinThumbnail && (
                              <img src={user?.avatar || "https://i.postimg.cc/j58spXp4/image.png"} alt="User" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#1e1f22]" />
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-[#dbdee1] mt-1 whitespace-pre-wrap">{replacePlaceholders(joinMessage)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-950 border border-dashed border-zinc-800 rounded-xl p-4 text-center">
                    <span className="text-xs font-semibold text-zinc-600">Aviso de Entrada Desativado</span>
                  </div>
                )}

                {/* Chat bubble DESPEDIDA */}
                {leaveStatus ? (
                  <div className="bg-[#313338] rounded-xl p-4 border border-[#232428] text-white">
                    <div className="flex items-start gap-3">
                      {botAvatar ? (
                        <img src={botAvatar} alt="Bot" className="w-10 h-10 object-cover rounded-xl" />
                      ) : (
                        <img src="https://i.postimg.cc/MpgXCXRh/aaa.png" alt="Sistine Bot" className="w-10 h-10 p-1.5 rounded-full bg-purple-700 shrink-0 object-contain"/>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#f2f3f5] text-xs">{botName ? botName.toUpperCase() : "Sistine"}</span>
                          <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1 rounded uppercase">BOT</span>
                          <span className="text-[10px] text-zinc-400 font-mono">hoje às 20:31</span>
                        </div>
                        {leaveEmbed ? (
                          <div className="mt-2 border-l-4 rounded-r-md bg-[#2b2d31] p-3 max-w-sm flex gap-3" style={{ borderLeftColor: leaveEmbedColor }}>
                            <div className="flex-1">
                              <h4 className="font-bold text-xs text-[#f2f3f5]">{leaveEmbedTitle}</h4>
                              <p className="text-xs text-[#dbdee1] mt-1 whitespace-pre-wrap">{replacePlaceholders(leaveMessage)}</p>
                            </div>
                            {leaveThumbnail && (
                              <img src={user?.avatar || "https://i.postimg.cc/j58spXp4/image.png"} alt="User" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#1e1f22]" />
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-[#dbdee1] mt-1 whitespace-pre-wrap">{replacePlaceholders(leaveMessage)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-950 border border-dashed border-zinc-800 rounded-xl p-4 text-center">
                    <span className="text-xs font-semibold text-zinc-600">Aviso de Saída Desativado</span>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* BARRA FLUTUANTE DE SALVAMENTO */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 shadow-2xl rounded-2xl px-6 py-4 flex items-center justify-between gap-8 z-50 transition-all duration-300 w-[90%] max-w-xl ${
        hasChanges ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
          <span className="text-xs font-medium text-zinc-200">Você tem alterações não salvas.</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleDiscard} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs transition cursor-pointer">
            Descartar
          </button>
          <button type="button" onClick={handleSave} disabled={isSaving} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-purple-600/15">
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>
      
    </div>
  );
}