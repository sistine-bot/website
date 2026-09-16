const satori = require('satori').default || require('satori');
const { html } = require('satori-html');
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

let cachedFonts = null;

function loadFonts() {
  if (cachedFonts) return cachedFonts;
  try {
    const fontsDir = path.join(__dirname, 'assets/fonts');
    const boldPath = path.join(fontsDir, 'Inter-Bold.woff');
    const regularPath = path.join(fontsDir, 'Inter-Regular.woff');

    if (fs.existsSync(boldPath) && fs.existsSync(regularPath)) {
      cachedFonts = [
        { name: 'Inter', data: fs.readFileSync(boldPath), weight: 700, style: 'normal' },
        { name: 'Inter', data: fs.readFileSync(regularPath), weight: 400, style: 'normal' }
      ];
      return cachedFonts;
    }
  } catch (err) {
    console.warn('[SatoriMinigames] Erro ao carregar fontes locais:', err.message);
  }

  cachedFonts = [];
  return cachedFonts;
}

/**
 * Renderiza o template HTML compilado para Buffer PNG 800x400
 * @param {string} fullHtmlString 
 * @returns {Promise<Buffer>}
 */
async function renderToPngBuffer(fullHtmlString) {
  const fonts = loadFonts();
  // Passa como array [string] para o satori-html compilar o HTML puro sem escape de tags
  const vnode = html([fullHtmlString]);
  
  const svg = await satori(vnode, {
    width: 800,
    height: 400,
    fonts: fonts.length > 0 ? fonts : undefined
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 800 }
  });
  return resvg.render().asPng();
}

/**
 * ============================================================================
 * MINIGAME 1: ENTREGADOR / CAMINHONEIRO / TAXISTA (Análise de Rota GPS)
 * ============================================================================
 */
