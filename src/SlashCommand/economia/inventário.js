const { ButtonStyle, ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, AttachmentBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const { getUserInventory, Format } = require('../../utils/functions.js');
const satori = require('satori').default || require('satori');
const { Resvg } = require('@resvg/resvg-js');
const path = require('path');
const fs = require('fs');
const itensAPI = require(`../../utils/itens.json`);
const { createRegadorVNode, createVaraVNode, createEnxadaVNode } = require('../../utils/satoriItemTemplates.js');

// ==========================================
// MOTOR DE FONTES (SATORI)
// ==========================================
let loadedFonts = [];

async function ensureFontsLoaded() {
  if (loadedFonts.length > 0) return;
  const localRegPath = path.join(__dirname, '../../utils/assets/fonts/Roboto-Regular.woff');
  const localBoldPath = path.join(__dirname, '../../utils/assets/fonts/Roboto-Bold.woff');
  if (fs.existsSync(localRegPath) && fs.existsSync(localBoldPath)) {
    loadedFonts.push({ name: 'Roboto', data: fs.readFileSync(localRegPath), weight: 400, style: 'normal' });
    loadedFonts.push({ name: 'Roboto', data: fs.readFileSync(localBoldPath), weight: 700, style: 'normal' });
    return;
  }
  try {
    const regReq = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.0.19/files/noto-sans-latin-400-normal.woff');
    const boldReq = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.0.19/files/noto-sans-latin-700-normal.woff');
    
    if (regReq.ok && boldReq.ok) {
        loadedFonts.push({ name: 'Roboto', data: Buffer.from(await regReq.arrayBuffer()), weight: 400, style: 'normal' });
        loadedFonts.push({ name: 'Roboto', data: Buffer.from(await boldReq.arrayBuffer()), weight: 700, style: 'normal' });
    }
  } catch(e) {
    console.error('[Inventário Satori] Erro ao carregar fontes:', e);
  }
}

// ==========================================
// EMOJIS TWEMOJI (SATORI)
// ==========================================
const emojiDir = path.join(__dirname, '../../utils/assets/emojis');
const graphemeImages = {};
const emojiMap = {
  '⭐': '2b50.svg',
  '📉': '1f4c9.svg',
  '💧': '1f4a7.svg',
  '🥀': '1f940.svg',
  '✨': '2728.svg'
};

for (const [char, file] of Object.entries(emojiMap)) {
  const p = path.join(emojiDir, file);
  if (fs.existsSync(p)) {
    graphemeImages[char] = `data:image/svg+xml;base64,${fs.readFileSync(p).toString('base64')}`;
  }
}

// ==========================================
// VNODE HELPER
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
// CACHE DE IMAGENS REMOTAS (ALTA VELOCIDADE)
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
    path.join(__dirname, '../../utils/assets/inventory/itens', url),
    path.join(baseDir, url),
    path.join(baseDir, path.basename(url)),
    ...subdirs.map(d => path.join(baseDir, d, path.basename(url))),
    ...subdirs.map(d => path.join(__dirname, '../../utils/assets/inventory/itens', d, path.basename(url)))
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

module.exports = {
  name: "inventário",
  description: `⌊💸 Economia⌉ Veja os itens que você possui in-game.`,
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "usuário",
      type: ApplicationCommandOptionType.User,
      description: "Mencione alguém para ver o inventário dela",
      required: false,
    }
  ],
  
  run: async (client, interaction, args, color, database, emoji) => {
    try {
      const user = interaction.options.getUser("usuário") || interaction.user;
      const msg = await interaction.followUp({ content: `<a:loading:929931026589954128> **|** Carregando inventário de **${user.username}**...` });

      // 1. Coleta de Dados do Inventário
      let inv = await getUserInventory(user);

      // 3. Mapeamento de TODOS os Itens (Suporte a Múltiplas Páginas)
      const allItems = [];
      const pushItem = (img, txt) => {
        if (img) allItems.push({ img, txt });
      };

      // Equipamentos e Ferramentas
      if (inv.arma?.item > 0) pushItem(itensAPI.arma[inv.arma.item]?.imagem, `(${Format(inv.arma.Xp || 0, '')}%) 1x`);
      if (inv.armacaça?.item > 0) pushItem(itensAPI.armacaça.imagem, `(${Format(inv.armacaça.Xp || 0, '')}%) 1x`);
      if (inv.porte?.item > 0) pushItem(itensAPI.porte?.imagem || 'armas/porte_armas.png', '1x');
      if (inv.anelcasamento?.item > 0) pushItem(itensAPI.anelcasamento.imagem, '1x');

      // Vara de Pesca (Vara de Bambu vs Clássica)
      if (inv.vara?.item > 0) {
        const isBambu = (inv.vara.tipo === 'bambu' || String(inv.vara.nome).toLowerCase().includes('bambu'));
        const varaImg = isBambu ? 'ferramentas/vara_bambu.png' : (itensAPI.vara?.imagem || 'ferramentas/vara_pescar.png');
        pushItem(varaImg, `(${Format(inv.vara.Xp || 0, '')}%) 1x`);
      }

      // Enxada (Enxada de Madeira vs Enxada de Ferro)
      if (inv.enxada?.item > 0) {
        const isMadeira = (inv.enxada.tipo === 'madeira' || String(inv.enxada.nome).toLowerCase().includes('madeira'));
        const enxadaImg = isMadeira ? 'ferramentas/enxada_madeira.png' : (itensAPI.enxada?.imagem || 'ferramentas/enxada.png');
        pushItem(enxadaImg, `(${Format(inv.enxada.Xp || 0, '')}%) 1x`);
      }

      // Regador (Regador de Plástico vs Regador de Ferro)
      if (inv.regador?.item > 0) {
        const isPlastico = (inv.regador.tipo === 'plastico' || String(inv.regador.nome).toLowerCase().includes('plástico'));
        const regadorImg = isPlastico ? 'ferramentas/regador_plastico.png' : 'ferramentas/regador_ferro.png';
        pushItem(regadorImg, `💧${inv.regador.agua !== undefined ? inv.regador.agua : 100}%`);
      }

      // Consumíveis e Outros Itens
      if (inv.munição > 0) pushItem(itensAPI.munição.imagem, `${Format(inv.munição, '')}x`);
      if (inv.isca > 0) pushItem(itensAPI.isca.imagem, `${Format(inv.isca, '')}x`);
      if (inv.peixe > 0) pushItem(itensAPI.peixe.imagem, `${Format(inv.peixe, '')}x`);
      if (inv.carne > 0) pushItem(itensAPI.carne.imagem, `${inv.carne}x`);
      if (inv.backgroundticket > 0) pushItem(itensAPI.backgroundticket.imagem, `${Format(inv.backgroundticket, '')}x`);
      if (inv.ração_animal > 0) pushItem(itensAPI.ração_animal.imagem, `${Format(inv.ração_animal, '')}x`);
      if (inv.baús?.epico > 0) pushItem(itensAPI.baú[3].imagem, `${inv.baús.epico}x`);
      if (inv.baús?.raro > 0) pushItem(itensAPI.baú[2].imagem, `${inv.baús.raro}x`);
      if (inv.baús?.comum > 0) pushItem(itensAPI.baú[1].imagem, `${inv.baús.comum}x`);
      if (inv.chave > 0) pushItem(itensAPI.chave.imagem, `${inv.chave}x`);
      if (inv.Ovo > 0) pushItem(itensAPI.Ovo.imagem, `${inv.Ovo}x`);
      if (inv.Leite > 0) pushItem(itensAPI.Leite.imagem, `${inv.Leite}x`);
      if (inv.Bacon > 0) pushItem(itensAPI.Bacon.imagem, `${inv.Bacon}x`);

      // Sementes no Inventário
      if (inv.semente_trigo > 0) pushItem(itensAPI.semente_trigo.imagem, `${inv.semente_trigo}x`);
      if (inv.semente_milho > 0) pushItem(itensAPI.semente_milho.imagem, `${inv.semente_milho}x`);
      if (inv.semente_feijao > 0) pushItem(itensAPI.semente_feijao.imagem, `${inv.semente_feijao}x`);
      if (inv.semente_cana > 0) pushItem(itensAPI.semente_cana.imagem, `${inv.semente_cana}x`);
      if (inv.semente_cenoura > 0) pushItem(itensAPI.semente_cenoura.imagem, `${inv.semente_cenoura}x`);
      if (inv.semente_abobora > 0) pushItem(itensAPI.semente_abobora.imagem, `${inv.semente_abobora}x`);

      // Plantações Colhidas (Qualidades e Podres)
      if (inv.planta_podre > 0) pushItem(itensAPI.planta_podre.imagem, `🥀${inv.planta_podre}x`);

      const cropsBase = [
        { name: 'Trigo', key: 'Trigo' },
        { name: 'Milho', key: 'Milho' },
        { name: 'Feijão', key: 'Feijão' },
        { name: 'CanaDeAçucar', key: 'CanaDeAçucar' },
        { name: 'Cenoura', key: 'Cenoura' },
        { name: 'Abóbora', key: 'Abóbora' }
      ];

      cropsBase.forEach(c => {
        const kExc = `${c.name}_excelente`;
        if (inv[kExc] > 0) pushItem(itensAPI[c.key]?.imagem, `⭐${inv[kExc]}x`);

        const kBom = `${c.name}_bom`;
        const baseCount = (inv[kBom] || 0) + (inv[c.key] || 0);
        if (baseCount > 0) pushItem(itensAPI[c.key]?.imagem, `${baseCount}x`);

        const kRui = `${c.name}_ruim`;
        if (inv[kRui] > 0) pushItem(itensAPI[c.key]?.imagem, `📉${inv[kRui]}x`);
      });

      // 4. Preparação de Fontes e Assets de Base
      await ensureFontsLoaded();
      
      const bgUrl = './src/utils/assets/inventory/new_inv.png';

      const PAGE_SIZE = 40;
      const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
      let currentPage = 0;

      // 5. Função de Renderização de Página (Grade 10x4)
      async function renderPage(pageIndex) {
        const pageItems = allItems.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE);

        const itemsNeedingFetch = pageItems.filter(i => !i.customVNode && i.img);
        const urlsToFetch = [bgUrl, ...itemsNeedingFetch.map(i => i.img)];
        const fetchedDataUris = await Promise.all(urlsToFetch.map(url => fetchRemoteDataUri(url)));

        const bgDataUri = fetchedDataUris[0];
        let fetchIdx = 1;
        pageItems.forEach((item) => {
          if (!item.customVNode && item.img) {
            item.dataUri = fetchedDataUris[fetchIdx++];
          }
        });

        const elements = [];

        // Imagem de Fundo (1200x670)
        if (bgDataUri) {
          elements.push(h('img', { src: bgDataUri, style: { position: 'absolute', top: 0, left: 0, width: '1200px', height: '670px' } }));
        }

        // Título: INVENTÁRIO - nome (O texto INVENTÁRIO já está fixo na imagem base em x: 19 a 236, y: 21 a 50)
        elements.push(h('div', {
          style: {
            position: 'absolute',
            top: 21,
            left: 250,
            color: '#ac28ae',
            fontSize: '26px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }
        }, `- ${user.username}`));

        // Rodapé: Paginação e Total de Itens abaixo do inventário (linha y=591)
        const startItem = pageIndex * PAGE_SIZE + 1;
        const endItem = Math.min((pageIndex + 1) * PAGE_SIZE, allItems.length);
        elements.push(h('div', {
          style: {
            position: 'absolute',
            top: 610,
            left: 31,
            width: 1134,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#94a3b8',
            fontSize: '18px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }
        }, [
          h('div', {}, totalPages > 1
            ? `PÁGINA ${pageIndex + 1} DE ${totalPages} • ITENS ${startItem}-${endItem}`
            : `PÁGINA 1 DE 1 • ${allItems.length} ${allItems.length === 1 ? 'ITEM' : 'ITENS'}`
          ),
          h('div', {}, `TOTAL: ${allItems.length} ${allItems.length === 1 ? 'ITEM' : 'ITENS'}`)
        ]));

        // Grade de Itens (10 colunas x 4 linhas = 40 Slots)
        // Subiu 37px (155 - 37 = 118) e andou pra esquerda 9px (50 - 9 = 41)
        pageItems.forEach((slot, index) => {
          if (!slot.customVNode && !slot.dataUri) return;
          
          const linha = Math.floor(index / 10);
          const coluna = index % 10;
          const baseX = 41 + (coluna * 115);
          const baseY = 118 + (linha * 114);

          // Renderização do Ícone: se for customVNode (ferramentas dinâmicas Satori) ou imagem (legado)
          if (slot.customVNode) {
            elements.push(h('div', {
              style: {
                position: 'absolute',
                top: baseY,
                left: baseX,
                width: '80px',
                height: '80px',
                display: 'flex'
              }
            }, slot.customVNode));
          } else if (slot.dataUri) {
            elements.push(h('img', {
              src: slot.dataUri,
              style: {
                position: 'absolute',
                top: baseY,
                left: baseX,
                width: '80px',
                height: '80px',
                objectFit: 'contain'
              }
            }));
          }

          // Texto de Quantidade / Durabilidade / Água
          const textTop = baseY + 66;
          const textRight = 1200 - (baseX + 83);
          
          elements.push(h('div', { 
            style: { 
              display: 'flex',
              alignItems: 'center',
              position: 'absolute',
              top: textTop,
              right: textRight, 
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 700, 
              textShadow: '0px 2px 4px rgba(0,0,0,0.9), 0px 0px 2px rgba(0,0,0,0.7)'
            } 
          }, slot.txt));
        });

        const vnode = h('div', {
          style: { display: 'flex', position: 'relative', width: '1200px', height: '670px', fontFamily: 'Roboto', overflow: 'hidden', backgroundColor: '#1e1e1e' }
        }, ...elements);

        const svg = await satori(vnode, { width: 1200, height: 670, fonts: loadedFonts, graphemeImages });
        const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
        return resvg.render().asPng();
      }

      function buildActionRow(pageIndex) {
        const row = new ActionRowBuilder();
        if (totalPages > 1) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId("prev_page")
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('⬅️')
              .setDisabled(pageIndex === 0),
            new ButtonBuilder()
              .setCustomId("page_num")
              .setStyle(ButtonStyle.Secondary)
              .setLabel(`${pageIndex + 1}/${totalPages}`)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("next_page")
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('➡️')
              .setDisabled(pageIndex >= totalPages - 1),
          );
        }
        row.addComponents(
          new ButtonBuilder().setCustomId("infos").setStyle(ButtonStyle.Secondary).setEmoji('ℹ️')
        );
        return row;
      }

      // 6. Renderiza a Primeira Página e Envia
      const initialBuffer = await renderPage(0);
      const attachment = new AttachmentBuilder(initialBuffer, { name: `mochila-${user.username}.png` });
      
      await msg.edit({ content: `${user}`, files: [attachment], components: [buildActionRow(0)] }).catch(() => {});
      
      const coletor = msg.createMessageComponentCollector({ 
        filter: x => x.user.id === interaction.user.id,
        time: 120000 
      });

      coletor.on('collect', async (i2) => {
        await i2.deferUpdate();

        if (i2.customId === 'prev_page' && currentPage > 0) {
          currentPage--;
          const buf = await renderPage(currentPage);
          const attach = new AttachmentBuilder(buf, { name: `mochila-${user.username}.png` });
          await msg.edit({ files: [attach], components: [buildActionRow(currentPage)] }).catch(() => {});
        } else if (i2.customId === 'next_page' && currentPage < totalPages - 1) {
          currentPage++;
          const buf = await renderPage(currentPage);
          const attach = new AttachmentBuilder(buf, { name: `mochila-${user.username}.png` });
          await msg.edit({ files: [attach], components: [buildActionRow(currentPage)] }).catch(() => {});
        } else if (i2.customId === 'infos') {
          const freshInv = await getUserInventory(user);
          
          const Embed = new EmbedBuilder()
            .setColor(color.embed || "#00ff00")
            .setTitle(`📦 Inventário Completo de ${user.username}`)
            .setTimestamp()
            .setFooter({ text: 'Detalhes do Inventário', iconURL: user.displayAvatarURL({ extension: 'png' }) });

          let equipDesc = "";
          const getToolName = (tool, fallback) => {
            if (!tool) return fallback;
            if (Array.isArray(tool.nome)) return tool.nome[0] || fallback;
            return tool.nome || fallback;
          };

          if (freshInv.armacaça?.item) equipDesc += `<:armacaca:1002636342557155370> **|** ${getToolName(freshInv.armacaça, itensAPI.armacaça.nome[0])}: ${freshInv.armacaça.Xp ? `✅ (${freshInv.armacaça.Xp}%)` : '❌'}\n`;
          if (freshInv.arma?.item) equipDesc += `🔫 **|** ${getToolName(freshInv.arma, freshInv.arma.nome)}: ${freshInv.arma.Xp ? `✅ (${freshInv.arma.Xp}%)` : '❌'}\n`;
          if (freshInv.vara?.item) equipDesc += `🎣 **|** ${getToolName(freshInv.vara, itensAPI.vara.nome[0])}: ${freshInv.vara.Xp ? `✅ (${freshInv.vara.Xp}%)` : '❌'}\n`;
          if (freshInv.enxada?.item) equipDesc += `⛏️ **|** ${getToolName(freshInv.enxada, itensAPI.enxada.nome[0])}: ${freshInv.enxada.Xp ? `✅ (${freshInv.enxada.Xp}%)` : '❌'}\n`;
          if (freshInv.regador?.item) equipDesc += `🚿 **|** ${getToolName(freshInv.regador, itensAPI.regador.nome[0])}: ${freshInv.regador.Xp ? `✅ (${freshInv.regador.Xp}%)` : '❌'} | 💧 Água: **${freshInv.regador.agua !== undefined ? freshInv.regador.agua : 100}%**\n`;
          if (freshInv.porte?.item) equipDesc += `📜 **|** ${freshInv.porte.nome || 'Porte de Armas'}: ✅\n`;
          if (freshInv.anelcasamento?.item) equipDesc += `💍 **|** ${freshInv.anelcasamento.nome || 'Anel de Casamento'}: ✅\n`;

          let seedDesc = "";
          if (freshInv.semente_trigo) seedDesc += `🌾 **|** ${itensAPI.semente_trigo.nome[0]}: **${freshInv.semente_trigo}**\n`;
          if (freshInv.semente_milho) seedDesc += `🌽 **|** ${itensAPI.semente_milho.nome[0]}: **${freshInv.semente_milho}**\n`;
          if (freshInv.semente_feijao) seedDesc += `🫘 **|** ${itensAPI.semente_feijao.nome[0]}: **${freshInv.semente_feijao}**\n`;
          if (freshInv.semente_cana) seedDesc += `🎋 **|** ${itensAPI.semente_cana.nome[0]}: **${freshInv.semente_cana}**\n`;
          if (freshInv.semente_cenoura) seedDesc += `🥕 **|** ${itensAPI.semente_cenoura.nome[0]}: **${freshInv.semente_cenoura}**\n`;
          if (freshInv.semente_abobora) seedDesc += `🎃 **|** ${itensAPI.semente_abobora.nome[0]}: **${freshInv.semente_abobora}**\n`;

          let harvestDesc = "";
          cropsBase.forEach(c => {
            const kExc = `${c.name}_excelente`;
            const kBom = `${c.name}_bom`;
            const kRui = `${c.name}_ruim`;
            if (freshInv[kExc]) harvestDesc += `⭐ **|** ${itensAPI[c.key]?.nome[0]} (Excelente): **${freshInv[kExc]}**\n`;
            const bCount = (freshInv[kBom] || 0) + (freshInv[c.key] || 0);
            if (bCount > 0) harvestDesc += `✨ **|** ${itensAPI[c.key]?.nome[0]} (Bom): **${bCount}**\n`;
            if (freshInv[kRui]) harvestDesc += `📉 **|** ${itensAPI[c.key]?.nome[0]} (Ruim): **${freshInv[kRui]}**\n`;
          });
          if (freshInv.planta_podre) harvestDesc += `🥀 **|** Planta Podre: **${freshInv.planta_podre}**\n`;

          let otherDesc = "";
          if (freshInv.munição) otherDesc += `<:bullet:1002628038778961981> **|** ${itensAPI.munição.nome[0]}: ${freshInv.munição}\n`;
          if (freshInv.Ovo) otherDesc += `<:ovo:1002603609139187733> **|** ${itensAPI.Ovo.nome[0]}: ${freshInv.Ovo}\n`;
          if (freshInv.Leite) otherDesc += `<:leite:1002603490536853595> **|** ${itensAPI.Leite.nome[0]}: ${freshInv.Leite}\n`;
          if (freshInv.Bacon) otherDesc += `<:bacon:1002603721227767848> **|** ${itensAPI.Bacon.nome[0]}: ${freshInv.Bacon}\n`;
          if (freshInv.ração_animal) otherDesc += `<:comidaAnimal:1060974202980671508> **|** ${itensAPI.ração_animal.nome[0]}: ${freshInv.ração_animal}\n`;
          if (freshInv.isca) otherDesc += `🦐 **|** ${itensAPI.isca.nome[0]}: ${freshInv.isca}\n`;
          if (freshInv.carne) otherDesc += `🥩 **|** ${itensAPI.carne.nome[0]}: ${freshInv.carne}\n`;
          if (freshInv.peixe) otherDesc += `🐟 **|** ${itensAPI.peixe.nome[0]}: ${freshInv.peixe}\n`;
          if (freshInv.adubo) otherDesc += `💩 **|** ${itensAPI.adubo?.nome ? itensAPI.adubo.nome[0] : 'Adubo'}: ${freshInv.adubo}\n`;
          if (freshInv.backgroundticket) otherDesc += `🎟️ **|** ${itensAPI.backgroundticket.nome[0]}: ${freshInv.backgroundticket}\n`;

          if (equipDesc) Embed.addFields({ name: "🛠️ Equipamentos & Ferramentas", value: equipDesc });
          if (seedDesc) Embed.addFields({ name: "🌱 Sementes", value: seedDesc });
          if (harvestDesc) Embed.addFields({ name: "🌾 Plantação & Colheitas", value: harvestDesc });
          if (otherDesc) Embed.addFields({ name: "🎒 Outros Itens", value: otherDesc });

          if (!equipDesc && !seedDesc && !harvestDesc && !otherDesc) {
            Embed.setDescription("Nenhum item detalhado encontrado no inventário.");
          }

          return interaction.followUp({ ephemeral: true, embeds: [Embed] });
        }
      });

      coletor.on('end', () => {
        const rowDesativada = buildActionRow(currentPage);
        rowDesativada.components.forEach(btn => btn.setDisabled(true));
        msg.edit({ components: [rowDesativada] }).catch(() => {});
      });

    } catch (error) {
      console.error(error);
      return interaction.followUp({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
};