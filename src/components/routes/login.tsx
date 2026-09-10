import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Sistine" },
      { name: "description", content: "Entre na sua conta Sistine para gerenciar seus servidores Discord." },
      { property: "og:title", content: "Login — Sistine" },
      { property: "og:description", content: "Entre na sua conta Sistine para gerenciar seus servidores Discord." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-md mx-auto rounded-3xl paper-card p-8 md:p-10">
          <p className="font-mono text-xs text-berry">03 — Login</p>
          <h1 className="mt-3 font-display font-bold text-2xl tracking-tight text-ink">
            Entrar na conta
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Conecte-se via Discord para acessar o dashboard.
          </p>
          <form className="mt-6 space-y-3" onSubmit={(e) => e.preventDefault()}>
            <div className="rounded-2xl bg-paper/80 border border-ink/10 px-4 py-3">
              <label className="block text-xs font-medium text-ink-soft">E-mail do Discord</label>
              <input
                type="email"
                placeholder="voce@servidor.com"
                className="mt-1 w-full bg-transparent text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none"
              />
            </div>
            <div className="rounded-2xl bg-paper/80 border border-ink/10 px-4 py-3">
              <label className="block text-xs font-medium text-ink-soft">Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                className="mt-1 w-full bg-transparent text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-berry text-white px-4 py-3 text-sm font-semibold hover:bg-berry/90 transition-colors"
            >
              Entrar
            </button>
            <p className="text-center text-xs text-ink-soft">
              Não tem conta?{" "}
              <a href="#" className="font-medium text-berry hover:underline">
                Criar uma
              </a>
            </p>
          </form>
          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink/10" />
            <span className="text-xs text-ink-soft">ou</span>
            <span className="h-px flex-1 bg-ink/10" />
          </div>
          <button
            type="button"
            className="mt-6 w-full rounded-full bg-ink text-white px-4 py-3 text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            Continuar com Discord
          </button>
        </div>
      </section>
    </PageShell>
  );
}
