import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import teamCreative from "@/assets/team-creative.png";
import teamEngineer from "@/assets/team-engineer.png";
import teamDesigner from "@/assets/team-designer.png";

const team = [
  { name: "Marina Vidal", role: "Fundadora & CTO", image: teamCreative },
  { name: "Diego Ramos", role: "Engenheiro de Infra", image: teamEngineer },
  { name: "Carla Nunes", role: "Product Designer", image: teamDesigner },
  { name: "Tomás Faria", role: "Suporte & Comunidade", image: teamEngineer },
  { name: "Lúcia Mendes", role: "Desenvolvedora Full-stack", image: teamDesigner },
  { name: "Ravi Okonkwo", role: "Community Manager", image: teamCreative },
  { name: "Ines Duarte", role: "UX Research", image: teamDesigner },
  { name: "Theo Vance", role: "Engenheiro de Dados", image: teamEngineer },
];

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team — Sistine" },
      { name: "description", content: "Conheça a equipe por trás do bot Sistine para Discord." },
      { property: "og:title", content: "Team — Sistine" },
      { property: "og:description", content: "Conheça a equipe por trás do bot Sistine para Discord." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-[46ch] mb-12">
          <p className="font-mono text-xs text-berry">05 — Team</p>
          <h1 className="mt-3 font-display font-bold text-4xl tracking-tight text-ink">
            Uma equipe construindo com intenção.
          </h1>
          <p className="mt-4 text-ink-soft">
            Designers, engenheiros e curadores de comunidade que fazem o Sistine soar.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {team.map((member) => (
            <div
              key={member.name}
              className="rounded-3xl paper-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-berry/10"
            >
              <img
                src={member.image}
                alt={member.name}
                width={512}
                height={512}
                className="aspect-square rounded-2xl object-cover"
                loading="lazy"
              />
              <p className="mt-4 font-display font-semibold text-ink">{member.name}</p>
              <p className="text-xs text-berry">{member.role}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
