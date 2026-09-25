const satori = require('satori').default || require('satori');
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const { getUserMoney, Format, getUserReps, getCasamento, CheckUserVip, getUserGlobalRank, getResolvedUserBadges } = require('./functions.js');
const { BACKGROUNDS_CATALOG, LAYOUTS_CATALOG, LEGACY_BG_URL_MAP, getBackgroundById, getLayoutById, getLayoutConfig } = require('./shopCatalog.js');
const { LEGACY_BADGE_URL_MAP } = require('./badgesMap.js');

const Canvas = require('@napi-rs/canvas');

const ASSETS_ROOT = path.join(__dirname, 'assets');
const DEFAULT_BG_URL = '/src/utils/assets/backgrounds/wallhaven-1kp5jv.png';

// ==========================================
let loadedFonts = [];

function initFonts() {
  if (loadedFonts.length > 0) return loadedFonts;
  try {
    const fontsDir = path.join(__dirname, 'assets/fonts');
    const fontRegular = fs.readFileSync(path.join(fontsDir, 'Inter-Regular.woff'));
    const fontBold = fs.readFileSync(path.join(fontsDir, 'Inter-Bold.woff'));

    loadedFonts = [
      { name: 'Noto Sans CJK JP', data: fontRegular, weight: 400, style: 'normal' },
      { name: 'Noto Sans CJK JP', data: fontBold, weight: 700, style: 'normal' }
    ];
  } catch (e) {
    console.error("❌ Erro ao carregar fontes locais do perfil:", e);
  }
  return loadedFonts;
}

initFonts();

// ==========================================
// 2. VNODE HELPER FUNCTION
// ==========================================
function h(type, props = {}, ...children) {
  if (type === 'img') {
    if (!props || !props.src || typeof props.src !== 'string' || props.src.trim() === '') {
      return null;
    }
  }

  if (props && props.style) {
    const cleanStyle = {};
    for (const [k, v] of Object.entries(props.style)) {
      if (v !== undefined && v !== null) cleanStyle[k] = v;
    }
    props.style = cleanStyle;
  }

  const flatChildren = children.flat()
    .filter(c => c !== null && c !== undefined && c !== false)
    .map(c => typeof c !== 'object' ? String(c) : c);

  return {
    type,
    props: {
      ...props,
      children: flatChildren.length === 1 ? flatChildren[0] : (flatChildren.length > 0 ? flatChildren : undefined)
    }
  };
}

// ==========================================
// 3. SISTEMA LOCAL DE CARREGAMENTO & CACHE DE IMAGENS (PNG SEGURO)
// ==========================================
const localAssetCache = new Map();
const remoteCache = new Map();
const inFlightRequests = new Map();

