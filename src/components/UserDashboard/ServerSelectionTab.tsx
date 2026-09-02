import React from 'react';
import { motion } from 'motion/react'; // ou framer-motion se estiver usando a versão clássica
import { Server, ChevronRight, Bot } from 'lucide-react';
import type { DiscordServer } from '../../types';

interface ServerSelectionTabProps {
  servers: DiscordServer[];
  onSelectServer: (srv: DiscordServer) => void;
  onTriggerToast: (type: 'success' | 'error', message: string) => void;
}

export default function ServerSelectionTab({ servers, onSelectServer, onTriggerToast }: ServerSelectionTabProps) {
  
  const getInitials = (name: string) => {
    if (!name) return 'SV';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-full">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">Seus Servidores</h2>
        <p className="text-zinc-400 mt-2 text-sm">Selecione um servidor abaixo para configurar os módulos do bot.</p>
      </div>

      {servers.length === 0 ? (
        <div className="text-center bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12">
          <Server className="text-zinc-600 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-bold text-white mb-2">Nenhum servidor encontrado</h3>
          <p className="text-zinc-500 text-sm">Você precisa ser administrador de um servidor para gerenciá-lo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {servers.map((srv) => (
            <motion.div
              key={srv.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                if (srv.botActive) onSelectServer(srv);
                else onTriggerToast('error', 'O bot não está neste servidor. Adicione-o primeiro!');
              }}
              className={`bg-zinc-900/80 border rounded-2xl p-5 flex items-center gap-4 transition-all ${
                srv.botActive 
                  ? 'border-zinc-800 hover:border-purple-500/50 cursor-pointer shadow-lg hover:shadow-purple-500/10' 
                  : 'border-zinc-800/50 opacity-60 cursor-not-allowed'
              }`}
            >
              {srv.icon ? (
                <img src={srv.icon} alt={srv.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {getInitials(srv.name)}
                </div>
              )}
              
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-white truncate text-sm">{srv.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {srv.botActive ? `${srv.members} membros` : 'Bot não adicionado'}
                </p>
              </div>

              <div className="shrink-0">
                {srv.botActive ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <ChevronRight size={16} className="text-emerald-500" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <Bot size={14} className="text-zinc-500" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}