import { ArrowLeft } from 'lucide-react';

interface ShopViewProps {
  onBack: () => void;
  onLogin: () => void;
}

export function ShopView({ onBack, onLogin }: ShopViewProps) {
  return (
    <div className="min-h-screen bg-paper text-ink p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-8 text-sm font-semibold text-ink-soft hover:text-ink transition bg-zinc-900/50 border border-white/10 px-4 py-2 rounded-full w-fit"
        >
          <ArrowLeft size={16} /> Voltar para o início
        </button>
        <h1 className="font-display font-extrabold text-4xl mb-4 text-berry">Sistine Pro (Shop)</h1>
        <p className="text-ink-soft mb-8">Leve seu servidor para o próximo nível com recursos ilimitados.</p>
        
        <div className="paper-card p-8 rounded-3xl border-berry/40 bg-gradient-to-br from-zinc-900/80 to-berry/10 max-w-md">
          <span className="font-mono text-xs text-berry uppercase tracking-wider">Plano Mensal</span>
          <h3 className="font-display font-bold text-3xl mt-2">R$ 19 <span className="text-sm text-ink-soft font-normal">/ mês</span></h3>
          <ul className="my-6 space-y-3 text-sm text-ink-soft">
            <li>✓ Bots ilimitados</li>
            <li>✓ Fila prioritária de música</li>
            <li>✓ Marca personalizada</li>
          </ul>
          <button
            onClick={onLogin}
            className="w-full rounded-full bg-berry text-white py-3 font-semibold shadow-lg shadow-berry/20 hover:bg-berry/90 transition"
          >
            Assinar Agora
          </button>
        </div>
      </div>
    </div>
  );
}