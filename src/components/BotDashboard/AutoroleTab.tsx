import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Save, Users, UserPlus, Clock, HelpCircle, Plus, Trash2 } from 'lucide-react';

interface DiscordRole {
  id: string;
  name: string;
}

interface AutoroleTabProps {
  dbState: any;
  discordRoles: DiscordRole[];
  onUpdateDb: (key: string, value: any) => Promise<void>;
  onTriggerSaveStatus: (type: 'success' | 'error', message: string) => void;
}

export default function AutoroleTab({ dbState, discordRoles, onUpdateDb, onTriggerSaveStatus }: AutoroleTabProps) {
  const getInitialState = () => ({
    status: dbState?.autorole?.status ?? false,
    roles: dbState?.autorole?.roles || [],
    botRoles: dbState?.autorole?.botRoles || [],
    delay: Number(dbState?.autorole?.delay || 0)
  });

  const [status, setStatus] = useState(getInitialState().status);
  const [roles, setRoles] = useState<string[]>(getInitialState().roles);
  const [botRoles, setBotRoles] = useState<string[]>(getInitialState().botRoles);
  const [delay, setDelay] = useState(getInitialState().delay);

  const [newMemberRole, setNewMemberRole] = useState('');
  const [newBotRole, setNewBotRole] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const data = getInitialState();
    setStatus(data.status);
    setRoles(data.roles);
    setBotRoles(data.botRoles);
    setDelay(data.delay);
  }, [dbState?.autorole]);

  const hasChanges = useMemo(() => {
    const current = { status, roles, botRoles, delay: Number(delay) };
    return JSON.stringify(getInitialState()) !== JSON.stringify(current);
  }, [status, roles, botRoles, delay, dbState?.autorole]);

  const handleDiscard = () => {
    const data = getInitialState();
    setStatus(data.status);
    setRoles(data.roles);
    setBotRoles(data.botRoles);
    setDelay(data.delay);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = { status, roles, delay: Number(delay), botRoles };
      await onUpdateDb('autorole', updated);
      onTriggerSaveStatus('success', 'Configurações de Autorole salvas com sucesso!');
    } catch (e: any) {
      onTriggerSaveStatus('error', e.message || 'Erro ao salvar cargos.');
    } finally {
      setIsSaving(false);
    }
  };

  const addMemberRole = () => {
    if (!newMemberRole || roles.includes(newMemberRole)) return;
    setRoles([...roles, newMemberRole]);
    setNewMemberRole('');
  };

  const removeMemberRole = (role: string) => setRoles(roles.filter(r => r !== role));

  const addBotRole = () => {
    if (!newBotRole || botRoles.includes(newBotRole)) return;
    setBotRoles([...botRoles, newBotRole]);
    setNewBotRole('');
  };

  const removeBotRole = (role: string) => setBotRoles(botRoles.filter(r => r !== role));

  const getRoleName = (roleId: string) => {
    if (!Array.isArray(discordRoles)) return roleId;
    const role = discordRoles.find(r => r.id === roleId || r.name === roleId);
    return role ? role.name : roleId;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-28 relative">
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-900/30 p-6 rounded-2xl border border-zinc-900">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Shield className="text-amber-400" size={22} />
            Autorole (Cargo Automático ao Entrar)
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            Atribua cargos automaticamente a novos membros ou robôs integrados assim que eles entrarem no seu servidor.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <span className="text-xs font-semibold text-zinc-400">Ativar Módulo:</span>
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
          <p className="text-sm">O módulo de atribuição automática de cargos está atualmente desligado.</p>
        </div>
      )}

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
              <UserPlus className="text-blue-400" size={16} /> Cargos para Novos Usuários Humanos
            </h3>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Cargo a Atribuir</label>
              <div className="flex gap-2">
                <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2 text-xs text-white">
                  <option value="">Selecione um cargo...</option>
                  {Array.isArray(discordRoles) && discordRoles.map(role => (
                    <option key={role.id} value={role.id}>@{role.name}</option>
                  ))}
                </select>
                <button type="button" onClick={addMemberRole} className="px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer border border-zinc-700"><Plus size={14} /> Adicionar</button>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-wider">Cargos Configurados Ativos</span>
              {roles.length === 0 ? (
                <p className="text-xs text-zinc-600 italic">Nenhum cargo adicionado ainda. Novos membros não receberão cargos.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <div key={role} className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg">
                      <span>{getRoleName(role)}</span>
                      <button type="button" onClick={() => removeMemberRole(role)} className="text-zinc-500 hover:text-rose-400 transition cursor-pointer"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-zinc-900">
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5"><Clock size={13} className="text-amber-400" /> Tempo de Espera (Delay)</label>
              <div className="flex items-center gap-3">
                <input type="number" value={delay} onChange={(e) => setDelay(Math.max(0, parseInt(e.target.value) || 0))} className="w-24 bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2 text-xs text-white font-mono" min="0" />
                <span className="text-xs text-zinc-500">segundos antes de aplicar (0 = instantâneo)</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Users className="text-purple-400" size={16} /> Cargos para Bots Integrados (Robôs)
            </h3>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Cargo a Atribuir para Bots</label>
              <div className="flex gap-2">
                <select value={newBotRole} onChange={(e) => setNewBotRole(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2 text-xs text-white">
                  <option value="">Selecione um cargo...</option>
                  {Array.isArray(discordRoles) && discordRoles.map(role => (
                    <option key={role.id} value={role.id}>@{role.name}</option>
                  ))}
                </select>
                <button type="button" onClick={addBotRole} className="px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer border border-zinc-700"><Plus size={14} /> Adicionar</button>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-wider">Cargos Configurados para Bots</span>
              {botRoles.length === 0 ? (
                <p className="text-xs text-zinc-600 italic">Nenhum cargo adicionado. Robôs adicionados não receberão cargos específicos.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {botRoles.map((role) => (
                    <div key={role} className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold rounded-lg">
                      <span>{getRoleName(role)}</span>
                      <button type="button" onClick={() => removeBotRole(role)} className="text-zinc-500 hover:text-rose-400 transition cursor-pointer"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800 flex gap-3 text-xs leading-relaxed text-zinc-500">
              <HelpCircle className="text-amber-500 shrink-0" size={16} />
              <div>
                <p className="font-semibold text-zinc-400">Por que separar cargos de bots?</p>
                <p className="text-[11px] mt-0.5">Robôs adicionados ao seu servidor necessitam de permissões administrativas segregadas para não herdarem limitações impostas a membros normais.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BARRA FLUTUANTE DE SALVAMENTO (AUTOROLE) */}
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