import React from 'react';

const capabilities = [
  {
    icon: "🌾",
    title: "Fazenda & Plantação",
    description: "O maior diferencial do bot! Cultive 6 safras com rega dinâmica e adote filhotes no rancho com afeto e carinho.",
    span: "md:col-span-3",
    iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    badge: "Diferencial Exclusivo",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
  },
  {
    icon: "🪙",
    title: "Economia Integrada",
    description: "Compre sementes e ração na loja, lucre vendendo safras de ouro e leite fresco, e dispute o topo do ranking!",
    span: "md:col-span-3",
    iconBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  },
  {
    icon: "🎉",
    title: "Diversão & Social",
    description: "Comandos interativos, casamentos, empregos e minijogos para manter o chat do seu Discord sempre ativo e divertido.",
    span: "md:col-span-2",
    iconBg: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  },
  {
    icon: "🛡️",
    title: "Moderação & Segurança",
    description: "Bloqueador de convites, registro de punições e filtros automatizados para proteger sua comunidade 24 horas por dia.",
    span: "md:col-span-2",
    iconBg: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  },
  {
    icon: null,
    title: "Dashboard Central",
    description: "Painel web completo para gerenciar o prefixo, cor de embeds e acompanhar os diferenciais rurais em tempo real.",
    span: "md:col-span-2",
    featured: true,
  },
];

export function Capabilities() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="mt-2 font-display font-bold text-3xl tracking-tight text-ink">
            Recursos e Diferenciais Únicos
          </h2>
          <p className="text-sm text-ink-soft mt-1">
            Conheça os módulos que fazem a Sistine ser o bot favorito das comunidades.
          </p>
        </div>
        <p className="hidden sm:block text-sm text-ink-soft max-w-[30ch]">
          Entregue a melhor experiência para seus membros em cada detalhe.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {capabilities.map((cap, index) => (
          <div
            key={index}
            className={`rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 relative ${
              cap.featured
                ? "md:col-span-2 bg-gradient-to-br from-berry to-tint text-white hover:shadow-xl hover:shadow-berry/25"
                : `${cap.span} paper-card hover:shadow-xl hover:shadow-berry/10`
            }`}
          >
            <div className="flex items-center justify-between">
              {cap.icon && (
                <div
                  className={`size-11 rounded-2xl grid place-items-center text-xl font-display font-bold shadow-inner ${
                    cap.featured ? "bg-white/20 text-white" : cap.iconBg
                  }`}
                >
                  {cap.icon}
                </div>
              )}
              {cap.badge && (
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${cap.badgeColor}`}>
                  {cap.badge}
                </span>
              )}
            </div>

            <h3 className="mt-5 font-display font-bold text-xl">{cap.title}</h3>
            <p className={`mt-2 text-sm ${cap.featured ? "text-white/80" : "text-ink-soft"} max-w-[38ch] leading-relaxed`}>
              {cap.description}
            </p>
            {cap.featured && (
              <a href="#" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
                Acessar Painel →
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
