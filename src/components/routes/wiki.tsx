import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

const guides = [
  { title: "Primeiros passos", description: "Convite, cargos e configuração inicial.", duration: "5 min", category: "Intro" },
  { title: "Configurando moderação", description: "Regras, níveis e caminhos de escalada.", duration: "8 min", category: "Moderation" },
  { title: "Comandos personalizados", description: "Respostas, botões e condições.", duration: "10 min", category: "Customization" },
  { title: "Webhooks & API", description: "Integre Sistine aos seus próprios sistemas.", duration: "12 min", category: "Developers" },
  { title: "Economia do servidor", description: "Configure moedas, recompensas e lojas.", duration: "7 min", category: "Economy" },
  { title: "Música e playlists", description: "Fila, crossfade e permissões de canal.", duration: "6 min", category: "Music" },
];

export const Route = createFileRoute("/wiki")({
  head: () => ({
    meta: [
      { title: "Wiki — Sistine" },
      { name: "description", content: "Documentação completa do bot Sistine para Discord." },
      { property: "og:title", content: "Wiki — Sistine" },
      { property: "og:description", content: "Documentação completa do bot Sistine para Discord." },
    ],
  }),
  component: WikiPage,
});

function WikiPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl mb-12">
          <p className="font-mono text-xs text-berry">06 — Wiki</p>
          <h1 className="mt-3 font-display font-bold text-4xl tracking-tight text-ink">
            Documentação
          </h1>
          <p className="mt-4 text-ink-soft">
            Guias para configurar, customizar e expandir o Sistine no seu servidor.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {guides.map((guide) => (
            <Link
              key={guide.title}
              to="/wiki"
              className="group rounded-3xl paper-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-berry/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-block rounded-full bg-berry/10 text-berry px-2.5 py-1 text-xs font-mono mb-3">
                    {guide.category}
                  </span>
                  <h3 className="font-display font-bold text-xl text-ink group-hover:text-berry transition-colors">
                    {guide.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-soft">{guide.description}</p>
                </div>
                <span className="text-xs text-ink-soft font-mono whitespace-nowrap">{guide.duration}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
