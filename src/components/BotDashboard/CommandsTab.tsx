import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Terminal, Save, Search, Hash, Power, Settings2, Command, ChevronUp } from 'lucide-react';
import type { BotCommand } from '../../types';

interface CommandsTabProps {
  dbState: any;
  commands: BotCommand[];
  onUpdateDb: (key: string, value: any) => Promise<void>;
  onTriggerSaveStatus: (type: 'success' | 'error', message: string) => void;
}

export default function CommandsTab({ dbState, commands, onUpdateDb, onTriggerSaveStatus }: CommandsTabProps) {
  const [disabledCommands, setDisabledCommands] = useState<string[]>(dbState?.disabled_commands || []);
  const [activeTab, setActiveTab] = useState<'prefix' | 'slash'>('slash');
  const [search, setSearch] = useState('');
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

  const { groupedCommands, categories } = useMemo(() => {
    const safeCommands = Array.isArray(commands) ? commands : [];
    const flattenedCommands: BotCommand[] = [];
    
    safeCommands.forEach(cmd => {
      if (cmd.category && cmd.category.toLowerCase() === 'admin') return;

      // FILTRO INTELIGENTE: Filtra apenas SUBCOMANDOS REAIS (Type 1 / SUB_COMMAND)
      const realSubcommands = cmd.options?.filter((opt: any) => 
        opt.type === 1 || opt.type === 'SUB_COMMAND' || opt.type === 2 || opt.type === 'SUB_COMMAND_GROUP'
      ) || [];

      if (realSubcommands.length > 0) {
        // Se tem subcomandos de fato (ex: /servidor info), desmembra
        realSubcommands.forEach((opt: any) => {
          flattenedCommands.push({
            ...cmd,
            name: `${cmd.name} ${opt.name}`,
            description: opt.description || cmd.description,
            options: undefined
          });
        });
      } else {
        // Se só tem argumentos normais (ex: /saldo [usuário]), mantém apenas /saldo
        flattenedCommands.push(cmd);
      }
    });

    const filtered = flattenedCommands.filter(cmd => {
      const cmdType = cmd.type || 'prefix';
      const matchesTab = cmdType === activeTab;
      
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        cmd.name.toLowerCase().includes(searchLower) || 
        (cmd.description && cmd.description.toLowerCase().includes(searchLower));

      return matchesTab && matchesSearch;
    });

    const grouped = filtered.reduce((acc, cmd) => {
      const cat = cmd.category || 'Sem Categoria';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(cmd);
      return acc;
    }, {} as Record<string, BotCommand[]>);

    const cats = Object.keys(grouped).sort();
    return { groupedCommands: grouped, categories: cats };
  }, [commands, activeTab, search]);

  const handleToggleCommand = (cmdName: string) => {
    setDisabledCommands(prev => 
      prev.includes(cmdName) ? prev.filter(c => c !== cmdName) : [...prev, cmdName]
    );
  };

  const scrollToTop = () => {
    const topElement = document.getElementById('commands-top');
    if (topElement) topElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateDb('disabled_commands', disabledCommands);
      onTriggerSaveStatus('success', 'Status dos comandos atualizados com sucesso!');
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

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-900/30 p-6 rounded-2xl border border-zinc-900">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Terminal className="text-blue-400" size={22} />
            Comandos da Sistine
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            Controle quais comandos estão disponíveis no seu servidor!
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-10 shadow-lg shadow-zinc-950/50">
        
        <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-1 shrink-0 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('slash')}
            className={`flex-1 md:w-32 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'slash' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Command size={14} /> Slash ( / )
          </button>
          <button
            onClick={() => setActiveTab('prefix')}
            className={`flex-1 md:w-32 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'prefix' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Hash size={14} /> Prefixo ( ! )
          </button>
        </div>

        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 text-zinc-500" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Buscar por nome ou descrição..."
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 pt-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500 shrink-0 mr-2 flex items-center gap-1.5">
            <Settings2 size={12} /> Pular para:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => scrollToCategory(cat)}
              className="shrink-0 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {categories.length === 0 ? (
        <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
          <Power size={32} className="mx-auto mb-3 text-zinc-600" />
          <p className="text-sm font-semibold text-white">Nenhum comando encontrado!</p>
          <p className="text-xs mt-1">Verifique se o bot está online ou altere sua pesquisa.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map(category => (
            <div key={category} id={`cat-${category}`} className="scroll-mt-24">
              <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/50 pb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {category}
                <span className="text-[10px] font-mono text-zinc-500 ml-2 bg-zinc-900 px-2 py-0.5 rounded-full">
                  {groupedCommands[category].length}
                </span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedCommands[category].map((cmd: any) => {
                  const isDisabled = disabledCommands.includes(cmd.name);
                  const cleanDesc = limpDesc(cmd.description);
                  
                  return (
                    <div 
                      key={cmd.name} 
                      className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
                        isDisabled ? 'bg-zinc-950/50 border-zinc-900 opacity-60 grayscale-[30%]' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-bold truncate flex items-center gap-1.5 ${isDisabled ? 'text-zinc-500' : 'text-zinc-100'}`}>
                            {activeTab === 'slash' ? (
                              <Command size={13} className={isDisabled ? 'text-zinc-600' : 'text-blue-400'} />
                            ) : (
                              <Hash size={13} className={isDisabled ? 'text-zinc-600' : 'text-blue-400'} />
                            )}
                            {cmd.name}
                          </h4>
                          <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2" title={cleanDesc}>
                            {cleanDesc}
                          </p>
                        </div>
                        
                        <label className="relative flex items-center cursor-pointer shrink-0 mt-1">
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
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={scrollToTop}
        className={`fixed bottom-10 right-10 p-3 bg-zinc-800 hover:bg-blue-600 text-zinc-400 hover:text-white rounded-full shadow-xl border border-zinc-700 hover:border-blue-500 transition-all duration-300 cursor-pointer z-50 flex items-center justify-center group ${
          showTopBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        title="Voltar ao topo"
      >
        <ChevronUp size={24} className="group-hover:-translate-y-1 transition-transform" />
      </button>

      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 shadow-2xl rounded-2xl px-6 py-4 flex items-center justify-between gap-8 z-50 transition-all duration-300 w-[90%] max-w-xl ${
        hasChanges ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
          <span className="text-xs font-medium text-zinc-200">Cuidado! Você tem alterações não salvas.</span>
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