// market/canvas.js
const satori = require('satori').default || require('satori');
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');
const { Format } = require('../../../src/utils/functions.js');
const { CANVAS } = require('./constants');
const itemsApi = require('../../utils/itens.json');

// ==========================================
// FONTS INITIALIZATION (À PROVA DE FALHAS)
// ==========================================
let loadedFonts = [];

async function ensureFontsLoaded() {
  if (loadedFonts.length > 0) return;
  
  try {
    const regReq = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.0.19/files/noto-sans-latin-400-normal.woff');
    const boldReq = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.0.19/files/noto-sans-latin-700-normal.woff');
    
    if (regReq.ok && boldReq.ok) {
        loadedFonts.push({ name: CANVAS.FONT_FAMILY || 'Noto Sans CJK JP', data: Buffer.from(await regReq.arrayBuffer()), weight: 400, style: 'normal' });
        loadedFonts.push({ name: CANVAS.FONT_FAMILY || 'Noto Sans CJK JP', data: Buffer.from(await boldReq.arrayBuffer()), weight: 700, style: 'normal' });
        return;
    }
  } catch(e) { }

  try {
    // Fallback Local
    const fontsDir = path.join(__dirname, '../../assets/fonts');
    const fontRegular = fs.readFileSync(path.join(fontsDir, 'Inter-Regular.woff'));
    const fontBold = fs.readFileSync(path.join(fontsDir, 'Inter-Bold.woff'));

    loadedFonts.push({ name: CANVAS.FONT_FAMILY || 'Noto Sans CJK JP', data: fontRegular, weight: 400, style: 'normal' });
    loadedFonts.push({ name: CANVAS.FONT_FAMILY || 'Noto Sans CJK JP', data: fontBold, weight: 700, style: 'normal' });
  } catch(e) { }
}

// ==========================================
// VNODE HELPER FUNCTION
// ==========================================
function h(type, props = {}, ...children) {
  if (props && props.style) {
    const cleanStyle = {};
    for (const [k, v] of Object.entries(props.style)) {
      if (v !== undefined && v !== null) cleanStyle[k] = v;
    }
    props.style = cleanStyle;
  }
  const flatChildren = children.flat().filter(c => c !== null && c !== undefined && c !== false).map(c => typeof c !== 'object' ? String(c) : c);
  return { type, props: { ...props, children: flatChildren.length === 1 ? flatChildren[0] : (flatChildren.length > 0 ? flatChildren : undefined) } };
}

// ==========================================
// DYNAMIC REMOTE IMAGE CACHE
// ==========================================
const remoteCache = new Map();
const inFlightRequests = new Map();

async function fetchRemoteDataUri(url, timeoutMs = 3000) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('data:')) return url;
  if (remoteCache.has(url)) return remoteCache.get(url);
  if (inFlightRequests.has(url)) return inFlightRequests.get(url);

  // Checa se é arquivo local
  const baseDir = path.join(process.cwd(), 'src/utils/assets/inventory/itens');
  const subdirs = ['armas', 'colheitas', 'consumiveis', 'ferramentas', 'sementes'];
  const localCandidates = [
    url,
    path.join(__dirname, '../../assets/inventory/itens', url),
    path.join(baseDir, url),
    path.join(baseDir, path.basename(url)),
    ...subdirs.map(d => path.join(baseDir, d, path.basename(url))),
    ...subdirs.map(d => path.join(__dirname, '../../assets/inventory/itens', d, path.basename(url)))
  ];
  for (const candidate of localCandidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        const buf = fs.readFileSync(candidate);
        let mime = 'image/png';
        if (candidate.endsWith('.jpg') || candidate.endsWith('.jpeg')) mime = 'image/jpeg';
        else if (candidate.endsWith('.webp')) mime = 'image/webp';
        const dataUri = `data:${mime};base64,${buf.toString('base64')}`;
        remoteCache.set(url, dataUri);
        return dataUri;
      }
    } catch (e) {}
  }

  const fetchTask = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) return url;
      const arrayBuffer = await res.arrayBuffer();
      const buf = Buffer.from(arrayBuffer);
      if (buf && buf.length > 0) {
        let mime = 'image/png';
        if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) mime = 'image/jpeg';
        else if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) mime = 'image/webp';
        
        const dataUri = `data:${mime};base64,${buf.toString('base64')}`;
        remoteCache.set(url, dataUri);
        return dataUri;
      }
    } catch (e) {
      return url; 
    } finally {
      inFlightRequests.delete(url);
    }
    return url;
  })();

  inFlightRequests.set(url, fetchTask);
  return fetchTask;
}

