import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

const plans = [
  {
    name: "Início",
    price: "Grátis",
    description: "Para começar a tocar.",
    features: ["50 comandos essenciais", "Moderação básica", "1 servidor"],
    featured: false,
  },
  {
    name: "Sinergia",
    price: "R$ 19",
    period: "/mês",
    description: "A melodia completa.",
    features: ["Todos os comandos + economia", "Moderação avançada", "Até 10 servidores"],
    featured: true,
  },
  {
    name: "Maestro",
    price: "R$ 49",
    period: "/mês",
    description: "Para redes e comunidades grandes.",
    features: ["Recursos ilimitados", "API personalizada", "Suporte prioritário"],
    featured: false,
  },
];

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Sistine" },
      { name: "description", content: "Escolha o plano Sistine ideal para o seu servidor Discord." },
      { property: "og:title", content: "Shop — Sistine" },
      { property: "og:description", content: "Escolha o plano Sistine ideal para o seu servidor Discord." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="font-mono text-xs text-berry">04 — Shop</p>
          <h1 className="mt-3 font-display font-bold text-4xl tracking-tight text-ink">
            Escolha seu plano
          </h1>
          <p className="mt-4 text-ink-soft">
            Comece de graça e evolua conforme seu servidor cresce.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 ${
                plan.featured
                  ? "paper-card bg-gradient-to-br from-berry to-tint text-white shadow-xl shadow-berry/20"
                  : "paper-card hover:shadow-xl hover:shadow-berry/10"
              }`}
            >
              <div className={`text-sm font-medium ${plan.featured ? "text-white/90" : "text-ink-soft"}`}>
                {plan.name}
              </div>
              <div className={`mt-2 font-display font-bold text-3xl ${plan.featured ? "text-white" : "text-ink"}`}>
                {plan.price}
                {plan.period && (
                  <span className={`text-base font-normal ${plan.featured ? "text-white/70" : "text-ink-soft"}`}>
                    {plan.period}
                  </span>
                )}
              </div>
              <p className={`mt-2 text-sm ${plan.featured ? "text-white/80" : "text-ink-soft"}`}>
                {plan.description}
              </p>
              <ul className={`mt-5 space-y-2 text-sm ${plan.featured ? "text-white/90" : "text-ink-soft"}`}>
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <button
                type="button"
                className={`mt-6 block w-full text-center px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  plan.featured
                    ? "bg-white text-berry hover:bg-white/90"
                    : "bg-ink/5 text-ink hover:bg-ink/10"
                }`}
              >
                {plan.featured ? "Assinar" : "Começar"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
