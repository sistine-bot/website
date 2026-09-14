import { Logo } from "./Logo";

const navLinks = [
  { id: "landing", label: "Início" },
  { id: "premium", label: "Premium" },
  { id: "shop", label: "Loja" },
  // { id: "wiki", label: "Wiki" },
  { id: "commands", label: "Comandos" },
  { id: "support", label: "Suporte" },
];

interface HeaderProps {
  onLogin?: () => void;
  onNavigate?: (view: string) => void;
  user?: { id: string; username: string; avatar: string; global_name?: string } | null;
}

export function Header({ onLogin, onNavigate, user }: HeaderProps) {
  const getAvatarUrl = () => {
    if (!user) return '';
    if (typeof user.avatar === 'string' && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://'))) {
      return user.avatar;
    }
    if (user.avatar && user.avatar !== 'null' && user.avatar !== 'undefined') {
      const isAnimated = user.avatar.startsWith('a_');
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${isAnimated ? 'gif' : 'png'}`;
    }
    try {
      const defaultIndex = user.id ? Number((BigInt(user.id) >> 22n) % 6n) : 0;
      return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
    } catch {
      return 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-paper/70 backdrop-blur-xl border-b border-ink/5">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Logo onClick={() => onNavigate?.('landing')} />
        <div className="hidden md:flex items-center gap-7 text-sm text-ink-soft">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onNavigate?.(link.id)}
              className="hover:text-ink transition-colors bg-transparent border-none cursor-pointer p-0 text-sm font-medium text-ink-soft"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div>
          {user ? (
            <button 
              onClick={onLogin}
              className="cursor-pointer flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl transition"
            >
              <img 
                src={getAvatarUrl()} 
                alt="Avatar" 
                className="w-7 h-7 rounded-full bg-zinc-900"
              />
              <span className="text-sm font-semibold">
                {user.global_name || user.username}
              </span>
            </button>
          ) : (
            <button 
              onClick={onLogin}
              className="rounded-full bg-berry text-white px-5 py-2 text-sm font-medium cursor-pointer hover:bg-berry/80 transition-colors"
            >
              Login
            </button>
          )}
        </div>

      </div>
    </nav>
  );
}