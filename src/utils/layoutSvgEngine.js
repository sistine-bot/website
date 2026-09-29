/**
 * layoutSvgEngine.js
 * Motor de geração dinâmica de Layouts de Perfil em SVG.
 * 
 * Permite manipular layouts base vetoriais (Clássico, Moderno Inferior e Casamento)
 * gerando dinamicamente paletas completas em SVG sem necessidade de dezenas de PNGs estáticos.
 */

// Ícone base de usuário/badges em PNG 50x50 embutido para o layout clássico
const BADGE_ICON_B64 = "iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABHNCSVQICAgIfAhkiAAAAAFzUkdCAK7OHOkAAAH+SURBVGiB7Vq7SgQxFD3rY1VUsFoWsVGxstMvsLCw8icEV0G/QSz8BUv/wo+wFgvttFzQQhEUZGxmJBszSe4jzow7B8Kww01yztzceyeZBVqMF+YAzFZNgoMzAFmg7VdN0oeVCAF2m6yatI0PhoiiPVZNvgBXgNkeqhaxqiQkAzAtJdMR9M2kk1uQcMEEs9+tZNIS7Ek6c5+CtjcKsL3C9UjtMNZCThPwEIMjpHYVGczg6ubVPAXYwd5mrbqBK+RVmQcAXEo6/5tXFEkGWgawLZncwCaAoWQA0VNQ8soXgCnpIFIhUBCjwUEla3UAXDH6bWmJSIH3iE3UfdUkqegBOAFwDGA+ss86gCMAfepkdXBtTIwFeWpX9h6AJ8+yMuG6VwaKLRnXxAMGFzFOc4Kav18ALDFE71oiJMhcSy02RrRqRWgck4/P9hPAjHkjFCMaa3Mx0m7B+n3ose1SCGgdvsWOd27NP+TGSwoRFCGm7QY18F3Brpnmnon27LltITfcgUowyK9rkfaxwR6E5pLKjP3OIFGtKf0api3kIB+3n0iI05UpjnnejPQbs1SoS+vH3qwjKQ7e7NqQDE0+Dhrx2F8I2cmv2lsGL3ftYKcWxVgudyGVqYRcKM/xCy53x2QLDrSKXR12tSOgfp/3Lqc6qAt5J2tqdm3kn3Ba2PgGWgqPO2eXx8cAAAAASUVORK5CYII=";

// 1. TEMPLATE BASE: CLÁSSICO (Card Superior com corte de Avatar e Barra de Badges/Sobremim)
export const CLASSIC_BASE_SVG = `<svg width="1200" height="670" viewBox="0 0 1200 670" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g clip-path="url(#clip0_classic)">
<rect x="778" y="57" width="444" height="100" fill="{{ACCENT}}"/>
<rect x="-50" y="-10" width="861" height="182" fill="{{PRIMARY}}"/>
<rect x="400" y="-102" width="861" height="182" fill="{{PRIMARY}}"/>
<rect x="676" y="60.0509" width="861" height="182" transform="rotate(-47.9208 676 60.0509)" fill="{{PRIMARY}}"/>
<rect y="157" width="811" height="30" fill="{{DARK}}"/>
<rect x="883" y="60" width="318" height="30" fill="{{DARK}}"/>
<rect x="905.634" y="79.8538" width="142.255" height="30" transform="rotate(131.437 905.634 79.8538)" fill="{{DARK}}"/>
<path d="M235 126C235 186.751 185.751 236 125 236C64.2487 236 15 186.751 15 126C15 65.2487 64.2487 16 125 16C185.751 16 235 65.2487 235 126Z" fill="{{DARK}}"/>
<path d="M0 540H61L93 590H0V540Z" fill="{{PRIMARY}}"/>
<rect y="590" width="1200" height="80" fill="{{DARK}}"/>
<image x="11" y="540" width="50" height="50" xlink:href="data:image/png;base64,${BADGE_ICON_B64}"/>
</g>
<defs>
<clipPath id="clip0_classic">
<rect width="1200" height="670" fill="white"/>
</clipPath>
</defs>
</svg>`;

