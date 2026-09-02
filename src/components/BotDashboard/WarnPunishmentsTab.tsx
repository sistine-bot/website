import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Save, AlertCircle, ChevronRight, HelpCircle, Clock } from 'lucide-react';

interface WarnPunishmentsTabProps {
  dbState: any;
  onUpdateDb: (key: string, value: any) => Promise<void>;
  onTriggerSaveStatus: (type: 'success' | 'error', message: string) => void;
}

export default function WarnPunishmentsTab({ dbState, onUpdateDb, onTriggerSaveStatus }: WarnPunishmentsTabProps) {
  const getDefaultData = () => dbState?.warn_punishments || {
    status: true,
    warns3: "mute",
    warns3Duration: "1h",
    warns5: "kick",
    warns10: "ban"
  };

  const [status, setStatus] = useState(getDefaultData().status);
  const [warns3, setWarns3] = useState(getDefaultData().warns3);
  const [warns3Duration, setWarns3Duration] = useState(getDefaultData().warns3Duration);
  const [warns5, setWarns5] = useState(getDefaultData().warns5);
  const [warns10, setWarns10] = useState(getDefaultData().warns10);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const data = getDefaultData();
    setStatus(data.status);
    setWarns3(data.warns3);
    setWarns3Duration(data.warns3Duration);
    setWarns5(data.warns5);
    setWarns10(data.warns10);
  }, [dbState?.warn_punishments]);

  const hasChanges = useMemo(() => {
    const current = { status, warns3, warns3Duration, warns5, warns10 };
    return JSON.stringify(getDefaultData()) !== JSON.stringify(current);
  }, [status, warns3, warns3Duration, warns5, warns10, dbState?.warn_punishments]);

  const handleDiscard = () => {
    const data = getDefaultData();
    setStatus(data.status);
    setWarns3(data.warns3);
    setWarns3Duration(data.warns3Duration);
    setWarns5(data.warns5);
    setWarns10(data.warns10);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = { status, warns3, warns3Duration, warns5, warns10 };
      await onUpdateDb('warn_punishments', updated);
      onTriggerSaveStatus('success', 'Punições automáticas por Acúmulo de Avisos salvas!');
    } catch (e: any) {
      onTriggerSaveStatus('error', 'Erro ao salvar punições de avisos.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-28 relative">
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-900/30 p-6 rounded-2xl border border-zinc-900">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <AlertCircle className="text-amber-400" size={22} />
            Configuração de Punições de Avisos (Warns Escalation)
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            Automatize as ações de moderação quando membros atingirem um número específico de avisos acumulados no servidor.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <span className="text-xs font-semibold text-zinc-400">Ativar Escalabilidade:</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={status} onChange={(e) => setStatus(e.target.checked)} />
              <div className={`w-11 h-6 rounded-full transition-colors ${status ? 'bg-amber-500' : 'bg-zinc-800'}`}></div>
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${status ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </label>
        </div>
      </div>

      {!status && (
        <div className="bg-zinc-900/10 border border-zinc-800/40 rounded-2xl p-8 text-center text-zinc-500">
          <p className="text-sm">O sistema automático de escalabilidade de avisos está desativado.</p>
        </div>
      )}

      {status && (
        <div className="space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-5">
            <span className="text-xs font-bold text-white block border-b border-zinc-900 pb-2">Regras de Acúmulo Progressivo</span>
            <div className="space-y-4">
              
              {/* Level 1: 3 Warns */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-sm font-bold">3</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">Ao atingir 3 avisos:</h4>
                    <p className="text-[11px] text-zinc-500">Primeiro nível de alerta para o infrator.</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400">Ação:</span>
                    <select value={warns3} onChange={(e) => setWarns3(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white cursor-pointer">
                      <option value="none">Nenhuma ação</option> <option value="mute">Mute Temporário</option> <option value="kick">Expulsar (Kick)</option> <option value="ban">Banir (Ban)</option>
                    </select>
                  </div>
                  {warns3 === 'mute' && (
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-zinc-500" />
                      <select value={warns3Duration} onChange={(e) => setWarns3Duration(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white cursor-pointer">
                        <option value="15m">15 minutos</option> <option value="30m">30 minutos</option> <option value="1h">1 hora</option> <option value="6h">6 horas</option> <option value="1d">1 dia</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Level 2: 5 Warns */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-sm font-bold">5</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">Ao atingir 5 avisos:</h4>
                    <p className="text-[11px] text-zinc-500">Segundo nível. Punição mais severa exigida.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400">Ação:</span>
                  <select value={warns5} onChange={(e) => setWarns5(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white cursor-pointer">
                    <option value="none">Nenhuma ação</option> <option value="mute">Mute Temporário</option> <option value="kick">Expulsar (Kick)</option> <option value="ban">Banir (Ban)</option>
                  </select>
                </div>
              </div>

              {/* Level 3: 10 Warns */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-sm font-bold">10</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">Ao atingir 10 avisos:</h4>
                    <p className="text-[11px] text-zinc-500">Nível máximo. Tolerância zero alcançada.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400">Ação:</span>
                  <select value={warns10} onChange={(e) => setWarns10(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white cursor-pointer">
                    <option value="none">Nenhuma ação</option> <option value="mute">Mute Temporário</option> <option value="kick">Expulsar (Kick)</option> <option value="ban">Banir (Ban)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5">
            <span className="text-xs font-bold text-white block border-b border-zinc-900 pb-3 mb-6">Linha do Tempo de Moderação Progressiva</span>
            <div className="relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 md:gap-4 max-w-3xl mx-auto py-4">
              <div className="absolute top-[35px] left-0 right-0 h-0.5 bg-zinc-800 -z-10 hidden md:block"></div>
              <div className="flex-1 flex flex-col items-center text-center bg-zinc-950/50 md:bg-transparent p-4 md:p-0 rounded-xl border border-zinc-850 md:border-transparent">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">1-2</div>
                <div className="mt-3"><h5 className="text-xs font-bold text-zinc-200">Aviso Inicial</h5><p className="text-[10px] text-zinc-500 mt-0.5">Membro recebe apenas avisos verbais do bot.</p></div>
              </div>
              <ChevronRight className="text-zinc-700 self-center hidden md:block" size={16} />
              <div className="flex-1 flex flex-col items-center text-center bg-zinc-950/50 md:bg-transparent p-4 md:p-0 rounded-xl border border-zinc-850 md:border-transparent">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-400">3</div>
                <div className="mt-3"><h5 className="text-xs font-bold text-amber-400">Primeira Ação</h5><p className="text-[10px] text-zinc-400 mt-0.5 capitalize">{warns3 === 'none' ? 'Inofensivo' : warns3 === 'mute' ? `Mute (${warns3Duration})` : warns3}</p></div>
              </div>
              <ChevronRight className="text-zinc-700 self-center hidden md:block" size={16} />
              <div className="flex-1 flex flex-col items-center text-center bg-zinc-950/50 md:bg-transparent p-4 md:p-0 rounded-xl border border-zinc-850 md:border-transparent">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-400">5</div>
                <div className="mt-3"><h5 className="text-xs font-bold text-orange-400">Segunda Ação</h5><p className="text-[10px] text-zinc-400 mt-0.5 capitalize">{warns5 === 'none' ? 'Inofensivo' : warns5}</p></div>
              </div>
              <ChevronRight className="text-zinc-700 self-center hidden md:block" size={16} />
              <div className="flex-1 flex flex-col items-center text-center bg-zinc-950/50 md:bg-transparent p-4 md:p-0 rounded-xl border border-zinc-850 md:border-transparent">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-xs font-bold text-red-400">10</div>
                <div className="mt-3"><h5 className="text-xs font-bold text-red-400">Ação Definitiva</h5><p className="text-[10px] text-zinc-400 mt-0.5 capitalize">{warns10 === 'none' ? 'Inofensivo' : warns10}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BARRA FLUTUANTE DE SALVAMENTO (WARN ESCALATION) */}
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
          <button type="button" onClick={handleSave} disabled={isSaving} className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/15">
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}