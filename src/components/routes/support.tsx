import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

const faqs = [
  { question: "Como adiciono o Sistine ao meu servidor?", answer: "Clique em 'Adicionar ao Discord', escolha o servidor e autorize as permissões necessárias." },
  { question: "O Sistine é gratuito?", answer: "Sim. O plano Início é gratuito e inclui os comandos essenciais. Planos pagos desbloqueiam recursos avançados." },
  { question: "Posso migrar dados de outro bot?", answer: "Sim, oferecemos ferramentas de importação para dados de níveis e economia dos principais bots do mercado." },
  { question: "Onde reporto bugs?", answer: "No nosso servidor do Discord ou por e-mail. Nossa equipe responde em até 2 horas." },
];

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Sistine" },
      { name: "description", content: "Obtenha ajuda com o bot Sistine para Discord." },
      { property: "og:title", content: "Support — Sistine" },
      { property: "og:description", content: "Obtenha ajuda com o bot Sistine para Discord." },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl mb-12">
          <p className="font-mono text-xs text-berry">07 — Support</p>
          <h1 className="mt-3 font-display font-bold text-4xl tracking-tight text-ink">
            Suporte
          </h1>
          <p className="mt-4 text-ink-soft">
            Estamos aqui para ajudar. Resposta média em menos de 2 horas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <a
            href="#"
            className="rounded-3xl paper-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-berry/10"
          >
            <h3 className="font-display font-bold text-xl text-ink">Servidor no Discord</h3>
            <p className="mt-2 text-sm text-ink-soft">Converse diretamente com a equipe e a comunidade.</p>
            <span className="mt-4 inline-block text-sm font-semibold text-berry">Entrar →</span>
          </a>
          <a
            href="#"
            className="rounded-3xl paper-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-berry/10"
          >
            <h3 className="font-display font-bold text-xl text-ink">E-mail</h3>
            <p className="mt-2 text-sm text-ink-soft">Envie sua dúvida ou solicitação comercial.</p>
            <span className="mt-4 inline-block text-sm font-semibold text-berry">Enviar e-mail →</span>
          </a>
        </div>

        <div className="max-w-3xl">
          <h2 className="font-display font-bold text-2xl text-ink mb-6">Perguntas frequentes</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-3xl paper-card p-6">
                <h3 className="font-display font-semibold text-ink">{faq.question}</h3>
                <p className="mt-2 text-sm text-ink-soft">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
