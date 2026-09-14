import React, { useState } from 'react';
import { 
  Crown, 
  Check, 
  Clock, 
  ShieldCheck, 
  Wheat, 
  Wrench, 
  Zap, 
  Gift, 
  ChevronRight, 
  ExternalLink,
  Layers
} from 'lucide-react';

interface VipShopProps {
  dbState?: any;
  user?: any;
}

export default function VipShop({ dbState, user }: VipShopProps) {
  const [activeTab, setActiveTab] = useState<'plans' | 'comparison'>('plans');

  const vipData = dbState?.vip || {};
  let rawVip = vipData.vip;
  let vipLevel = 0;
  if (typeof rawVip === 'string') {
    const low = rawVip.toLowerCase();
    if (low === 'ouro' || low === 'diamante' || low === 'premium+') vipLevel = 2;
    else if (low === 'prata' || low === 'premium') vipLevel = 1;
    else vipLevel = parseInt(rawVip) || 0;
  } else {
    vipLevel = Number(rawVip || 0);
  }

  const vipTime = Number(vipData.tempo || 0);
  const vipDate = Number(vipData.data || 0);

  const isVipActive = vipLevel > 0 && (vipDate === 0 || vipTime === 0 || vipTime - (Date.now() - vipDate) > 0);
  const remainingDays = isVipActive && vipDate > 0 && vipTime > 0
    ? Math.max(0, Math.ceil((vipTime - (Date.now() - vipDate)) / (1000 * 60 * 60 * 24)))
    : null;

  const vipTierName = vipLevel >= 2 ? 'VIP Ouro' : 'VIP Prata';

  const plans = [
    {
      level: 1,
      title: 'VIP Prata',
      subtitle: 'Plano Essencial',
      price: 'R$ 19,90',
      period: '/mês',
      color: 'border-zinc-500/40 hover:border-zinc-300',
      badgeBg: 'bg-zinc-400/10 text-zinc-300 border-zinc-500/30',
      glow: 'bg-zinc-400/10',
      highlight: 'Ótimo Custo-Benefício',
      icon: '🥈',
      accentColor: 'text-zinc-300',
      buttonClass: 'bg-zinc-200 hover:bg-white text-zinc-950 font-bold',
      perks: [
        { title: 'Multiplicador 2x de XP', desc: 'Evolua de nível duas vezes mais rápido em qualquer comando' },
        { title: '+20% na Plantação & Fazenda', desc: '+1 colheita extra em cada canteiro e animal cuidado' },
        { title: '25% OFF em Reparos (/recuperar)', desc: 'Economize ao consertar armas de caça e varas de pesca' },
        { title: '+25% de Carnes e Peixes', desc: 'Rendimento aumentado em expedições de caça e pesca' },
        { title: 'Bolsa Semanal (/semanal)', desc: 'Resgate de R$ 20.000 a R$ 30.000 + suprimentos rurais' },
        { title: 'Insígnia VIP Prata Exclusiva', desc: 'Exibida com destaque no seu cartão de /perfil e dashboard' },
        { title: 'Wallpaper Customizado', desc: 'Envie seu próprio wallpaper para o seu cartão de perfil' },
        { title: 'Cargo Exclusivo no Discord', desc: 'Destaque e canal de chat exclusivo para assinantes' },
      ]
    },
    {
      level: 2,
      title: 'VIP Ouro',
      subtitle: 'Experiência Suprema',
      price: 'R$ 29,90',
      period: '/mês',
      color: 'border-amber-500/50 hover:border-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      glow: 'bg-amber-500/15',
      highlight: 'Mais Completo & Popular',
      icon: '👑',
      accentColor: 'text-amber-400',
      buttonClass: 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-black shadow-lg shadow-amber-500/20',
      perks: [
        { title: 'Multiplicador 3x de XP', desc: 'Triplica o ganho de experiência em todas as atividades do bot' },
        { title: '+40% na Plantação & Fazenda', desc: '+2 colheitas extras por slot e crescimento acelerado dos filhotes' },
        { title: '50% OFF em Reparos (/recuperar)', desc: 'Metade do preço para consertar qualquer equipamento danificado' },
        { title: '+50% de Carnes e Peixes', desc: 'Rendimento massivo na caça/pesca com desgaste quase nulo' },
        { title: 'Super Recompensa Semanal', desc: 'Resgate de R$ 45.000 a R$ 65.000 + pacote reforçado de sementes e rações' },
        { title: 'Insígnia Dourada Animada', desc: 'Emblema supremo de prestígio no /perfil e na web' },
        { title: 'Acesso a Todos Wallpapers VIP', desc: 'Desbloqueio irrestrito do catálogo de wallpapers e múltiplos uploads' },
        { title: 'Suporte Prioritário & Cargo Patrono', desc: 'Atendimento VIP direto com os desenvolvedores' },
      ]
    }
  ];

  const comparisonRows = [
    { perk: 'Multiplicador de XP', free: '1.0x', prata: '2.0x (Dobro)', ouro: '3.0x (Triplo)' },
    { perk: 'Bônus Plantação & Fazenda', free: 'Padrão', prata: '+1 item (+20%)', ouro: '+2 itens (+40%) + afeto rápido' },
    { perk: 'Desconto em Reparos (/recuperar)', free: 'Sem desconto', prata: '25% OFF', ouro: '50% OFF' },
    { perk: 'Bônus de Caça e Pesca', free: 'Padrão', prata: '+25% de recursos', ouro: '+50% de recursos + durabilidade' },
    { perk: 'Recompensa Semanal (/semanal)', free: 'Indisponível', prata: 'R$ 20k-30k + sementes/rações', ouro: 'R$ 45k-65k + pacote rural duplo' },
    { perk: 'Insígnia Exclusiva no /perfil', free: '—', prata: 'Insígnia VIP Prata', ouro: 'Insígnia VIP Ouro Reluzente' },
    { perk: 'Upload de Wallpapers Próprios', free: 'Bloqueado', prata: '1 Wallpaper Ativo', ouro: 'Wallpapers Ilimitados' },
    { perk: 'Catálogo de Wallpapers VIP', free: 'Bloqueado', prata: 'Acesso Selecionado', ouro: 'Acesso Completo Total' },
    { perk: 'Cargo e Sala VIP no Discord', free: '—', prata: 'Membro VIP', ouro: 'Patrono Ouro VIP' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* BANNER PRINCIPAL COM STATUS */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-zinc-900/60 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Crown size={14} className="text-amber-400" />
              Sistine Club • Vantagens VIP
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Acelere sua Jornada no Bot
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 max-w-xl leading-relaxed">
              Assine um dos planos VIP para turbinar seu rendimento na <strong className="text-emerald-400">Fazenda e Plantação</strong>, 
              garantir multiplicadores de <strong className="text-purple-400">XP</strong>, descontos na <strong className="text-blue-400">Oficina</strong> e recompensas semanais exclusivas!
            </p>
          </div>

          {/* CARD DE STATUS ATUAL DO USUÁRIO */}
          <div className="shrink-0">
            {isVipActive ? (
              <div className="bg-zinc-900/90 border border-amber-500/40 p-5 rounded-2xl shadow-xl flex items-center gap-4 min-w-[240px]">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${
                  vipLevel >= 2 ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' : 'bg-zinc-400/20 border border-zinc-400/30 text-zinc-300'
                }`}>
                  {vipLevel >= 2 ? '👑' : '⭐'}
                </div>
                <div>
                  <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">Assinatura Ativa</span>
                  <h4 className="text-sm font-black text-white">{vipTierName}</h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                    <Clock size={12} className="text-amber-400" />
                    <span>{remainingDays !== null ? `${remainingDays} dias restantes` : 'Vitalício / Especial'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950/80 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4 min-w-[240px]">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 text-2xl">
                  🛡️
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Status da Conta</span>
                  <h4 className="text-sm font-bold text-zinc-300">Sem Plano VIP Ativo</h4>
                  <span className="text-[11px] text-zinc-500 block mt-0.5">Escolha um plano abaixo</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE CARDS E TABELA */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center gap-3">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'plans' 
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Layers size={14} /> Planos & Vantagens
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'comparison' 
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Check size={14} /> Tabela Comparativa Detalhada
          </button>
        </div>
      </div>

      {/* DESTAQUE DOS 4 PILARES VIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-900/80 flex flex-col gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Wheat size={18} />
          </div>
          <h4 className="text-xs font-bold text-white">Módulo Rural VIP</h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Colha +1 a +2 itens a cada safra e acelere o crescimento dos animais na fazenda.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-900/80 flex flex-col gap-2">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Zap size={18} />
          </div>
          <h4 className="text-xs font-bold text-white">2x a 3x Multiplicador de XP</h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Alcance novos níveis muito mais rápido em todas as ações e comandos do bot.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-900/80 flex flex-col gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Wrench size={18} />
          </div>
          <h4 className="text-xs font-bold text-white">Oficina com até 50% OFF</h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Conserte suas ferramentas no <code className="text-zinc-300">/recuperar</code> gastando metade do valor.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-900/80 flex flex-col gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Gift size={18} />
          </div>
          <h4 className="text-xs font-bold text-white">Bolsa Semanal VIP</h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Receba até R$ 65.000 toda semana no <code className="text-zinc-300">/semanal</code> mais suprimentos raros.
          </p>
        </div>
      </div>

      {/* VISÃO 1: CARDS DOS PLANOS */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = isVipActive && vipLevel === plan.level;

            return (
              <div
                key={plan.title}
                className={`relative flex flex-col justify-between rounded-3xl border ${plan.color} bg-zinc-900/40 p-7 backdrop-blur-md transition-all duration-200 hover:shadow-2xl overflow-hidden ${
                  isCurrentPlan ? 'ring-2 ring-amber-400/40 shadow-xl' : ''
                }`}
              >
                <div className={`absolute -right-16 -top-16 w-44 h-44 ${plan.glow} rounded-full blur-3xl pointer-events-none`} />

                <div className="relative z-10 space-y-6">
                  {/* TOPO DO CARD */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{plan.icon}</span>
                      <div>
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                          {plan.subtitle}
                        </span>
                        <h3 className="text-xl font-black text-white">{plan.title}</h3>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${plan.badgeBg}`}>
                      {plan.highlight}
                    </span>
                  </div>

                  {/* PREÇO */}
                  <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white font-mono">{plan.price}</span>
                    <span className="text-xs text-zinc-500 font-medium">{plan.period}</span>
                  </div>

                  {/* LISTA DE BENEFÍCIOS */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
                      Vantagens Inclusas:
                    </span>
                    <ul className="space-y-2.5">
                      {plan.perks.map((perk, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs">
                          <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <Check size={11} strokeWidth={3} />
                          </div>
                          <div>
                            <strong className="text-zinc-200 font-bold block">{perk.title}</strong>
                            <span className="text-zinc-500 text-[11px] leading-tight block mt-0.5">{perk.desc}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* BOTÃO DE AÇÃO */}
                <div className="relative z-10 pt-6 mt-6 border-t border-zinc-800/80">
                  <button
                    onClick={() => {
                      alert(`🎉 Para assinar o ${plan.title} com ativação instantânea via PIX ou Cartão, abra um ticket no nosso servidor de suporte oficial do Discord!`);
                    }}
                    className={`w-full py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 ${
                      isCurrentPlan 
                        ? 'bg-emerald-600 text-white font-bold cursor-default shadow-lg shadow-emerald-600/20' 
                        : plan.buttonClass
                    }`}
                  >
                    {isCurrentPlan ? (
                      <>
                        <Check size={16} /> Seu Plano Atual
                      </>
                    ) : (
                      <>
                        <span>Assinar {plan.title} (PIX Instantâneo)</span>
                        <ChevronRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISÃO 2: TABELA COMPARATIVA */}
      {activeTab === 'comparison' && (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  <th className="p-4 font-bold text-zinc-300 w-2/5">Recurso / Vantagem</th>
                  <th className="p-4 font-bold text-zinc-400 text-center">Gratuito</th>
                  <th className="p-4 font-bold text-zinc-200 text-center bg-zinc-800/40">VIP Prata (Nível 1)</th>
                  <th className="p-4 font-bold text-amber-400 text-center bg-amber-500/10">VIP Ouro (Nível 2)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-900/30 transition">
                    <td className="p-4 font-semibold text-zinc-200">{row.perk}</td>
                    <td className="p-4 text-center text-zinc-500">{row.free}</td>
                    <td className="p-4 text-center font-medium text-zinc-300 bg-zinc-800/20">{row.prata}</td>
                    <td className="p-4 text-center font-bold text-amber-300 bg-amber-500/5">{row.ouro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BLOCO DE AJUDA E ATIVAÇÃO */}
      <div className="bg-zinc-900/40 border border-zinc-800/90 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-purple-400" size={18} />
            Como funciona a ativação do VIP?
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
            A ativação é 100% segura e vinculada diretamente à sua conta do Discord. Assim que o pagamento via PIX é confirmado pela nossa equipe de suporte, seus benefícios são aplicados imediatamente em todos os comandos do bot e no dashboard.
          </p>
        </div>

        <a
          href="https://discord.gg/vMvRrf5"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 shadow-lg shadow-purple-600/20 cursor-pointer"
        >
          <span>Abrir Ticket no Suporte</span>
          <ExternalLink size={14} />
        </a>
      </div>

    </div>
  );
}