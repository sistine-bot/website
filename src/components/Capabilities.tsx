const capabilities = [
  {
    icon: "D",
    title: "Diversão",
    description: "Comandos hilários e minijogos para animar o chat e garantir boas risadas na galera!",
    span: "md:col-span-3",
    iconBg: "bg-berry/10 text-berry",
  },
  {
    icon: "M",
    title: "Moderação",
    description: "Ferramentas práticas para manter a ordem e deixar seu servidor seguro sem dor de cabeça.",
    span: "md:col-span-3",
    iconBg: "bg-berry/10 text-berry",
  },
  {
    icon: "E",
    title: "Economia",
    description: "Trabalhe, acumule riqueza e suba no ranking para se tornar o verdadeiro magnata da comunidade!",
    span: "md:col-span-2",
    iconBg: "bg-berry/10 text-berry",
  },
  {
    icon: "A",
    title: "Apostas",
    description: "Sinta toda a adrenalina do cassino e dobre sua banca sem gastar um tostão real.",
    span: "md:col-span-2",
    iconBg: "bg-berry/10 text-berry",
  },
  {
    icon: null,
    title: "Dashboard configurável",
    description: "Painel intuitivo para você personalizar cada detalhe do bot em poucos cliques.",
    span: "md:col-span-2",
    featured: true,
  },
];

export function Capabilities() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="flex items-end justify-between mb-8">
        <div>
          {/* <p className="font-mono text-xs text-berry">01 — Capabilities</p> */}
          <h2 className="mt-2 font-display font-bold text-3xl tracking-tight text-ink">
            Construído com amor
          </h2>
        </div>
        <p className="hidden sm:block text-sm text-ink-soft max-w-[30ch]">
          Entregue a melhor experiência para seus membros em cada detalhe.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {capabilities.map((cap, index) => (
          <div
            key={index}
            className={`rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 ${
              cap.featured
                ? "md:col-span-2 bg-gradient-to-br from-berry to-tint text-white hover:shadow-xl hover:shadow-berry/25"
                : `${cap.span} paper-card hover:shadow-xl hover:shadow-berry/10`
            }`}
          >
            {cap.icon && (
              <div
                className={`size-11 rounded-2xl grid place-items-center font-display font-bold ${
                  cap.featured ? "bg-white/20 text-white" : cap.iconBg
                }`}
              >
                {cap.icon}
              </div>
            )}
            <h3 className="mt-5 font-display font-bold text-xl">{cap.title}</h3>
            <p className={`mt-2 text-sm ${cap.featured ? "text-white/80" : "text-ink-soft"} max-w-[38ch]`}>
              {cap.description}
            </p>
            {cap.featured && (
              <a href="#" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
                Abrir →
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
