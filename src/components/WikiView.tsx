import { ArrowLeft } from 'lucide-react';

interface WikiViewProps {
  onBack: () => void;
}

export function WikiView({ onBack }: WikiViewProps) {
  return (
    <div className="min-h-screen bg-paper text-ink p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-8 text-sm font-semibold text-ink-soft hover:text-ink transition bg-zinc-900/50 border border-white/10 px-4 py-2 rounded-full w-fit"
        >
          <ArrowLeft size={16} /> Voltar para o início
        </button>
        <h1 className="font-display font-extrabold text-4xl mb-4 text-berry">Documentação / Wiki</h1>
        <p className="text-ink-soft mb-8">Bem-vindo à documentação do Sistine Bot. Aqui você aprende a configurar cargos, moderação e comandos.</p>
        
        <div className="space-y-4">
          <div className="paper-card p-6 rounded-2xl">
            <h3 className="font-bold text-xl mb-2">1. Primeiros Passos</h3>
            <p className="text-sm text-ink-soft">Como convidar o bot e dar permissões básicas de Administrador.</p>
          </div>
          <div className="paper-card p-6 rounded-2xl">
            <h3 className="font-bold text-xl mb-2">2. Configurando Cargos Automáticos</h3>
            <p className="text-sm text-ink-soft">Atribuição de cargos automáticos para novos membros que entram no servidor.</p>
          </div>
        </div>
      </div>
    </div>
  );
}