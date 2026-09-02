import React from 'react';
import { Crown, Check, Sparkles, Clock, ShieldCheck } from 'lucide-react';

interface VipShopProps {
  dbState?: any;
  user?: any;
}

export default function VipShop({ dbState, user }: VipShopProps) {
  const vipData = dbState?.vip || {};
  const vipLevel = Number(vipData.vip || 0);
  const vipTime = Number(vipData.tempo || 0);
  const vipDate = Number(vipData.data || 0);

  const isVipActive = vipLevel > 0 && (vipDate === 0 || vipTime - (Date.now() - vipDate) > 0);
  const remainingDays = isVipActive && vipDate > 0 && vipTime > 0
    ? Math.max(0, Math.ceil((vipTime - (Date.now() - vipDate)) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Crown className="text-yellow-400" size={22} />
            Planos VIP & Vantagens Exclusivas
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Adquira status VIP para receber multiplicador de moedas, insígnias únicas e customizações premium no bot.
          </p>
        </div>

        {/* STATUS VIP ATUAL */}
        {isVipActive ? (
          <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl shrink-0 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-lg">
              👑
            </div>
            <div>
              <span className="text-[10px] text-amber-300 font-bold block uppercase tracking-wider">Status VIP Ativo</span>
              <span className="text-xs font-bold text-white">
                {vipLevel === 2 ? 'VIP Ouro' : 'VIP Prata'}
                {remainingDays !== null && <span className="text-zinc-400 font-normal ml-1">({remainingDays} dias restantes)</span>}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl shrink-0 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 text-lg">
              🛡️
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Status da Conta</span>
              <span className="text-xs font-semibold text-zinc-300">Sem Plano VIP Ativo</span>
            </div>
          </div>
        )}
      </div>

      {/* CARDS DOS PLANOS VIP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            level: 2,
            title: 'VIP Ouro',
            price: 'R$ 29,90',
            color: 'border-yellow-500/50 hover:border-yellow-400',
            bg: 'bg-yellow-500/10',
            badge: '🥇',
            highlight: 'Mais Completo',
            perks: [
              'Badge Exclusiva VIP Ouro no /perfil',
              'Multiplicador 3x em todas as moedas',
              'Acesso a todos os Wallpapers Premium',
              'Cooldown reduzido nos comandos de economia',
              'Cargo exclusivo no servidor do suporte'
            ]
          },
          {
            level: 1,
            title: 'VIP Prata',
            price: 'R$ 19,90',
            color: 'border-zinc-400/50 hover:border-zinc-300',
            bg: 'bg-zinc-400/10',
            badge: '🥈',
            highlight: 'Recomendado',
            perks: [
              'Badge Exclusiva VIP Prata no /perfil',
              'Multiplicador 2x em moedas diárias',
              'Acesso a Wallpapers Selecionados',
              'Prioridade em sorteios e eventos'
            ]
          },
          {
            level: 0,
            title: 'VIP Bronze',
            price: 'R$ 9,90',
            color: 'border-amber-700/50 hover:border-amber-600',
            bg: 'bg-amber-700/10',
            badge: '🥉',
            highlight: 'Econômico',
            perks: [
              'Badge de Apoiador no /perfil',
              'Multiplicador 1.5x em moedas',
              'Acesso ao chat VIP no Discord'
            ]
          },
        ].map((vip) => {
          const isCurrentPlan = isVipActive && vipLevel === vip.level;

          return (
            <div
              key={vip.title}
              className={`bg-zinc-900/40 border ${vip.color} p-6 rounded-2xl space-y-4 flex flex-col justify-between relative overflow-hidden transition-all ${
                isCurrentPlan ? 'ring-2 ring-yellow-500/30' : ''
              }`}
            >
              <div className={`absolute -right-10 -top-10 w-32 h-32 ${vip.bg} rounded-full blur-2xl pointer-events-none`}></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{vip.badge}</span>
                  {vip.highlight && (
                    <span className="text-[10px] font-extrabold bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full border border-zinc-700">
                      {vip.highlight}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mt-3">{vip.title}</h3>
                <span className="text-2xl font-black text-white block mt-1 font-mono">
                  {vip.price} <span className="text-xs text-zinc-500 font-normal">/mês</span>
                </span>

                <ul className="text-xs text-zinc-300 space-y-2 mt-5">
                  {vip.perks.map((perk, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => alert(`Para assinar o ${vip.title}, entre no servidor oficial do Discord ou chame no suporte!`)}
                className={`w-full py-2.5 font-extrabold rounded-xl text-xs transition cursor-pointer relative z-10 mt-4 shadow-lg ${
                  isCurrentPlan
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-zinc-100 hover:bg-white text-black'
                }`}
              >
                {isCurrentPlan ? 'Plano Atual Ativo' : 'Assinar Agora (PIX)'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}