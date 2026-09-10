const wikiItems = [
  { title: "Primeiros passos", duration: "5 min", href: "/wiki" },
  { title: "Configurando cargos", duration: "8 min", href: "/wiki" },
  { title: "Webhooks & API", duration: "12 min", href: "/wiki" },
];

export function WikiSupport() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="grid md:grid-cols-1 gap-4">

        <div className="rounded-3xl paper-card p-7">
          {/* <p className="font-mono text-xs text-berry">07 — Support</p> */}
          <h3 className="mt-3 font-display font-bold text-xl text-ink">Suporte e comunidade</h3>
          <p className="mt-2 text-sm text-ink-soft">
            Encontre fãs da sistine para conversar, peça ajuda de ideias e reporte bugs. Entre no servidor oficial
          </p>
          <div className="mt-5 flex gap-3">
            <a href="#" className="flex-1 rounded-full bg-paper/80 border border-ink/10 px-4 py-2.5 text-sm font-medium text-center text-ink hover:border-berry/40 transition-colors">
              Enviar e-mail
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}