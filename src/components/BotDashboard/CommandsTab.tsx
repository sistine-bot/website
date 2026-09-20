import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Terminal, Search, X, CheckCircle2, XCircle, Power, Settings2, Command, Hash, ChevronUp, Filter } from 'lucide-react';
import type { BotCommand } from '../../types';

interface CommandsTabProps {
  dbState: any;
  commands: BotCommand[];
  onUpdateDb: (key: string, value: any) => Promise<void>;
  onTriggerSaveStatus: (type: 'success' | 'error', message: string) => void;
}

/**
 * Mapeamento de aliases frequentes para busca avançada de comandos
 */
const COMMAND_ALIASES: Record<string, string[]> = {
  transações: ['transacoes', 'transacao', 'extrato', 'historico'],
  saldo: ['bal', 'money', 'carteira', 'banco'],
  inventário: ['inv', 'inventario', 'mochila'],
  perfil: ['profile', 'p'],
  daily: ['diario', 'diário', 'd'],
  semanal: ['weekly'],
  apostar: ['aposta', 'bet'],
  jokenpo: ['jkp', 'ppt', 'pedra', 'papel', 'tesoura'],
  slotmachine: ['slot', 'slots', 'cacaniquel', 'caça-níquel'],
  raspadinha: ['raspar'],
  corrida: ['race'],
  blackjack: ['bj', '21'],
  depositar: ['dep', 'deposito', 'depósito'],
  sacar: ['saque', 'with', 'withdraw'],
  transferir: ['pay', 'pagar', 'pix', 'doar'],
  loja: ['shop', 'store'],
  market: ['mercado', 'mkt'],
  vender: ['sell'],
  fazenda: ['farm'],
  plantação: ['plantacao', 'plantar'],
  recuperar: ['repair', 'reparar', 'consertar'],
  assaltar: ['roubar', 'rob', 'assalto'],
  crime: ['delito'],
  namorar: ['namoro', 'marry', 'casar'],
  casamento: ['casados', 'matrimonio', 'matrimônio'],
  reputação: ['reputacao', 'rep'],
  nível: ['nivel', 'rank', 'xp'],
  vip: ['vips', 'beneficios'],
  trabalhar: ['work', 'trampar', 'trampo'],
  emprego: ['empregos', 'jobs', 'job'],
  estatísticas: ['estatisticas', 'stats'],
  help: ['ajuda', 'comandos'],
  botinfo: ['info', 'bot'],
  servidor: ['server'],
  usuário: ['usuario', 'user'],
  tempo: ['cooldowns', 'cd'],
  lembrete: ['lembretes', 'remind'],
  caçar: ['cacar', 'hunt'],
  pescar: ['pesca', 'fish'],
  top: ['ranking', 'ranks', 'leaderboard']
};

/**
 * Metadados visuais das categorias
 */
const CATEGORY_META: Record<string, { label: string; icon: string; border: string }> = {
  economia: { label: 'Economia', icon: '💸', border: 'border-emerald-500/30' },
  apostas: { label: 'Apostas & Cassino', icon: '🎰', border: 'border-purple-500/30' },
  modulos: { label: 'Módulos & RP', icon: '⚙️', border: 'border-amber-500/30' },
  utilidades: { label: 'Utilidades', icon: '🛠️', border: 'border-blue-500/30' },
};

function normalizeStr(s?: string): string {
  return s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
}