async function bufferToSafeDataUri(buf, source = '') {
  if (!buf || buf.length === 0) return null;

  // 1. Se for SVG, certifica-se de que tem viewBox para o parser do Satori não falhar
  if (source.includes('.svg') || buf.toString('utf8', 0, 100).includes('<svg')) {
    let svgText = buf.toString('utf8');
    if (!svgText.includes('viewBox') && !svgText.includes('viewbox')) {
      const wMatch = svgText.match(/width=["'](\d+)(?:px)?["']/);
      const hMatch = svgText.match(/height=["'](\d+)(?:px)?["']/);
      if (wMatch && hMatch) {
        svgText = svgText.replace('<svg ', `<svg viewBox="0 0 ${wMatch[1]} ${hMatch[1]}" `);
      }
    }
    return `data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}`;
  }

  // 2. Se já for PNG puro (assinatura PNG 89 50 4E 47)
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    return `data:image/png;base64,${buf.toString('base64')}`;
  }

  // 3. Se for JPEG, WebP, GIF ou outro formato raster:
  // Converte para PNG limpo com o Canvas para o Satori nunca chamar o parser de JPEG problemático
  try {
    const img = await Canvas.loadImage(buf);
    const canvas = Canvas.createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const pngBuf = canvas.toBuffer('image/png');
    return `data:image/png;base64,${pngBuf.toString('base64')}`;
  } catch (err) {
    return `data:image/png;base64,${buf.toString('base64')}`;
  }
}

async function loadLocalFileAsDataUri(relativeOrAbsPath) {
  if (!relativeOrAbsPath) return null;
  let targetPath = String(relativeOrAbsPath);
  
  if (localAssetCache.has(targetPath)) {
    return localAssetCache.get(targetPath);
  }

  if (targetPath.startsWith('/src/utils/assets/')) {
    targetPath = path.join(ASSETS_ROOT, targetPath.replace('/src/utils/assets/', ''));
  } else if (targetPath.startsWith('src/utils/assets/')) {
    targetPath = path.join(ASSETS_ROOT, targetPath.replace('src/utils/assets/', ''));
  } else if (targetPath.startsWith('/src/assets/images/')) {
    targetPath = path.join(ASSETS_ROOT, targetPath.replace('/src/assets/images/', ''));
  } else if (targetPath.startsWith('src/assets/images/')) {
    targetPath = path.join(ASSETS_ROOT, targetPath.replace('src/assets/images/', ''));
  } else if (targetPath.startsWith('/src/assets/')) {
    targetPath = path.join(ASSETS_ROOT, targetPath.replace('/src/assets/', ''));
  } else if (targetPath.startsWith('src/assets/')) {
    targetPath = path.join(ASSETS_ROOT, targetPath.replace('src/assets/', ''));
  } else if (targetPath.startsWith('/assets/')) {
    targetPath = path.join(ASSETS_ROOT, targetPath.replace('/assets/', ''));
  } else if (targetPath.startsWith('assets/')) {
    targetPath = path.join(ASSETS_ROOT, targetPath.replace('assets/', ''));
  } else if (!path.isAbsolute(targetPath)) {
    targetPath = path.join(ASSETS_ROOT, targetPath);
  }

  // Se o caminho apontar para .jpg e existir a versão .png, preferir o .png
  if (targetPath.endsWith('.jpg') || targetPath.endsWith('.jpeg')) {
    const pngCandidate = targetPath.replace(/\.jpe?g$/, '.png');
    if (fs.existsSync(pngCandidate)) {
      targetPath = pngCandidate;
    }
  }

  try {
    if (fs.existsSync(targetPath)) {
      const buf = fs.readFileSync(targetPath);
      const dataUri = await bufferToSafeDataUri(buf, targetPath);
      if (dataUri) {
        localAssetCache.set(relativeOrAbsPath, dataUri);
        localAssetCache.set(targetPath, dataUri);
        return dataUri;
      }
    }
  } catch (err) {
    console.error(`❌ Erro ao ler asset local [${targetPath}]:`, err.message);
  }
  return null;
}

async function resolveAssetDataUri(source, fallbackType = 'default') {
  if (!source || typeof source !== 'string') {
    if (fallbackType === 'avatar') return loadLocalFileAsDataUri('fallback_avatar.png');
    if (fallbackType === 'background') return loadLocalFileAsDataUri('backgrounds/wallhaven-1kp5jv.png');
    return null;
  }

  if (source.startsWith('data:')) return source;

  // 1. Mapeamento de links legados para arquivos locais
  if (LEGACY_BG_URL_MAP && LEGACY_BG_URL_MAP[source]) {
    const bgItem = BACKGROUNDS_CATALOG.find(b => b.id === LEGACY_BG_URL_MAP[source]);
    if (bgItem && bgItem.url) return loadLocalFileAsDataUri(bgItem.url);
  }
  if (LEGACY_BADGE_URL_MAP && LEGACY_BADGE_URL_MAP[source]) {
    return loadLocalFileAsDataUri(LEGACY_BADGE_URL_MAP[source]);
  }

  // 2. Arquivo local
  if (source.includes('assets') || source.startsWith('/') || source.startsWith('./') || !source.startsWith('http')) {
    const local = await loadLocalFileAsDataUri(source);
    if (local) return local;
  }

  // 3. Link remoto (Avatar do Discord ou Background personalizado por URL)
  if (remoteCache.has(source)) return remoteCache.get(source);
  if (inFlightRequests.has(source)) return inFlightRequests.get(source);

  const fetchTask = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(source, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuffer);
        if (buf && buf.length > 0) {
          const dataUri = await bufferToSafeDataUri(buf, source);
          if (dataUri) {
            remoteCache.set(source, dataUri);
            return dataUri;
          }
        }
      }
    } catch (e) {
      // Ignora erro e usa o fallback local
    } finally {
      inFlightRequests.delete(source);
    }

    let fallbackUri = null;
    if (fallbackType === 'avatar') fallbackUri = await loadLocalFileAsDataUri('fallback_avatar.png');
    else if (fallbackType === 'background') fallbackUri = await loadLocalFileAsDataUri('backgrounds/wallhaven-1kp5jv.png');
    if (fallbackUri) remoteCache.set(source, fallbackUri);
    return fallbackUri;
  })();

  inFlightRequests.set(source, fetchTask);
  return fetchTask;
}

