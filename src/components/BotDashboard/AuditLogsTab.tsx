import React, { useState } from 'react';
import { ShieldAlert, Search, Clock, FileText, Trash2, ArrowRight, Settings2 } from 'lucide-react';

interface AuditLog {
  id: string;
  date: string;
  username: string;
  userId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  ip?: string;
}

interface AuditLogsTabProps {
  dbState: any;
  onUpdateDb: (key: string, value: any) => Promise<void>;
  onTriggerSaveStatus: (type: 'success' | 'error', message: string) => void;
}

export default function AuditLogsTab({ dbState, onUpdateDb, onTriggerSaveStatus }: AuditLogsTabProps) {
  const logs: AuditLog[] = dbState?.audit_logs || [];
  const [search, setSearch] = useState('');

  // 1. Funções de Tradução e Formatação (Movidas para cima para a pesquisa conseguir ler)
  const formatActionAndKey = (actionString: string) => {
    if (!actionString) return { key: 'Sistema', text: 'Ação desconhecida' };
    if (actionString.startsWith('Update ') && actionString.endsWith(' Config')) {
      const extractedKey = actionString.replace('Update ', '').replace(' Config', '');
      return { key: extractedKey, text: 'Atualizou as configurações do módulo' };
    }
    return { key: 'Geral', text: actionString };
  };

  const getFriendlyName = (key: string) => {
    const dictionary: Record<string, string> = {
      status: 'Status',
      joinChannel: 'Canal de Entrada',
      joinMessage: 'Msg. Boas-Vindas',
      joinEmbed: 'Embed Entrada',
      joinEmbedColor: 'Cor Embed Entrada',
      joinEmbedTitle: 'Título Embed Entrada',
      leaveChannel: 'Canal de Saída',
      leaveMessage: 'Msg. Despedida',
      leaveEmbed: 'Embed Saída',
      leaveEmbedColor: 'Cor Embed Saída',
      leaveEmbedTitle: 'Título Embed Saída',
      action: 'Punição Base',
      deleteMessage: 'Apagar Msg Original',
      warnLimit: 'Limite de Avisos',
      customMessage: 'Aviso Customizado no Chat',
      whitelistedChannels: 'Canais Ignorados (Whitelist)',
      whitelistedRoles: 'Cargos Ignorados (Whitelist)',
      roles: 'Cargos para Membros',
      botRoles: 'Cargos para Bots',
      delay: 'Tempo de Espera (Delay)',
      trackMessageDelete: 'Log: Mensagens Excluídas',
      trackMessageEdit: 'Log: Mensagens Editadas',
      trackVoiceStatus: 'Log: Mudanças em Voz',
      trackMemberJoinLeave: 'Log: Entradas e Saídas',
      trackRoleUpdate: 'Log: Alteração de Cargos',
      trackChannelCreateDelete: 'Log: Edição de Canais',
      channel: 'Canal de Envio dos Logs',
      disabled_commands: 'Lista de Comandos Desativados',
      welcome: 'Módulo de Boas-Vindas',
      autorole: 'Módulo de Cargo Automático',
      invite_blocker: 'Módulo Anti-Convites'
    };
    return dictionary[key] || key;
  };

  // 2. Sistema de Pesquisa Inteligente
  const filteredLogs = logs.filter(log => {
    const query = search.toLowerCase().trim();
    if (!query) return true; // Se a barra estiver vazia, mostra tudo

    const { key, text } = formatActionAndKey(log.action);
    const friendlyModuleName = getFriendlyName(key).toLowerCase();

    // A pesquisa agora busca por: Nome do usuário, Nome do Módulo traduzido, Nome do Módulo Técnico ou Texto da ação
    return (
      (log.username && log.username.toLowerCase().includes(query)) ||
      (friendlyModuleName.includes(query)) ||
      (log.action && log.action.toLowerCase().includes(query)) ||
      (text && text.toLowerCase().includes(query))
    );
  });

  // const handleClearLogs = async () => {
  //   if (!window.confirm('Deseja realmente limpar todo o histórico de auditoria?')) return;
  //   try {
  //     await onUpdateDb('audit_logs', null);
  //     onTriggerSaveStatus('success', 'Histórico de auditoria limpo com sucesso!');
  //   } catch (e: any) {
  //     onTriggerSaveStatus('error', 'Erro ao limpar logs.');
  //   }
  // };

  const isValueEmpty = (val: any) => {
    return val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0);
  };

  const formatValue = (val: any) => {
    if (val === true) return 'Ativado';
    if (val === false) return 'Desativado';
    if (val === null || val === undefined) return 'Não configurado';
    
    if (Array.isArray(val)) {
      if (val.length === 0) return 'Nenhum';
      const joined = val.join(', ');
      return joined.length > 50 ? `${joined.substring(0, 50)}...` : joined;
    }
    
    if (typeof val === 'object') return '{ configurações }';
    if (typeof val === 'string') {
        if (val.trim() === '') return 'Nenhum';
        return val.length > 50 ? `"${val.substring(0, 50)}..."` : `"${val}"`;
    }
    return String(val);
  };

  const getChangesList = (oldStr?: string, newStr?: string, moduleKey?: string) => {
    if (!oldStr && !newStr) return [];
    try {
      const oldParsed = oldStr ? JSON.parse(oldStr) : null;
      const newParsed = newStr ? JSON.parse(newStr) : null;

      if (Array.isArray(oldParsed) || Array.isArray(newParsed)) {
        const oldArr = Array.isArray(oldParsed) ? oldParsed : [];
        const newArr = Array.isArray(newParsed) ? newParsed : [];
        
        if (isValueEmpty(oldArr) && isValueEmpty(newArr)) return [];

        const formattedOld = formatValue(oldArr);
        const formattedNew = formatValue(newArr);

        if (formattedOld !== formattedNew) {
          return [{
            key: getFriendlyName(moduleKey || 'Lista'),
            oldVal: formattedOld,
            newVal: formattedNew
          }];
        }
        return [];
      }

      const oldObj = typeof oldParsed === 'object' && oldParsed !== null ? oldParsed : {};
      const newObj = typeof newParsed === 'object' && newParsed !== null ? newParsed : {};
      const changes: { key: string; oldVal: string; newVal: string }[] = [];
      
      const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

      allKeys.forEach(k => {
        const oldProp = oldObj[k];
        const newProp = newObj[k];

        if (isValueEmpty(oldProp) && isValueEmpty(newProp)) return;

        const formattedOld = formatValue(oldProp);
        const formattedNew = formatValue(newProp);

        if (formattedOld !== formattedNew) {
          changes.push({
            key: getFriendlyName(k),
            oldVal: formattedOld,
            newVal: formattedNew
          });
        }
      });
      return changes;
    } catch (e) {
      return [{ key: 'Dados', oldVal: 'Modificados', newVal: 'Verifique no sistema' }];
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-900/30 p-6 rounded-2xl border border-zinc-900">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <ShieldAlert className="text-amber-400" size={22} />
            Registro de Auditoria
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            Acompanhe exatamente quais configurações foram ativadas, desativadas ou modificadas pela sua equipe.
          </p>
        </div>

        {/* {logs.length > 0 && (
          <button
            onClick={handleClearLogs}
            className="px-4 py-2 bg-zinc-800 hover:bg-rose-950/40 hover:text-rose-400 text-zinc-400 border border-zinc-700/50 hover:border-rose-500/30 rounded-xl text-xs transition cursor-pointer flex items-center gap-2"
          >
            <Trash2 size={14} />
            <span>Limpar Histórico</span>
          </button>
        )} */}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
        <Search className="text-zinc-500 shrink-0" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder-zinc-600 focus:outline-none"
          placeholder="Busque por administrador ou nome do módulo (ex: Boas-Vindas)..."
        />
      </div>

      <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-600 text-xs">
            Nenhum registro de auditoria condizente com a pesquisa encontrado.
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredLogs.map((log) => {
              const { key, text } = formatActionAndKey(log.action);
              const changes = getChangesList(log.oldValue, log.newValue, key);
              
              if (changes.length === 0 && (log.oldValue || log.newValue)) return null;

              return (
                <div 
                  key={log.id} 
                  className="bg-zinc-950/60 border border-zinc-900/80 rounded-xl p-4 flex flex-col gap-4 hover:border-zinc-800 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700/50 overflow-hidden">
                        <img 
                          src={`https://cdn.discordapp.com/embed/avatars/${Math.abs(Number(log.userId || '0')) % 5}.png`} 
                          alt={log.username} 
                          className="w-full h-full object-cover" 
                        />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-white">{log.username || 'Desconhecido'}</span>
                          <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                            Módulo: <span className="text-zinc-300 font-bold">{getFriendlyName(key)}</span>
                          </span>
                        </div>

                        <p className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
                          <FileText size={12} className="text-blue-400 shrink-0" />
                          {text}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono shrink-0 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800/50 self-start sm:self-center">
                      <Clock size={12} className="text-zinc-400" />
                      <span>{log.date ? new Date(log.date).toLocaleString('pt-BR') : 'Data Indisponível'}</span>
                    </div>
                  </div>

                  {changes.length > 0 && (
                    <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/60 ml-0 sm:ml-[50px] space-y-2">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-2">
                        <Settings2 size={12} /> Alterações Efetuadas:
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                        {changes.map((change, idx) => (
                          <div key={idx} className="flex flex-col text-xs bg-zinc-950 p-2 rounded border border-zinc-800">
                            <span className="text-zinc-400 font-semibold mb-1 text-[11px] border-b border-zinc-800/50 pb-1">{change.key}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-rose-400/80 line-through truncate max-w-[45%] font-mono" title={change.oldVal}>{change.oldVal}</span>
                              <ArrowRight size={12} className="text-zinc-600 shrink-0" />
                              <span className="text-emerald-400 font-bold truncate max-w-[45%] font-mono" title={change.newVal}>{change.newVal}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}