async function generateRouteMinigame() {
  const routes = ['vermelho', 'azul', 'verde'];
  const freeRoute = routes[Math.floor(Math.random() * routes.length)];

  const isBlocked = {
    vermelho: freeRoute !== 'vermelho',
    azul: freeRoute !== 'azul',
    verde: freeRoute !== 'verde'
  };

  // SVGs Vetoriais Nativos (Garantem exibição perfeita sem dependência de fontes de emoji)
  const truckSvg = `
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: flex;">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" fill="#0284c7" />
      <circle cx="7" cy="18" r="2" fill="#0284c7" />
    </svg>
  `;

  const flagSvg = `
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: flex;">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="#f59e0b" fill-opacity="0.25" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  `;

  const barrierSvg = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style="display: flex;">
      <rect x="2" y="5" width="20" height="10" rx="2" fill="#ea580c" />
      <line x1="6" y1="5" x2="10" y2="15" stroke="#ffffff" stroke-width="2.5" />
      <line x1="12" y1="5" x2="16" y2="15" stroke="#ffffff" stroke-width="2.5" />
      <line x1="18" y1="5" x2="21" y2="12.5" stroke="#ffffff" stroke-width="2.5" />
      <line x1="3" y1="7.5" x2="6" y2="15" stroke="#ffffff" stroke-width="2.5" />
      <line x1="5" y1="15" x2="5" y2="20" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" />
      <line x1="19" y1="15" x2="19" y2="20" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" />
    </svg>
  `;

  const satelliteSvg = `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: flex;">
      <path d="M13 2 3 14l9 2 2 9 12-10z" fill="#38bdf8" fill-opacity="0.2" />
    </svg>
  `;

  const fullHtml = `
    <div style="display: flex; flex-direction: column; width: 800px; height: 400px; background-color: #0b1120; padding: 20px; color: #ffffff; justify-content: space-between;">
      
      <!-- Topo Header GPS -->
      <div style="display: flex; justify-content: space-between; align-items: center; background-color: #111827; border: 1px solid #1f2937; padding: 10px 18px; border-radius: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          ${satelliteSvg}
          <span style="font-size: 18px; font-weight: bold; color: #38bdf8; letter-spacing: 1px;">SISTEMA GPS DE LOGÍSTICA & ROTAS</span>
        </div>
        <div style="display: flex; background-color: #991b1b; padding: 4px 14px; border-radius: 9999px; font-size: 12px; font-weight: bold; color: #fecaca;">
          2 ROTAS BLOQUEADAS POR OBRAS
        </div>
      </div>

      <!-- Mapa Central com Origem, 3 Traçados de Vias SVG e Destino -->
      <div style="display: flex; flex: 1; align-items: center; justify-content: space-between; position: relative; padding: 0 10px;">
        
        <!-- Ponto de Origem -->
        <div style="display: flex; flex-direction: column; align-items: center; background-color: #111827; border: 2px solid #1f2937; border-radius: 12px; padding: 16px 14px; width: 110px;">
          ${truckSvg}
          <span style="font-size: 12px; font-weight: bold; color: #94a3b8; margin-top: 6px;">ORIGEM</span>
        </div>

        <!-- Canvas das 3 Rotas SVG -->
        <div style="display: flex; position: relative; width: 490px; height: 230px; align-items: center; justify-content: center;">
          <svg width="490" height="230" viewBox="0 0 490 230" style="display: flex;">
            <!-- Rota 1: Vermelha (Curva Superior) -->
            <path d="M 10 40 C 160 0, 330 0, 480 40" fill="none" stroke="#ef4444" stroke-width="10" stroke-linecap="round" />
            
            <!-- Rota 2: Azul (Linha Reta Central) -->
            <path d="M 10 115 L 480 115" fill="none" stroke="#3b82f6" stroke-width="10" stroke-linecap="round" />
            
            <!-- Rota 3: Verde (Curva Inferior) -->
            <path d="M 10 190 C 160 230, 330 230, 480 190" fill="none" stroke="#10b981" stroke-width="10" stroke-linecap="round" />
          </svg>

          <!-- Marcadores de Bloqueio com Barricada SVG -->
          ${isBlocked.vermelho ? `
            <div style="display: flex; align-items: center; gap: 6px; position: absolute; left: 190px; top: 10px; background-color: #450a0a; border: 2px solid #ef4444; padding: 4px 12px; border-radius: 9999px;">
              ${barrierSvg}
              <span style="font-size: 12px; font-weight: bold; color: #fca5a5;">BLOQUEIO</span>
            </div>
          ` : ''}

          ${isBlocked.azul ? `
            <div style="display: flex; align-items: center; gap: 6px; position: absolute; left: 190px; top: 98px; background-color: #450a0a; border: 2px solid #ef4444; padding: 4px 12px; border-radius: 9999px;">
              ${barrierSvg}
              <span style="font-size: 12px; font-weight: bold; color: #fca5a5;">BLOQUEIO</span>
            </div>
          ` : ''}

          ${isBlocked.verde ? `
            <div style="display: flex; align-items: center; gap: 6px; position: absolute; left: 190px; top: 180px; background-color: #450a0a; border: 2px solid #ef4444; padding: 4px 12px; border-radius: 9999px;">
              ${barrierSvg}
              <span style="font-size: 12px; font-weight: bold; color: #fca5a5;">BLOQUEIO</span>
            </div>
          ` : ''}
        </div>

        <!-- Ponto de Destino -->
        <div style="display: flex; flex-direction: column; align-items: center; background-color: #111827; border: 2px solid #1f2937; border-radius: 12px; padding: 16px 14px; width: 110px;">
          ${flagSvg}
          <span style="font-size: 12px; font-weight: bold; color: #94a3b8; margin-top: 6px;">DESTINO</span>
        </div>
      </div>

      <!-- Rodapé de Instrução -->
      <div style="display: flex; justify-content: center; background-color: #111827; padding: 8px; border-radius: 8px; border: 1px solid #1f2937;">
        <span style="font-size: 13px; font-weight: bold; color: #94a3b8;">
          Observe as 3 linhas (Vermelha, Azul e Verde) e clique no botão da rota que está TOTALMENTE LIVRE!
        </span>
      </div>
    </div>
  `;

  const buffer = await renderToPngBuffer(fullHtml);
  return {
    buffer,
    freeRoute,
    options: ['vermelho', 'azul', 'verde']
  };
}

/**
 * ============================================================================
 * MINIGAME 2: TAXISTA / FRENTISTA (Matemática Rápida de Troco)
 * ============================================================================
 */
async function generateReceiptMinigame() {
  const servicePrice = Math.floor(Math.random() * 55) + 25; // 25 a 79
  const paidOptions = [50, 100, 150, 200].filter(val => val > servicePrice);
  const paidAmount = paidOptions[Math.floor(Math.random() * paidOptions.length)] || (servicePrice + 30);
  const correctChange = paidAmount - servicePrice;

  const decoys = new Set();
  const offsets = [-12, -7, -4, -2, 2, 4, 7, 12, 15];
  while (decoys.size < 3) {
    const off = offsets[Math.floor(Math.random() * offsets.length)];
    const val = correctChange + off;
    if (val > 0 && val !== correctChange) decoys.add(val);
  }

  const allOptions = [correctChange, ...Array.from(decoys)].sort(() => Math.random() - 0.5);

  const receiptIconSvg = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: flex;">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
      <path d="M12 17.5v-11"/>
    </svg>
  `;

  const taxiIconSvg = `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: flex;">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.1 2 11.6 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2" fill="#ca8a04"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2" fill="#ca8a04"/>
    </svg>
  `;

  const fullHtml = `
    <div style="display: flex; width: 800px; height: 400px; background-color: #0f172a; padding: 20px; justify-content: center; align-items: center;">
      <div style="display: flex; flex-direction: column; width: 460px; background-color: #ffffff; border-radius: 12px; border: 3px dashed #64748b; padding: 24px; color: #0f172a;">
        
        <!-- Cabeçalho do Recibo -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${receiptIconSvg}
            <span style="font-size: 17px; font-weight: bold; letter-spacing: 0.5px;">CUPOM FISCAL DE ATENDIMENTO</span>
          </div>
          ${taxiIconSvg}
        </div>

        <!-- Discriminação de Valores -->
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 15px; color: #64748b;">Corrida / Serviço:</span>
            <span style="font-size: 18px; font-weight: bold; color: #0f172a;">${servicePrice} Moedas</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 15px; color: #64748b;">Cliente pagou com:</span>
            <span style="font-size: 18px; font-weight: bold; color: #16a34a;">${paidAmount} Moedas</span>
          </div>
        </div>

        <!-- Pergunta de Raciocínio -->
        <div style="display: flex; justify-content: center; background-color: #f1f5f9; padding: 12px; border-radius: 8px; border: 1px dashed #94a3b8; margin-bottom: 14px;">
          <span style="font-size: 16px; font-weight: bold; color: #2563eb; letter-spacing: 0.5px;">
            CALCULE O TROCO EXATO DO CLIENTE
          </span>
        </div>

        <!-- Código de Barras SVG Puro -->
        <div style="display: flex; justify-content: center; align-items: center; opacity: 0.75;">
          <svg width="340" height="30" viewBox="0 0 340 30" style="display: flex;">
            <rect x="10" y="0" width="4" height="30" fill="#0f172a"/>
            <rect x="20" y="0" width="8" height="30" fill="#0f172a"/>
            <rect x="34" y="0" width="2" height="30" fill="#0f172a"/>
            <rect x="42" y="0" width="6" height="30" fill="#0f172a"/>
            <rect x="54" y="0" width="10" height="30" fill="#0f172a"/>
            <rect x="70" y="0" width="3" height="30" fill="#0f172a"/>
            <rect x="80" y="0" width="6" height="30" fill="#0f172a"/>
            <rect x="92" y="0" width="4" height="30" fill="#0f172a"/>
            <rect x="104" y="0" width="8" height="30" fill="#0f172a"/>
            <rect x="120" y="0" width="2" height="30" fill="#0f172a"/>
            <rect x="130" y="0" width="10" height="30" fill="#0f172a"/>
            <rect x="146" y="0" width="4" height="30" fill="#0f172a"/>
            <rect x="176" y="0" width="8" height="30" fill="#0f172a"/>
            <rect x="200" y="0" width="6" height="30" fill="#0f172a"/>
            <rect x="212" y="0" width="10" height="30" fill="#0f172a"/>
            <rect x="238" y="0" width="8" height="30" fill="#0f172a"/>
            <rect x="262" y="0" width="6" height="30" fill="#0f172a"/>
            <rect x="274" y="0" width="8" height="30" fill="#0f172a"/>
            <rect x="296" y="0" width="10" height="30" fill="#0f172a"/>
            <rect x="312" y="0" width="4" height="30" fill="#0f172a"/>
          </svg>
        </div>
      </div>
    </div>
  `;

  const buffer = await renderToPngBuffer(fullHtml);
  return {
    buffer,
    servicePrice,
    paidAmount,
    correctChange,
    options: allOptions
  };
}