// Pré-aquece todos os assets estáticos locais na memória no startup
(async () => {
  try {
    await loadLocalFileAsDataUri('default_bg.png');
    await loadLocalFileAsDataUri('fallback_avatar.png');
    await loadLocalFileAsDataUri('wedding_rings.png');
    for (const b of BACKGROUNDS_CATALOG) {
      await loadLocalFileAsDataUri(b.url);
    }
    for (const l of LAYOUTS_CATALOG) {
      if (l.overlay) await loadLocalFileAsDataUri(l.overlay);
      if (l.overlayBadge) await loadLocalFileAsDataUri(l.overlayBadge);
      if (l.overlayMarried) await loadLocalFileAsDataUri(l.overlayMarried);
    }
  } catch(e) {}
})();

// ==========================================
// 4. FETCH OTIMIZADO DO PERFIL DO USUÁRIO
// ==========================================
async function fetchUserProfileData(targetUser, executorId, client, database) {
  let carteira = 0, banco = 0, recebidas = 0, vip = 0, casamento = null;
  let dbData = {}, infoData = {}, equipadosData = {}, badgesConfig = {};
  let userEcoData = {};

  if (database) {
    const snapUser = await database.ref(`/economia/${targetUser.id}`).once('value').catch(() => null);
    userEcoData = snapUser ? snapUser.val() || {} : {};

    dbData = userEcoData.Perfil || {};
    infoData = dbData.Informações || dbData.Informacoes || {};
    equipadosData = dbData.Equipados || {};
    badgesConfig = dbData.Badges || dbData.BadgesConfig || {};

    const saldoVal = userEcoData.saldo || {};
    carteira = saldoVal.carteira || 0;
    banco = saldoVal.banco || 0;

    const repsVal = userEcoData.Reputações || userEcoData.reputacoes || {};
    recebidas = repsVal.reputações_recebidas || repsVal.recebidas || 0;

    const vipVal = userEcoData.vip || {};
    vip = vipVal.vip || 0;
    if (vipVal.data !== null && vipVal.tempo && (vipVal.tempo - (Date.now() - vipVal.data) < 0)) vip = 0;

    const casVal = userEcoData.Casamento || userEcoData.casamento || {};
    const conjId = casVal.casado || casVal.conjuge || casVal.conjunge || 0;
    if (conjId && conjId !== 0) casamento = { casado: true, conjuge: conjId, durante: casVal.datanow || casVal.durante || 0 };
  }

  if (!carteira && !banco && !database) {
    const money = await getUserMoney(targetUser).catch(() => ({ carteira: 0, banco: 0 }));
    carteira = money.carteira || 0; banco = money.banco || 0;
  }
  if (!recebidas && !database) {
    const reps = await getUserReps(targetUser).catch(() => ({ recebidas: 0 }));
    recebidas = reps.recebidas || 0;
  }
  if (!casamento && !database) casamento = await getCasamento(targetUser).catch(() => ({ casado: false }));
  if (!vip && !database) {
    const vipData = await CheckUserVip(targetUser).catch(() => ({ vip: 0, tempo: 0, data: null }));
    vip = vipData.vip || 0;
  }

  let rankBancoStr = "1 / 1";
  if (database && getUserGlobalRank) {
    const rankBancoObj = await getUserGlobalRank(database, targetUser.id, 'saldo/banco').catch(() => ({ rank: "N/A", total: 0 }));
    rankBancoStr = `${rankBancoObj.rank} / ${rankBancoObj.total}`;
  }

  let sobremim = infoData.sobremim || dbData.sobremim;
  if (!sobremim) sobremim = targetUser.id === executorId ? "Sou uma linda borboleta | Utilize /sobremim" : "Sou uma linda borboleta";

  let layoutId = equipadosData.layout || equipadosData.layoutId;
  if (!layoutId) {
      const antigos = dbData.Layouts || {};
      if ((antigos.tema_branco_log || 0) > 0) layoutId = 'classic_branco';
      else if ((antigos.tema_roxo_log || 0) > 0) layoutId = 'classic_roxo';
      else if ((antigos.tema_preto_log || 0) > 0) layoutId = 'classic_preto';
      else if ((antigos.tema_vermelho_log || 0) > 0) layoutId = 'classic_vermelho';
      else if ((antigos.tema_verde_log || 0) > 0) layoutId = 'classic_verde';
      else if ((antigos.tema_laranja_log || 0) > 0) layoutId = 'classic_laranja';
      else layoutId = 'classic_azul';
  }

  const bgTarget = equipadosData.backgroundId || equipadosData.background || infoData.imagemperfil || DEFAULT_BG_URL;
  const bgItem = getBackgroundById(bgTarget);
  const backgroundUrl = bgItem.url || DEFAULT_BG_URL;

  const fullDiscordUser = client?.users?.cache?.get?.(targetUser.id) || targetUser;
  let guildMember = null;
  if (client?.guilds?.cache && typeof client.guilds.cache.map === 'function') {
    guildMember = client.guilds.cache.map(g => g?.members?.cache?.get?.(targetUser.id)).find(Boolean) || null;
  }
  
  const allUserBadges = getResolvedUserBadges 
    ? await getResolvedUserBadges(fullDiscordUser, database, guildMember, { badges: badgesConfig, vip: userEcoData.vip || {} }).catch(() => []) 
    : [];
  
  const disabledBadges = badgesConfig.disabled || [];
  const activeBadges = allUserBadges.filter(badge => {
    if (disabledBadges.includes(badge.id)) return false;
    if (badge.houseKey && disabledBadges.includes(badge.houseKey)) return false;
    return badge.active === true;
  });
  
  let conjugeData = null;
  if (casamento && casamento.casado) {
    let conjugeUser = client?.users?.cache?.get?.(String(casamento.conjuge)) || null;
    if (!conjugeUser && client?.users?.fetch) {
      conjugeUser = await client.users.fetch(String(casamento.conjuge)).catch(() => null);
    }
    const diasCasados = casamento.durante ? moment().diff(casamento.durante, 'days') : 0;
    conjugeData = {
      nome: conjugeUser ? conjugeUser.username : 'Usuário Antigo',
      data: `${moment.tz(casamento.durante, 'America/Sao_Paulo').format("DD/MM/YYYY")} ${diasCasados > 0 ? `(${diasCasados} Dias)` : ''}`
    };
  }

  let avatarUrl = targetUser.displayAvatarURL ? targetUser.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true }) : 'https://cdn.discordapp.com/embed/avatars/0.png';

  return {
    user: targetUser,
    layoutId,
    backgroundUrl,
    avatarUrl,
    carteira,
    banco,
    reputacoes: recebidas,
    sobremim,
    rankBanco: rankBancoStr, 
    activeBadges: activeBadges.slice(0, 50),
    conjuge: conjugeData
  };
}

