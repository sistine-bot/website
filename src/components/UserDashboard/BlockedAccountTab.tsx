import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Ban, 
  Lock, 
  LogOut, 
  ExternalLink, 
  Copy, 
  Check, 
  Calendar, 
  UserX, 
  HelpCircle, 
  ArrowLeft,
  Coins,
  Terminal,
  ServerOff,
  Clock
} from 'lucide-react';
import type { BlacklistData, UserProfile } from '../../types';

interface BlockedAccountTabProps {
  user: UserProfile | null;
  blacklist?: BlacklistData | null;
  onLogout: () => void;
  onNavigateHome: () => void;
  supportLink?: string;
  botName?: string;
  botAvatar?: string;
}

export default function BlockedAccountTab({
  user,
  blacklist,
  onLogout,
  onNavigateHome,
  supportLink = "https://discord.gg/sistine",
  botName = "Sistine",
  botAvatar = ""
}: BlockedAccountTabProps) {
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const getAvatarUrl = () => {
    if (!user) return 'https://cdn.discordapp.com/embed/avatars/0.png';
    if (typeof user.avatar === 'string' && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://'))) {
      return user.avatar;
    }
    if (user.avatar && user.avatar !== 'null' && user.avatar !== 'undefined') {
      const isAnimated = user.avatar.startsWith('a_');
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${isAnimated ? 'gif' : 'png'}?size=128`;
    }
    try {
      const defaultIndex = user.id ? Number((BigInt(user.id) >> 22n) % 6n) : 0;
      return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
    } catch {
      return 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
  };

  const getFormattedDate = (timestamp?: number) => {
    if (!timestamp) return 'Não registrada';
    try {
      return new Date(timestamp).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data indisponível';
    }
  };

  const motivo = blacklist?.motivo || "Violação das diretrizes de segurança ou regras de utilização da Sistine.";
  const staff = blacklist?.staff || "Equipe de Moderação Global";
  const rawTempo = blacklist?.tempo || "Indeterminado (Permanente)";
  // Limpa backticks markdown e formatações de tempo do Discord
  const tempo = typeof rawTempo === 'string' 
    ? rawTempo.replace(/`/g, '').replace(/<t:\d+:R>/g, '').trim() 
    : "Indeterminado (Permanente)";
  const dataAplicacao = getFormattedDate(blacklist?.data);

  return (
    <div className="h-full w-full bg-zinc-950 text-white flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 overflow-y-auto font-sans relative">
      {/* Background Decorativo Sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20 pointer-events-none"></div>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="my-auto relative z-10 w-full max-w-lg bg-zinc-900/95 border border-rose-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl"
      >
        {/* Header Compacto */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-2.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-rose-500/15 border border-rose-500/35 rounded-2xl flex items-center justify-center text-rose-500 shadow-lg shadow-rose-950/40">
              <ShieldAlert size={28} className="animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-rose-600 rounded-full p-1 border-2 border-zinc-900 text-white shadow-sm">
              <Ban size={11} />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-semibold uppercase tracking-wider mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            Acesso Restrito ・ Conta Suspensa
          </div>

          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Você foi banido dos sistemas da {botName}
          </h1>
          <p className="text-zinc-400 text-xs mt-1 max-w-sm leading-relaxed">
            Sua conta está suspensa de todas as funções interativas, comandos no Discord e gerenciamento pelo Painel Web.
          </p>
        </div>

        {/* Card de Dados da Punição */}
        <div className="mt-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3 sm:p-4 space-y-3">
          {/* Usuário Afetado & ID */}
          <div className="flex flex-col xs:flex-row sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                src={getAvatarUrl()} 
                alt={user?.username || 'Avatar'} 
                className="w-9 h-9 rounded-full border border-rose-500/40 object-cover shrink-0 bg-zinc-800" 
              />
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Usuário Afetado</p>
                <p className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1">
                  <span className="truncate">{user?.global_name || user?.username || 'Usuário'}</span>
                  <span className="text-[11px] font-normal text-zinc-500 shrink-0">(@{user?.username || 'desconhecido'})</span>
                </p>
              </div>
            </div>

            {user?.id && (
              <button 
                onClick={handleCopyId}
                className="self-stretch sm:self-center flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition text-[11px] font-mono shrink-0"
                title="Copiar Discord ID"
              >
                {copiedId ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                <span>ID: {user.id}</span>
              </button>
            )}
          </div>

          {/* Grid de Metadados: Duração e Staff */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/60">
              <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mb-0.5">
                <Calendar size={13} className="text-rose-400 shrink-0" />
                <span>Duração</span>
              </div>
              <p className="text-xs font-semibold text-rose-300 font-mono break-words">
                {tempo}
              </p>
            </div>

            <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/60">
              <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mb-0.5">
                <ShieldAlert size={13} className="text-amber-400 shrink-0" />
                <span>Staff Responsável</span>
              </div>
              <p className="text-xs font-semibold text-zinc-200 truncate">
                {staff}
              </p>
            </div>
          </div>

          {/* Data de Aplicação */}
          {blacklist?.data && (
            <div className="flex items-center justify-between text-[10px] text-zinc-500 px-1 font-mono">
              <span className="flex items-center gap-1">
                <Clock size={11} /> Aplicado em:
              </span>
              <span>{dataAplicacao}</span>
            </div>
          )}

          {/* Motivo Oficial */}
          <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/60">
            <p className="text-[11px] text-zinc-400 font-medium mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
              Motivo Oficial:
            </p>
            <div className="p-2 bg-zinc-950/90 rounded-md border border-zinc-900 font-mono text-[11px] text-rose-200/90 whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto">
              {motivo}
            </div>
          </div>
        </div>

        {/* Resumo Compacto das Restrições */}
        <div className="mt-3.5 bg-rose-500/5 border border-rose-500/20 rounded-xl p-3">
          <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Lock size={12} /> Recursos Bloqueados
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <Terminal size={13} className="text-rose-500 shrink-0" />
              <span>Comandos Slash e Mensagens</span>
            </div>
            <div className="flex items-center gap-2">
              <ServerOff size={13} className="text-rose-500 shrink-0" />
              <span>Painel e Servidores</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins size={13} className="text-rose-500 shrink-0" />
              <span>Economia e Lojas</span>
            </div>
            <div className="flex items-center gap-2">
              <Ban size={13} className="text-rose-500 shrink-0" />
              <span>Ganho de XP e Níveis</span>
            </div>
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            onClick={onNavigateHome}
            className="w-full sm:w-auto order-3 sm:order-1 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <ArrowLeft size={13} />
            <span>Página Inicial</span>
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            {supportLink && (
              <a
                href={supportLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/30 transition text-center"
              >
                <HelpCircle size={13} />
                <span>Solicitar Apelação</span>
                <ExternalLink size={11} className="opacity-70" />
              </a>
            )}

            <button
              onClick={onLogout}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-rose-950/60 hover:text-rose-300 border border-zinc-750 hover:border-rose-500/40 text-zinc-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <LogOut size={13} />
              <span>Encerrar Sessão</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
