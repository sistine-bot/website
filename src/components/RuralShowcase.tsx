import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, 
  Heart, 
  Coins, 
  Check, 
  Copy, 
  TrendingUp, 
  Sparkles,
  ChevronRight,
  BookOpen,
  Repeat,
  MousePointerClick,
  Layers,
  MessageCircle,
  ShoppingBag,
  Hash,
  Eye,
  X,
  Bell,
  Pin,
  Users
} from 'lucide-react';

interface RuralShowcaseProps {
  onAddBot?: () => void;
  onOpenDocs?: () => void;
  botName?: string;
  botAvatar?: string;
}

interface EphemeralMessage {
  id: string;
  content: React.ReactNode;
  timestamp: string;
}

// Grade minimalista de safras (apenas ícone e nome para ilustrar variedade sem sobrecarga cognitiva)
const MINIMAL_CROPS = [
  { name: 'Trigo', emoji: '🌾' },
  { name: 'Milho', emoji: '🌽' },
  { name: 'Feijão', emoji: '🫘' },
  { name: 'Cana-de-Açúcar', emoji: '🎋' },
  { name: 'Cenoura', emoji: '🥕' },
  { name: 'Abóbora', emoji: '🎃' },
];

// Grade minimalista de animais da fazenda
const MINIMAL_ANIMALS = [
  { name: 'Galinha', babyEmoji: '🐣', adultEmoji: '🐔', item: 'Ovos Frescos' },
  { name: 'Vaca', babyEmoji: '🐮', adultEmoji: '🐄', item: 'Leite Fresco' },
  { name: 'Porco', babyEmoji: '🐷', adultEmoji: '🐖', item: 'Bacon Selecionado' },
];