// 2. TEMPLATE BASE: MODERNO INFERIOR (Card Inferior com recorte circular e gradiente)
export const MODERN_BASE_SVG = `<svg width="1200" height="670" viewBox="0 0 1200 670" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_modern)">
<rect x="-10" y="451" width="1211" height="180" fill="{{PRIMARY}}"/>
<rect y="631" width="1200" height="39" fill="{{DARK}}"/>
<rect x="882" y="451" width="318" height="58" fill="url(#paint0_linear_modern)"/>
<path d="M88.5 456.5C132.13 456.5 167.5 491.87 167.5 535.5C167.5 579.13 132.13 614.5 88.5 614.5C44.8695 614.5 9.5 579.13 9.5 535.5C9.5 491.87 44.8695 456.5 88.5 456.5Z" stroke="{{RING}}" stroke-width="9"/>
</g>
<defs>
<linearGradient id="paint0_linear_modern" x1="882" y1="480" x2="1200" y2="480" gradientUnits="userSpaceOnUse">
<stop offset="0.120192" stop-color="{{DARK}}" stop-opacity="0"/>
<stop offset="0.634615" stop-color="{{DARK}}"/>
</linearGradient>
<clipPath id="clip0_modern">
<rect width="1200" height="670" fill="white"/>
</clipPath>
</defs>
</svg>`;

// 3. TEMPLATE BASE: CASAMENTO (Card Lateral Inferior Direito com gradiente e anel estilizado)
export const MARRIED_BASE_SVG = `<svg width="1200" height="670" viewBox="0 0 1200 670" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="marriedGrad" x1="880" y1="468" x2="1200" y2="468" gradientUnits="userSpaceOnUse">
      <stop offset="0.0" stop-color="{{DARK}}" stop-opacity="0"/>
      <stop offset="0.25" stop-color="{{DARK}}" stop-opacity="0.12"/>
      <stop offset="0.65" stop-color="{{DARK}}" stop-opacity="0.32"/>
      <stop offset="1.0" stop-color="{{DARK}}" stop-opacity="0.38"/>
    </linearGradient>
  </defs>
  <rect x="880" y="427" width="320" height="82" fill="url(#marriedGrad)"/>
  <g transform="translate(1142, 442) scale(1.4)">
    <path fill="#9AAAB4" d="M18 12c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z"/>
    <path fill="{{PRIMARY}}" d="M29 5l-4-5H11L7 5l11 9z"/>
    <path fill="{{ACCENT}}" d="M29 5l-4-5H11L7 5h11z"/>
    <path fill="{{PRIMARY}}" d="M29 5l-4-5h-7v5h1z"/>
    <path fill="{{ACCENT}}" d="M18 5h11l-11 9z"/>
    <path fill="#9AAAB4" d="M25 13c0 1.657-1.343 3-3 3h-8c-1.657 0-3-1.343-3-3s1.343-3 3-3h8c1.657 0 3 1.343 3 3z"/>
  </g>
</svg>`;

