import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Save, Key, AlertTriangle, Check, X, ShieldAlert, Lock, ChevronUp, ChevronDown, Palette, Type } from 'lucide-react';

interface RolePermission {
  id: string;
  role: string;
  color: string;
  editableByBot: boolean;
  position: number;
  
  // Gerais & Administração
  ADMINISTRATOR: boolean;
  MANAGE_GUILD: boolean;
  MANAGE_ROLES: boolean;
  MANAGE_CHANNELS: boolean;
  MANAGE_WEBHOOKS: boolean;
  MANAGE_EXPRESSIONS: boolean;
  VIEW_AUDIT_LOG: boolean;
  VIEW_GUILD_INSIGHTS: boolean;

  // Moderação & Membros
  KICK_MEMBERS: boolean;
  BAN_MEMBERS: boolean;
  MODERATE_MEMBERS: boolean;
  CREATE_INSTANT_INVITE: boolean;
  CHANGE_NICKNAME: boolean;
  MANAGE_NICKNAMES: boolean;

  // Canais de Texto
  VIEW_CHANNEL: boolean;
  SEND_MESSAGES: boolean;
  SEND_MESSAGES_IN_THREADS: boolean;
  CREATE_PUBLIC_THREADS: boolean;
  CREATE_PRIVATE_THREADS: boolean;
  EMBED_LINKS: boolean;
  ATTACH_FILES: boolean;
  ADD_REACTIONS: boolean;
  USE_EXTERNAL_EMOJIS: boolean;
  USE_EXTERNAL_STICKERS: boolean;
  MENTION_EVERYONE: boolean;
  MANAGE_MESSAGES: boolean;
  MANAGE_THREADS: boolean;
  READ_MESSAGE_HISTORY: boolean;
  SEND_TTS_MESSAGES: boolean;
  USE_APPLICATION_COMMANDS: boolean;

  // Canais de Voz & Palco
  CONNECT: boolean;
  SPEAK: boolean;
  STREAM: boolean;
  USE_SOUNDBOARD: boolean;
  USE_EXTERNAL_SOUNDS: boolean;
  USE_VAD: boolean;
  PRIORITY_SPEAKER: boolean;
  MUTE_MEMBERS: boolean;
  DEAFEN_MEMBERS: boolean;
  MOVE_MEMBERS: boolean;
  REQUEST_TO_SPEAK: boolean;
  MANAGE_EVENTS: boolean;
}

interface DiscordRole {
  id: string;
  name: string;
  color: string;
  permissions: string[];
  editableByBot: boolean;
  position: number;
}

interface PermissionsTabProps {
  dbState: any;
  discordRoles: DiscordRole[];
  serverId: string;
  onUpdateDb: (key: string, value: any) => Promise<void>;
  csrfToken: string;
  onTriggerSaveStatus: (type: 'success' | 'error', message: string) => void;
}

