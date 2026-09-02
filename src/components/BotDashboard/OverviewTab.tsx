import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Hash, Palette, Terminal, Save, Sparkles, MessageSquare, Bot, Shield, Zap } from 'lucide-react';

interface DiscordChannel {
  id: string;
  name: string;
}

interface OverviewTabProps {
  dbState: any;
  channels: DiscordChannel[];
  serverId: string;
  csrfToken: string;
  onUpdateDb: (key: string, value: any) => Promise<void>;
  onTriggerSaveStatus: (type: 'success' | 'error', message: string) => void
  botAvatar?: string;
  botName?: string;
  user: { id: string; username: string; avatar: string } | null;
}

export default function OverviewTab({ dbState, channels, serverId, csrfToken, onUpdateDb, onTriggerSaveStatus, botAvatar, botName, user }: OverviewTabProps) {
  
  const getInitialState = () => ({
    prefix: dbState?.config?.prefix ?? "!",
    commandsChannel: dbState?.config?.commandsChannel ?? "",
    embedColor: dbState?.color?.embed ?? "#831396"
  });

  // Estados Base (Salvos) e Estados Atuais (Em edição)
  const [savedPrefix, setSavedPrefix] = useState<string>(() => getInitialState().prefix);
  const [savedCommandsChannel, setSavedCommandsChannel] = useState<string>(() => getInitialState().commandsChannel);
  const [savedEmbedColor, setSavedEmbedColor] = useState<string>(() => getInitialState().embedColor);

  const [prefix, setPrefix] = useState<string>(() => getInitialState().prefix);
  const [commandsChannel, setCommandsChannel] = useState<string>(() => getInitialState().commandsChannel);
  const [embedColor, setEmbedColor] = useState<string>(() => getInitialState().embedColor);

  const [isSaving, setIsSaving] = useState(false);

  // Sincroniza quando os dados chegarem do Firebase
  useEffect(() => {
    const init = getInitialState();
    setSavedPrefix(init.prefix);
    setPrefix(init.prefix);

    setSavedCommandsChannel(init.commandsChannel);
    setCommandsChannel(init.commandsChannel);

    setSavedEmbedColor(init.embedColor);
    setEmbedColor(init.embedColor);
  }, [dbState?.config?.prefix, dbState?.config?.commandsChannel, dbState?.color?.embed]);

  // Detector de Alterações para a Barra Flutuante (Compara o atual com o salvo localmente)
  const hasChanges = useMemo(() => {
    return prefix !== savedPrefix || commandsChannel !== savedCommandsChannel || embedColor !== savedEmbedColor;
  }, [prefix, commandsChannel, embedColor, savedPrefix, savedCommandsChannel, savedEmbedColor]);

  const handleDiscard = () => {
    setPrefix(savedPrefix);
    setCommandsChannel(savedCommandsChannel);
    setEmbedColor(savedEmbedColor);
  };

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= 3) {
      setPrefix(val);
    }
  };

  const handleSave = async () => {
    if (!prefix.trim()) {
      // Uso do ?. evita que o app quebre se a prop não for enviada
      onTriggerSaveStatus?.('error', 'O prefixo do bot não pode ficar em branco.');
      return;
    }

    setIsSaving(true);
    try {
      const cleanPrefix = prefix.trim();

      const updatedConfig = {
        ...(dbState?.config || {}),
        prefix: cleanPrefix,
        commandsChannel: commandsChannel
      };
      await onUpdateDb('config', updatedConfig);

      const updatedColor = {
        ...(dbState?.color || {}),
        embed: embedColor
      };
      await onUpdateDb('color', updatedColor);

      setSavedPrefix(cleanPrefix);
      setSavedCommandsChannel(commandsChannel);
      setSavedEmbedColor(embedColor);

      // Chamada segura com optional chaining ?.
      onTriggerSaveStatus?.('success', 'Configurações da visão geral salvas com sucesso!');
    } catch (e: any) {
      onTriggerSaveStatus?.('error', e.message || 'Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-28 relative">
      
      {/* BANNER / CABEÇALHO */}
      <div className="bg-gradient-to-r from-purple-900/30 via-zinc-900/40 to-zinc-900/30 p-6 md:p-8 rounded-3xl border border-zinc-800/80 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {botAvatar ? (
              <img src={botAvatar} alt="Bot Avatar" className="w-16 h-16 rounded-2xl border-2 border-purple-500/30 object-cover shadow-lg shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Bot size={32} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Painel Central - {botName ? botName : "Sistine"}
                </h2>
                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  v2.0 Active
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                Bem-vindo ao centro de controle! Gerencie a identidade do bot, padronize as cores das mensagens, ajuste o prefixo de comandos e restrinja salas de atendimento em poucos cliques.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CONFIGURAÇÕES GERAIS */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 space-y-5">
            <span className="text-xs font-bold text-white block border-b border-zinc-900 pb-3 uppercase tracking-wider flex items-center gap-2">
              <Zap size={14} className="text-purple-400" />
              Ajustes de Identidade & Operação
            </span>

            {/* Prefixo dos Comandos */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                Prefixo dos Comandos de Texto
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Terminal size={14} className="absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="text"
                    value={prefix}
                    onChange={handlePrefixChange}
                    maxLength={3}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-mono font-bold"
                    placeholder="Ex: !"
                  />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 border border-zinc-800/80 px-3 py-2.5 rounded-xl shrink-0">
                  {prefix.length}/3 chars
                </span>
              </div>
              <p className="text-[10px] text-zinc-500">
                Caractere digitado antes das mensagens para acionar os comandos clássicos (ex: <span className="text-purple-400 font-mono">{prefix || "!"}help</span>).
              </p>
            </div>

            {/* Cor das Embeds */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-900/60">
              <label className="block text-xs font-semibold text-zinc-300">
                Cor Padrão das Embeds (Cartões do Bot)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={embedColor}
                  onChange={(e) => setEmbedColor(e.target.value)}
                  className="w-10 h-10 p-1 rounded-xl border border-zinc-800 bg-zinc-950 cursor-pointer shrink-0"
                />
                <div className="relative flex-1">
                  <Palette size={14} className="absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="text"
                    value={embedColor}
                    onChange={(e) => setEmbedColor(e.target.value)}
                    maxLength={7}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-mono uppercase font-bold"
                    placeholder="#831396"
                  />
                </div>
              </div>
              <p className="text-[10px] text-zinc-500">
                Define a faixa de cor lateral usada em anúncios, logs, respostas de comandos e mensagens de aviso.
              </p>
            </div>

            {/* Canal de Comandos */}
            {/* <div className="space-y-1.5 pt-2 border-t border-zinc-900/60">
              <label className="block text-xs font-semibold text-zinc-300">
                Canal Exclusivo para Comandos
              </label>
              <select
                value={commandsChannel}
                onChange={(e) => setCommandsChannel(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white cursor-pointer"
              >
                <option value="">Permitir comandos em todos os canais de texto</option>
                {Array.isArray(channels) && channels.map((canal) => (
                  <option key={canal.id} value={canal.id}>#{canal.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500">
                Se selecionado, os comandos de texto serão aceitos apenas nesta sala (administradores ignoram esta restrição).
              </p>
            </div> */}

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/20 border border-zinc-900/80 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Shield size={14} className="text-emerald-400" />
                Segurança Ativa
              </span>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Proteção anti-invites, moderação automática de termos e logs de punições integrados ao sistema.
              </p>
            </div>

            <div className="bg-zinc-900/20 border border-zinc-900/80 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-400" />
                Sincronização em Tempo Real
              </span>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Qualquer alteração salva no painel é aplicada no bot sem a necessidade de reiniciá-lo.
              </p>
            </div>
          </div>
        </div>

        {/* SIMULADOR DO DISCORD */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-5 sticky top-6">
            <span className="text-xs font-bold text-zinc-400 mb-4 flex items-center gap-1.5 uppercase tracking-wider block">
              <MessageSquare size={13} className="text-purple-400" />
              Preview de Resposta no Chat
            </span>

            <div className="space-y-4 bg-[#313338] rounded-xl p-4 border border-[#232428] text-white font-sans text-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-700 overflow-hidden shrink-0">
                  <img src={user?.avatar || "https://i.postimg.cc/9QYx00L8/avatar.png"} alt={user?.username || "Guest"} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[#f2f3f5]">{user?.username || "Guest"}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">hoje às 12:00</span>
                  </div>
                  <p className="text-xs text-[#dbdee1] mt-0.5 font-mono">
                    {prefix || "!"}ajuda
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-zinc-800/60">
                {botAvatar ? (
                  <img src={botAvatar} alt="Bot" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-purple-700 flex items-center justify-center shrink-0">
                    <Bot size={18} className="text-white" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#f2f3f5] text-xs">{botName ? botName : "Sistine"}</span>
                    <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1 rounded uppercase">BOT</span>
                    <span className="text-[10px] text-zinc-400 font-mono">hoje às 12:00</span>
                  </div>

                  <div 
                    className="mt-2 border-l-4 rounded-r-md bg-[#2b2d31] p-3 max-w-sm transition-all"
                    style={{ borderLeftColor: embedColor || "#831396" }}
                  >
                    <h4 className="font-bold text-xs text-[#f2f3f5]">Central de Ajuda</h4>
                    <p className="text-xs text-[#dbdee1] mt-1 leading-relaxed">
                      Meu prefixo neste servidor é <span className="font-mono bg-zinc-900 px-1 py-0.5 rounded text-purple-300">{prefix || "!"}</span>. Use <span className="font-mono bg-zinc-900 px-1 py-0.5 rounded text-purple-300">{prefix || "!"}comandos</span> para ver a lista de recursos disponíveis.
                    </p>
                    
                    {commandsChannel && (
                      <div className="mt-2.5 pt-2 border-t border-zinc-700/40 text-[10px] text-zinc-400 flex items-center gap-1">
                        <Hash size={10} className="text-purple-400" />
                        Comandos restritos à sala selecionada.
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* BARRA FLUTUANTE DE SALVAMENTO */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 shadow-2xl rounded-2xl px-6 py-4 flex items-center justify-between gap-8 z-50 transition-all duration-300 w-[90%] max-w-xl ${
        hasChanges ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></div>
          <span className="text-xs font-medium text-zinc-200">Você tem alterações não salvas na visão geral.</span>
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