// ==========================================
// 4. PALETAS DE CORES (Originais + Novas Diferentes)
// ==========================================
export const LAYOUT_COLOR_PALETTES = {
  // --- CORES ORIGINAIS ---
  azul: {
    name: 'Azul Safira',
    primary: '#0094ff',
    dark: '#005dc7',
    accent: '#00d1ff',
    ring: '#0254b2',
    themeColor: '#3b82f6',
    themeMode: 'dark',
    textColor: '#ffffff',
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    classicPrice: 0,
    modernPrice: 18000,
    isDefault: true,
    descClassic: 'Layout clássico padrão com card superior de informações e detalhes em azul.',
    descModern: 'Layout moderno com informações posicionadas na base, detalhes em azul vibrante.'
  },
  roxo: {
    name: 'Roxo Imperial',
    primary: '#b213ac',
    dark: '#810e7c',
    accent: '#d050cb',
    ring: '#810e7c',
    themeColor: '#a855f7',
    themeMode: 'dark',
    textColor: '#ffffff',
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    classicPrice: 4000,
    modernPrice: 20000,
    descClassic: 'Moldura clássica estilizada com tons vibrantes de ametista e violeta neon.',
    descModern: 'Visual moderno com acentos púrpuras nobres e contraste aveludado na base.'
  },
  branco: {
    name: 'Branco Puro',
    primary: '#ffffff',
    dark: '#c5c5c5',
    accent: '#888888',
    ring: '#888888',
    themeColor: '#f8fafc',
    themeMode: 'light',
    textColor: '#000000',
    textShadow: 'none',
    classicPrice: 5000,
    modernPrice: 22000,
    descClassic: 'Design limpo e moderno em tons brancos translúcidos de alto contraste.',
    descModern: 'Estética clean minimalista com linhas brancas e tipografia escura na base.'
  },
  preto: {
    name: 'Dark Obsidian',
    primary: '#4c4c4c',
    dark: '#000000',
    accent: '#707070',
    ring: '#000000',
    themeColor: '#18181b',
    themeMode: 'dark',
    textColor: '#ffffff',
    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
    classicPrice: 6000,
    modernPrice: 25000,
    descClassic: 'Visual dark minimalista com bordas escuras sofisticadas.',
    descModern: 'Layout moderno com informações posicionadas na base, detalhes em preto e texto claro.'
  },
  vermelho: {
    name: 'Rubro Carmesim',
    primary: '#ee2222',
    dark: '#a81414',
    accent: '#ff4040',
    ring: '#a81414',
    themeColor: '#ef4444',
    themeMode: 'dark',
    textColor: '#ffffff',
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    classicPrice: 7500,
    modernPrice: 25000,
    descClassic: 'Tema ardente e imponente com destaques avermelhados de alto impacto.',
    descModern: 'Linhas vermelhas intensas com alta visibilidade para guerreiros natos.'
  },
  verde: {
    name: 'Verde Esmeralda',
    primary: '#04d700',
    dark: '#288019',
    accent: '#86ff84',
    ring: '#288019',
    themeColor: '#10b981',
    themeMode: 'dark',
    textColor: '#ffffff',
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    classicPrice: 7500,
    modernPrice: 25000,
    descClassic: 'Harmonia e elegância natural com detalhes esmeralda brilhantes.',
    descModern: 'Frescor esmeralda moderno com equilíbrio visual relaxante e vívido.'
  },
  laranja: {
    name: 'Âmbar Sunset',
    primary: '#ff891c',
    dark: '#d17e1d',
    accent: '#ffa945',
    ring: '#d17e1d',
    themeColor: '#f97316',
    themeMode: 'dark',
    textColor: '#ffffff',
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    classicPrice: 7500,
    modernPrice: 25000,
    descClassic: 'Calor e energia vibrante em tons dourados e alaranjados de pôr do sol.',
    descModern: 'Acentos em âmbar vívido trazendo calor e dinamismo à sua base de perfil.'
  },

  // --- NOVAS CORES DIFERENTES CRIADAS ---
  rosa: {
    name: 'Rosa Sakura',
    primary: '#ec4899',
    dark: '#be185d',
    accent: '#f472b6',
    ring: '#be185d',
    themeColor: '#ec4899',
    themeMode: 'dark',
    textColor: '#ffffff',
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    classicPrice: 8000,
    modernPrice: 26000,
    descClassic: 'Elegância graciosa e suave inspirada nas flores de cerejeira em flor.',
    descModern: 'Design contemporâneo em tons de rosa sakura com toque acolhedor e expressivo.'
  },
  ciano: {
    name: 'Ciano Glacial',
    primary: '#06b6d4',
    dark: '#0e7490',
    accent: '#67e8f9',
    ring: '#0e7490',
    themeColor: '#06b6d4',
    themeMode: 'dark',
    textColor: '#ffffff',
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    classicPrice: 8000,
    modernPrice: 26000,
    descClassic: 'Tons gélidos e futuristas inspirados em geleiras árticas e cristais de gelo.',
    descModern: 'Fluidez holográfica em ciano puro trazendo clareza e modernidade cristalina.'
  },
  dourado: {
    name: 'Dourado Solar',
    primary: '#eab308',
    dark: '#a16207',
    accent: '#fef08a',
    ring: '#a16207',
    themeColor: '#eab308',
    themeMode: 'dark',
    textColor: '#ffffff',
    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
    classicPrice: 10000,
    modernPrice: 30000,
    descClassic: 'Brilho régio e acabamento solar em ouro puro para perfis de prestígio.',
    descModern: 'Luxo e distinção em barras áureas polidas de alto valor na economia.'
  },
  magenta: {
    name: 'Magenta Cósmico',
    primary: '#d946ef',
    dark: '#86198f',
    accent: '#f0abfc',
    ring: '#86198f',
    themeColor: '#d946ef',
    themeMode: 'dark',
    textColor: '#ffffff',
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    classicPrice: 8500,
    modernPrice: 27000,
    descClassic: 'Energia cósmica profunda em nuances intensas de fúcsia e ultravioleta.',
    descModern: 'Base futurista com vibração ultravioleta cósmica de alto contraste.'
  },
  lima: {
    name: 'Verde Lima Neon',
    primary: '#84cc16',
    dark: '#4d7c0f',
    accent: '#bef264',
    ring: '#4d7c0f',
    themeColor: '#84cc16',
    themeMode: 'dark',
    textColor: '#ffffff',
    textShadow: '0 1px 3px rgba(0,0,0,0.7)',
    classicPrice: 8500,
    modernPrice: 27000,
    descClassic: 'Estética cibernética ácida e eletrizante com verde-limão luminescente.',
    descModern: 'Traços eletrizantes em verde-limão radioativo para quem não passa despercebido.'
  },
  vinho: {
    name: 'Vinho Carmim',
    primary: '#9f1239',
    dark: '#4c0519',
    accent: '#f43f5e',
    ring: '#4c0519',
    themeColor: '#9f1239',
    themeMode: 'dark',
    textColor: '#ffffff',
    textShadow: '0 1px 3px rgba(0,0,0,0.7)',
    classicPrice: 9000,
    modernPrice: 28000,
    descClassic: 'Elegância sombria e refinada em tons nobres de vinho tinto e rubi escuro.',
    descModern: 'Sofisticação aristocrática em vermelho rubi escuro e detalhes enigmáticos.'
  },
  prata: {
    name: 'Prata Grafite',
    primary: '#64748b',
    dark: '#334155',
    accent: '#94a3b8',
    ring: '#1e293b',
    themeColor: '#64748b',
    themeMode: 'dark',
    textColor: '#ffffff',
    textShadow: '0 1px 3px rgba(0,0,0,0.7)',
    classicPrice: 7000,
    modernPrice: 24000,
    descClassic: 'Acabamento metálico industrial em aço escovado e grafite fosco.',
    descModern: 'Minimalismo técnico com tons de ardósia e prata espacial para o perfil.'
  },
  indigo: {
    name: 'Índigo Noturno',
    primary: '#4f46e5',
    dark: '#312e81',
    accent: '#818cf8',
    ring: '#1e1b4b',
    themeColor: '#4f46e5',
    themeMode: 'dark',
    textColor: '#ffffff',
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    classicPrice: 8000,
    modernPrice: 26000,
    descClassic: 'A serenidade do céu noturno com gradientes profundos de azul marinho e índigo.',
    descModern: 'Harmonia noturna relaxante com azul índigo celestial para sua base.'
  }
};

