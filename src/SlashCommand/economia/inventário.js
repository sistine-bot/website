const { ButtonStyle, ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, AttachmentBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const { getUserInventory, Format, CheckUserVip, getUserMoney, getUserReps } = require('../../utils/functions.js');
const satori = require('satori').default || require('satori');
const { Resvg } = require('@resvg/resvg-js');
const parseMs = require('parse-ms');
const itensAPI = require(`../../utils/itens.json`);

// ==========================================
// MOTOR DE FONTES (SATORI)
// ==========================================
let loadedFonts = [];

async function ensureFontsLoaded() {
  if (loadedFonts.length > 0) return;
  try {
    const regReq = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.0.19/files/noto-sans-latin-400-normal.woff');
    const boldReq = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.0.19/files/noto-sans-latin-700-normal.woff');
    
    if (regReq.ok && boldReq.ok) {
        loadedFonts.push({ name: 'Noto Sans CJK JP', data: Buffer.from(await regReq.arrayBuffer()), weight: 400, style: 'normal' });
        loadedFonts.push({ name: 'Noto Sans CJK JP', data: Buffer.from(await boldReq.arrayBuffer()), weight: 700, style: 'normal' });
    }
  } catch(e) {
    console.error('[Inventário Satori] Erro ao carregar fontes:', e);
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

      // 1. Coleta de Dados Assíncrona
      let { vip, tempo, data } = await CheckUserVip(interaction, user);
      if (data !== null && tempo - (Date.now() - data) < 0 || vip < 1) vip = 0;
      
      const time = parseMs(tempo - (Date.now() - data));
      const DataVIP = `${time.days}d ${time.hours}h ${time.minutes}m`;
      
      const { carteira, banco } = await getUserMoney(user);
      const { recebidas } = await getUserReps(user);
      
      let inv = await getUserInventory(user);
      
      let vipStr = 'Não possui VIP';
      if (vip === 1) vipStr = `Ouro (${DataVIP})`;
      if (vip === 2) vipStr = `Diamante (${DataVIP})`;

      // 2. Preparação do Layout (Textos do Perfil Lateral)
      const profileTexts = [
        { title: 'nome:', desc: user.username, c1: '#FFFFFF', c2: '#FFFFFF' },
        { title: 'vip:', desc: vipStr, c1: '#FFFFFF', c2: '#FFFFFF' },
        { title: 'banco:', desc: Format(banco), c1: '#FFFFFF', c2: '#FFFFFF' },
        { title: 'carteira:', desc: Format(carteira), c1: '#FFFFFF', c2: '#FFFFFF' },
        { title: 'reputações:', desc: Format(recebidas), c1: '#FFFFFF', c2: '#FFFFFF' },
        { title: 'porte de armas:', desc: inv.porte?.item ? 'Sim' : 'Não', c1: '#FFFFFF', c2: inv.porte?.item ? '#04ff00' : '#ff0000' }
      ];

      // 3. Mapeamento da Grade de Itens (Até 20 Slots)
      const itemsToRender = [];
      const pushItem = (img, txt) => { if (itemsToRender.length < 20) itemsToRender.push({ img, txt }); };

      if (inv.arma?.item > 0) pushItem(itensAPI.arma[inv.arma.item].imagem, `(${Format(inv.arma.Xp, '')}%) 1x`);
      if (inv.munição > 0) pushItem(itensAPI.munição.imagem, `${Format(inv.munição, '')}x`);
      if (inv.anelcasamento?.item > 0) pushItem(itensAPI.anelcasamento.imagem, '1x');
      if (inv.armacaça?.item > 0) pushItem(itensAPI.armacaça.imagem, `(${Format(inv.armacaça.Xp, '')}%) 1x`);
      if (inv.vara?.item > 0) pushItem(itensAPI.vara.imagem, `(${Format(inv.vara.Xp, '')}%) 1x`);
      if (inv.isca > 0) pushItem(itensAPI.isca.imagem, `${Format(inv.isca, '')}x`);
      if (inv.peixe > 0) pushItem(itensAPI.peixe.imagem, `${Format(inv.peixe, '')}x`);
      if (inv.backgroundticket > 0) pushItem(itensAPI.backgroundticket.imagem, `${Format(inv.backgroundticket, '')}x`);
      if (inv.ração_animal > 0) pushItem(itensAPI.ração_animal.imagem, `${Format(inv.ração_animal, '')}x`);
      if (inv.carne > 0) pushItem(itensAPI.carne.imagem, `${inv.carne}x`);
      if (inv.baús?.epico > 0) pushItem(itensAPI.baú[3].imagem, `${inv.baús.epico}x`);
      if (inv.baús?.raro > 0) pushItem(itensAPI.baú[2].imagem, `${inv.baús.raro}x`);
      if (inv.baús?.comum > 0) pushItem(itensAPI.baú[1].imagem, `${inv.baús.comum}x`);
      if (inv.chave > 0) pushItem(itensAPI.chave.imagem, `${inv.chave}x`);
      if (inv.Trigo > 0) pushItem(itensAPI.Trigo.imagem, `${inv.Trigo}x`);
      if (inv.Milho > 0) pushItem(itensAPI.Milho.imagem, `${inv.Milho}x`);
      if (inv.Feijão > 0) pushItem(itensAPI.Feijão.imagem, `${inv.Feijão}x`);
      if (inv.CanaDeAçucar > 0) pushItem(itensAPI.CanaDeAçucar.imagem, `${inv.CanaDeAçucar}x`);
      if (inv.Cenoura > 0) pushItem(itensAPI.Cenoura.imagem, `${inv.Cenoura}x`);
      if (inv.Abóbora > 0) pushItem(itensAPI.Abóbora.imagem, `${inv.Abóbora}x`);
      if (inv.Ovo > 0) pushItem(itensAPI.Ovo.imagem, `${inv.Ovo}x`);
      if (inv.Leite > 0) pushItem(itensAPI.Leite.imagem, `${inv.Leite}x`);
      if (inv.Bacon > 0) pushItem(itensAPI.Bacon.imagem, `${inv.Bacon}x`);

      // 4. Download Concorrente de TODAS as imagens
      await ensureFontsLoaded();
      
      const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
      const bgUrl = 'https://i.postimg.cc/PJbzDM0S/i-Pad-Pro-12-9-1-1.png';

      const urlsToFetch = [bgUrl, avatarUrl, ...itemsToRender.map(i => i.img)];
      const fetchedDataUris = await Promise.all(urlsToFetch.map(url => fetchRemoteDataUri(url)));

      const bgDataUri = fetchedDataUris[0];
      const avatarDataUri = fetchedDataUris[1] || 'https://cdn.discordapp.com/embed/avatars/0.png';
      
      // Injeta os dados URI retornados de volta aos itens
      const itemDataUris = fetchedDataUris.slice(2);
      itemsToRender.forEach((item, index) => { item.dataUri = itemDataUris[index]; });

      // 5. Motor de Renderização (Satori)
      const elements = [];

      // Fundo e Avatar
      if (bgDataUri) elements.push(h('img', { src: bgDataUri, style: { position: 'absolute', top: 0, left: 0, width: '1200px', height: '670px' } }));
      elements.push(h('img', { src: avatarDataUri, style: { position: 'absolute', top: 140, left: 655, width: '228px', height: '228px', borderRadius: '15px', objectFit: 'cover' } }));

      // Textos da Coluna Direita (Matemática convertida de BaseLine para Top-Left)
      profileTexts.forEach((t, i) => {
        const titleTop = 147 + (i * 39) - 15 + 3;
        const descTop = 168 + (i * 39) - 20 + 4;
        
        elements.push(h('div', { style: { position: 'absolute', top: titleTop, left: 895, color: t.c1, fontSize: '15px', fontWeight: 400, textTransform: 'uppercase' } }, t.title));
        elements.push(h('div', { style: { position: 'absolute', top: descTop, left: 895, color: t.c2, fontSize: '20px', fontWeight: 700, textTransform: 'uppercase' } }, t.desc));
      });

      // Grade de Itens Esquerda
      itemsToRender.forEach((slot, index) => {
        if (!slot.dataUri) return;
        
        const linha = Math.floor(index / 5);
        const coluna = index % 5;
        const baseX = 50 + (coluna * 115);
        const baseY = 155 + (linha * 115);

        // Ícone do Item
        elements.push(h('img', { src: slot.dataUri, style: { position: 'absolute', top: baseY, left: baseX, width: '80px', height: '80px' } }));

        // Texto (Quantidades / XP)
        const textTop = baseY + 83 - 16 + 2;
        const textRight = 1200 - (baseX + 83); // Alinhamento matemático à direita
        
        elements.push(h('div', { 
            style: { 
                position: 'absolute', top: textTop, right: textRight, 
                color: '#ffffff', fontSize: '16px', fontWeight: 700, 
                textShadow: '0px 2px 4px rgba(0,0,0,0.9), 0px 0px 2px rgba(0,0,0,0.5)' // Sombra forte pra garantir leitura
            } 
        }, slot.txt));
      });

      const vnode = h('div', {
        style: { display: 'flex', position: 'relative', width: '1200px', height: '670px', fontFamily: 'Noto Sans CJK JP', overflow: 'hidden', backgroundColor: '#1e1e1e' }
      }, ...elements);

      const svg = await satori(vnode, { width: 1200, height: 670, fonts: loadedFonts });
      const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
      const finalBuffer = resvg.render().asPng();

      // 6. Envio e Interações
      const attachment = new AttachmentBuilder(finalBuffer, { name: `mochila-${user.username}.png` });
      
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("infos").setStyle(ButtonStyle.Secondary).setEmoji('ℹ️'),
      );
      
      await msg.edit({ content: `${user}`, files: [attachment] }).catch(() => {});
      
      if (user.id === interaction.user.id) {
        await msg.edit({ components: [row] }).catch(() => {});
      }
      
      const coletor = msg.createMessageComponentCollector({ 
        filter: x => x.user.id === interaction.user.id,
        time: 120000 
      });

      coletor.on('collect', async (i2) => {
        await i2.deferUpdate();

        if (i2.customId === 'infos') {
          const freshInv = await getUserInventory(user);
          
          const Embed = new EmbedBuilder()
            .setColor(color.embed || "#00ff00")
            .setTitle("Seu Histórico de Itens")
            .setTimestamp()
            .setFooter({ text: 'Detalhes do Inventário', iconURL: user.displayAvatarURL({ extension: 'png' }) });

          let desc = "";
          if (freshInv.armacaça?.item) desc += `<:armacaca:1002636342557155370> **|** ${itensAPI.armacaça.nome[0]}: ${freshInv.armacaça.Xp ? `✅ (${freshInv.armacaça.Xp}%)` : '❌'}\n`;
          if (freshInv.arma?.item) desc += `🔫 **|** ${freshInv.arma.nome}: ${freshInv.arma.Xp ? `✅ (${freshInv.arma.Xp}%)` : '❌'}\n`;
          if (freshInv.vara?.item) desc += `🎣 **|** ${freshInv.vara.nome[0]}: ${freshInv.vara.Xp ? `✅ (${freshInv.vara.Xp}%)` : '❌'}\n`;
          if (freshInv.porte?.item) desc += `📜 **|** ${freshInv.porte.nome}: ✅\n`;
          if (freshInv.anelcasamento?.item) desc += `💍 **|** ${freshInv.anelcasamento.nome}: ✅\n`;
          if (freshInv.munição) desc += `<:bullet:1002628038778961981> **|** ${itensAPI.munição.nome[0]}: ${freshInv.munição}\n`;
          if (freshInv.Trigo) desc += `<:trigo:994604784571125770> **|** ${itensAPI.Trigo.nome[0]}: ${freshInv.Trigo}\n`;
          if (freshInv.Milho) desc += `<:milho:994602871511334912> **|** ${itensAPI.Milho.nome[0]}: ${freshInv.Milho}\n`;
          if (freshInv.Feijão) desc += `<:feijo:994608694375497798> **|** ${itensAPI.Feijão.nome[0]}: ${freshInv.Feijão}\n`;
          if (freshInv.CanaDeAçucar) desc += `<:canadeacucar:994610951884128347> **|** ${itensAPI.CanaDeAçucar.nome[0]}: ${freshInv.CanaDeAçucar}\n`;
          if (freshInv.Cenoura) desc += `<:cenoura:948417146273275915> **|** ${itensAPI.Cenoura.nome[0]}: ${freshInv.Cenoura}\n`;
          if (freshInv.Abóbora) desc += `<:abobora:994611617264308344> **|** ${itensAPI.Abóbora.nome[0]}: ${freshInv.Abóbora}\n`;
          if (freshInv.Ovo) desc += `<:ovo:1002603609139187733> **|** ${itensAPI.Ovo.nome[0]}: ${freshInv.Ovo}\n`;
          if (freshInv.Leite) desc += `<:leite:1002603490536853595> **|** ${itensAPI.Leite.nome[0]}: ${freshInv.Leite}\n`;
          if (freshInv.Bacon) desc += `<:bacon:1002603721227767848> **|** ${itensAPI.Bacon.nome[0]}: ${freshInv.Bacon}\n`;
          if (freshInv.ração_animal) desc += `<:comidaAnimal:1060974202980671508> **|** ${itensAPI.ração_animal.nome[0]}: ${freshInv.ração_animal}\n`;
          if (freshInv.isca) desc += `🦐 **|** ${itensAPI.isca.nome[0]}: ${freshInv.isca}\n`;
          if (freshInv.carne) desc += `🥩 **|** ${itensAPI.carne.nome[0]}: ${freshInv.carne}\n`;
          if (freshInv.peixe) desc += `🐟 **|** ${itensAPI.peixe.nome[0]}: ${freshInv.peixe}\n`;
          if (freshInv.adubo) desc += `💩 **|** ${itensAPI.adubo.nome[0]}: ${freshInv.adubo}\n`;
          if (freshInv.backgroundticket) desc += `🎟️ **|** ${itensAPI.backgroundticket.nome[0]}: ${freshInv.backgroundticket}\n`;

          Embed.setDescription(desc || "Nenhum item detalhado encontrado.");
          return interaction.followUp({ ephemeral: true, embeds: [Embed] });
        }
      });

      coletor.on('end', () => {
        const rowDesativada = ActionRowBuilder.from(row);
        rowDesativada.components.forEach(btn => btn.setDisabled(true));
        msg.edit({ components: [rowDesativada] }).catch(() => {});
      });

    } catch (error) {
      console.error(error);
      return interaction.followUp({ content: `Ocorreu um erro inesperado na utilização deste comando.` });
    }
  }
};