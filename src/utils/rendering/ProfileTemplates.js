// layouts.js (ou dentro do seu config)
module.exports = {
    // Layout 1: O Padrão Clássico (similar ao que você já tem)
    "classic": {
        id: "classic",
        nome: "Padrão Clássico",
        overlay: "https://link-do-seu-layout-vazio-com-bordas.png", 
        avatar: { x: 125, y: 125, radius: 100 },
        textos: {
            username: { x: 200, y: 50, font: 'bold 35px Noto Sans CJK JP', color: '#FFFFFF', align: 'left' },
            carteira: { x: 244, y: 110, font: '30px Noto Sans CJK JP', color: '#FFFFFF', align: 'left', prefix: 'Carteira: ' },
            banco: { x: 244, y: 140, font: '30px Noto Sans CJK JP', color: '#FFFFFF', align: 'left', prefix: 'Banco: ' },
            reputacao: { x: 895, y: 140, font: '40px Noto Sans CJK JP', color: '#FFFFFF', align: 'left', suffix: ' reputações' },
            sobremim: { x: 20, y: 638, font: 'bold 26px Noto Sans CJK JP', color: '#FFFFFF', align: 'left' }
        },
        badges: { startX: 93, startY: 542, spacing: 55, size: 47 }
    },

    // Layout 2: Centralizado (Exemplo de um padrão diferente)
    "premium_center": {
        id: "premium_center",
        nome: "Premium Centralizado",
        overlay: "https://link-de-outro-layout-vazado.png",
        avatar: { x: 600, y: 200, radius: 120 }, // Avatar no meio da tela
        textos: {
            username: { x: 600, y: 360, font: 'bold 45px Noto Sans CJK JP', color: '#FFD700', align: 'center' },
            carteira: { x: 450, y: 420, font: '30px Noto Sans CJK JP', color: '#FFFFFF', align: 'center', prefix: '💵 ' },
            banco: { x: 750, y: 420, font: '30px Noto Sans CJK JP', color: '#FFFFFF', align: 'center', prefix: '🏦 ' },
            reputacao: { x: 600, y: 480, font: '35px Noto Sans CJK JP', color: '#FFFFFF', align: 'center', suffix: ' Reps' },
            sobremim: { x: 600, y: 600, font: '26px Noto Sans CJK JP', color: '#CCCCCC', align: 'center' }
        },
        badges: { startX: 350, startY: 500, spacing: 60, size: 50 }
    }
};