export function RuralShowcase({ onAddBot, onOpenDocs, botName, botAvatar }: RuralShowcaseProps) {
  const [activeTab, setActiveTab] = useState<'plantacao' | 'fazenda'>('plantacao');
  const [previewMode, setPreviewMode] = useState<'plantacao' | 'fazenda'>('plantacao');
  const [ephemeralReply, setEphemeralReply] = useState<EphemeralMessage | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Estado do Bot Logado (com fetch automático de fallback)
  const [botInfo, setBotInfo] = useState<{ name: string; avatar: string }>({
    name: botName || 'Sistine',
    avatar: botAvatar || '/src/utils/assets/logo.png',
  });

  useEffect(() => {
    if (botName || botAvatar) {
      setBotInfo({
        name: botName || 'Sistine',
        avatar: botAvatar || '/src/utils/assets/logo.png',
      });
    } else {
      fetch('/api/status')
        .then((res) => res.json())
        .then((data) => {
          if (data && (data.botName || data.botAvatar)) {
            setBotInfo({
              name: data.botName || 'Sistine',
              avatar: data.botAvatar || '/src/utils/assets/logo.png',
            });
          }
        })
        .catch(() => {});
    }
  }, [botName, botAvatar]);

  const switchMode = (mode: 'plantacao' | 'fazenda') => {
    setActiveTab(mode);
    setPreviewMode(mode);
  };

  const triggerEphemeral = (content: React.ReactNode) => {
    const now = new Date();
    const timeStr = `hoje às ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setEphemeralReply({
      id: Math.random().toString(36).substring(7),
      content,
      timestamp: timeStr,
    });
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard?.writeText(cmd);
    setCopied(cmd);
    setTimeout(() => setCopied(null), 2000);
  };

  const botInviteUrl = "https://discord.com/oauth2/authorize?client_id=123&permissions=8&scope=bot";

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 relative overflow-hidden">
      
      {/* Iluminações atmosféricas suaves */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* CABEÇALHO DA SEÇÃO: FOCO NO BENEFÍCIO E RETENÇÃO */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-4 relative z-10">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <TrendingUp size={14} className="text-emerald-400" />
          <span>Comunidade Ativa & Retenção Orgânica</span>
        </div>

        {/* H2 baseado no maior argumento de venda */}
        <h2 className="font-display font-black text-3xl sm:text-5xl lg:text-5xl tracking-tight text-white leading-[1.15]">
          Aumente a retenção e faça os membros <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
            voltarem todos os dias
          </span>
        </h2>

        <p className="text-zinc-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Sem esforço manual da equipe para manter conversas vivas. Com os módulos de Plantação e Rancho, sua comunidade cria hábitos diários no chat: regar, colher, cuidar de filhotes e movimentar a economia juntos.
        </p>

        {/* Seletor de Modo Centralizado */}
        <div className="pt-3 flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-xl">
            <button
              type="button"
              onClick={() => switchMode('plantacao')}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'plantacao'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              <span className="text-base">🌾</span>
              <span>Plantação Dinâmica</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('fazenda')}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'fazenda'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              <span className="text-base">🐮</span>
              <span>Rancho & Adoção</span>
            </button>
          </div>
        </div>
      </div>

      {/* GRID PRINCIPAL: ESQUERDA (PROPOSTA DE VALOR & CTAs) | DIREITA (MOCKUP INTERATIVO VALORIZADO) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-14 items-center relative z-10">
        
        {/* ========================================================= */}
        {/* LADO ESQUERDO: ARGUMENTAÇÃO LIMPA, BULLETS E CTAs         */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-6">
          
          <AnimatePresence mode="wait">
            {activeTab === 'plantacao' ? (
              <motion.div
                key="tab-plantacao"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Cabeçalho do Módulo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Sprout size={14} />
                      Módulo de Agricultura
                    </span>
                    <button
                      type="button"
                      onClick={() => copyCommand('/plantacao')}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/20 text-emerald-300 font-mono text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copied === '/plantacao' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      /plantacao
                    </button>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white font-display">
                    Engajamento com ciclos de retorno rápido
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    O ciclo de rega e colheita cria um ritmo de retorno espontâneo. O usuário planta no servidor e retorna ao chat naturalmente para cuidar da safra.
                  </p>
                </div>

                {/* 4 Bullet Points Curtos e Escaneáveis */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-emerald-500/20 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <Repeat size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Retorno Diário Recorrente</h4>
                      <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                        Ciclos rápidos motivam membros a abrir o canal várias vezes ao dia para regar e colher.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-emerald-500/20 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Qualidade Dinâmica do Solo</h4>
                      <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                        Membros dedicados colhem safras raras com alto valor de revenda na economia.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-emerald-500/20 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                      <MousePointerClick size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">100% Nativo via Botões</h4>
                      <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                        Sem sintaxes complicadas. Tudo funciona através dos botões nativos do Discord.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-emerald-500/20 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                      <Layers size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Progressão & Expansão de Lotes</h4>
                      <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                        Jogadores reinvestem suas moedas para desbloquear até 6 terrenos de cultivo.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grade Minimalista de Variedade (Apenas ícones e nomes) */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                      <span>🌾</span> Variedade de Culturas
                    </span>
                    <span className="text-zinc-500 font-mono">6 Safras Disponíveis</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {MINIMAL_CROPS.map((crop, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950/70 border border-zinc-800/60 hover:border-emerald-500/30 transition-colors"
                      >
                        <span className="text-lg">{crop.emoji}</span>
                        <span className="text-xs font-medium text-zinc-200 truncate">{crop.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="tab-fazenda"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Cabeçalho do Módulo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Heart size={14} />
                      Módulo de Rancho & Adoção
                    </span>
                    <button
                      type="button"
                      onClick={() => copyCommand('/fazenda')}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-amber-500/20 text-amber-300 font-mono text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copied === '/fazenda' ? <Check size={12} className="text-amber-400" /> : <Copy size={12} />}
                      /fazenda
                    </button>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white font-display">
                    Laços emocionais que geram conversas no chat
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Animais virtuais ativam o senso de cuidado. Membros dão carinho nos filhotes, compartilham reações e cooperam na alimentação diária.
                  </p>
                </div>

                {/* 4 Bullet Points Curtos e Escaneáveis */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-amber-500/20 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                      <Heart size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Afeição Diária & Carinho</h4>
                      <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                        Dar carinho reduz o tempo de crescimento do filhote e gera reações fofas no chat.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-amber-500/20 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Produção Periódica de Itens</h4>
                      <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                        Animais adultos produzem ovos, leite e bacon para alimentar o comércio interno.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-amber-500/20 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                      <MessageCircle size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Socialização Espontânea</h4>
                      <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                        Filhotes viram mascotes da comunidade, gerando tópicos orgânicos de conversa.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-amber-500/20 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <Coins size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Economia Circular & Valorização</h4>
                      <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                        Criações valorizam com a idade e podem ser vendidas com retorno integral.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grade Minimalista de Variedade (Apenas ícones e nomes) */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                      <span>🐮</span> Espécies para Criar
                    </span>
                    <span className="text-zinc-500 font-mono">Do Filhote à Produção</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {MINIMAL_ANIMALS.map((animal, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center text-center p-2 rounded-xl bg-zinc-950/70 border border-zinc-800/60 hover:border-amber-500/30 transition-colors"
                      >
                        <span className="text-base">{animal.babyEmoji} ➔ {animal.adultEmoji}</span>
                        <span className="text-xs font-medium text-zinc-200 mt-1">{animal.name}</span>
                        <span className="text-[10px] text-zinc-500 truncate mt-0.5">{animal.item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* HIERARQUIA DE AÇÃO (CTA) */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* CTA Primário Vibrante e Isolado */}
            <a
              href={onAddBot ? undefined : botInviteUrl}
              onClick={onAddBot}
              target={onAddBot ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Sparkles size={16} className="text-emerald-200" />
              <span>Adicionar ao Servidor</span>
            </a>

            {/* CTA Secundário Discreto */}
            <a
              href={onOpenDocs ? undefined : "/wiki"}
              onClick={onOpenDocs}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-semibold text-xs transition cursor-pointer whitespace-nowrap"
            >
              <BookOpen size={14} />
              <span>Ler Documentação Completa</span>
              <ChevronRight size={13} className="text-zinc-500" />
            </a>
          </div>

        </div>

        {/* ========================================================= */}
        {/* LADO DIREITO: MOCKUP INTERATIVO AUTÊNTICO DO DISCORD      */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 xl:col-span-7 relative">
          
          {/* Brilho de fundo sutil dando destaque ao Discord Mockup */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-purple-500/10 to-amber-500/10 rounded-3xl blur-2xl -z-10" />

          {/* Cabeçalho do Simulador: Mais respiro e valorização */}
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-zinc-300 font-bold">Simulação Autêntica do Discord</span>
              <span className="hidden sm:inline text-zinc-500">• Clique nos botões para testar</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              100% Interativo
            </span>
          </div>

          {/* Caixa estilo Janela do Discord com padding e acabamento refinado */}
          <div className="rounded-3xl bg-[#1e1f22] border border-[#2b2d31] shadow-2xl overflow-hidden ring-1 ring-white/5">
            
            {/* Barra superior de canal do Discord */}
            <div className="px-4 py-2.5 bg-[#2b2d31] border-b border-[#1e1f22] flex items-center justify-between select-none">
              <div className="flex items-center gap-2 min-w-0">
                <Hash size={18} className="text-[#80848e] shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-[#f2f3f5] truncate">fazenda-e-plantacao</span>
                <span className="hidden md:inline text-zinc-500 font-normal text-xs">|</span>
                <span className="hidden md:inline text-xs text-[#949ba4] truncate max-w-[220px]">
                  Plantações, animais e economia diária
                </span>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {/* Alternador de Modo estilo Discord Pill */}
                <div className="flex items-center bg-[#1e1f22] p-0.5 rounded-lg border border-[#35373c]/40">
                  <button
                    type="button"
                    onClick={() => switchMode('plantacao')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      previewMode === 'plantacao' 
                        ? 'bg-[#248046] text-white shadow-sm' 
                        : 'text-[#949ba4] hover:text-[#dbdee1]'
                    }`}
                  >
                    🌾 Plantação
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('fazenda')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      previewMode === 'fazenda' 
                        ? 'bg-[#248046] text-white shadow-sm' 
                        : 'text-[#949ba4] hover:text-[#dbdee1]'
                    }`}
                  >
                    🐮 Fazenda
                  </button>
                </div>

                {/* Ícones autênticos da barra do Discord */}
                <div className="hidden sm:flex items-center gap-2 text-[#b5bac1] pl-1 border-l border-[#35373c]/60">
                  <Bell size={15} className="hover:text-[#dbdee1] cursor-pointer" />
                  <Pin size={15} className="hover:text-[#dbdee1] cursor-pointer" />
                  <Users size={15} className="hover:text-[#dbdee1] cursor-pointer" />
                </div>
              </div>
            </div>

            {/* Chat Body com Mensagens Autênticas do Discord */}
            <div className="p-4 sm:p-6 bg-[#313338] text-white font-sans text-xs space-y-3">
              
              {/* Linha de Slash Command do Usuário no Discord */}
              <div className="flex items-center gap-2 text-[12px] text-[#949ba4] font-medium pl-1 select-none">
                <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] text-white font-bold shrink-0">
                  U
                </div>
                <span className="font-semibold text-[#dbdee1] hover:underline cursor-pointer">Você</span>
                <span>usou</span>
                <span className="text-[#00a8fc] hover:underline cursor-pointer font-medium bg-[#5865F2]/10 px-1 py-0.5 rounded text-[11px]">
                  /{previewMode === 'plantacao' ? 'plantação' : 'fazenda'}
                </span>
              </div>

              {/* Mensagem Principal do Bot */}
              <div className="flex items-start gap-3.5 group">
                
                {/* Imagem do Bot Logado com Fallback */}
                <div className="relative shrink-0">
                  <img
                    src={botInfo.avatar}
                    alt={botInfo.name}
                    className="w-10 h-10 rounded-full object-cover bg-purple-700 ring-1 ring-black/20"
                    onError={(e) => {
                      (e.target as HTMLElement).src = '/src/utils/assets/logo.png';
                    }}
                  />
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  
                  {/* Cabeçalho do Bot: Nome, APP/BOT Badge e Horário */}
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-semibold text-sm text-[#f2f3f5] hover:underline cursor-pointer">
                      {botInfo.name}
                    </span>
                    <span className="bg-[#5865f2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] uppercase leading-none flex items-center gap-0.5">
                      <Check size={9} strokeWidth={3} />
                      APP
                    </span>
                    <span className="text-[11px] text-[#949ba4] ml-1">hoje às 18:42</span>
                  </div>

                  {/* ========================================================================= */}
                  {/* EMBED 1: CÓPIA EXATA DE src/SlashCommand/modulos/plantação.js            */}
                  {/* ========================================================================= */}
                  {previewMode === 'plantacao' ? (
                    <div className="border-l-[4px] border-[#10b981] rounded-[4px] bg-[#2b2d31] p-4 space-y-3 text-xs shadow-md">
                      
                      {/* Autor da Embed */}
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-600/30 flex items-center justify-center text-[10px] shrink-0">
                          🌾
                        </div>
                        <span className="font-bold text-[#f2f3f5] text-xs">
                          🌾 Plantação de Você
                        </span>
                      </div>

                      {/* Descrição Exata de plantação.js com HTML para Bolds e Quotes */}
                      <div className="text-[#dbdee1] text-[12px] leading-relaxed space-y-2.5 font-sans">
                        
                        {/* Blockquote do topo */}
                        <blockquote className="border-l-[3px] border-[#4e5058] pl-2.5 text-[#949ba4] text-[12px] my-1 leading-snug">
                          Cuide de seus terrenos, mantenha suas ferramentas prontas e colha produtos de alta qualidade.
                        </blockquote>

                        {/* Seção Ferramentas & Equipamentos */}
                        <div className="space-y-0.5 pt-1">
                          <div className="font-bold text-[#f2f3f5] text-[12px]">
                            🛠️ Ferramentas &amp; Equipamentos:
                          </div>
                          <div>
                            ⛏️ Enxada: <strong className="font-bold text-[#f2f3f5]">100%</strong> durabilidade
                          </div>
                          <div>
                            🚿 Regador: <strong className="font-bold text-[#f2f3f5]">85%</strong> durabilidade • 💧 Água: <strong className="font-bold text-[#f2f3f5]">80%</strong>
                          </div>
                          <div>
                            💰 Carteira: <strong className="font-bold text-[#f2f3f5]">R$ 14.850</strong>
                          </div>
                        </div>

                        {/* Seção Seus Terrenos */}
                        <div className="space-y-0.5 pt-1">
                          <div className="font-bold text-[#f2f3f5] text-[12px]">
                            🌱 Seus Terrenos:
                          </div>
                          <div>
                            🌾 <strong className="font-bold text-[#f2f3f5]">Lote 1</strong> - <strong className="font-bold text-[#f2f3f5]">Trigo</strong> • <strong className="font-bold text-[#f2f3f5]">Pronto para Colher!</strong> (⭐ Excelente)
                          </div>
                          <div>
                            🌽 <strong className="font-bold text-[#f2f3f5]">Lote 2</strong> - <strong className="font-bold text-[#f2f3f5]">Milho</strong> • Crescendo (<span className="text-[#00a8fc] bg-[#5865F2]/10 px-1 py-0.5 rounded text-[11px]">em 2 minutos</span>) • 💧 Regado
                          </div>
                          <div>
                            🌱 <strong className="font-bold text-[#f2f3f5]">Lote 3</strong> - Solo Arado (Vazio) • Pronto para plantar
                          </div>
                          <div className="text-[#949ba4]">
                            🔒 <strong className="font-bold text-[#b5bac1]">Lote 4</strong> - Bloqueado (R$ 20.000)
                          </div>
                          <div className="text-[#949ba4]">
                            🔒 <strong className="font-bold text-[#b5bac1]">Lote 5</strong> - Bloqueado (R$ 35.000)
                          </div>
                          <div className="text-[#949ba4]">
                            🔒 <strong className="font-bold text-[#b5bac1]">Lote 6</strong> - Bloqueado (R$ 50.000)
                          </div>
                        </div>
                      </div>

                      {/* Footer Exato da Embed */}
                      <div className="pt-2 border-t border-[#35373c] text-[10px] text-[#949ba4] flex items-center justify-between">
                        <span>Clique nos botões abaixo para gerenciar seus lotes | Expansão fluida ativa</span>
                        <span className="font-mono">hoje às 18:42</span>
                      </div>

                    </div>
                  ) : (
                    /* ========================================================================= */
                    /* EMBED 2: CÓPIA EXATA DE src/SlashCommand/modulos/fazenda.js               */
                    /* ========================================================================= */
                    <div className="border-l-[4px] border-[#22c55e] rounded-[4px] bg-[#2b2d31] p-4 space-y-3 text-xs shadow-md">
                      
                      {/* Autor da Embed */}
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-amber-600/30 flex items-center justify-center text-[10px] shrink-0">
                          👨‍🌾
                        </div>
                        <span className="font-bold text-[#f2f3f5] text-xs">
                          👨‍🌾 Fazenda de Você
                        </span>
                      </div>

                      {/* Descrição Exata de fazenda.js com HTML para Bolds e Quotes */}
                      <div className="text-[#dbdee1] text-[12px] leading-relaxed space-y-2.5 font-sans">
                        
                        {/* Blockquotes do topo */}
                        <blockquote className="border-l-[3px] border-[#4e5058] pl-2.5 text-[#949ba4] text-[12px] my-1 leading-snug space-y-0.5">
                          <div>Cuide dos seus animais alimentando, dando carinho e colhendo seus valiosos produtos.</div>
                          <div>Adquira filhotes nos espaços vazios e ajude-os a crescerem fortes e produtivos!</div>
                        </blockquote>

                        {/* Seção Estoque & Recursos */}
                        <div className="space-y-0.5 pt-1">
                          <div className="font-bold text-[#f2f3f5] text-[12px]">
                            📦 Estoque &amp; Recursos:
                          </div>
                          <div>
                            🥫 Ração Animal: <strong className="font-bold text-[#f2f3f5]">5</strong> un. • 💰 Carteira: <strong className="font-bold text-[#f2f3f5]">R$ 26.300</strong>
                          </div>
                          <div>
                            🧺 Armazém de Produtos: 🥚 <strong className="font-bold text-[#f2f3f5]">8</strong> Ovos • 🥛 <strong className="font-bold text-[#f2f3f5]">4</strong> Leites • 🥓 <strong className="font-bold text-[#f2f3f5]">2</strong> Bacons
                          </div>
                          <div>
                            🐾 Ocupação do Rancho: <strong className="font-bold text-[#f2f3f5]">2/3</strong> (🐣 Filhotes: <strong className="font-bold text-[#f2f3f5]">1</strong> | 🏆 Adultos: <strong className="font-bold text-[#f2f3f5]">1</strong>)
                          </div>
                        </div>

                        {/* Seção Seus Espaços do Rancho */}
                        <div className="space-y-0.5 pt-1">
                          <div className="font-bold text-[#f2f3f5] text-[12px]">
                            🏡 Seus Espaços do Rancho:
                          </div>
                          <div>
                            🐣 <strong className="font-bold text-[#f2f3f5]">Espaço 1</strong> - <strong className="font-bold text-[#f2f3f5]">Pintinho</strong> (Filhote) • [████░░░] <strong className="font-bold text-[#f2f3f5]">60%</strong> (<span className="text-[#00a8fc] bg-[#5865F2]/10 px-1 py-0.5 rounded text-[11px]">em 4 minutos</span>) • 🍼 Alimentado • ❤️ <strong className="font-bold text-[#f2f3f5]">85%</strong> Amor
                          </div>
                          <div>
                            🧺 <strong className="font-bold text-[#f2f3f5]">Espaço 2</strong> - <strong className="font-bold text-[#f2f3f5]">Vaca</strong> • 🥛 <strong className="font-bold text-[#f2f3f5]">Leites Prontos para Coletar!</strong> (⭐ Amor: 90%)
                          </div>
                          <div>
                            🪹 <strong className="font-bold text-[#f2f3f5]">Espaço 3</strong> - Rancho Vazio • Pronto para abrigar um filhote
                          </div>
                          <div className="text-[#949ba4]">
                            🔒 <strong className="font-bold text-[#b5bac1]">Espaço 4</strong> - Bloqueado (R$ 25.000)
                          </div>
                          <div className="text-[#949ba4]">
                            🔒 <strong className="font-bold text-[#b5bac1]">Espaço 5</strong> - Bloqueado (R$ 45.000)
                          </div>
                          <div className="text-[#949ba4]">
                            🔒 <strong className="font-bold text-[#b5bac1]">Espaço 6</strong> - Bloqueado (R$ 70.000)
                          </div>
                        </div>
                      </div>

                      {/* Footer Exato da Embed */}
                      <div className="pt-2 border-t border-[#35373c] text-[10px] text-[#949ba4] flex items-center justify-between">
                        <span>Clique nos espaços abaixo para gerenciar ou alimentar seus animais | 6 Espaços Modulares</span>
                        <span className="font-mono">hoje às 18:42</span>
                      </div>

                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* ACTION ROWS DE BOTÕES IDÊNTICOS AOS ARQUIVOS .JS                          */}
                  {/* ========================================================================= */}
                  {previewMode === 'plantacao' ? (
                    <div className="space-y-1.5 pt-1 select-none">
                      {/* Linha 1 de botões: Lotes 1 a 3 */}
                      <div className="flex flex-wrap gap-2">
                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              <div className="mb-1">
                                🌾 <span className="text-[#4e5058] font-bold">|</span> <span className="bg-[#5865f2]/20 text-[#c9cdfb] font-medium px-1 py-0.5 rounded-[3px]">@Você</span>, você colheu o <strong className="font-bold text-[#f2f3f5]">Lote 1</strong>!
                              </div>
                              <blockquote className="border-l-[3px] border-[#4e5058] pl-2 text-[#949ba4] text-[11px] my-0.5 space-y-0.5">
                                <div>Qualidade: ⭐ <strong className="font-bold text-[#f2f3f5]">EXCELENTE</strong>! (+50% valor e XP)</div>
                                <div>Recebido: <strong className="font-bold text-[#f2f3f5]">4x Trigo</strong> e <em className="italic text-[#dbdee1]">18 XP</em>!</div>
                              </blockquote>
                            </div>
                          )}
                          className="h-8 px-3.5 rounded-[4px] bg-[#248046] hover:bg-[#1a6334] active:bg-[#15512b] text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                        >
                          <span className="text-sm">🌾</span>
                          <span>Lote 1 (Colher)</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              💧 <span className="text-[#4e5058] font-bold">|</span> <span className="bg-[#5865f2]/20 text-[#c9cdfb] font-medium px-1 py-0.5 rounded-[3px]">@Você</span>, você regou seu <strong className="font-bold text-[#f2f3f5]">Milho</strong> no <strong className="font-bold text-[#f2f3f5]">Lote 2</strong>! A planta continua crescendo forte e saudável. (💧 Água restante: <strong className="font-bold text-[#f2f3f5]">75%</strong>)
                            </div>
                          )}
                          className="h-8 px-3.5 rounded-[4px] bg-[#4e5058] hover:bg-[#6d6f78] active:bg-[#80848e] text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                        >
                          <span className="text-sm">⏳</span>
                          <span>Lote 2</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              <div className="mb-1">
                                🌱 <span className="text-[#4e5058] font-bold">|</span> <span className="bg-[#5865f2]/20 text-[#c9cdfb] font-medium px-1 py-0.5 rounded-[3px]">@Você</span>, selecione a semente para o <strong className="font-bold text-[#f2f3f5]">Lote 3</strong>:
                              </div>
                              <blockquote className="border-l-[3px] border-[#4e5058] pl-2 text-[#949ba4] text-[11px] my-0.5 space-y-0.5">
                                <div>🌾 <strong className="font-bold text-[#f2f3f5]">Trigo</strong>: 2m (+12 XP) • 🌽 <strong className="font-bold text-[#f2f3f5]">Milho</strong>: 5m (+18 XP)</div>
                                <div>🫘 <strong className="font-bold text-[#f2f3f5]">Feijão</strong>: 15m (+25 XP) • 🎋 <strong className="font-bold text-[#f2f3f5]">Cana</strong>: 30m (+35 XP)</div>
                                <div>🥕 <strong className="font-bold text-[#f2f3f5]">Cenoura</strong>: 45m (+45 XP) • 🎃 <strong className="font-bold text-[#f2f3f5]">Abóbora</strong>: 1h 30m (+60 XP)</div>
                              </blockquote>
                            </div>
                          )}
                          className="h-8 px-3.5 rounded-[4px] bg-[#4e5058] hover:bg-[#6d6f78] active:bg-[#80848e] text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                        >
                          <span className="text-sm">🌱</span>
                          <span>Lote 3</span>
                        </button>
                      </div>

                      {/* Linha 2 de botões: Lotes 4 a 6 (bloqueados) */}
                      <div className="flex flex-wrap gap-2">
                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              🔒 <span className="text-[#4e5058] font-bold">|</span> Este lote está bloqueado. Use o botão <strong className="font-bold text-[#f2f3f5]">Expandir Terreno</strong> abaixo para desbloqueá-lo!
                            </div>
                          )}
                          className="h-8 px-3.5 rounded-[4px] bg-[#4e5058] hover:bg-[#6d6f78] active:bg-[#80848e] text-zinc-300 text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                        >
                          <span className="text-sm">🔒</span>
                          <span>Lote 4</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              🔒 <span className="text-[#4e5058] font-bold">|</span> Este lote está bloqueado. Desbloqueie primeiro o Lote 4 para liberar o Lote 5!
                            </div>
                          )}
                          className="h-8 px-3.5 rounded-[4px] bg-[#4e5058] hover:bg-[#6d6f78] active:bg-[#80848e] text-zinc-300 text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                        >
                          <span className="text-sm">🔒</span>
                          <span>Lote 5</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              🔒 <span className="text-[#4e5058] font-bold">|</span> Este lote está bloqueado. Desbloqueie os lotes anteriores para expandir ao máximo!
                            </div>
                          )}
                          className="h-8 px-3.5 rounded-[4px] bg-[#4e5058] hover:bg-[#6d6f78] active:bg-[#80848e] text-zinc-300 text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                        >
                          <span className="text-sm">🔒</span>
                          <span>Lote 6</span>
                        </button>
                      </div>

                      {/* Linha 3 de botões: Ações Utilitárias */}
                      <div className="flex flex-wrap gap-2">
                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              🎉 <span className="text-[#4e5058] font-bold">|</span> Parabéns <span className="bg-[#5865f2]/20 text-[#c9cdfb] font-medium px-1 py-0.5 rounded-[3px]">@Você</span>! Você expandiu seu terreno com sucesso e liberou o <strong className="font-bold text-[#f2f3f5]">Lote 4</strong>!
                            </div>
                          )}
                          className="h-8 px-3 rounded-[4px] bg-[#248046] hover:bg-[#1a6334] active:bg-[#15512b] text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                        >
                          <span className="text-sm">🌱</span>
                          <span>Expandir Terreno (R$ 20.000)</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              💧 <span className="text-[#4e5058] font-bold">|</span> <span className="bg-[#5865f2]/20 text-[#c9cdfb] font-medium px-1 py-0.5 rounded-[3px]">@Você</span>, você encheu o seu <strong className="font-bold text-[#f2f3f5]">Regador</strong> com sucesso! (Nível de Água: <strong className="font-bold text-[#f2f3f5]">100%</strong>).
                            </div>
                          )}
                          className="h-8 px-3 rounded-[4px] bg-[#5865f2] hover:bg-[#4752c4] active:bg-[#3c45a5] text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                        >
                          <span className="text-sm">💧</span>
                          <span>Encher Regador</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              🔄 <span className="text-[#4e5058] font-bold">|</span> Informações dos terrenos e ferramentas atualizadas com sucesso!
                            </div>
                          )}
                          className="h-8 px-3 rounded-[4px] bg-[#4e5058] hover:bg-[#6d6f78] active:bg-[#80848e] text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                          title="Atualizar"
                        >
                          <span className="text-sm">🔄</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-1 select-none">
                      {/* Linha 1 de botões: Espaços 1 a 3 */}
                      <div className="flex flex-wrap gap-2">
                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              <div className="mb-1">
                                ❤️ <span className="text-[#4e5058] font-bold">|</span> <span className="bg-[#5865f2]/20 text-[#c9cdfb] font-medium px-1 py-0.5 rounded-[3px]">@Você</span> fez carinho no seu <strong className="font-bold text-[#f2f3f5]">Pintinho</strong>!
                              </div>
                              <blockquote className="border-l-[3px] border-[#4e5058] pl-2 text-[#949ba4] text-[11px] my-0.5 space-y-0.5">
                                <div className="italic text-[#dbdee1]">🐥 Piu piu! O pintinho piou alegremente e se aninhou na sua mão!</div>
                                <div>Nível de Amor: <strong className="font-bold text-[#f2f3f5]">85%</strong> <em className="italic text-[#dbdee1]">(+10 XP)</em> <span className="text-emerald-400 font-semibold">(+1m de crescimento antecipado!)</span></div>
                              </blockquote>
                            </div>
                          )}
                          className="h-8 px-3.5 rounded-[4px] bg-[#4e5058] hover:bg-[#6d6f78] active:bg-[#80848e] text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                        >
                          <span className="text-sm">🐣</span>
                          <span>Espaço 1 (Pintinho)</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              <div className="mb-1">
                                🧺 <span className="text-[#4e5058] font-bold">|</span> <span className="bg-[#5865f2]/20 text-[#c9cdfb] font-medium px-1 py-0.5 rounded-[3px]">@Você</span>, você coletou os produtos de sua <strong className="font-bold text-[#f2f3f5]">Vaca</strong> no <strong className="font-bold text-[#f2f3f5]">Espaço 2</strong>!
                              </div>
                              <blockquote className="border-l-[3px] border-[#4e5058] pl-2 text-[#949ba4] text-[11px] my-0.5 space-y-0.5">
                                <div>Qualidade: ⭐ <strong className="font-bold text-[#f2f3f5]">PRODUÇÃO DE OURO!</strong> (Animal radiante de felicidade, rendimento máximo &amp; +50% XP)</div>
                                <div>Recebido: 🥛 <strong className="font-bold text-[#f2f3f5]">5x Leite</strong> e <em className="italic text-[#dbdee1]">+35 XP</em>!</div>
                              </blockquote>
                            </div>
                          )}
                          className="h-8 px-3.5 rounded-[4px] bg-[#248046] hover:bg-[#1a6334] active:bg-[#15512b] text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                        >
                          <span className="text-sm">🧺</span>
                          <span>Espaço 2 (Coletar)</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              <div className="mb-1">
                                🐣 <span className="text-[#4e5058] font-bold">|</span> Escolha um filhote para abrigar no <strong className="font-bold text-[#f2f3f5]">Espaço 3</strong>:
                              </div>
                              <blockquote className="border-l-[3px] border-[#4e5058] pl-2 text-[#949ba4] text-[11px] my-0.5 space-y-0.5">
                                <div>• 🐣 <strong className="font-bold text-[#f2f3f5]">Pintinho</strong>: R$ 2.500 (Gera ovos a cada 15m)</div>
                                <div>• 🐮 <strong className="font-bold text-[#f2f3f5]">Bezerro</strong>: R$ 7.500 (Gera leite fresco a cada 30m)</div>
                                <div>• 🐷 <strong className="font-bold text-[#f2f3f5]">Leitão</strong>: R$ 15.000 (Gera bacon especial a cada 50m)</div>
                              </blockquote>
                            </div>
                          )}
                          className="h-8 px-3.5 rounded-[4px] bg-[#4e5058] hover:bg-[#6d6f78] active:bg-[#80848e] text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                        >
                          <span className="text-sm">🪹</span>
                          <span>Espaço 3 (Adotar)</span>
                        </button>
                      </div>

                      {/* Linha 2 de botões: Espaços 4 a 6 (bloqueados) */}
                      <div className="flex flex-wrap gap-2">
                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              🔒 <span className="text-[#4e5058] font-bold">|</span> Este espaço está bloqueado. Use o botão <strong className="font-bold text-[#f2f3f5]">Expandir Rancho</strong> abaixo para liberá-lo!
                            </div>
                          )}
                          className="h-8 px-3.5 rounded-[4px] bg-[#4e5058] hover:bg-[#6d6f78] active:bg-[#80848e] text-zinc-300 text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                        >
                          <span className="text-sm">🔒</span>
                          <span>Espaço 4</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              🔒 <span className="text-[#4e5058] font-bold">|</span> Este espaço está bloqueado. Desbloqueie o Espaço 4 primeiro para progredir!
                            </div>
                          )}
                          className="h-8 px-3.5 rounded-[4px] bg-[#4e5058] hover:bg-[#6d6f78] active:bg-[#80848e] text-zinc-300 text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                        >
                          <span className="text-sm">🔒</span>
                          <span>Espaço 5</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              🔒 <span className="text-[#4e5058] font-bold">|</span> Este espaço está bloqueado. Expanda as baias anteriores para atingir o nível máximo!
                            </div>
                          )}
                          className="h-8 px-3.5 rounded-[4px] bg-[#4e5058] hover:bg-[#6d6f78] active:bg-[#80848e] text-zinc-300 text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                        >
                          <span className="text-sm">🔒</span>
                          <span>Espaço 6</span>
                        </button>
                      </div>

                      {/* Linha 3 de botões: Ações Utilitárias do Rancho */}
                      <div className="flex flex-wrap gap-2">
                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              🎉 <span className="text-[#4e5058] font-bold">|</span> Parabéns <span className="bg-[#5865f2]/20 text-[#c9cdfb] font-medium px-1 py-0.5 rounded-[3px]">@Você</span>! Você expandiu seu rancho com sucesso e desbloqueou o <strong className="font-bold text-[#f2f3f5]">Espaço 4</strong>!
                            </div>
                          )}
                          className="h-8 px-3 rounded-[4px] bg-[#248046] hover:bg-[#1a6334] active:bg-[#15512b] text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                        >
                          <span className="text-sm">🏡</span>
                          <span>Expandir Rancho (R$ 25.000)</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              🥫 <span className="text-[#4e5058] font-bold">|</span> <span className="bg-[#5865f2]/20 text-[#c9cdfb] font-medium px-1 py-0.5 rounded-[3px]">@Você</span>, você comprou <strong className="font-bold text-[#f2f3f5]">3x Ração Animal</strong> por <strong className="font-bold text-[#f2f3f5]">R$ 900</strong>! Seu estoque foi abastecido.
                            </div>
                          )}
                          className="h-8 px-3 rounded-[4px] bg-[#5865f2] hover:bg-[#4752c4] active:bg-[#3c45a5] text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                        >
                          <span className="text-sm">🥫</span>
                          <span>Comprar Ração (3x)</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => triggerEphemeral(
                            <div className="text-[12px] text-[#dbdee1] leading-relaxed">
                              🔄 <span className="text-[#4e5058] font-bold">|</span> Informações dos animais e celeiro atualizadas com sucesso!
                            </div>
                          )}
                          className="h-8 px-3 rounded-[4px] bg-[#4e5058] hover:bg-[#6d6f78] active:bg-[#80848e] text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:translate-y-[1px]"
                          title="Atualizar"
                        >
                          <span className="text-sm">🔄</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* RESPOSTA EFÊMERA (EPHEMERAL MESSAGE) AUTÊNTICA DO DISCORD                */}
                  {/* ========================================================================= */}
                  <AnimatePresence>
                    {ephemeralReply && (
                      <motion.div
                        key={ephemeralReply.id}
                        initial={{ opacity: 0, y: 8, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.99 }}
                        transition={{ duration: 0.15 }}
                        className="mt-3 pt-3 border-t border-[#35373c]/60 relative"
                      >
                        {/* Top Ephemeral Badge do Discord com botão Dispensar */}
                        <div className="flex items-center justify-between text-[11px] text-[#949ba4] mb-2 px-0.5 select-none">
                          <div className="flex items-center gap-1.5">
                            <Eye size={13} className="text-[#949ba4]" />
                            <span>Apenas você pode ver isto</span>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => setEphemeralReply(null)}
                              className="text-[#00a8fc] hover:underline cursor-pointer font-medium"
                            >
                              Dispensar mensagem
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEphemeralReply(null)}
                            className="text-[#949ba4] hover:text-[#dbdee1] p-0.5 rounded cursor-pointer"
                            title="Dispensar"
                          >
                            <X size={13} />
                          </button>
                        </div>

                        {/* Mensagem Efêmera do Bot */}
                        <div className="flex items-start gap-3">
                          <img
                            src={botInfo.avatar}
                            alt={botInfo.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0 bg-purple-700 ring-1 ring-black/20"
                            onError={(e) => {
                              (e.target as HTMLElement).src = '/src/utils/assets/logo.png';
                            }}
                          />
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-1.5 leading-none">
                              <span className="font-semibold text-xs text-[#f2f3f5] hover:underline cursor-pointer">
                                {botInfo.name}
                              </span>
                              <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1 py-0.5 rounded-[3px] uppercase leading-none flex items-center gap-0.5">
                                <Check size={8} strokeWidth={3} />
                                APP
                              </span>
                              <span className="text-[10px] text-[#949ba4] ml-1">{ephemeralReply.timestamp}</span>
                            </div>

                            {/* Conteúdo da Mensagem Efêmera */}
                            <div className="p-2.5 rounded-[4px] bg-[#2b2d31] border border-[#1e1f22] shadow">
                              {ephemeralReply.content}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>

            </div>

            {/* Rodapé explicativo do simulador */}
            <div className="px-4 py-2.5 bg-[#2b2d31] text-[11px] text-[#949ba4] flex items-center justify-between border-t border-[#1e1f22] select-none">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Interaja ao vivo com os botões autênticos do Discord acima
              </span>
              <span className="font-mono text-[10px] text-zinc-400">Preview 100% Fiel</span>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