// ==========================================
// GERAÇÃO DO MARKETPLACE (SATORI)
// ==========================================
async function generateMarketCanvas(marketItems, isLocal) {
  await ensureFontsLoaded();

  const bgUrl = CANVAS.BACKGROUND_URL;
  const textUrl = isLocal ? CANVAS.TEXT_LOCAL_URL : CANVAS.TEXT_GLOBAL_URL;
  const fallbackUrl = 'https://3.bp.blogspot.com/-bNbqH1Ll5BY/XD97Ife_ioI/AAAAAAAA9Mk/ipwUBBWtGgoEUNu7m7AaYGyvw1DxBR97QCLcBGAs/s1600/Fundo%2Btransparente%2B1900x1900.png';

  // 1. Download Concorrente das Imagens (Instantâneo)
  const urlsToFetch = [bgUrl, textUrl, fallbackUrl];

  for (let i = 0; i < CANVAS.MAX_DISPLAY_ITEMS; i++) {
    const item = marketItems[i];
    if (item) {
      const itemConfig = itemsApi[item.db];
      const imageUrl = (item.db === 'arma') ? itemConfig[item.quantia]?.imagem : itemConfig.imagem;
      if (imageUrl) urlsToFetch.push(imageUrl);
    }
  }

  const fetchedImages = await Promise.all(urlsToFetch.map(url => fetchRemoteDataUri(url)));

  const bgDataUri = fetchedImages[0];
  const textDataUri = fetchedImages[1];
  const fallbackDataUri = fetchedImages[2];
  let fetchedIndex = 3;

  // 2. Montagem dos Elementos baseados no layout do antigo Canvas
  const elements = [];

  if (bgDataUri) elements.push(h('img', { src: bgDataUri, style: { position: 'absolute', top: 0, left: 0, width: '1200px', height: '670px' } }));
  if (textDataUri) elements.push(h('img', { src: textDataUri, style: { position: 'absolute', top: 0, left: 0, width: '1200px', height: '670px' } }));

  for (let i = 0; i < CANVAS.MAX_DISPLAY_ITEMS; i++) {
    const item = marketItems[i];
    const x = 233 + (i % 5) * 155;
    const y = 255 + Math.floor(i / 5) * 170;

    if (item) {
      const itemConfig = itemsApi[item.db];
      const itemDisplayName = (item.db === 'arma') ? itemConfig[item.quantia]?.nome[0] : itemConfig.nome[0];
      const priceText = (item.quantia < 2 || item.db === 'arma') 
        ? Format(item.preço, 'R$') 
        : `${Format(item.preço, 'R$')} - ${item.quantia}x`;

      const itemImageUrl = (item.db === 'arma') ? itemConfig[item.quantia]?.imagem : itemConfig.imagem;
      let itemImageUri = null;
      if (itemImageUrl) {
        itemImageUri = fetchedImages[fetchedIndex];
        fetchedIndex++;
      }

      // Imagem do Item
      if (itemImageUri) {
        elements.push(h('img', {
          src: itemImageUri,
          style: { position: 'absolute', top: `${y + 10}px`, left: `${x - 5}px`, width: '100px', height: '100px', objectFit: 'contain' }
        }));
      }

      // Nome do Item (Usando WebkitTextStroke para simular o ctx.strokeText original)
      elements.push(h('div', {
        style: {
          position: 'absolute',
          top: `${y - 20}px`,
          left: `${x + 45 - 100}px`, // Centraliza perfeitamente no X + 45 como o antigo
          width: '200px',
          display: 'flex',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontSize: '19px',
          fontWeight: 700,
          textShadow: '2px 2px 5px rgba(0, 0, 0, 0.9)',
          WebkitTextStroke: '2px black' 
        }
      }, itemDisplayName));

      // Preço do Item
      elements.push(h('div', {
        style: {
          position: 'absolute',
          top: `${y + 103}px`,
          left: `${x + 45 - 100}px`,
          width: '200px',
          display: 'flex',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontSize: '17px',
          fontWeight: 700,
          textShadow: '2px 2px 5px rgba(0, 0, 0, 0.9)',
          WebkitTextStroke: '2px black'
        }
      }, priceText));

    } else {
      // Slot Vazio
      if (fallbackDataUri) {
        elements.push(h('img', {
          src: fallbackDataUri,
          style: { position: 'absolute', top: `${y}px`, left: `${x}px`, width: '120px', height: '120px' }
        }));
      }
    }
  }

  // 3. Montagem Principal
  const vnode = h('div', {
    style: {
      display: 'flex', position: 'relative', width: '1200px', height: '670px',
      fontFamily: CANVAS.FONT_FAMILY || 'Noto Sans CJK JP', overflow: 'hidden',
      border: '1px solid #333333' // Simula o ctx.strokeRect(0, 0, width, height)
    }
  }, ...elements);

  const svg = await satori(vnode, { width: CANVAS.WIDTH, height: CANVAS.HEIGHT, fonts: loadedFonts });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: CANVAS.WIDTH } });
  const finalBuffer = resvg.render().asPng();

  return new AttachmentBuilder(finalBuffer, {
    name: 'market.png',
    description: 'Marketplace Satori'
  });
}

module.exports = { generateMarketCanvas };