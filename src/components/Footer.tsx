import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-ink/5">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Logo />
          <div className="flex flex-wrap gap-x-7 gap-y-2 text-sm text-ink-soft">
            <p className="text-xs text-ink-soft font-mono">© 2026 Sistine</p>
          </div>
        </div>
      </div>
    </footer>
  );
}