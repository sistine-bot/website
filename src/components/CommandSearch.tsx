import { useState, useMemo } from "react";
import type { BotCommand } from '../types';

interface CommandSearchProps {
  commands: BotCommand[];
}

const categoryStyles: Record<string, string> = {
  Music: "bg-tint/40",
  Música: "bg-tint/40",
  Moderation: "bg-berry/10 text-berry",
  Moderação: "bg-berry/10 text-berry",
  Utility: "bg-ink/5",
  Utilidades: "bg-ink/5",
  Community: "bg-tint/40",
  Comunidade: "bg-tint/40",
  Diversão: "bg-tint/40",
  Economia: "bg-ink/5",
  Apostas: "bg-berry/10 text-berry",
};

export function CommandSearch({ commands }: CommandSearchProps) {
  const [query, setQuery] = useState("");
  // console.log("Comandos brutos recebidos no CommandSearch:", commands);

  // Função para limpar os prefixos/módulos visuais da descrição
  const limpDesc = (mensagem?: string) => {
    if (!mensagem) return "Sem descrição";
    return mensagem
      .replace('⌊⚙️ Módulos⌉', '')
      .replace('⌊⚙️ Modulos⌉', '')
      .replace('⌊🛠️ Utilidades⌉', '')
      .replace('⌊😂 Diversão⌉', '')
      .replace('⌊🎰 Apostas⌉', '')
      .replace('⌊💸 Economia⌉', '')
      .trim();
  };

  const processedCommands = useMemo(() => {
    // Trata casos em que 'commands' vem envelopado em { commands: [...] } ou { data: [...] }
    const rawArray = Array.isArray(commands)
      ? commands
      : (commands as any)?.commands || (commands as any)?.data || [];

    if (!Array.isArray(rawArray) || rawArray.length === 0) {
      return [];
    }

    const flattenedCommands: { id: string; name: string; description: string; category: string }[] = [];

    rawArray.forEach((cmd) => {
      // Ignora comandos de admin
      if (cmd.category && cmd.category.toLowerCase() === 'admin') return;

      // Filtra subcomandos reais (Type 1, 2, SUB_COMMAND ou SUB_COMMAND_GROUP)
      const realSubcommands = cmd.options?.filter((opt: any) =>
        opt.type === 1 || opt.type === 'SUB_COMMAND' || opt.type === 2 || opt.type === 'SUB_COMMAND_GROUP'
      ) || [];

      if (realSubcommands.length > 0) {
        realSubcommands.forEach((opt: any) => {
          const isPrefix = cmd.type === 'prefix' || cmd.id?.startsWith('prefix-');
          const symbol = isPrefix ? '!' : '/';

          // Junta o símbolo, o nome do comando e o subcomando (se existir)
          const formattedName = opt?.name 
            ? `${symbol}${cmd.name} ${opt.name}` 
            : `${symbol}${cmd.name}`;
            
          flattenedCommands.push({
            id: cmd.id || `${formattedName}-${Math.random()}`, 
            name: formattedName,
            description: limpDesc(cmd.description),
            category: cmd.category || 'Sem Categoria',
          })
        });
      } else {
        const isPrefix = cmd.type === 'prefix' || cmd.id?.startsWith('prefix-');
        const formattedName = isPrefix ? `!${cmd.name}` : `/${cmd.name}`;

        flattenedCommands.push({
          id: cmd.id || `${formattedName}-${Math.random}`,
          name: formattedName,
          description: limpDesc(cmd.description),
          category: cmd.category || 'Sem Categoria',
        });
      }
    });

    return flattenedCommands;
  }, [commands]);

  // Filtra por termo digitado na busca (nome, descrição ou categoria)
  const filtered = useMemo(() => {
    const searchLower = query.toLowerCase();
    return processedCommands.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(searchLower) ||
        cmd.description.toLowerCase().includes(searchLower) ||
        cmd.category.toLowerCase().includes(searchLower)
    );
  }, [processedCommands, query]);

  // Calcula a quantidade total de categorias únicas
  const totalCategories = useMemo(() => {
    return new Set(processedCommands.map((c) => c.category)).size;
  }, [processedCommands]);
  
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="rounded-3xl paper-card p-8 md:p-10">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            {/* <p className="font-mono text-xs text-berry">02 — Commands</p> */}
            <h2 className="mt-2 font-display font-bold text-2xl tracking-tight text-ink">
              Buscar na biblioteca
            </h2>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite para filtrar…"
              className="mt-5 w-full rounded-full bg-paper/80 border border-ink/10 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-berry/30"
            />
            <p className="mt-3 text-xs text-ink-soft font-mono">
              {processedCommands.length} comandos · {totalCategories} categorias
            </p>
          </div>
          <div className="md:col-span-2 space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {filtered.map((cmd, index) => (
              <div
                key={`${cmd.name}-${index}`}
                className="flex items-center justify-between gap-4 rounded-2xl bg-paper/70 border border-ink/5 px-4 py-3 hover:border-berry/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-sm font-semibold text-ink block truncate">
                    {cmd.name}
                  </span>
                  <p className="text-xs text-ink-soft truncate mt-0.5" title={cmd.description}>
                    {cmd.description}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-mono ${
                    categoryStyles[cmd.category] ?? "bg-ink/5"
                  }`}
                >
                  {cmd.category}
                </span>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-ink-soft py-4 text-center">Nenhum comando encontrado.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}