/**
 * ============================================================================
 * MINIGAME 3: MECÂNICO (Diagnóstico em 4 Quadrantes)
 * ============================================================================
 */
async function generateMechanicMinigame() {
  const problems = [
    { quadrant: 1, part: 'Bateria', text: 'O cliente reclamou que o painel elétrico não liga e as luzes apagaram totalmente.' },
    { quadrant: 1, part: 'Bateria', text: 'O cliente gira a chave no contato, mas não há faísca e a buzina não funciona.' },
    { quadrant: 2, part: 'Radiador/Água', text: 'O cliente relatou fumaça branca e cheiro de líquido doce fervendo sob o capô.' },
    { quadrant: 2, part: 'Radiador/Água', text: 'O ponteiro de temperatura disparou no vermelho e há vazamento de fluido verde.' },
    { quadrant: 3, part: 'Pneu', text: 'O cliente avisou que o volante trepida muito e o carro está puxando para a direita.' },
    { quadrant: 3, part: 'Pneu', text: 'O sensor de rodagem acusou baixa pressão e instabilidade em curvas asfaltadas.' },
    { quadrant: 4, part: 'Motor', text: 'O cliente ouviu estalos metálicos pesados no bloco, com engasgos na aceleração.' },
    { quadrant: 4, part: 'Motor', text: 'O veículo perdeu compressão em subidas e soltou fumaça de queima de óleo.' }
  ];

  const selected = problems[Math.floor(Math.random() * problems.length)];

  // Ícones SVG Vetoriais de Peças Automotivas
  const wrenchSvg = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: flex;">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  `;

  const batterySvg = `
    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: flex;">
      <rect x="2" y="7" width="16" height="12" rx="2" fill="#0284c7" fill-opacity="0.2"/>
      <path d="M22 11v4"/>
      <path d="M10 10v6"/>
      <path d="M7 13h6"/>
    </svg>
  `;

  const radiatorSvg = `
    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: flex;">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="#06b6d4" fill-opacity="0.25"/>
    </svg>
  `;

  const tireSvg = `
    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: flex;">
      <circle cx="12" cy="12" r="10" fill="#f59e0b" fill-opacity="0.15"/>
      <circle cx="12" cy="12" r="4" fill="#0f172a"/>
      <line x1="12" y1="2" x2="12" y2="8"/>
      <line x1="12" y1="16" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="8" y2="12"/>
      <line x1="16" y1="12" x2="22" y2="12"/>
    </svg>
  `;

  const engineSvg = `
    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: flex;">
      <circle cx="12" cy="12" r="3" fill="#ef4444" fill-opacity="0.2"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  `;

  const fullHtml = `
    <div style="display: flex; flex-direction: column; width: 800px; height: 400px; background-color: #0f172a; padding: 24px; color: #ffffff;">
      
      <!-- Card Superior do Chamado -->
      <div style="display: flex; flex-direction: column; background-color: #1e293b; border-radius: 10px; padding: 14px 18px; border: 1px solid #334155; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${wrenchSvg}
            <span style="font-size: 14px; font-weight: bold; color: #f59e0b; text-transform: uppercase;">
              ORDEM DE SERVIÇO AUTOMOTIVA
            </span>
          </div>
          <span style="font-size: 12px; color: #94a3b8;">Oficina Sistine</span>
        </div>
        <span style="font-size: 16px; color: #f1f5f9; font-weight: bold; line-height: 1.3;">
          "${selected.text}"
        </span>
      </div>

      <!-- 4 Quadrantes Numerados com Ícones SVG -->
      <div style="display: flex; flex: 1; gap: 14px;">
        <div style="display: flex; flex-direction: column; flex: 1; background-color: #1e293b; border-radius: 12px; border: 2px solid #334155; align-items: center; justify-content: center; padding: 12px;">
          <div style="display: flex; width: 28px; height: 28px; background-color: #3b82f6; border-radius: 9999px; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; color: #ffffff;">1</div>
          <div style="display: flex; margin: 8px 0;">${batterySvg}</div>
          <span style="font-size: 14px; color: #cbd5e1; font-weight: bold;">Bateria</span>
        </div>

        <div style="display: flex; flex-direction: column; flex: 1; background-color: #1e293b; border-radius: 12px; border: 2px solid #334155; align-items: center; justify-content: center; padding: 12px;">
          <div style="display: flex; width: 28px; height: 28px; background-color: #3b82f6; border-radius: 9999px; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; color: #ffffff;">2</div>
          <div style="display: flex; margin: 8px 0;">${radiatorSvg}</div>
          <span style="font-size: 14px; color: #cbd5e1; font-weight: bold;">Radiador/Água</span>
        </div>

        <div style="display: flex; flex-direction: column; flex: 1; background-color: #1e293b; border-radius: 12px; border: 2px solid #334155; align-items: center; justify-content: center; padding: 12px;">
          <div style="display: flex; width: 28px; height: 28px; background-color: #3b82f6; border-radius: 9999px; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; color: #ffffff;">3</div>
          <div style="display: flex; margin: 8px 0;">${tireSvg}</div>
          <span style="font-size: 14px; color: #cbd5e1; font-weight: bold;">Pneu</span>
        </div>

        <div style="display: flex; flex-direction: column; flex: 1; background-color: #1e293b; border-radius: 12px; border: 2px solid #334155; align-items: center; justify-content: center; padding: 12px;">
          <div style="display: flex; width: 28px; height: 28px; background-color: #3b82f6; border-radius: 9999px; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; color: #ffffff;">4</div>
          <div style="display: flex; margin: 8px 0;">${engineSvg}</div>
          <span style="font-size: 14px; color: #cbd5e1; font-weight: bold;">Motor</span>
        </div>
      </div>
    </div>
  `;

  const buffer = await renderToPngBuffer(fullHtml);
  return {
    buffer,
    problemText: selected.text,
    correctQuadrant: selected.quadrant,
    correctPart: selected.part
  };
}