export default function CommandsTab({ dbState, commands, onUpdateDb, onTriggerSaveStatus }: CommandsTabProps) {
  const [disabledCommands, setDisabledCommands] = useState<string[]>(dbState?.disabled_commands || []);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [isSaving, setIsSaving] = useState(false);

  const [showTopBtn, setShowTopBtn] = useState(false);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  const hasChanges = useMemo(() => {
    const initial = dbState?.disabled_commands || [];
    if (disabledCommands.length !== initial.length) return true;
    return !disabledCommands.every(c => initial.includes(c));
  }, [disabledCommands, dbState]);

  const handleDiscard = () => {
    setDisabledCommands(dbState?.disabled_commands || []);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowTopBtn(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (topSentinelRef.current) observer.observe(topSentinelRef.current);
    return () => observer.disconnect();
  }, []);

  const limpDesc = (mensagem?: string) => {
    if (!mensagem) return "Sem descrição";
    return mensagem
      .replace('⌊⚙️ Módulos⌉', '')
      .replace('⌊🛠️ Utilidades⌉', '')
      .replace('⌊😂 Diversão⌉', '')
      .replace('⌊🎰 Apostas⌉', '')
      .replace('⌊💸 Economia⌉', '')
      .trim();
  };

  // 1. Processa e unifica a lista de comandos (eliminando duplicatas entre slash e prefixo)
  const unifiedCommands = useMemo(() => {
    const safeCommands = Array.isArray(commands) ? commands : [];
    const flattenedCommands: (BotCommand & { baseName: string })[] = [];
    const seenNames = new Set<string>();

    // Ordena priorizando comandos Slash
    const sorted = [...safeCommands].sort((a, b) => {
      if (a.type === 'slash' && b.type !== 'slash') return -1;
      if (b.type === 'slash' && a.type !== 'slash') return 1;
      return 0;
    });

    sorted.forEach(cmd => {
      if (cmd.category && cmd.category.toLowerCase() === 'admin') return;
      const baseKey = cmd.name.toLowerCase().trim();
      if (seenNames.has(baseKey)) return;
      seenNames.add(baseKey);

      // Desmembra subcomandos reais para permitir controle granular no painel
      const realSubcommands = cmd.options?.filter((opt: any) => 
        opt.type === 1 || opt.type === 'SUB_COMMAND' || opt.type === 2 || opt.type === 'SUB_COMMAND_GROUP'
      ) || [];

      if (realSubcommands.length > 0) {
        realSubcommands.forEach((opt: any) => {
          flattenedCommands.push({
            ...cmd,
            baseName: cmd.name,
            name: `${cmd.name} ${opt.name}`,
            description: opt.description || cmd.description,
            options: undefined
          });
        });
      } else {
        flattenedCommands.push({
          ...cmd,
          baseName: cmd.name
        });
      }
    });

    return flattenedCommands;
  }, [commands]);

  // 2. Extrai categorias disponíveis
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    unifiedCommands.forEach(cmd => {
      if (cmd.category) cats.add(cmd.category.toLowerCase());
    });
    return Array.from(cats).sort();
  }, [unifiedCommands]);

  // 3. Aplica busca inteligente e filtros
  const { filteredCommands, groupedCommands, displayCategories, stats } = useMemo(() => {
    const searchNorm = normalizeStr(search);

    const filtered = unifiedCommands.filter(cmd => {
      const isDisabled = disabledCommands.includes(cmd.name);

      // Filtro de Status
      if (statusFilter === 'enabled' && isDisabled) return false;
      if (statusFilter === 'disabled' && !isDisabled) return false;

      // Filtro de Categoria
      if (selectedCategory !== 'all' && cmd.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Filtro de Busca Acentuação / Descrição / Nome / Categoria / Aliases
      if (searchNorm) {
        const nameNorm = normalizeStr(cmd.name);
        const descNorm = normalizeStr(cmd.description);
        const catNorm = normalizeStr(cmd.category);
        const baseKey = normalizeStr(cmd.baseName);
        const aliases = COMMAND_ALIASES[baseKey] || [];
        const matchesAlias = aliases.some(al => normalizeStr(al).includes(searchNorm));

        const matches = 
          nameNorm.includes(searchNorm) ||
          descNorm.includes(searchNorm) ||
          catNorm.includes(searchNorm) ||
          matchesAlias;

        if (!matches) return false;
      }

      return true;
    });

    // Agrupamento por categoria
    const grouped = filtered.reduce((acc, cmd) => {
      const cat = cmd.category ? cmd.category.toLowerCase() : 'geral';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(cmd);
      return acc;
    }, {} as Record<string, typeof filtered>);

    const sortedCats = Object.keys(grouped).sort();

    const totalCount = unifiedCommands.length;
    const disabledCount = unifiedCommands.filter(c => disabledCommands.includes(c.name)).length;
    const enabledCount = totalCount - disabledCount;

    return {
      filteredCommands: filtered,
      groupedCommands: grouped,
      displayCategories: sortedCats,
      stats: {
        total: totalCount,
        enabled: enabledCount,
        disabled: disabledCount,
        filteredCount: filtered.length
      }
    };
  }, [unifiedCommands, disabledCommands, search, selectedCategory, statusFilter]);

  const handleToggleCommand = (cmdName: string) => {
    setDisabledCommands(prev => 
      prev.includes(cmdName) ? prev.filter(c => c !== cmdName) : [...prev, cmdName]
    );
  };

  const handleBulkToggleCategory = (catName: string, disableAll: boolean) => {
    const catCmds = groupedCommands[catName] || [];
    const catCmdNames = catCmds.map(c => c.name);

    setDisabledCommands(prev => {
      if (disableAll) {
        const set = new Set([...prev, ...catCmdNames]);
        return Array.from(set);
      } else {
        return prev.filter(c => !catCmdNames.includes(c));
      }
    });
  };

  const scrollToTop = () => {
    const topElement = document.getElementById('commands-top');
    if (topElement) topElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateDb('disabled_commands', disabledCommands);
      onTriggerSaveStatus('success', 'Status dos comandos atualizados com sucesso para Slash e Prefixo!');
    } catch (e: any) {
      onTriggerSaveStatus('error', e.message || 'Erro ao salvar os comandos.');
    } finally {
      setIsSaving(false);
    }
  };

  const scrollToCategory = (category: string) => {
    const element = document.getElementById(`cat-${category}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div id="commands-top" className="space-y-6 max-w-6xl mx-auto pb-12 relative">
      
      <div ref={topSentinelRef} className="absolute top-0 w-full h-1 pointer-events-none opacity-0" />

      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Terminal className="text-blue-400" size={22} />
            Comandos da Sistine
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Gerencie a disponibilidade dos comandos em seu servidor. Ao desativar um comando aqui, ele é bloqueado <strong>tanto via Slash (<code className="text-blue-300">/</code>) quanto via Prefixo (<code className="text-emerald-300">!</code>)</strong> simultaneamente.
          </p>
        </div>

        {/* Resumo Rápido de Status */}
        <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 px-3.5 py-2 rounded-xl shrink-0 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 size={14} />
            <span>{stats.enabled} Ativos</span>
          </div>
          <span className="text-zinc-700">•</span>
          <div className="flex items-center gap-1.5 text-rose-400 font-medium">
            <XCircle size={14} />
            <span>{stats.disabled} Desativados</span>
          </div>
        </div>
      </div>

      {/* Barra de Pesquisa Avançada e Filtros */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 sticky top-0 z-10 shadow-xl shadow-zinc-950/60 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Input de Busca com Clear Button */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-3 text-zinc-500 pointer-events-none" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition outline-none"
              placeholder="Buscar por nome, descrição, categoria ou apelido (ex: transações, bal, pix, farm, jkp)..."
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-200 transition p-0.5 rounded cursor-pointer"
                title="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtros de Status */}
          <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-1 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'all' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('enabled')}
              className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                statusFilter === 'enabled' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 shadow-sm' : 'text-zinc-500 hover:text-emerald-400'
              }`}
            >
              <CheckCircle2 size={13} />
              Ativos ({stats.enabled})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('disabled')}
              className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                statusFilter === 'disabled' ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40 shadow-sm' : 'text-zinc-500 hover:text-rose-400'
              }`}
            >
              <XCircle size={13} />
              Desativados ({stats.disabled})
            </button>
          </div>
        </div>

        {/* Filtros por Categorias (Chips) */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pt-1">
          <span className="text-[10px] uppercase font-bold text-zinc-500 shrink-0 mr-1 flex items-center gap-1">
            <Filter size={11} /> Categoria:
          </span>

          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer border ${
              selectedCategory === 'all' 
                ? 'bg-blue-600 border-blue-500 text-white' 
                : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todas
          </button>

          {allCategories.map(cat => {
            const meta = CATEGORY_META[cat] || { label: cat.toUpperCase(), icon: '📁' };
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer border flex items-center gap-1.5 ${
                  isSelected 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navegação Rápida entre Categorias */}
      {displayCategories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          <span className="text-[10px] uppercase font-bold text-zinc-500 shrink-0 mr-1 flex items-center gap-1">
            <Settings2 size={11} /> Pular para:
          </span>
          {displayCategories.map(cat => {
            const meta = CATEGORY_META[cat] || { label: cat, icon: '📁' };
            return (
              <button
                key={cat}
                type="button"
                onClick={() => scrollToCategory(cat)}
                className="shrink-0 px-2.5 py-1 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
              >
                {meta.icon} {meta.label} ({groupedCommands[cat]?.length || 0})
              </button>
            );
          })}
        </div>
      )}

      {/* Estado Vazio de Busca */}
      {displayCategories.length === 0 ? (
        <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
          <Power size={32} className="mx-auto mb-3 text-zinc-600" />
          <p className="text-sm font-semibold text-white">Nenhum comando encontrado!</p>
          <p className="text-xs mt-1 text-zinc-500">
            Nenhum resultado para "{search}" com os filtros selecionados.
          </p>
          {(search || selectedCategory !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
                setStatusFilter('all');
              }}
              className="mt-4 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg transition cursor-pointer"
            >
              Limpar Filtros e Busca
            </button>
          )}
        </div>
      ) : (
        /* Lista de Comandos Agrupados */
        <div className="space-y-8">
          {displayCategories.map(category => {
            const meta = CATEGORY_META[category] || { label: category.toUpperCase(), icon: '📁' };
            const catCommands = groupedCommands[category] || [];
            const allCatDisabled = catCommands.every(c => disabledCommands.includes(c.name));

            return (
              <div key={category} id={`cat-${category}`} className="scroll-mt-32">
                
                {/* Header da Categoria com Ações em Massa */}
                <div className="flex items-center justify-between gap-4 mb-3 border-b border-zinc-800/80 pb-2.5">
                  <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
                    <span className="text-base">{meta.icon}</span>
                    <span className="uppercase">{meta.label}</span>
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                      {catCommands.length} {catCommands.length === 1 ? 'comando' : 'comandos'}
                    </span>
                  </h3>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleBulkToggleCategory(category, false)}
                      className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 hover:underline transition cursor-pointer"
                    >
                      Ativar todos
                    </button>
                    <span className="text-zinc-700">•</span>
                    <button
                      type="button"
                      onClick={() => handleBulkToggleCategory(category, true)}
                      className="text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:underline transition cursor-pointer"
                    >
                      Desativar todos
                    </button>
                  </div>
                </div>
                
                {/* Grid de Cards de Comandos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catCommands.map((cmd) => {
                    const isDisabled = disabledCommands.includes(cmd.name);
                    const cleanDesc = limpDesc(cmd.description);
                    const baseKey = normalizeStr(cmd.baseName);
                    const aliases = COMMAND_ALIASES[baseKey] || [];
                    
                    return (
                      <div 
                        key={cmd.name} 
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3.5 ${
                          isDisabled 
                            ? 'bg-zinc-950/60 border-zinc-900 opacity-60 grayscale-[30%]' 
                            : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            
                            {/* Título do Comando com Badge Universal */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span 
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 shrink-0 ${
                                  isDisabled 
                                    ? 'bg-zinc-900 text-zinc-500 border-zinc-800' 
                                    : 'bg-blue-950/60 text-blue-300 border-blue-800/50'
                                }`}
                                title="Disponível via Slash Command ( / ) e Mensagem de Prefixo ( ! )"
                              >
                                <Command size={10} className="text-blue-400" />
                                <span className="text-zinc-500 font-normal">/</span>
                                <Hash size={10} className="text-emerald-400" />
                              </span>

                              <h4 className={`text-sm font-bold truncate ${isDisabled ? 'text-zinc-500' : 'text-zinc-100'}`}>
                                {cmd.name}
                              </h4>
                            </div>

                            <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed" title={cleanDesc}>
                              {cleanDesc}
                            </p>

                            {/* Tags de Aliases se houver */}
                            {aliases.length > 0 && (
                              <div className="mt-2 flex items-center gap-1 flex-wrap">
                                <span className="text-[9px] uppercase font-bold text-zinc-600">Apelidos:</span>
                                {aliases.slice(0, 3).map(alias => (
                                  <span key={alias} className="text-[9px] font-mono text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800/80">
                                    !{alias}
                                  </span>
                                ))}
                                {aliases.length > 3 && (
                                  <span className="text-[9px] text-zinc-600">+{aliases.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Toggle Switch */}
                          <label className="relative flex items-center cursor-pointer shrink-0 mt-0.5">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={!isDisabled}
                              onChange={() => handleToggleCommand(cmd.name)}
                            />
                            <div className={`w-10 h-5 rounded-full transition-colors ${!isDisabled ? 'bg-blue-600' : 'bg-zinc-800'}`}></div>
                            <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${!isDisabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                          </label>
                        </div>

                        {/* Rodapé do Card com Status Explícito */}
                        <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between text-[10px]">
                          <span className={isDisabled ? 'text-rose-400 font-medium flex items-center gap-1' : 'text-emerald-400 font-medium flex items-center gap-1'}>
                            {isDisabled ? (
                              <>
                                <XCircle size={11} /> Desativado no servidor
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={11} /> Ativo (/ e !)
                              </>
                            )}
                          </span>

                          <span className="text-zinc-600">
                            {isDisabled ? 'Slash & Prefixo bloqueados' : 'Disponível para membros'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Botão Flutuante de Voltar ao Topo */}
      <button
        type="button"
        onClick={scrollToTop}
        className={`fixed bottom-10 right-10 p-3 bg-zinc-800 hover:bg-blue-600 text-zinc-400 hover:text-white rounded-full shadow-xl border border-zinc-700 hover:border-blue-500 transition-all duration-300 cursor-pointer z-50 flex items-center justify-center group ${
          showTopBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        title="Voltar ao topo"
      >
        <ChevronUp size={24} className="group-hover:-translate-y-1 transition-transform" />
      </button>

      {/* Barra de Alterações Não Salvas */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 shadow-2xl rounded-2xl px-6 py-4 flex items-center justify-between gap-8 z-50 transition-all duration-300 w-[90%] max-w-xl ${
        hasChanges ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
          <span className="text-xs font-medium text-zinc-200">Cuidado! Você tem alterações não salvas nos comandos.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDiscard}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            Descartar
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-600/15"
          >
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}