// ==========================================
// 5. RENDERING COM SATORI ENGINE
// ==========================================
async function renderProfileSatori(data) {
  initFonts();
  
  const layout = getLayoutConfig(data.layoutId);

  const [resolvedBadgesUris, customBgDataUri, remoteAvatarDataUri, overlayDataUri, overlayBadgeDataUri, overlayMarriedDataUri] = await Promise.all([
    Promise.all((data.activeBadges || []).map(b => resolveAssetDataUri(b.icon, 'badge'))),
    resolveAssetDataUri(data.backgroundUrl, 'background'),
    resolveAssetDataUri(data.avatarUrl, 'avatar'),
    layout.overlay ? resolveAssetDataUri(layout.overlay, 'layout') : Promise.resolve(null),
    layout.overlayBadge ? resolveAssetDataUri(layout.overlayBadge, 'layout') : Promise.resolve(null),
    (layout.casamento && layout.overlayMarried && data.conjuge) ? resolveAssetDataUri(layout.overlayMarried, 'layout') : Promise.resolve(null)
  ]);

  const validBadgesUris = (resolvedBadgesUris || []).filter(uri => typeof uri === 'string' && uri.trim().length > 0);

  const finalBg = customBgDataUri || (await resolveAssetDataUri(DEFAULT_BG_URL, 'background'));
  const fallbackAvatar = await resolveAssetDataUri('/src/utils/assets/fallback_avatar.png', 'avatar');
  const finalAvatar = remoteAvatarDataUri || fallbackAvatar;

  let badgesNode = null;
  if (layout.badges && validBadgesUris.length > 0) {
    const badgeSize = layout.badges.size || 36;
    const badgeGap = Math.max((layout.badges.spacing || 42) - badgeSize, 4);
    const hasBg = Boolean(layout.badgeBackground);
    const themeColor = layout.themeColor || '#00c3ff';
    const bgColor = typeof layout.badgeBackground === 'string' ? layout.badgeBackground : `${themeColor}44`;

    const badgeElements = validBadgesUris
      .map(bUri => h('img', {
        src: bUri,
        width: badgeSize,
        height: badgeSize,
        style: {
          width: `${badgeSize}px`,
          height: `${badgeSize}px`,
          objectFit: 'contain'
        }
      }))
      .filter(Boolean);

    if (badgeElements.length > 0) {
      badgesNode = h('div', {
        style: {
          position: 'absolute',
          top: `${layout.badges.startY || 535}px`,
          left: '0px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: `${badgeGap}px`,
          paddingTop: '0px',
          paddingBottom: '0px',
          paddingRight: hasBg ? '15px' : '0px',
          paddingLeft: hasBg ? `${layout.badges.startX || 80}px` : '0px',
          backgroundColor: hasBg ? bgColor : 'transparent',
          width: 'auto',
          border: 'none',
          height: hasBg ? '52px' : undefined,
          overflow: 'hidden'
        }
      }, ...badgeElements);
    }
  }

  const elements = [];

  if (finalBg && typeof finalBg === 'string' && finalBg.trim().length > 0) {
    elements.push(h('img', { src: finalBg, style: { position: 'absolute', top: 0, left: 0, width: '1200px', height: '670px', objectFit: 'cover' } }));
  }

  if (badgesNode && layout.templateType === 'classic') {
    elements.push(badgesNode);
  }

  if (overlayDataUri && typeof overlayDataUri === 'string' && overlayDataUri.trim().length > 0) {
    elements.push(h('img', { src: overlayDataUri, style: { position: 'absolute', top: 0, left: 0, width: '1200px', height: '670px' } }));
  }

  if (overlayBadgeDataUri && typeof overlayBadgeDataUri === 'string' && overlayBadgeDataUri.trim().length > 0) {
    elements.push(h('img', { src: overlayBadgeDataUri, style: { position: 'absolute', top: 0, left: 0, width: '1200px', height: '670px' } }));
  }

  if (overlayMarriedDataUri && typeof overlayMarriedDataUri === 'string' && overlayMarriedDataUri.trim().length > 0) {
    elements.push(h('img', { src: overlayMarriedDataUri, style: { position: 'absolute', top: 0, left: 0, width: '1200px', height: '670px' } }));
  }

  if (layout.avatar && finalAvatar && typeof finalAvatar === 'string' && finalAvatar.trim().length > 0) {
    const size = layout.avatar.radius * 2;
    elements.push(h('img', {
      src: finalAvatar,
      style: {
        position: 'absolute',
        top: `${layout.avatar.y - layout.avatar.radius}px`,
        left: `${layout.avatar.x - layout.avatar.radius}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: layout.avatar.borderRadius || '50%',
        border: layout.avatar.border || undefined,
        objectFit: 'cover'
      }
    }));
  }

  if (layout.textos) {
    for (const [key, config] of Object.entries(layout.textos)) {
      let val = '';
      if (key === 'username') val = data.user.username.length > 20 ? data.user.username.slice(0, 17) + '...' : data.user.username;
      else if (key === 'carteira') val = Format(data.carteira);
      else if (key === 'banco') val = Format(data.banco);
      else if (key === 'reputacao') val = data.reputacoes;
      else if (key === 'sobremim') val = data.sobremim;
      else if (key === 'rankBanco') val = data.rankBanco;

      if (!val && val !== 0 && val !== "N/A") continue;

      const textoFinal = (config.prefix || '') + val + (config.suffix || '');
      const isRight = config.align === 'right';
      const fontSize = parseInt(config.font.match(/\d+/)[0]) || 30;
      const satoriTop = config.y - fontSize + 6;

      const fieldColor = config.color || layout.textColor || '#ffffff';
      const fieldShadow = config.textShadow !== undefined 
        ? (config.textShadow === false || config.textShadow === 'none' ? undefined : config.textShadow)
        : (layout.textShadow === false || layout.textShadow === 'none' ? undefined : layout.textShadow);

      elements.push(h('div', {
        style: {
          position: 'absolute',
          top: `${satoriTop}px`,
          left: isRight ? undefined : `${config.x}px`,
          right: isRight ? `${1200 - config.x}px` : undefined,
          display: config.maxLines ? '-webkit-box' : 'flex',
          WebkitLineClamp: config.maxLines ? config.maxLines : undefined,
          WebkitBoxOrient: config.maxLines ? 'vertical' : undefined,
          overflow: config.maxWidth ? 'hidden' : undefined,
          textOverflow: config.maxWidth ? 'ellipsis' : undefined,
          wordBreak: config.maxWidth ? 'break-word' : 'normal',
          maxWidth: config.maxWidth ? `${config.maxWidth}px` : undefined,
          lineHeight: config.lineHeight ? `${config.lineHeight}px` : undefined,
          color: fieldColor,
          fontSize: `${fontSize}px`,
          fontWeight: config.font.includes('bold') ? 700 : 400,
          textShadow: fieldShadow
        }
      }, textoFinal));
    }
  }

  if (badgesNode && layout.templateType !== 'classic') {
    elements.push(badgesNode);
  }

  if (layout.casamento && data.conjuge) {
    const cConfig = layout.casamento;
    const isRight = cConfig.align === 'right';
    const fontSizeNome = parseInt((cConfig.font || '28px').match(/\d+/)[0]) || 28;
    const casadoColor = cConfig.color || layout.textColor || '#ffffff';
    const casadoShadow = cConfig.textShadow !== undefined 
      ? (cConfig.textShadow === false || cConfig.textShadow === 'none' ? undefined : cConfig.textShadow)
      : (layout.textShadow === false || layout.textShadow === 'none' ? undefined : layout.textShadow);

    if (cConfig.nameX !== undefined) {
      elements.push(h('div', {
        style: {
          position: 'absolute',
          top: `${cConfig.nameY - fontSizeNome + 6}px`,
          left: isRight ? undefined : `${cConfig.nameX}px`,
          right: isRight ? `${1200 - cConfig.nameX}px` : undefined,
          display: 'flex', color: casadoColor, fontSize: `${fontSizeNome}px`,
          fontWeight: 700, textShadow: casadoShadow
        }
      }, data.conjuge.nome)); // Anel removido, usa apenas o nome
    }

    if (cConfig.exibirData !== false && cConfig.dateX !== undefined) {
       const fontSizeData = fontSizeNome - 6;
       elements.push(h('div', {
        style: {
          position: 'absolute',
          top: `${cConfig.dateY - fontSizeData + 6}px`,
          left: isRight ? undefined : `${cConfig.dateX}px`,
          right: isRight ? `${1200 - cConfig.dateX}px` : undefined,
          display: 'flex', color: casadoColor, fontSize: `${fontSizeData}px`,
          fontWeight: 500, textShadow: casadoShadow
        }
      }, data.conjuge.data));
    }
  }

  const vnode = h('div', {
    style: {
      display: 'flex', position: 'relative', width: '1200px', height: '670px',
      fontFamily: 'Noto Sans CJK JP', overflow: 'hidden', backgroundColor: '#0b0f19'
    }
  }, ...elements);

  const svg = await satori(vnode, { width: 1200, height: 670, fonts: loadedFonts });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  
  return resvg.render().asPng();
}

// ==========================================
// EXPORT FINAL
// ==========================================
async function generateUserProfileImage(targetUser, authorId, client, database) {
  const profileData = await fetchUserProfileData(targetUser, authorId, client, database);
  const buffer = await renderProfileSatori(profileData);
  return { buffer, data: profileData };
}

module.exports = { generateUserProfileImage };