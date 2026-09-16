const satori = require('satori').default || require('satori');
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CARREGAMENTO SEGURO DE FONTES LOCAIS (ROBOTO / INTER)
// ============================================================================
let cachedFonts = null;

function loadSatoriFonts() {
  if (cachedFonts && cachedFonts.length > 0) return cachedFonts;

  const fonts = [];
  const fontsDir = path.join(__dirname, 'assets/fonts');

  try {
    const interRegular = path.join(fontsDir, 'Inter-Regular.woff');
    const interBold = path.join(fontsDir, 'Inter-Bold.woff');
    const robotoRegular = path.join(fontsDir, 'Roboto-Regular.woff');
    const robotoBold = path.join(fontsDir, 'Roboto-Bold.woff');

    if (fs.existsSync(interRegular) && fs.existsSync(interBold)) {
      fonts.push(
        { name: 'Inter', data: fs.readFileSync(interRegular), weight: 400, style: 'normal' },
        { name: 'Inter', data: fs.readFileSync(interBold), weight: 700, style: 'normal' }
      );
    } else if (fs.existsSync(robotoRegular) && fs.existsSync(robotoBold)) {
      fonts.push(
        { name: 'Inter', data: fs.readFileSync(robotoRegular), weight: 400, style: 'normal' },
        { name: 'Inter', data: fs.readFileSync(robotoBold), weight: 700, style: 'normal' }
      );
    }
  } catch (err) {
    console.warn('[satoriItemTemplates] Aviso ao carregar fontes locais:', err.message);
  }

  cachedFonts = fonts;
  return cachedFonts;
}

// ============================================================================
// VNODE HELPER
// ============================================================================
function h(type, props = {}, ...children) {
  if (props && props.style) {
    const cleanStyle = {};
    for (const [k, v] of Object.entries(props.style)) {
      if (v !== undefined && v !== null) cleanStyle[k] = v;
    }
    props.style = cleanStyle;
  }
  const flatChildren = children
    .flat()
    .filter(c => c !== null && c !== undefined && c !== false)
    .map(c => (typeof c !== 'object' ? String(c) : c));

  return {
    type,
    props: {
      ...props,
      children: flatChildren.length === 1 ? flatChildren[0] : (flatChildren.length > 0 ? flatChildren : undefined)
    }
  };
}

// Helper para converter caminhos de imagem local em Data URI Base64
function toDataUri(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const buf = fs.readFileSync(filePath);
      return `data:image/png;base64,${buf.toString('base64')}`;
    }
  } catch (e) {
    console.error('[toDataUri] Erro ao carregar:', filePath, e.message);
  }
  return null;
}

