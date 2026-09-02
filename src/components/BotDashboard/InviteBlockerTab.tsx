import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Save, Octagon, List, Trash2, Plus, MessageSquare, AlertTriangle, Clock } from 'lucide-react';

interface DiscordChannel {
  id: string;
  name: string;
  botAvatar?: string;
  botName?: string;
}

interface DiscordRole {
  id: string;
  name: string;
  color?: string;
}

interface InviteBlockerTabProps {
  dbState: any;
  discordChannels: DiscordChannel[];
  discordRoles: DiscordRole[];
  onUpdateDb: (key: string, value: any) => Promise<void>;
  onTriggerSaveStatus: (type: 'success' | 'error', message: string) => void;
  botAvatar?: string;
  botName?: string;
}

export default function InviteBlockerTab({ dbState, discordChannels, discordRoles, onUpdateDb, onTriggerSaveStatus, botAvatar, botName }: InviteBlockerTabProps) {
  
  const getInitialState = () => ({
    status: dbState?.invite_blocker?.status ?? false,
    action: dbState?.invite_blocker?.action ?? 'none',
    deleteMessage: dbState?.invite_blocker?.deleteMessage ?? true,
    muteTime: dbState?.invite_blocker?.muteTime ?? 3600,
    whitelistedChannels: dbState?.invite_blocker?.whitelistedChannels || [],
    whitelistedRoles: dbState?.invite_blocker?.whitelistedRoles || [],
    customMessage: dbState?.invite_blocker?.customMessage ?? "⚠️ {user}, não é permitido enviar links de outros servidores aqui!",
    // Novas opções de estilo do aviso
    embed: dbState?.invite_blocker?.embed ?? true,
    embedColor: dbState?.invite_blocker?.embedColor ?? "#ef4444",
    embedTitle: dbState?.invite_blocker?.embedTitle ?? "Aviso do Sistema",
    thumbnail: dbState?.invite_blocker?.thumbnail ?? true
  });

  const [status, setStatus] = useState(getInitialState().status);
  const [action, setAction] = useState(getInitialState().action);
  const [deleteMessage, setDeleteMessage] = useState(getInitialState().deleteMessage);
  const [muteTime, setMuteTime] = useState(getInitialState().muteTime);
  const [customMessage, setCustomMessage] = useState(getInitialState().customMessage);
  const [whitelistedChannels, setWhitelistedChannels] = useState<string[]>(getInitialState().whitelistedChannels);
  const [whitelistedRoles, setWhitelistedRoles] = useState<string[]>(getInitialState().whitelistedRoles);
  
  const [embed, setEmbed] = useState(getInitialState().embed);
  const [embedColor, setEmbedColor] = useState(getInitialState().embedColor);
  const [embedTitle, setEmbedTitle] = useState(getInitialState().embedTitle);
  const [thumbnail, setThumbnail] = useState(getInitialState().thumbnail);

  const [newChannel, setNewChannel] = useState('');
  const [newRole, setNewRole] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const data = getInitialState();
    setStatus(data.status);
    setAction(data.action);
    setDeleteMessage(data.deleteMessage);
    setMuteTime(data.muteTime);
    setCustomMessage(data.customMessage);
    setWhitelistedChannels(data.whitelistedChannels);
    setWhitelistedRoles(data.whitelistedRoles);
    setEmbed(data.embed);
    setEmbedColor(data.embedColor);
    setEmbedTitle(data.embedTitle);
    setThumbnail(data.thumbnail);
  }, [dbState?.invite_blocker]);

  const hasChanges = useMemo(() => {
    // A ordem das chaves aqui agora está idêntica ao getInitialState()!
    const current = { 
      status, 
      action, 
      deleteMessage, 
      muteTime, 
      whitelistedChannels, 
      whitelistedRoles,
      customMessage, 
      embed, 
      embedColor, 
      embedTitle, 
      thumbnail
    };
    return JSON.stringify(getInitialState()) !== JSON.stringify(current);
  }, [
    status, action, deleteMessage, muteTime, whitelistedChannels, whitelistedRoles, customMessage,
    embed, embedColor, embedTitle, thumbnail, dbState?.invite_blocker
  ]);

  const handleDiscard = () => {
    const data = getInitialState();
    setStatus(data.status);
    setAction(data.action);
    setDeleteMessage(data.deleteMessage);
    setMuteTime(data.muteTime);
    setCustomMessage(data.customMessage);
    setWhitelistedChannels(data.whitelistedChannels);
    setWhitelistedRoles(data.whitelistedRoles);
    setEmbed(data.embed);
    setEmbedColor(data.embedColor);
    setEmbedTitle(data.embedTitle);
    setThumbnail(data.thumbnail);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = {
        status, action, deleteMessage, muteTime: Number(muteTime), whitelistedChannels, whitelistedRoles, customMessage,
        embed, embedColor, embedTitle, thumbnail
      };
      await onUpdateDb('invite_blocker', updated);
      onTriggerSaveStatus('success', 'Configurações do Bloqueador de Convites salvas!');
    } catch (e: any) {
      onTriggerSaveStatus('error', e.message || 'Erro ao salvar bloqueador.');
    } finally {
      setIsSaving(false);
    }
  };

  const addChannel = () => {
    if (!newChannel) return;
    if (whitelistedChannels.includes(newChannel)) return;
    setWhitelistedChannels([...whitelistedChannels, newChannel]);
    setNewChannel('');
  };

  const removeChannel = (chId: string) => {
    setWhitelistedChannels(whitelistedChannels.filter(c => c !== chId));
  };

  const addRole = () => {
    if (!newRole) return;
    if (whitelistedRoles.includes(newRole)) return;
    setWhitelistedRoles([...whitelistedRoles, newRole]);
    setNewRole('');
  };

  const removeRole = (rlId: string) => {
    setWhitelistedRoles(whitelistedRoles.filter(r => r !== rlId));
  };

  const getChannelName = (id: string) => {
    if (!Array.isArray(discordChannels)) return id;
    const ch = discordChannels.find(c => c.id === id || c.name === id);
    return ch ? ch.name : id;
  };

  const getRoleName = (id: string) => {
    if (!Array.isArray(discordRoles)) return id;
    const role = discordRoles.find(r => r.id === id || r.name === id);
    return role ? role.name : id;
  };

  const formatPreviewMessage = (text: string) => {
    if (!text) return "";
    return text.replaceAll('{user}', '@Infrator').replaceAll('{server}', 'Sistine Server');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-900/30 p-6 rounded-2xl border border-zinc-900">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Octagon className="text-red-400" size={22} />
            Bloqueador de Convites (Anti-Invite)
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            Previna a auto-promoção e divulgação não autorizada excluindo automaticamente links de convites de outros servidores e aplicando punições aos infratores.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <span className="text-xs font-semibold text-zinc-400">Ativar Filtro:</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={status} onChange={(e) => setStatus(e.target.checked)} />
              <div className={`w-11 h-6 rounded-full transition-colors ${status ? 'bg-red-600' : 'bg-zinc-800'}`}></div>
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${status ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </label>
        </div>
      </div>

      {!status && (
        <div className="bg-zinc-900/10 border border-zinc-800/40 rounded-2xl p-8 text-center text-zinc-500">
          <p className="text-sm">O sistema de detecção e bloqueio de convites está atualmente desligado.</p>
        </div>
      )}

      {status && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold text-white block border-b border-zinc-900 pb-2">Regras de Ação & Punição</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Punição Automática</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    <option value="none">🗑️ Nenhuma</option>
                    <option value="warn">⚠️ Advertência (Warn)</option>
                    <option value="mute">🔇 Silenciamento (Mute)</option>
                    <option value="kick">👢 Expulsão (Kick)</option>
                    <option value="ban">🔨 Banimento (Ban)</option>
                  </select>
                </div>
                
                {/* Opcional: Mostra o seletor de mute se a ação for Mute */}
                {action === 'mute' ? (
                  <div className="animate-in fade-in">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-red-400 mb-1.5">
                      <Clock size={12} /> Tempo do Silenciamento
                    </label>
                    <select 
                      value={muteTime} 
                      onChange={(e) => setMuteTime(Number(e.target.value))} 
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value={60}>1 Minuto</option>
                      <option value={300}>5 Minutos</option>
                      <option value={600}>10 Minutos</option>
                      <option value={3600}>1 Hora</option>
                      <option value={86400}>1 Dia (24 Horas)</option>
                      <option value={604800}>1 Semana (7 Dias)</option>
                    </select>
                  </div>
                ) : (
                  <div className="hidden md:block"></div> /* Placeholder para manter o grid alinhado */
                )}
              </div>

              <div className="flex items-center justify-between bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                <div>
                  <span className="block text-[12px] font-bold text-white mb-0.5">Apagar a mensagem original?</span>
                  <span className="text-[10px] text-zinc-500">Se ativo, o bot excluirá a mensagem do infrator que contém o link.</span>
                </div>
                <label className="relative flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" className="sr-only" checked={deleteMessage} onChange={(e) => setDeleteMessage(e.target.checked)} />
                  <div className={`w-9 h-5 rounded-full transition-colors ${deleteMessage ? 'bg-red-600' : 'bg-zinc-800'}`}></div>
                  <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${deleteMessage ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </label>
              </div>

            </div>

            {/* SEÇÃO DE MENSAGEM CUSTOMIZADA (COM EMBED) */}
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold text-white block border-b border-zinc-900 pb-2 flex items-center justify-between">
                Aviso Customizado no Chat
              </span>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Estilo da Mensagem</label>
                <div className="flex items-center gap-2 h-9">
                  <button type="button" onClick={() => setEmbed(true)} className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition cursor-pointer border ${embed ? 'bg-red-600/10 border-red-500/30 text-red-400' : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-400'}`}>Embed Rico</button>
                  <button type="button" onClick={() => setEmbed(false)} className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition cursor-pointer border ${!embed ? 'bg-red-600/10 border-red-500/30 text-red-400' : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-400'}`}>Apenas Texto</button>
                </div>
              </div>

              {embed && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4.5 bg-zinc-950/50 rounded-xl border border-zinc-800/60">
                  <div className="md:col-span-6">
                    <label className="block text-[10px] font-semibold text-zinc-500 mb-1.5">Título do Embed</label>
                    <input type="text" value={embedTitle} onChange={(e) => setEmbedTitle(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg px-3 py-1.5 text-xs text-white" placeholder="Ex: Aviso do Sistema"/>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-semibold text-zinc-500 mb-1.5">Cor Lateral</label>
                    <div className="flex gap-1.5">
                      <input type="color" value={embedColor} onChange={(e) => setEmbedColor(e.target.value)} className="w-8 h-7 p-0 rounded border border-zinc-800 bg-transparent cursor-pointer shrink-0" />
                      <input type="text" value={embedColor} onChange={(e) => setEmbedColor(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg px-2 text-xs text-white font-mono uppercase" maxLength={7} />
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-semibold text-zinc-500 mb-1.5">Foto Infrator</label>
                    <div className="flex items-center gap-1.5 h-7">
                      <button type="button" onClick={() => setThumbnail(true)} className={`flex-1 text-[10px] py-1 rounded transition border ${thumbnail ? 'bg-red-600/10 border-red-500/30 text-red-400' : 'border-zinc-800 text-zinc-500'}`}>Exibir</button>
                      <button type="button" onClick={() => setThumbnail(false)} className={`flex-1 text-[10px] py-1 rounded transition border ${!thumbnail ? 'bg-red-600/10 border-red-500/30 text-red-400' : 'border-zinc-800 text-zinc-500'}`}>Ocultar</button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Texto da Mensagem</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-zinc-700"
                  placeholder="Ex: ⚠️ {user}, não envie links aqui."
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">Variáveis: <span className="text-purple-400 font-bold">{`{user}`}</span> e <span className="text-purple-400 font-bold">{`{server}`}</span> (você pode repetir várias vezes). Se deixar vazio, o aviso não será enviado.</span>
              </div>
            </div>

            {/* Whitelisted channels and roles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                <span className="text-xs font-bold text-white block border-b border-zinc-900 pb-2">Canais Ignorados</span>
                <div className="flex gap-2">
                  <select value={newChannel} onChange={(e) => setNewChannel(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl px-3 py-2 text-xs text-white">
                    <option value="">Selecione...</option>
                    {Array.isArray(discordChannels) && discordChannels.map(ch => <option key={ch.id} value={ch.id}>#{ch.name}</option>)}
                  </select>
                  <button type="button" onClick={addChannel} className="px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs transition border border-zinc-700">Add</button>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {whitelistedChannels.length === 0 ? (
                    <p className="text-[11px] text-zinc-600 italic">Todos os canais bloqueados.</p>
                  ) : (
                    whitelistedChannels.map((ch) => (
                      <div key={ch} className="flex items-center justify-between px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs">
                        <span className="text-zinc-400 font-semibold font-mono">#{getChannelName(ch)}</span> 
                        <button onClick={() => removeChannel(ch)} className="text-zinc-500 hover:text-rose-500 transition"><Trash2 size={12} /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                <span className="text-xs font-bold text-white block border-b border-zinc-900 pb-2">Cargos Ignorados</span>
                <div className="flex gap-2">
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl px-3 py-2 text-xs text-white">
                    <option value="">Selecione...</option>
                    {Array.isArray(discordRoles) && discordRoles.map(role => <option key={role.id} value={role.id}>@{role.name}</option>)}
                  </select>
                  <button type="button" onClick={addRole} className="px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs transition border border-zinc-700">Add</button>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {whitelistedRoles.length === 0 ? (
                    <p className="text-[11px] text-zinc-600 italic">Todos os cargos sujeitos a bloqueio.</p>
                  ) : (
                    whitelistedRoles.map((rl) => (
                      <div key={rl} className="flex items-center justify-between px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs">
                        <span className="text-zinc-400 font-semibold">@ {getRoleName(rl)}</span>
                        <button onClick={() => removeRole(rl)} className="text-zinc-500 hover:text-rose-500 transition"><Trash2 size={12} /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Discord simulation output (Right 5 Columns) */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-5 sticky top-6">
              <span className="text-xs font-bold text-zinc-400 mb-4 flex items-center gap-1.5 uppercase tracking-wider block">
                <MessageSquare size={13} className="text-red-400" />
                Preview do Chat
              </span>

              <div className="space-y-3.5 bg-[#313338] rounded-xl p-4 border border-[#232428] text-white">
                
                {/* 1. Spammer post */}
                <div className={`flex items-start gap-3 transition-all duration-300 ${deleteMessage ? 'opacity-40 grayscale' : ''}`}>
                  <div className="w-10 h-10 rounded-xl shrink-0 bg-zinc-600 overflow-hidden relative">
                    <img src="https://i.postimg.cc/4dqRNGY6/image.png" alt="Infrator" className="w-full h-full object-cover scale-[2] origin-top-left" />
                    {deleteMessage && (
                      <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                        <Trash2 size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-xs ${deleteMessage ? 'text-zinc-400' : 'text-[#f2f3f5]'}`}>Infrator</span>
                      <span className="text-[10px] text-zinc-500 font-mono">hoje às 20:30</span>
                    </div>
                    <p className={`text-xs mt-0.5 ${deleteMessage ? 'text-zinc-500 line-through' : 'text-[#dbdee1]'}`}>
                      Entrem no meu server! <span className={`${deleteMessage ? 'text-zinc-500' : 'text-blue-400 underline'}`}>discord.gg/servidor</span>
                    </p>
                  </div>
                </div>

                {/* 2. Bot action */}
                {(customMessage.trim() !== '' || deleteMessage) && (
                  <div className="flex items-start gap-3 pt-2.5 border-t border-zinc-800/50">
                    {botAvatar ? (
                        <img src={botAvatar} alt="Bot" className="w-10 h-10 object-cover rounded-xl shrink-0" />
                      ) : (
                        <img src="https://i.postimg.cc/MpgXCXRh/aaa.png" alt="Sistine" className="w-10 h-10 p-1.5 rounded-xl bg-purple-700 shrink-0 object-contain"/>
                      )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#f2f3f5] text-xs">{botName ? botName.toUpperCase() : "Sistine"}</span>
                        <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1 rounded uppercase">BOT</span>
                        <span className="text-[10px] text-zinc-400 font-mono">hoje às 20:30</span>
                      </div>

                      {deleteMessage && (
                        <div className="bg-red-500/10 border-l-2 border-red-500 rounded px-2.5 py-1.5 mt-2 max-w-sm text-red-300 text-[11px] font-mono">
                          [MENSAGEM APAGADA POR CONTER CONVITE NÃO AUTORIZADO]
                        </div>
                      )}

                      {/* Renderiza a Custom Message usando as novas config de Embed */}
                      {customMessage.trim() !== '' && (
                        embed ? (
                          <div className="mt-2 border-l-4 rounded-r-md bg-[#2b2d31] p-3 max-w-sm flex gap-3" style={{ borderLeftColor: embedColor }}>
                            <div className="flex-1">
                              <h4 className="font-bold text-xs text-[#f2f3f5]">{embedTitle}</h4>
                              <p className="text-xs text-[#dbdee1] mt-1 whitespace-pre-wrap">{formatPreviewMessage(customMessage)}</p>
                            </div>
                            {thumbnail && (
                              <img src="https://cdn.discordapp.com/embed/avatars/0.png" alt="User" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#1e1f22]" />
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-[#dbdee1] mt-2 whitespace-pre-wrap">{formatPreviewMessage(customMessage)}</p>
                        )
                      )}

                      {action === 'mute' && (
                          <div className="mt-2 text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded w-fit flex items-center gap-1.5">
                            <Clock size={10} />
                            Usuário silenciado por {muteTime >= 3600 ? `${muteTime / 3600} hora(s)` : `${muteTime / 60} minuto(s)`}
                          </div>
                      )}
                    </div>
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
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-xs font-medium text-zinc-200">Você tem alterações não salvas.</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleDiscard} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs transition cursor-pointer">
            Descartar
          </button>
          <button type="button" onClick={handleSave} disabled={isSaving} className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-red-600/15">
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>
      
    </div>
  );
}