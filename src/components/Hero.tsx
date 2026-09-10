interface HeroProps {
  onAddBot?: () => void;
  onLogin?: () => void;
}

export function Hero({ onAddBot, onLogin }: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute -top-24 -left-20 size-72 rounded-full bg-berry/20 blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-0 size-80 rounded-full bg-tint/40 blur-3xl pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-28">
        <div className="flex flex-col lg:flex-row lg:items-center gap-12">
          <div className="lg:flex-1 rise">
            <h1 className="font-display font-extrabold text-6xl lg:text-7xl tracking-tight leading-[0.95] text-balance text-ink">
              A orquestra que seu servidor <span className="text-berry">precisa.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-soft max-w-[42ch] text-pretty">
              Sistine junta Economia, Moderação e Diveersão num único bot — Desenvolvido com amor e carinho.
            </p>
            
            <div className="mt-8 inline-flex flex-col items-center gap-3">
              <div className="flex flex-wrap justify-center gap-3">
                
                <a href="https://discord.com/oauth2/authorize?client_id=123&permissions=8&scope=bot" className="rounded-full bg-white/10 backdrop-blur-md border border-ink/10 px-6 py-3 text-sm font-semibold text-ink hover:bg-white/20 transition-colors">
                  Adicionar ao Discord
                </a>

                <a href="/wiki" className="rounded-full bg-white/10 backdrop-blur-md border border-ink/10 px-6 py-3 text-sm font-semibold text-ink hover:bg-white/20 transition-colors">
                  Explorar a Wiki
                </a>
              </div>

              <a onClick={onLogin} className="cursor-pointer rounded-full bg-berry backdrop-blur-md border border-ink/10 px-7 py-3 text-base font-semibold text-ink hover:bg-berry/70 transition-colors">
                Painel de controle
              </a>

            </div>

          </div>
          <div className="lg:flex-1 flex justify-center rise-delay">
            <div className="relative">
              <div className="size-64 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/60 shadow-2xl shadow-berry/10 grid place-items-center">
                <img
                  src='src/utils/assets/logo.png'
                  alt="Sistine Logo"
                  width={160}
                  height={160}
                  className="size-60 rounded-[1.5rem] object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}