export default function PermissionsTab({ onUpdateDb, discordRoles, serverId, csrfToken, onTriggerSaveStatus }: PermissionsTabProps) {
  const [basePermissions, setBasePermissions] = useState<RolePermission[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [selectedRoleIndex, setSelectedRoleIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const mapDiscordRoles = (roles: DiscordRole[]): RolePermission[] => {
    if (!roles || roles.length === 0) return [];
    return roles.map(role => {
      const rawPerms = role.permissions || [];
      const perms = rawPerms.map((p: string) => p.toUpperCase().replace(/_/g, ''));

      const has = (permName: string) => perms.includes(permName.replace(/_/g, ''));

      return {
        id: role.id,
        role: role.name,
        color: role.color && role.color !== '#000000' ? role.color : '#94a3b8',
        editableByBot: role.editableByBot ?? false,
        position: role.position ?? 0,

        // Gerais
        ADMINISTRATOR: has('ADMINISTRATOR'),
        MANAGE_GUILD: has('MANAGEGUILD') || has('MANAGESERVER'),
        MANAGE_ROLES: has('MANAGEROLES'),
        MANAGE_CHANNELS: has('MANAGECHANNELS'),
        MANAGE_WEBHOOKS: has('MANAGEWEBHOOKS'),
        MANAGE_EXPRESSIONS: has('MANAGEEXPRESSIONS') || has('MANAGEEMOJISANDSTICKERS'),
        VIEW_AUDIT_LOG: has('VIEWAUDITLOG'),
        VIEW_GUILD_INSIGHTS: has('VIEWGUILDINSIGHTS'),

        // Moderação
        KICK_MEMBERS: has('KICKMEMBERS'),
        BAN_MEMBERS: has('BANMEMBERS'),
        MODERATE_MEMBERS: has('MODERATEMEMBERS') || has('TIMEOUTMEMBERS'),
        CREATE_INSTANT_INVITE: has('CREATEINSTANTINVITE'),
        CHANGE_NICKNAME: has('CHANGENICKNAME'),
        MANAGE_NICKNAMES: has('MANAGENICKNAMES'),

        // Texto
        VIEW_CHANNEL: has('VIEWCHANNEL'),
        SEND_MESSAGES: has('SENDMESSAGES'),
        SEND_MESSAGES_IN_THREADS: has('SENDMESSAGESINTHREADS'),
        CREATE_PUBLIC_THREADS: has('CREATEPUBLICTHREADS'),
        CREATE_PRIVATE_THREADS: has('CREATEPRIVATETHREADS'),
        EMBED_LINKS: has('EMBEDLINKS'),
        ATTACH_FILES: has('ATTACHFILES'),
        ADD_REACTIONS: has('ADDREACTIONS'),
        USE_EXTERNAL_EMOJIS: has('USEEXTERNALEMOJIS'),
        USE_EXTERNAL_STICKERS: has('USEEXTERNALSTICKERS'),
        MENTION_EVERYONE: has('MENTIONEVERYONE'),
        MANAGE_MESSAGES: has('MANAGEMESSAGES'),
        MANAGE_THREADS: has('MANAGETHREADS'),
        READ_MESSAGE_HISTORY: has('READMESSAGEHISTORY'),
        SEND_TTS_MESSAGES: has('SENDTTSMESSAGES'),
        USE_APPLICATION_COMMANDS: has('USEAPPLICATIONCOMMANDS'),

        // Voz & Eventos
        CONNECT: has('CONNECT'),
        SPEAK: has('SPEAK'),
        STREAM: has('STREAM') || has('VIDEO'),
        USE_SOUNDBOARD: has('USESOUNDBOARD'),
        USE_EXTERNAL_SOUNDS: has('USEEXTERNALSOUNDS'),
        USE_VAD: has('USEVAD'),
        PRIORITY_SPEAKER: has('PRIORITYSPEAKER'),
        MUTE_MEMBERS: has('MUTEMEMBERS'),
        DEAFEN_MEMBERS: has('DEAFENMEMBERS'),
        MOVE_MEMBERS: has('MOVEMEMBERS'),
        REQUEST_TO_SPEAK: has('REQUESTTOSPEAK'),
        MANAGE_EVENTS: has('MANAGEEVENTS')
      };
    });
  };

  useEffect(() => {
    const mapped = mapDiscordRoles(discordRoles);
    setBasePermissions(mapped);
    setPermissions(mapped);
    setSelectedRoleIndex(0);
  }, [discordRoles]);

  const hasChanges = useMemo(() => {
    if (permissions.length === 0 || basePermissions.length === 0) return false;
    return JSON.stringify(basePermissions) !== JSON.stringify(permissions);
  }, [basePermissions, permissions]);

  const handleDiscard = () => {
    setPermissions(basePermissions);
  };

  const activeRole = permissions[selectedRoleIndex];

  const handleUpdateActiveRole = (key: keyof RolePermission, value: any) => {
    if (!activeRole || !activeRole.editableByBot) return;
    const updated = [...permissions];
    updated[selectedRoleIndex] = {
      ...activeRole,
      [key]: value
    };
    setPermissions(updated);
  };

  const handleTogglePermission = (field: keyof Omit<RolePermission, 'role' | 'color' | 'id' | 'editableByBot' | 'position'>) => {
    if (!activeRole || !activeRole.editableByBot) return;
    handleUpdateActiveRole(field, !activeRole[field]);
  };

  const handleMoveRole = (e: React.MouseEvent, index: number, direction: 'up' | 'down') => {
    e.stopPropagation();
    
    const newPerms = [...permissions];
    if (direction === 'up' && index > 0) {
      const temp = newPerms[index - 1];
      newPerms[index - 1] = newPerms[index];
      newPerms[index] = temp;
      
      if (selectedRoleIndex === index) setSelectedRoleIndex(index - 1);
      else if (selectedRoleIndex === index - 1) setSelectedRoleIndex(index);
    } 
    else if (direction === 'down' && index < newPerms.length - 1) {
      const temp = newPerms[index + 1];
      newPerms[index + 1] = newPerms[index];
      newPerms[index] = temp;

      if (selectedRoleIndex === index) setSelectedRoleIndex(index + 1);
      else if (selectedRoleIndex === index + 1) setSelectedRoleIndex(index);
    }
    setPermissions(newPerms);
  };

  const handleSave = async () => {
    if (!activeRole) return;
    setIsSaving(true);
    try {
      const changedRoles = permissions.filter(p => {
        const original = basePermissions.find(bp => bp.id === p.id);
        return original && JSON.stringify(p) !== JSON.stringify(original);
      });

      if (changedRoles.length > 0) {
        const resPerms = await fetch('/api/update-role-permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-selected-server': serverId, 'x-csrf-token': csrfToken },
          body: JSON.stringify({ changedRoles })
        });
        if (!resPerms.ok) throw new Error((await resPerms.json()).error || 'Erro ao sincronizar cargos e permissões.');
      }

      const originalOrderIds = basePermissions.map(p => p.id);
      const currentOrderIds = permissions.map(p => p.id);
      
      if (JSON.stringify(originalOrderIds) !== JSON.stringify(currentOrderIds)) {
        const originalPositions = basePermissions.map(p => p.position).sort((a, b) => b - a);
        
        const positionPayload = permissions.map((p, index) => ({
          role: p.id,
          position: originalPositions[index]
        }));

        const resPos = await fetch('/api/update-role-positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-selected-server': serverId, 'x-csrf-token': csrfToken },
          body: JSON.stringify({ rolePositions: positionPayload })
        });
        if (!resPos.ok) throw new Error((await resPos.json()).error || 'Erro ao reordenar cargos.');
      }

      setBasePermissions([...permissions]);
      onTriggerSaveStatus('success', 'Cargos atualizados no Discord com sucesso!');
    } catch (e: any) {
      onTriggerSaveStatus('error', e.message || 'Erro ao atualizar cargos no servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  // Categorias Organizadas de Permissões
  const permissionCategories = [
    {
      category: "Permissões Gerais do Servidor",
      items: [
        { key: 'ADMINISTRATOR' as const, label: 'Administrador', desc: 'Concede todas as permissões ao cargo e ignora restrições de canal. Perigoso!', danger: true },
        { key: 'MANAGE_GUILD' as const, label: 'Gerenciar Servidor', desc: 'Permite alterar o nome, ícone e configurações gerais do servidor.', danger: true },
        { key: 'MANAGE_ROLES' as const, label: 'Gerenciar Cargos', desc: 'Permite criar, editar e deletar cargos abaixo do seu.', danger: true },
        { key: 'MANAGE_CHANNELS' as const, label: 'Gerenciar Canais', desc: 'Permite criar, editar e deletar canais de texto e voz.', danger: true },
        { key: 'MANAGE_WEBHOOKS' as const, label: 'Gerenciar Webhooks', desc: 'Permite criar, editar e deletar webhooks do servidor.', danger: true },
        { key: 'MANAGE_EXPRESSIONS' as const, label: 'Gerenciar Emojis e Figurinhos', desc: 'Permite adicionar e remover emojis/stickers personalizados.', danger: false },
        { key: 'VIEW_AUDIT_LOG' as const, label: 'Ver Registro de Auditoria', desc: 'Permite visualizar os logs de ações realizadas no servidor.', danger: false },
        { key: 'VIEW_GUILD_INSIGHTS' as const, label: 'Ver Análises do Servidor', desc: 'Permite ver estatísticas de membros e engajamento do servidor.', danger: false },
      ]
    },
    {
      category: "Moderação & Membros",
      items: [
        { key: 'KICK_MEMBERS' as const, label: 'Expulsar Membros', desc: 'Permite expulsar membros do servidor.', danger: true },
        { key: 'BAN_MEMBERS' as const, label: 'Banir Membros', desc: 'Permite banir permanentemente membros do servidor.', danger: true },
        { key: 'MODERATE_MEMBERS' as const, label: 'Silenciar / Castigar Membros', desc: 'Permite colocar membros em timeout (castigo temporário).', danger: true },
        { key: 'MANAGE_NICKNAMES' as const, label: 'Gerenciar Apelidos', desc: 'Permite alterar os apelidos de outros membros.', danger: false },
        { key: 'CHANGE_NICKNAME' as const, label: 'Alterar Próprio Apelido', desc: 'Permite alterar seu próprio apelido no servidor.', danger: false },
        { key: 'CREATE_INSTANT_INVITE' as const, label: 'Criar Convites', desc: 'Permite criar convites para novos membros entrarem no servidor.', danger: false },
      ]
    },
    {
      category: "Permissões dos Canais de Texto",
      items: [
        { key: 'VIEW_CHANNEL' as const, label: 'Ver Canais', desc: 'Permite visualizar e ler os canais de texto do servidor.', danger: false },
        { key: 'SEND_MESSAGES' as const, label: 'Enviar Mensagens', desc: 'Permite conversar por texto nos canais.', danger: false },
        { key: 'SEND_MESSAGES_IN_THREADS' as const, label: 'Enviar Mensagens em Tópicos', desc: 'Permite enviar mensagens dentro de tópicos/threads.', danger: false },
        { key: 'CREATE_PUBLIC_THREADS' as const, label: 'Criar Tópicos Públicos', desc: 'Permite abrir tópicos visíveis por todos.', danger: false },
        { key: 'CREATE_PRIVATE_THREADS' as const, label: 'Criar Tópicos Privados', desc: 'Permite abrir tópicos restritos a convidados.', danger: false },
        { key: 'EMBED_LINKS' as const, label: 'Inserir Links', desc: 'Permite exibir prévias em links enviados no chat.', danger: false },
        { key: 'ATTACH_FILES' as const, label: 'Anexar Arquivos', desc: 'Permite enviar imagens, vídeos e documentos.', danger: false },
        { key: 'ADD_REACTIONS' as const, label: 'Adicionar Reações', desc: 'Permite reagir a mensagens enviadas com emojis.', danger: false },
        { key: 'USE_EXTERNAL_EMOJIS' as const, label: 'Usar Emojis Externos', desc: 'Permite usar emojis de outros servidores.', danger: false },
        { key: 'USE_EXTERNAL_STICKERS' as const, label: 'Usar Figurinhos Externos', desc: 'Permite usar stickers de outros servidores.', danger: false },
        { key: 'MENTION_EVERYONE' as const, label: 'Mencionar @everyone e @here', desc: 'Permite notificar todos os membros do servidor de uma vez.', danger: true },
        { key: 'MANAGE_MESSAGES' as const, label: 'Gerenciar Mensagens', desc: 'Permite apagar e fixar mensagens de outros membros.', danger: true },
        { key: 'MANAGE_THREADS' as const, label: 'Gerenciar Tópicos', desc: 'Permite deletar, arquivar e trancar tópicos.', danger: true },
        { key: 'READ_MESSAGE_HISTORY' as const, label: 'Ver Histórico de Mensagens', desc: 'Permite ler mensagens enviadas antes de entrar no canal.', danger: false },
        { key: 'SEND_TTS_MESSAGES' as const, label: 'Enviar Mensagens TTS', desc: 'Permite enviar mensagens de Texto para Voz (/tts).', danger: false },
        { key: 'USE_APPLICATION_COMMANDS' as const, label: 'Usar Comandos de Aplicativos', desc: 'Permite usar comandos slash (/) de bots.', danger: false },
      ]
    },
    {
      category: "Permissões dos Canais de Voz & Palco",
      items: [
        { key: 'CONNECT' as const, label: 'Conectar em Voz', desc: 'Permite entrar nos canais de voz.', danger: false },
        { key: 'SPEAK' as const, label: 'Falar em Voz', desc: 'Permite transmitir áudio nos canais de voz.', danger: false },
        { key: 'STREAM' as const, label: 'Transmitir Vídeo / Compartilhar Tela', desc: 'Permite fazer live ou compartilhar tela.', danger: false },
        { key: 'USE_SOUNDBOARD' as const, label: 'Usar Painel de Som', desc: 'Permite reproduzir sons do soundboard.', danger: false },
        { key: 'USE_EXTERNAL_SOUNDS' as const, label: 'Usar Sons Externos', desc: 'Permite usar sons de soundboard de outros servidores.', danger: false },
        { key: 'USE_VAD' as const, label: 'Usar Detecção de Voz', desc: 'Permite falar sem precisar do Pressionar para Falar.', danger: false },
        { key: 'PRIORITY_SPEAKER' as const, label: 'Voz Prioritária', desc: 'Reduz o volume de outros membros enquanto este membro fala.', danger: false },
        { key: 'MUTE_MEMBERS' as const, label: 'Silenciar Membros em Voz', desc: 'Permite desativar o microfone de outros usuários.', danger: true },
        { key: 'DEAFEN_MEMBERS' as const, label: 'Ensurdecer Membros em Voz', desc: 'Permite desativar o fone de ouvido de outros usuários.', danger: true },
        { key: 'MOVE_MEMBERS' as const, label: 'Mover Membros em Voz', desc: 'Permite arrastar membros entre salas de voz.', danger: true },
        { key: 'REQUEST_TO_SPEAK' as const, label: 'Pedir para Falar em Palco', desc: 'Permite pedir autorização para falar em canais de Palco.', danger: false },
        { key: 'MANAGE_EVENTS' as const, label: 'Gerenciar Eventos', desc: 'Permite agendar, editar e deletar eventos do servidor.', danger: false },
      ]
    }
  ];

  if (!activeRole) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 font-medium">
        Carregando hierarquia do servidor...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-28 relative">
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-900/30 p-6 rounded-2xl border border-zinc-900">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <ShieldAlert className="text-rose-400" size={22} />
            Gerenciamento e Hierarquia de Cargos
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            Edite nomes, cores, permissões e a posição dos cargos diretamente no servidor do Discord.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
          <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-wider">Hierarquia do Servidor</span>
          
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {permissions.map((roleObj, idx) => (
              <div 
                key={roleObj.id} 
                className="flex items-center gap-2 group"
              >
                <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity w-5">
                  <button 
                    disabled={!roleObj.editableByBot || idx === 0}
                    onClick={(e) => handleMoveRole(e, idx, 'up')}
                    className="text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 cursor-pointer"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button 
                    disabled={!roleObj.editableByBot || idx === permissions.length - 1}
                    onClick={(e) => handleMoveRole(e, idx, 'down')}
                    className="text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 cursor-pointer"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRoleIndex(idx)}
                  className={`flex-1 flex items-center justify-between p-3 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                    selectedRoleIndex === idx
                      ? 'bg-zinc-900 border-rose-500/30 text-white'
                      : 'bg-zinc-950/40 border-transparent text-zinc-400 hover:bg-zinc-900/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span
                      className="inline-block w-3 h-3 rounded-full border border-black/30 shrink-0"
                      style={{ backgroundColor: roleObj.color }}
                    ></span>
                    <span className="truncate">{roleObj.role}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!roleObj.editableByBot && (
                      <span title="Cargo superior ao Bot">
                        <Lock size={12} className="text-zinc-500" />
                    </span>
                    )}
                    {roleObj.ADMINISTRATOR && (
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono uppercase">
                        Admin
                      </span>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/60 flex gap-2.5 text-[11px] leading-relaxed text-zinc-500">
            <AlertTriangle className="text-amber-500 shrink-0" size={15} />
            <span>Passe o mouse ao lado esquerdo dos cargos para reordenar a hierarquia.</span>
          </div>
        </div>

        <div className="md:col-span-8 bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 space-y-6">
          
          {/* PAINEL SUPERIOR: EDITAR NOME E COR DO CARGO */}
          <div className="flex flex-col gap-4 border-b border-zinc-900 pb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-mono">CONFIGURAÇÕES DO CARGO</span>
              <span className="text-[10px] font-mono text-zinc-500">ID: <span className="text-zinc-400 uppercase">{activeRole.id}</span></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Nome do Cargo */}
              <div className="sm:col-span-8 space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Type size={13} className="text-rose-400" /> Nome do Cargo
                </label>
                <input
                  type="text"
                  value={activeRole.role}
                  disabled={!activeRole.editableByBot}
                  onChange={(e) => handleUpdateActiveRole('role', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-50"
                  placeholder="Nome do Cargo"
                />
              </div>

              {/* Cor do Cargo */}
              <div className="sm:col-span-4 space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Palette size={13} className="text-rose-400" /> Cor do Cargo
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={activeRole.color}
                    disabled={!activeRole.editableByBot}
                    onChange={(e) => handleUpdateActiveRole('color', e.target.value)}
                    className="w-9 h-8 p-0 rounded-lg border border-zinc-800 bg-transparent cursor-pointer shrink-0 disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={activeRole.color}
                    disabled={!activeRole.editableByBot}
                    onChange={(e) => handleUpdateActiveRole('color', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-2.5 text-xs text-white font-mono uppercase disabled:opacity-50"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {!activeRole.editableByBot && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-3 mt-1">
                <Lock className="text-rose-400 shrink-0" size={18} />
                <p className="text-xs text-rose-300 leading-relaxed">
                  <strong>Acesso Negado:</strong> O bot não pode alterar este cargo pois ele está posicionado <strong>acima ou igual</strong> ao cargo do próprio bot na hierarquia do servidor.
                </p>
              </div>
            )}
          </div>

          {/* LISTA CATEGORIZADA DE TODAS AS PERMISSÕES */}
          <div className={`space-y-6 ${!activeRole.editableByBot ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            {permissionCategories.map((catObj) => (
              <div key={catObj.category} className="space-y-3">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  {catObj.category}
                </h4>

                <div className="space-y-2.5">
                  {catObj.items.map((def) => {
                    const value = activeRole[def.key as keyof RolePermission] as boolean;
                    return (
                      <div
                        key={def.key}
                        className={`flex items-start justify-between p-3.5 rounded-xl border transition ${
                          value
                            ? 'bg-zinc-900/50 border-zinc-800/80'
                            : 'bg-zinc-950/20 border-zinc-900/30'
                        }`}
                      >
                        <div className="space-y-0.5 max-w-[82%]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{def.label}</span>
                            {def.danger && (
                              <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-semibold uppercase">
                                Perigoso
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 leading-relaxed">{def.desc}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTogglePermission(def.key)}
                          className={`p-2 rounded-lg border transition cursor-pointer shrink-0 ${
                            value
                              ? 'bg-rose-600 border-rose-500 text-white'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-zinc-500'
                          }`}
                        >
                          {value ? <Check size={14} /> : <X size={14} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

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
          <button type="button" onClick={handleSave} disabled={isSaving} className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-rose-600/15">
            <span>{isSaving ? 'Salvando...' : 'Atualizar Discord'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}