// ==========================================
// 5. FUNÇÕES GERADORAS DE SVG
// ==========================================

function stringToDataUri(str) {
  if (typeof Buffer !== 'undefined') {
    return `data:image/svg+xml;base64,${Buffer.from(str).toString('base64')}`;
  }
  if (typeof btoa !== 'undefined') {
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(str)))}`;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(str)}`;
}

/**
 * Constrói o código SVG puro para um layout e paleta específicos.
 */
export function buildLayoutSvgString(templateType, palette) {
  const isClassic = templateType === 'classic';
  let svg = isClassic ? CLASSIC_BASE_SVG : MODERN_BASE_SVG;

  svg = svg.replaceAll('{{PRIMARY}}', palette.primary);
  svg = svg.replaceAll('{{DARK}}', palette.dark);
  svg = svg.replaceAll('{{ACCENT}}', palette.accent || palette.primary);
  svg = svg.replaceAll('{{RING}}', palette.ring || palette.dark);

  return svg;
}

/**
 * Constrói o código SVG de casamento para a paleta correspondente.
 */
export function buildMarriedSvgString(palette) {
  let svg = MARRIED_BASE_SVG;
  svg = svg.replaceAll('{{PRIMARY}}', palette.primary);
  svg = svg.replaceAll('{{DARK}}', palette.dark);
  svg = svg.replaceAll('{{ACCENT}}', palette.accent || palette.primary);
  return svg;
}

/**
 * Retorna o Data URI pronto para uso em Satori ou tags <img src="...">.
 */
export function getLayoutSvgDataUri(templateType, colorKey) {
  const palette = LAYOUT_COLOR_PALETTES[colorKey] || LAYOUT_COLOR_PALETTES.azul;
  const svg = buildLayoutSvgString(templateType, palette);
  return stringToDataUri(svg);
}