// SVGs Vetoriais Nativos (Garantem nitidez absoluta sem depender de fontes de emojis)
const GIFT_ICON_DATA_URI = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="%2310b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>`;
const BULB_ICON_DATA_URI = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="%23fbbf24" stroke="%23f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"></path></svg>`;

// ============================================================================
// GERADOR DO CARD DE RECOMPENSAS DO KIT INICIANTE (/start) EM SATORI
// ============================================================================

/**
 * Renderiza o Card Completo do Kit Iniciante Aberto usando as imagens PNG oficiais
 * @param {object} param0
 * @param {string} param0.username Nome do usuário
 * @param {number} [param0.coins=1000] Quantidade de moedas entregues
 * @returns {Promise<Buffer>}
 */
async function generateStarterKitImage({ username = 'Aventureiro', coins = 1000 } = {}) {
  const fonts = loadSatoriFonts();

  const baseDir = path.join(__dirname, 'assets/inventory/itens');
  const moedasUri = toDataUri(path.join(baseDir, 'consumiveis/moedas.png'));
  const varaUri = toDataUri(path.join(baseDir, 'ferramentas/vara_bambu.png'));
  const iscaUri = toDataUri(path.join(baseDir, 'consumiveis/isca.png'));
  const regadorUri = toDataUri(path.join(baseDir, 'ferramentas/regador_plastico.png'));
  const enxadaUri = toDataUri(path.join(baseDir, 'ferramentas/enxada_madeira.png'));
  const trigoUri = toDataUri(path.join(baseDir, 'sementes/semente_trigo.png'));

  // Itens do Kit para o Grid Visual do Satori (6 itens)
  const kitItems = [
    {
      name: '1.000 Moedas',
      sub: 'Capital Inicial',
      badge: 'CARTEIRA',
      imgUri: moedasUri,
      bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(180, 83, 9, 0.38) 100%)',
      border: '1.5px solid rgba(245, 158, 11, 0.7)',
      badgeBg: 'rgba(245, 158, 11, 0.3)',
      badgeColor: '#fef3c7',
      tagColor: '#fbbf24'
    },
    {
      name: 'Vara de Bambu',
      sub: '8 usos - Frágil',
      badge: 'NÃO REPARÁVEL',
      imgUri: varaUri,
      bg: 'linear-gradient(135deg, rgba(101, 163, 13, 0.18) 0%, rgba(63, 98, 18, 0.38) 100%)',
      border: '1.5px solid rgba(132, 204, 22, 0.7)',
      badgeBg: 'rgba(132, 204, 22, 0.3)',
      badgeColor: '#ecfccb',
      tagColor: '#a3e635'
    },
    {
      name: '3x Iscas',
      sub: 'Pesca Inicial',
      badge: 'CONSUMÍVEL',
      imgUri: iscaUri,
      bg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.18) 0%, rgba(194, 65, 12, 0.38) 100%)',
      border: '1.5px solid rgba(249, 115, 22, 0.7)',
      badgeBg: 'rgba(249, 115, 22, 0.3)',
      badgeColor: '#ffedd5',
      tagColor: '#fb923c'
    },
    {
      name: 'Regador Plástico',
      sub: '15 usos de água',
      badge: 'NÃO ENCHÍVEL',
      imgUri: regadorUri,
      bg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(14, 116, 144, 0.38) 100%)',
      border: '1.5px solid rgba(6, 182, 212, 0.7)',
      badgeBg: 'rgba(6, 182, 212, 0.3)',
      badgeColor: '#cffafe',
      tagColor: '#22d3ee'
    },
    {
      name: 'Enxada Madeira',
      sub: '12 usos - Arar solo',
      badge: 'NÃO REPARÁVEL',
      imgUri: enxadaUri,
      bg: 'linear-gradient(135deg, rgba(217, 119, 6, 0.18) 0%, rgba(120, 53, 15, 0.38) 100%)',
      border: '1.5px solid rgba(217, 119, 6, 0.7)',
      badgeBg: 'rgba(217, 119, 6, 0.3)',
      badgeColor: '#fef3c7',
      tagColor: '#f59e0b'
    },
    {
      name: '5x Sementes Trigo',
      sub: 'Agricultura Rápida',
      badge: 'CONSUMÍVEL',
      imgUri: trigoUri,
      bg: 'linear-gradient(135deg, rgba(234, 179, 8, 0.18) 0%, rgba(161, 98, 7, 0.38) 100%)',
      border: '1.5px solid rgba(234, 179, 8, 0.7)',
      badgeBg: 'rgba(234, 179, 8, 0.3)',
      badgeColor: '#fef9c3',
      tagColor: '#facc15'
    }
  ];

  // Elementos do Banner (980 x 440)
  const itemCards = kitItems.map((item) => {
    return h(
      'div',
      {
        style: {
          width: '142px',
          height: '220px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 6px',
          background: item.bg,
          border: item.border,
          borderRadius: '16px',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
          position: 'relative'
        }
      },
      // Badge superior de Tipo / Restrição
      h(
        'div',
        {
          style: {
            fontSize: '9px',
            fontWeight: 700,
            color: item.badgeColor,
            backgroundColor: item.badgeBg,
            padding: '2px 5px',
            borderRadius: '6px',
            letterSpacing: '0.4px',
            textTransform: 'uppercase'
          }
        },
        item.badge
      ),
      // Imagem PNG oficial do Item
      h(
        'div',
        {
          style: {
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '4px 0'
          }
        },
        item.imgUri
          ? h('img', {
              src: item.imgUri,
              style: {
                width: '78px',
                height: '78px',
                objectFit: 'contain'
              }
            })
          : null
      ),
      // Textos de Identificação
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }
        },
        h(
          'div',
          {
            style: {
              fontSize: '13px',
              fontWeight: 700,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: '1.2',
              marginBottom: '3px'
            }
          },
          item.name
        ),
        h(
          'div',
          {
            style: {
              fontSize: '10px',
              fontWeight: 400,
              color: item.tagColor,
              textAlign: 'center',
              opacity: 0.95
            }
          },
          item.sub
        )
      )
    );
  });

  const vnode = h(
    'div',
    {
      style: {
        width: '980px',
        height: '440px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '26px 30px',
        background: 'linear-gradient(145deg, #090d16 0%, #0f172a 50%, #030712 100%)',
        border: '2px solid rgba(16, 185, 129, 0.45)',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
        fontFamily: 'Inter, sans-serif',
        position: 'relative'
      }
    },
    // Cabeçalho
    h(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          paddingBottom: '12px'
        }
      },
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }
        },
        h('img', {
          src: GIFT_ICON_DATA_URI,
          style: { width: '34px', height: '34px' }
        }),
        h(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column'
            }
          },
          h(
            'div',
            {
              style: {
                fontSize: '22px',
                fontWeight: 700,
                color: '#10b981',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }
            },
            'KIT INICIANTE DESBLOQUEADO!'
          ),
          h(
            'div',
            {
              style: {
                fontSize: '13px',
                color: '#94a3b8'
              }
            },
            `Suprimentos entregues para ${username} - Bem-vindo(a) a Sistine!`
          )
        )
      ),
      h(
        'div',
        {
          style: {
            fontSize: '11px',
            fontWeight: 700,
            color: '#34d399',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            padding: '6px 12px',
            borderRadius: '20px',
            letterSpacing: '0.8px',
            textTransform: 'uppercase'
          }
        },
        'RESGATE UNICO'
      )
    ),

    // Grid com os 5 Cards de Itens
    h(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          margin: '10px 0'
        }
      },
      ...itemCards
    ),

    // Rodapé de Orientação do Jogador
    h(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '10px',
          color: '#94a3b8',
          fontSize: '12px'
        }
      },
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }
        },
        h('img', {
          src: BULB_ICON_DATA_URI,
          style: { width: '16px', height: '16px' }
        }),
        h('span', { style: { color: '#e2e8f0', fontWeight: 700 } }, 'Primeiros passos:'),
        'Prepare o solo com sua ',
        h('span', { style: { color: '#f59e0b', fontWeight: 700 } }, 'Enxada'),
        ' no ',
        h('span', { style: { color: '#38bdf8', fontWeight: 700 } }, '/plantacao'),
        ' e comece seu expediente em ',
        h('span', { style: { color: '#34d399', fontWeight: 700 } }, '/trabalhar')
      ),
      h(
        'div',
        {
          style: {
            color: '#64748b',
            fontSize: '11px'
          }
        },
        'Sistine Economia RPG'
      )
    )
  );

  const svg = await satori(vnode, {
    width: 980,
    height: 440,
    fonts: fonts.length > 0 ? fonts : undefined
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 980 }
  });

  return resvg.render().asPng();
}

module.exports = {
  h,
  loadSatoriFonts,
  toDataUri,
  generateStarterKitImage
};
