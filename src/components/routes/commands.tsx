import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";

const commands = [
  { name: "/play", args: "query", category: "Music", description: "Toca uma música ou playlist." },
  { name: "/pause", args: "", category: "Music", description: "Pausa a reprodução atual." },
  { name: "/warn", args: "user reason", category: "Moderation", description: "Aplica um aviso a um membro." },
  { name: "/kick", args: "user reason", category: "Moderation", description: "Remove um membro do servidor." },
  { name: "/ban", args: "user reason", category: "Moderation", description: "Bane um membro permanentemente." },
  { name: "/embed", args: "title body", category: "Utility", description: "Cria uma mensagem embed rica." },
  { name: "/ticket", args: "reason", category: "Utility", description: "Abre um ticket de suporte." },
  { name: "/level", args: "[user]", category: "Community", description: "Mostra o nível de um membro." },
  { name: "/leaderboard", args: "", category: "Community", description: "Exibe o ranking do servidor." },
  { name: "/daily", args: "", category: "Economy", description: "Resgata a recompensa diária." },
  { name: "/balance", args: "[user]", category: "Economy", description: "Consulta o saldo de moedas." },
  { name: "/help", args: "[command]", category: "Utility", description: "Mostra ajuda sobre comandos." },
];

const categories = ["All", "Music", "Moderation", "Utility", "Community", "Economy"];

const categoryStyles: Record<string, string> = {
  Music: "bg-tint/40 text-ink",
  Moderation: "bg-berry/10 text-berry",
  Utility: "bg-ink/5 text-ink",
  Community: "bg-tint/40 text-ink",
  Economy: "bg-berry/10 text-berry",
};

export const Route = createFileRoute("/commands")({
  head: () => ({
    meta: [
      { title: "Commands — Sistine" },
      { name: "description", content: "Lista completa de comandos do bot Sistine para Discord." },
      { property: "og:title", content: "Commands — Sistine" },
      { property: "og:description", content: "Lista completa de comandos do bot Sistine para Discord." },
    ],
  }),
  component: CommandsPage,
});

function CommandsPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = commands.filter((cmd) => {
    const matchesQuery =
      cmd.name.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = activeCategory === "All" || cmd.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl mb-8">
          <p className="font-mono text-xs text-berry">02 — Commands</p>
          <h1 className="mt-3 font-display font-bold text-4xl tracking-tight text-ink">
            Biblioteca de comandos
          </h1>
          <p className="mt-4 text-ink-soft">
            Todos os comandos disponíveis no Sistine, organizados por categoria.
          </p>
        </div>

        <div className="rounded-3xl paper-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar comando…"
              className="w-full md:w-80 rounded-full bg-paper/80 border border-ink/10 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-berry/30"
            />
            <p className="text-xs text-ink-soft font-mono">{commands.length} commands · {categories.length - 1} categories</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-berry text-white"
                    : "bg-paper/80 border border-ink/10 text-ink-soft hover:text-ink"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map((cmd) => (
              <div
                key={cmd.name}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl bg-paper/70 border border-ink/5 px-4 py-3 hover:border-berry/30 transition-colors"
              >
                <div>
                  <span className="font-mono text-sm text-ink">
                    {cmd.name} <span className="text-ink-soft">{cmd.args}</span>
                  </span>
                  <p className="text-xs text-ink-soft mt-0.5">{cmd.description}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-mono self-start sm:self-center ${categoryStyles[cmd.category]}`}>
                  {cmd.category}
                </span>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-ink-soft py-8 text-center">Nenhum comando encontrado.</p>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