/**
 * Retorna o Data URI do layout de casamento correspondente à cor.
 */
export function getMarriedSvgDataUri(colorKey) {
  const palette = LAYOUT_COLOR_PALETTES[colorKey] || LAYOUT_COLOR_PALETTES.azul;
  const svg = buildMarriedSvgString(palette);
  return stringToDataUri(svg);
}

/**
 * Constrói a lista completa do catálogo unificado de layouts usando o motor SVG.
 */
export function buildCompleteLayoutsCatalog() {
  const catalog = [];
  const paletteKeys = Object.keys(LAYOUT_COLOR_PALETTES);

  // 1. Layouts Clássicos (Card superior)
  for (const key of paletteKeys) {
    const pal = LAYOUT_COLOR_PALETTES[key];
    const overlayUri = getLayoutSvgDataUri('classic', key);
    const marriedUri = getMarriedSvgDataUri(key);

    catalog.push({
      id: `classic_${key}`,
      name: `Clássico ${pal.name}`,
      description: pal.descClassic,
      category: 'Clássico',
      price: pal.classicPrice,
      themeColor: pal.themeColor,
      themeMode: pal.themeMode || 'dark',
      textColor: pal.textColor || '#ffffff',
      textShadow: pal.textShadow,
      previewUrl: overlayUri,
      overlay: overlayUri,
      overlayMarried: marriedUri,
      overlayBadge: false,
      templateType: 'classic',
      isDefault: Boolean(pal.isDefault),
      vipOnly: false
    });
  }

  // 2. Layouts Modernos Inferiores (Card na base)
  for (const key of paletteKeys) {
    const pal = LAYOUT_COLOR_PALETTES[key];
    const overlayUri = getLayoutSvgDataUri('modern', key);

    catalog.push({
      id: `embaixo_${key}`,
      name: `Moderno ${pal.name}`,
      description: pal.descModern,
      category: 'Moderno',
      price: pal.modernPrice,
      themeColor: pal.themeColor,
      themeMode: pal.themeMode || 'dark',
      textColor: pal.textColor || '#ffffff',
      textShadow: pal.textShadow,
      previewUrl: overlayUri,
      overlay: overlayUri,
      overlayMarried: null,
      templateType: 'modern',
      isDefault: false,
      vipOnly: false
    });
  }

  // 3. Layouts Especiais de Prestígio (Cyberpunk & VIP)
  const cyberpunkPalette = {
    primary: '#06b6d4',
    dark: '#0f172a',
    accent: '#f43f5e',
    ring: '#06b6d4'
  };
  const cyberpunkUri = stringToDataUri(buildLayoutSvgString('classic', cyberpunkPalette));
  const cyberpunkMarried = stringToDataUri(buildMarriedSvgString(cyberpunkPalette));

  catalog.push({
    id: 'cyberpunk_neon',
    name: 'Cyberpunk Holográfico',
    description: 'Design futurista com circuitos luminescentes em neon ciano e magenta.',
    category: 'Cyberpunk',
    price: 50000,
    themeColor: '#06b6d4',
    themeMode: 'dark',
    textColor: '#ffffff',
    textShadow: '0 0 8px rgba(6,182,212,0.8)',
    previewUrl: cyberpunkUri,
    overlay: cyberpunkUri,
    overlayMarried: cyberpunkMarried,
    templateType: 'classic',
    isDefault: false,
    vipOnly: false
  });

  const goldPalette = {
    primary: '#f59e0b',
    dark: '#78350f',
    accent: '#fef08a',
    ring: '#b45309'
  };
  const goldUri = stringToDataUri(buildLayoutSvgString('classic', goldPalette));
  const goldMarried = stringToDataUri(buildMarriedSvgString(goldPalette));

  catalog.push({
    id: 'vip_gold_frame',
    name: 'Imperial Gold Prestige',
    description: 'Moldura nobre banhada a ouro solar para os magnatas da Sistine.',
    category: 'VIP',
    price: 75000,
    themeColor: '#eab308',
    themeMode: 'dark',
    textColor: '#fef08a',
    textShadow: '0 0 10px rgba(234,179,8,0.7)',
    previewUrl: goldUri,
    overlay: goldUri,
    overlayMarried: goldMarried,
    templateType: 'classic',
    isDefault: false,
    vipOnly: false
  });

  return catalog;
}
