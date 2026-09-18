import { getDailyShopItems, BACKGROUNDS_CATALOG, LAYOUTS_CATALOG } from './shopCatalog';

// Cache em memória das URLs que já foram carregadas
const preloadedUrls = new Set<string>();
const inFlightUrls = new Set<string>();

/**
 * Pré-carrega uma única imagem no cache do navegador.
 */
export function preloadImage(url: string): Promise<boolean> {
  if (!url || typeof url !== 'string') return Promise.resolve(false);
  const cleanUrl = url.trim();
  if (!cleanUrl) return Promise.resolve(false);

  if (preloadedUrls.has(cleanUrl)) return Promise.resolve(true);

  return new Promise((resolve) => {
    inFlightUrls.add(cleanUrl);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      preloadedUrls.add(cleanUrl);
      inFlightUrls.delete(cleanUrl);
      resolve(true);
    };
    img.onerror = () => {
      inFlightUrls.delete(cleanUrl);
      resolve(false);
    };
    img.src = cleanUrl;
  });
}

/**
 * Pré-carrega uma lista de imagens com controle de concorrência
 * para não sobrecarregar a rede do usuário nem congelar a interface.
 */
export async function preloadImagesInBatches(urls: string[], concurrency = 3): Promise<void> {
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));
  const queue = [...uniqueUrls];

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const url = queue.shift();
      if (url) {
        await preloadImage(url);
      }
    }
  });

  await Promise.all(workers);
}

/**
 * Retorna se a imagem já foi pré-carregada e está em cache.
 */
export function isImagePreloaded(url: string): boolean {
  return preloadedUrls.has(url);
}

let catalogPreloadStarted = false;

/**
 * Estratégia Inteligente de Pré-Carregamento em Duas Fases:
 * 1. Fase Imediata: Carrega prioritariamente os 12 itens da loja diária de hoje.
 * 2. Fase Ociosa (Background): Pré-carrega os demais itens do catálogo aos poucos durante tempo ocioso.
 */
export function preloadShopCatalog(): void {
  if (catalogPreloadStarted) return;
  catalogPreloadStarted = true;

  try {
    // 1. Fase 1: Itens da loja de hoje (12 itens)
    const dailyItems = getDailyShopItems(12);
    const highPriorityUrls: string[] = [];

    dailyItems.forEach((item: any) => {
      if (item.previewUrl) highPriorityUrls.push(item.previewUrl);
      if (item.url) highPriorityUrls.push(item.url);
      if (item.overlay) highPriorityUrls.push(item.overlay);
    });

    // Adiciona o background padrão
    highPriorityUrls.push('/src/utils/assets/backgrounds/default_bg.jpg');

    // Executa o carregamento prioritário com 3 conexões paralelas
    preloadImagesInBatches(highPriorityUrls, 3).then(() => {
      // 2. Fase 2: Carregamento ocioso dos demais itens em background
      const idleCallback = typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? (window as any).requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 2000);

      idleCallback(() => {
        const remainingUrls: string[] = [];

        BACKGROUNDS_CATALOG.forEach(bg => {
          if (!preloadedUrls.has(bg.url)) remainingUrls.push(bg.url);
        });

        LAYOUTS_CATALOG.forEach(l => {
          if (l.previewUrl && !preloadedUrls.has(l.previewUrl)) remainingUrls.push(l.previewUrl);
          if (l.overlay && !preloadedUrls.has(l.overlay)) remainingUrls.push(l.overlay);
        });

        // Concorrência leve (2 por vez) em background para não pesar
        preloadImagesInBatches(remainingUrls, 2).catch(() => {});
      });
    }).catch(() => {});
  } catch (err) {
    console.warn('[ImagePreloader] Erro ao pré-carregar catálogo:', err);
  }
}
