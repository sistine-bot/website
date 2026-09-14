import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Hash, 
  Palette, 
  Terminal, 
  Save, 
  Sparkles, 
  MessageSquare, 
  Bot, 
  Shield, 
  Zap, 
  Wheat, 
  Heart, 
  Sprout, 
  ShoppingBag, 
  Wrench, 
  Users, 
  ArrowUpRight, 
  CheckCircle2, 
  ChevronRight, 
  Coins, 
  Trophy, 
  Clock, 
  Droplets,
  Copy,
  Check,
  Star,
  Award,
  TrendingUp,
  SunMedium,
  Layers,
  ArrowRight
} from 'lucide-react';

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
  onTriggerSaveStatus: (type: 'success' | 'error', message: string) => void;
  botAvatar?: string;
  botName?: string;
  user: { id: string; username: string; avatar: string } | null;
  onNavigateSection?: (section: string) => void;
}

// Configurações reais das culturas (baseadas em plantação.js)
const CROPS_DATA = [
  {
    id: 3,
    name: 'Trigo',
    emoji: '🌾',
    time: '2 min',
    water: 'Não precisa de água',
    needsWater: false,
    xp: '+12 XP',
    badge: 'Iniciante',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Cultura de entrada rápida. Perfeita para quem acabou de começar a arar a terra.'
  },
  {
    id: 4,
    name: 'Milho',
    emoji: '🌽',
    time: '5 min',
    water: 'Rega a cada 2.5 min',
    needsWater: true,
    xp: '+18 XP',
    badge: 'Popular',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Excelente retorno em poucos minutos. Requer solo úmido para atingir maturação.'
  },
  {
    id: 5,
    name: 'Feijão',
    emoji: '🫘',
    time: '15 min',
    water: 'Rega a cada 7.5 min',
    needsWater: true,
    xp: '+25 XP',
    badge: 'Essencial',
    badgeColor: 'bg-stone-500/20 text-stone-300 border-stone-500/30',
    description: 'Cultura de tempo moderado com alto valor de mercado e boa recompensa de XP.'
  },
  {
    id: 6,
    name: 'Cana-de-Açúcar',
    emoji: '🎋',
    time: '30 min',
    water: 'Rega a cada 15 min',
    needsWater: true,
    xp: '+35 XP',
    badge: 'Rentável',
    badgeColor: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
    description: 'Ideal para ciclos de conversas no chat do servidor enquanto o canteiro cresce.'
  },
  {
    id: 7,
    name: 'Cenoura',
    emoji: '🥕',
    time: '45 min',
    water: 'Rega a cada 22.5 min',
    needsWater: true,
    xp: '+45 XP',
    badge: 'Avançado',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    description: 'Safra nobre que rende muitas moedas na loja quando colhida com qualidade ⭐ Excelente.'
  },
  {
    id: 8,
    name: 'Abóbora',
    emoji: '🎃',
    time: '90 min',
    water: 'Rega a cada 45 min',
    needsWater: true,
    xp: '+60 XP',
    badge: 'Tesouro Real',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    description: 'A joia dourada dos fazendeiros experientes. Maior recompensa e status no ranking.'
  }
];

// Configurações reais dos animais (baseadas em fazenda.js)
const ANIMALS_DATA = [
  {
    id: 1,
    name: 'Galinha & Pintinho',
    babyEmoji: '🐣',
    adultEmoji: '🐔',
    babyName: 'Pintinho',
    adultName: 'Galinha',
    price: 'R$ 2.500',
    growthTime: '10 min',
    productionTime: '15 min',
    product: 'Ovo Fresco',
    productEmoji: '🥚',
    yieldAmount: '2 a 5 ovos',
    feed: 'Ração Animal',
    interaction: '🐥 Piu piu! O pintinho piou alegremente e se aninhou na sua mão!',
    xpReward: '+35 XP / ciclo',
    gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    borderColor: 'border-amber-500/30',
    accentColor: 'text-amber-400'
  },
  {
    id: 2,
    name: 'Vaca & Bezerro',
    babyEmoji: '🐮',
    adultEmoji: '🐄',
    babyName: 'Bezerro',
    adultName: 'Vaca Leiteira',
    price: 'R$ 7.500',
    growthTime: '20 min',
    productionTime: '30 min',
    product: 'Leite Fresco',
    productEmoji: '🥛',
    yieldAmount: '2 a 5 garrafas',
    feed: 'Ração Animal',
    interaction: '🐮 Muuuu! Lambeu sua mão com carinho e abanou o rabinho alegremente!',
    xpReward: '+60 XP / ciclo',
    gradient: 'from-sky-500/20 via-blue-500/10 to-transparent',
    borderColor: 'border-sky-500/30',
    accentColor: 'text-sky-400'
  },
  {
    id: 3,
    name: 'Porco & Leitão',
    babyEmoji: '🐷',
    adultEmoji: '🐖',
    babyName: 'Leitão',
    adultName: 'Porco Premiado',
    price: 'R$ 15.000',
    growthTime: '35 min',
    productionTime: '50 min',
    product: 'Bacon Selecionado',
    productEmoji: '🥓',
    yieldAmount: '2 a 4 fatias',
    feed: 'Ração Animal',
    interaction: '🐷 Oinc oinc! Deu pulinhos alegres ao receber carinho na barriguinha!',
    xpReward: '+85 XP / ciclo',
    gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    borderColor: 'border-rose-500/30',
    accentColor: 'text-rose-400'
  }
];

