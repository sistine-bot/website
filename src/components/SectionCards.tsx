interface SectionCardsProps {
  onLogin?: () => void;
}

export function SectionCards({ onLogin }: SectionCardsProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="grid md:grid-cols-3 gap-4">

        <div className="rounded-3xl paper-card p-7">
          {/* <p className="font-mono text-xs text-berry">03 — Login</p> */}
          <h3 className="mt-3 font-display font-bold text-xl text-ink">Entrar</h3>
          <p className="mt-2 text-sm text-ink-soft">Conecte-se via Discord OAuth para gerenciar seus servidores.</p>
          <button
            onClick={onLogin}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-berry text-white px-5 py-2.5 text-sm font-medium hover:bg-berry/80 transition-colors"
          >
            Continuar com Discord
          </button>
        </div>

        <div className="rounded-3xl paper-card p-7">
          {/* <p className="font-mono text-xs text-berry">04 — Shop</p> */}
          <h3 className="mt-3 font-display font-bold text-xl text-ink">Premium</h3>
          <p className="mt-2 text-sm text-ink-soft">Ganhe vantagens sem estragar sua experiência.</p>
          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-sm text-ink-soft">a partir de</span>
            <span className="font-display font-bold text-3xl text-ink">R$ 9,90</span>
            <span className="text-sm text-ink-soft">/ mês</span>
          </div>
          <a href="/shop" className="mt-4 inline-block text-sm font-semibold text-berry">
            Ver planos →
          </a>
        </div>

        {/* <div className="rounded-3xl paper-card p-7">
          <p className="font-mono text-xs text-berry">05 — Team</p>
          <h3 className="mt-3 font-display font-bold text-xl text-ink">Os compositores</h3>
          <div className="mt-5 flex -space-x-3">
            <img
              src='src/utils/assets/team-creative.png'
              alt="Creative director"
              width={44}
              height={44}
              className="size-11 rounded-full object-cover outline-2 outline-paper"
              loading="lazy"
            />
            <img
              src='src/utils/assets/team-creative.png'
              alt="Software engineer"
              width={44}
              height={44}
              className="size-11 rounded-full object-cover outline-2 outline-paper"
              loading="lazy"
            />
            <img
              src='src/utils/assets/team-creative.png'
              alt="Product designer"
              width={44}
              height={44}
              className="size-11 rounded-full object-cover outline-2 outline-paper"
              loading="lazy"
            />
          </div>
          <p className="mt-4 text-sm text-ink-soft">+9 pessoas no time</p>
          <a href="/team" className="mt-2 inline-block text-sm font-semibold text-berry">
            Conhecer →
          </a>
        </div>
         */}
      </div>
    </section>
  );
}