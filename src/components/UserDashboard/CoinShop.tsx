import React from 'react';
import { Coins, Wallet, Landmark, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';

interface CoinShopProps {
  dbState?: any;
  user?: any;
}

export default function CoinShop({ dbState, user }: CoinShopProps) {
  const carteira = dbState?.saldo?.carteira || 0;
  const banco = dbState?.saldo?.banco || 0;
  const total = Number(carteira) + Number(banco);

  return (
    <div className="space-y-6">
      {/* CABEÇALHO COM SALDO ATUAL DO BANCO */}
      <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Coins className="text-emerald-400" size={22} />
            Loja de Moedas & Economia
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Turbine seu saldo para apostar, comprar itens no market e subir no ranking global da Sistine.
          </p>
        </div>

        {/* STATUS FINANCEIRO */}
        <div className="flex items-center gap-4 bg-zinc-950 p-3 rounded-xl border border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-emerald-400" />
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase font-bold">Carteira</span>
              <span className="text-xs font-mono font-bold text-white">R$ {Number(carteira).toLocaleString('pt-BR')}</span>
            </div>
          </div>
          <div className="w-px h-6 bg-zinc-800"></div>
          <div className="flex items-center gap-2">
            <Landmark size={16} className="text-blue-400" />
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase font-bold">Banco</span>
              <span className="text-xs font-mono font-bold text-white">R$ {Number(banco).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PACOTES DE MOEDAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            amount: '50.000',
            bonus: '+ 5.000 Bônus',
            price: 'R$ 5,00',
            badge: 'Iniciante',
            color: 'border-zinc-800 hover:border-emerald-500/50'
          },
          {
            amount: '150.000',
            bonus: '+ 25.000 Bônus',
            price: 'R$ 12,00',
            badge: 'Mais Popular',
            color: 'border-emerald-500/60 ring-2 ring-emerald-500/20'
          },
          {
            amount: '500.000',
            bonus: '+ 100.000 Bônus',
            price: 'R$ 30,00',
            badge: 'Melhor Custo-Benefício',
            color: 'border-purple-500/60 ring-2 ring-purple-500/20'
          },
        ].map((pack) => (
          <div
            key={pack.amount}
            className={`bg-zinc-900/40 border ${pack.color} transition p-6 rounded-2xl space-y-4 text-center flex flex-col justify-between relative overflow-hidden`}
          >
            {pack.badge && (
              <span className="absolute top-3 right-3 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {pack.badge}
              </span>
            )}

            <div className="space-y-2 pt-2">
              <Coins className="text-emerald-400 mx-auto" size={42} />
              <div>
                <h3 className="text-2xl font-black text-white font-mono">{pack.amount}</h3>
                <span className="text-xs font-semibold text-emerald-400 block">{pack.bonus}</span>
                <span className="text-xs text-zinc-500">Sistine Coins</span>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-zinc-800/80">
              <div className="text-xl font-extrabold text-white">{pack.price}</div>
              <button
                onClick={() => alert('Para adquirir moedas, utilize o canal de doações no Discord oficial ou use PIX.')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                Comprar via PIX
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-900 flex items-center gap-3 text-xs text-zinc-500">
        <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
        <span>Todas as transações são creditadas de forma instantânea e segura na conta do seu usuário.</span>
      </div>
    </div>
  );
}