const FARM_SLOTS_COSTS = [
  { slot: 'Lote / Baia 1', cost: 'Grátis (Padrão)', free: true },
  { slot: 'Lote / Baia 2', cost: 'R$ 5.000', free: false },
  { slot: 'Lote / Baia 3', cost: 'R$ 10.000 (Plantação) / R$ 12.000 (Rancho)', free: false },
  { slot: 'Lote / Baia 4', cost: 'R$ 20.000 (Plantação) / R$ 25.000 (Rancho)', free: false },
  { slot: 'Lote / Baia 5', cost: 'R$ 35.000 (Plantação) / R$ 45.000 (Rancho)', free: false },
  { slot: 'Lote / Baia 6', cost: 'R$ 50.000 (Plantação) / R$ 70.000 (Rancho)', free: false },
];

export default function OverviewTab({ dbState, channels, serverId, csrfToken, onUpdateDb, onTriggerSaveStatus, botAvatar, botName, user, onNavigateSection }: OverviewTabProps) {
  
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
  const [activeRuralTab, setActiveRuralTab] = useState<'plantacao' | 'fazenda' | 'preview'>('plantacao');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

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

  // Detector de Alterações para a Barra Flutuante
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
    onTriggerSaveStatus?.('success', `Comando ${text} copiado para a área de transferência!`);
  };

  const handleSave = async () => {
    if (!prefix.trim()) {
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

      onTriggerSaveStatus?.('success', 'Configurações da visão geral salvas com sucesso!');
    } catch (e: any) {
      onTriggerSaveStatus?.('error', e.message || 'Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-32 relative">
      
      <div className="pt-4 border-t border-zinc-800/80">
        <div className="mb-6">
          <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2 font-display">
            <Zap size={18} className="text-purple-400" />
            Ajustes Operacionais & Identidade no Discord
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Personalize o prefixo de comandos e a cor das mensagens enviadas pelo bot nas salas do servidor.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CONFIGURAÇÕES GERAIS */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 space-y-5">
              
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

              {/* Canal de Comandos */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-900/60">
                <label className="block text-xs font-semibold text-zinc-300">
                  Canal Dedicado de Comandos (Opcional)
                </label>
                <div className="relative">
                  <Hash size={14} className="absolute left-3.5 top-3 text-zinc-500" />
                  <select
                    value={commandsChannel}
                    onChange={(e) => setCommandsChannel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white cursor-pointer"
                  >
                    <option value="">Liberado em todos os canais</option>
                    {channels.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        #{ch.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-zinc-500">
                  Restrinja os comandos do bot a um canal específico para manter as outras salas organizadas.
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

          {/* SIMULADOR DO DISCORD COM PREVIEW DA COR */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 sticky top-6">
              <span className="text-xs font-bold text-zinc-400 mb-4 flex items-center gap-1.5 uppercase tracking-wider block">
                <MessageSquare size={13} className="text-purple-400" />
                Preview em Tempo Real no Discord
              </span>

              <div className="space-y-4 bg-[#313338] rounded-xl p-4 border border-[#232428] text-white font-sans text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-700 overflow-hidden shrink-0">
                    <img 
                      src={user?.avatar || "https://cdn.discordapp.com/embed/avatars/0.png"} 
                      alt={user?.username || "Guest"} 
                      className="w-full h-full object-cover" 
                    />
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
                      <h4 className="font-bold text-xs text-[#f2f3f5]">Central de Ajuda • {botName || "Sistine"}</h4>
                      <p className="text-xs text-[#dbdee1] mt-1 leading-relaxed">
                        Prefixo ativo: <span className="font-mono bg-zinc-900 px-1 py-0.5 rounded text-purple-300 font-bold">{prefix || "!"}</span>.<br/>
                        🌾 Experimente o comando <span className="font-mono bg-zinc-900 px-1 py-0.5 rounded text-emerald-300">/plantacao</span> ou <span className="font-mono bg-zinc-900 px-1 py-0.5 rounded text-amber-300">/fazenda</span> para começar sua vida no campo!
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