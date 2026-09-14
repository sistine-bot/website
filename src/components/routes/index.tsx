import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Hero } from "@/components/Hero";
import { RuralShowcase } from "@/components/RuralShowcase";
import { Capabilities } from "@/components/Capabilities";
import { CommandSearch } from "@/components/CommandSearch";
import { SectionCards } from "@/components/SectionCards";
import { WikiSupport } from "@/components/WikiSupport";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sistine — Discord Bot" },
      { name: "description", content: "Sistine é o compositor do seu servidor Discord — moderação, música e comunidade afinados em uma única chave elegante." },
      { property: "og:title", content: "Sistine — Discord Bot" },
      { property: "og:description", content: "Sistine é o compositor do seu servidor Discord — moderação, música e comunidade afinados em uma única chave elegante." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <PageShell>
      <Hero />
      <RuralShowcase />
      <Capabilities />
      <CommandSearch />
      <SectionCards />
      <WikiSupport />
    </PageShell>
  );
}
