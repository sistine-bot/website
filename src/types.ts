export interface BotCommand {
  name: string;
  description: string;
  category: string;
  options?: any[];
  aliases?: string[];
  type: 'slash' | 'prefix';
}

export interface SimulatedMessage {
  id: string;
  sender: 'user' | 'bot';
  username: string;
  tag: string;
  avatar: string;
  content: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: string | number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    footer?: { text: string };
  }>;
  timestamp: string;
}

export interface DiscordServer {
  id: string;
  name: string;
  icon: string;
  members: number;
  botActive: boolean;
  premium: boolean;
}

export interface EconomyUserConfig {
  saldo_inicial: number;
  taxa_assalto: number;
  cooldown_daily: number;
  cooldown_crime: number;
  cooldown_pescar: number;
  cooldown_caçar: number;
  cooldown_trabalhar: number;
  recompensa_daily: number;
  recompensa_weekly: number;
}

export interface TransacaoMensagens {
  mensagem_deposito: string;
  mensagem_transferencia_enviou: string;
  mensagem_transferencia_recebeu: string;
  mensagem_loja_buy: string;
  mensagem_loja_vendas: string;
  mensagem_crime_vitoria: string;
  mensagem_crime_derrota: string;
  mensagem_emprego: string;
  mensagem_assalto_vitoria: string;
  mensagem_assalto_derrota: string;
  mensagem_namoro: string;
  mensagem_aposta_vitoria: string;
  mensagem_aposta_derrota: string;
  mensagem_slotmachine_vitoria: string;
  mensagem_slotmachine_derrota: string;
  emoji_enviou: string;
  emoji_recebeu: string;
}

export interface ApostasConfig {
  multiplicador_slot_2x: number;
  multiplicador_slot_3x: number;
  multiplicador_slot_jackpot: number;
  aposta_minima: number;
  aposta_maxima: number;
  taxa_banca: number;
}

export interface ModulacaoConfig {
  ticket_status: boolean;
  automod_status: boolean;
  xp_multiplicador: number;
  taxa_casamento: number;
  vip_duracao_dias: number;
}

export interface BotGlobalConfig {
  economia: EconomyUserConfig;
  transacoes: TransacaoMensagens;
  apostas: ApostasConfig;
  modulacao: ModulacaoConfig;
}

export interface SystemAuditReport {
  name: string;
  status: 'active' | 'warning' | 'inactive';
  description: string;
  commandsCount: number;
  dependency: string;
}

// Interface para a tabela de Auditoria da Visão Geral
export interface SystemAuditReport {
  name: string;
  description: string;
  commandsCount: number;
  dependency: string;
}