/**
 * ============================================================================
 * MINIGAME 4: GARI (Coleta Seletiva)
 * ============================================================================
 */
async function generateTrashMinigame() {
  const wasteItems = [
    { name: 'Papel & Jornais', type: 'papel', bin: 'azul', binLabel: 'Azul (Papel)' },
    { name: 'Caixa de Papelão', type: 'papel', bin: 'azul', binLabel: 'Azul (Papel)' },
    { name: 'Copo de Plástico', type: 'plastico', bin: 'vermelha', binLabel: 'Vermelha (Plástico)' },
    { name: 'Garrafa Pet', type: 'plastico', bin: 'vermelha', binLabel: 'Vermelha (Plástico)' },
    { name: 'Garrafa de Vidro', type: 'vidro', bin: 'verde', binLabel: 'Verde (Vidro)' },
    { name: 'Pote de Conserva', type: 'vidro', bin: 'verde', binLabel: 'Verde (Vidro)' },
    { name: 'Lata de Alumínio', type: 'metal', bin: 'amarela', binLabel: 'Amarela (Metal)' },
    { name: 'Parafuso & Porca', type: 'metal', bin: 'amarela', binLabel: 'Amarela (Metal)' }
  ];

  const selected = wasteItems[Math.floor(Math.random() * wasteItems.length)];

  // Ícones SVG
  const recycleLogoSvg = `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: flex;">
      <path d="M7 19H4.81a2 2 0 0 1-1.77-1.11 2 2 0 0 1 .18-2.09L5.3 13"/>
      <path d="m11 9-3-6-3 6"/>
      <path d="M2.3 13 4 8h5"/>
      <path d="m17 19 3-6-3-6"/>
      <path d="M21.7 13 20 8h-5"/>
      <path d="m7 19 4 3 4-3"/>
      <path d="M12 22v-5"/>
    </svg>
  `;

  const binIconSvg = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: flex;">
      <path d="M3 6h18"/>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  `;

  const itemBadgeSvg = `
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: flex;">
      <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  `;

  const fullHtml = `
    <div style="display: flex; flex-direction: column; width: 800px; height: 400px; background-color: #064e3b; padding: 24px; color: #ffffff;">
      
      <!-- Header Ecológico -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #047857; padding-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          ${recycleLogoSvg}
          <span style="font-size: 20px; font-weight: bold; color: #6ee7b7; letter-spacing: 0.5px;">
            CENTRO DE TRIAGEM & COLETA SELETIVA
          </span>
        </div>
        <span style="background-color: #047857; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: bold;">
          EXPEDIENTE DE LIMPEZA
        </span>
      </div>

      <!-- Item Sorteado Central -->
      <div style="display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center;">
        <span style="font-size: 14px; color: #a7f3d0; margin-bottom: 8px; font-weight: bold; letter-spacing: 1px;">
          MATERIAL COLETADO NA VIA PÚBLICA:
        </span>
        <div style="display: flex; align-items: center; gap: 14px; background-color: #047857; padding: 10px 28px; border-radius: 9999px; border: 2px solid #10b981;">
          ${itemBadgeSvg}
          <span style="font-size: 24px; font-weight: bold; color: #ffffff;">${selected.name}</span>
        </div>
      </div>

      <!-- 4 Lixeiras Coloridas do Padrão CONAMA -->
      <div style="display: flex; gap: 14px; justify-content: space-between;">
        <div style="display: flex; flex-direction: column; flex: 1; background-color: #1d4ed8; border-radius: 10px; padding: 12px; align-items: center; border: 2px solid #60a5fa;">
          ${binIconSvg}
          <span style="font-size: 15px; font-weight: bold; color: #ffffff; margin-top: 4px;">AZUL</span>
          <span style="font-size: 12px; color: #bfdbfe; font-weight: bold;">PAPEL</span>
        </div>
        <div style="display: flex; flex-direction: column; flex: 1; background-color: #b91c1c; border-radius: 10px; padding: 12px; align-items: center; border: 2px solid #f87171;">
          ${binIconSvg}
          <span style="font-size: 15px; font-weight: bold; color: #ffffff; margin-top: 4px;">VERMELHA</span>
          <span style="font-size: 12px; color: #fecaca; font-weight: bold;">PLÁSTICO</span>
        </div>
        <div style="display: flex; flex-direction: column; flex: 1; background-color: #15803d; border-radius: 10px; padding: 12px; align-items: center; border: 2px solid #4ade80;">
          ${binIconSvg}
          <span style="font-size: 15px; font-weight: bold; color: #ffffff; margin-top: 4px;">VERDE</span>
          <span style="font-size: 12px; color: #bbf7d0; font-weight: bold;">VIDRO</span>
        </div>
        <div style="display: flex; flex-direction: column; flex: 1; background-color: #ca8a04; border-radius: 10px; padding: 12px; align-items: center; border: 2px solid #facc15;">
          ${binIconSvg}
          <span style="font-size: 15px; font-weight: bold; color: #ffffff; margin-top: 4px;">AMARELA</span>
          <span style="font-size: 12px; color: #fef08a; font-weight: bold;">METAL</span>
        </div>
      </div>
    </div>
  `;

  const buffer = await renderToPngBuffer(fullHtml);
  return {
    buffer,
    wasteName: selected.name,
    correctBin: selected.bin,
    correctBinLabel: selected.binLabel
  };
}

module.exports = {
  renderToPngBuffer,
  generateRouteMinigame,
  generateReceiptMinigame,
  generateMechanicMinigame,
  generateTrashMinigame
};
