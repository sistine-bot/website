const { ActivityType } = require("discord.js");
const client = require("../../index.js");
const firebase = require("firebase");
const database = firebase.database();
const cron = require('node-cron');

// Variáveis persistentes fora da função para lembrar o último status exibido de verdade
let previousRandomMensagem = '';

client.on('clientReady', async () => {
  iniciarRotinaDeLimpeza();
  iniciarImpostoCasamento();
  await updateStatus();

  // Define o intervalo para atualizar o status a cada 1 minuto (60000ms)
  setInterval(async () => {
    await updateStatus().catch(err => console.error("Erro ao atualizar status:", err));
  }, 60000);

  // Cálculo real de usuários somando todos os servidores
  const totalUsuarios = client.guilds.cache.reduce((a, b) => a + b.memberCount, 0);

  console.warn(`[CLIENT] - ${client.user.username} (${client.user.id})
[INFOS] - ${client.guilds.cache.size} servidores | ${totalUsuarios} usuários reais

  > https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`);
});

async function updateStatus() {
  // OTIMIZAÇÃO: Busca o nó inteiro uma única vez no banco de dados
  const snapshot = await database.ref(`Administração/Status/`).once('value');
  const statusData = snapshot.val() || {};

  const totalServidores = client.guilds.cache.size;
  const totalUsuarios = client.guilds.cache.reduce((a, b) => a + (b.memberCount || 0), 0);

  // Lista padrão de mensagens simples, alinhadas à vibe do bot e novidades recentes
  const defaultActivities = [
    // 🌾 Novidades Recentes (Fazenda & Plantação)
    { name: '🌾 Cuidando da fazenda | /fazenda', type: ActivityType.Custom },
    { name: '🥕 Colhendo a plantação | /plantacao', type: ActivityType.Custom },
    { name: '🌱 Regando as mudas na /plantacao', type: ActivityType.Custom },
    { name: '🐔 Alimentando os animais na /fazenda', type: ActivityType.Custom },

    // 📈 Novidades Recentes (Níveis, XP & Recuperar)
    { name: '📈 Subindo de nível | /nivel', type: ActivityType.Custom },
    { name: '⭐ Ganhando XP nas conversas | /nivel', type: ActivityType.Custom },
    { name: '🛡️ Protegendo contas | /recuperar', type: ActivityType.Custom },

    // 💼 Economia & Trabalho
    { name: '💼 Trabalhando duro | /trabalhar', type: ActivityType.Custom },
    { name: '💰 Resgatando recompensas no /daily', type: ActivityType.Custom },
    { name: '🏪 Negociando itens no /market', type: ActivityType.Custom },
    { name: '🎒 Organizando a mochila | /inventario', type: ActivityType.Custom },
    { name: '🎣 Pescando e caçando | /pescar', type: ActivityType.Custom },

    // 🎰 Jogos, Cassino & Apostas
    { name: '🎰 Apostando fichas | /apostar', type: ActivityType.Custom },
    { name: '🎟️ Raspando a sorte | /raspadinha', type: ActivityType.Custom },
    { name: 'Blackjack no cassino', type: ActivityType.Playing },
    { name: 'corrida de cavalos | /corrida', type: ActivityType.Competing },

    // 💍 Social, Casamento & Relacionamentos
    { name: '💍 Celebrando casamentos | /casamento', type: ActivityType.Custom },
    { name: '💖 Namorando no servidor | /namorar', type: ActivityType.Custom },
    { name: '⭐ Enviando reputações | /reputacao', type: ActivityType.Custom },
    { name: '🎨 Personalizando perfil com /perfil', type: ActivityType.Custom },

    // 📌 Ajuda & Comandos
    { name: '✨ Use /help para ver meus comandos', type: ActivityType.Custom },
    { name: '/help para ver meus comandos', type: ActivityType.Listening },
    { name: 'suas mensagens e comandos', type: ActivityType.Listening },
    { name: 'Sistine Bot | /help', type: ActivityType.Playing },

    // 📊 Estatísticas
    { name: `${totalServidores.toLocaleString('pt-BR')} servidores incríveis`, type: ActivityType.Watching },
    { name: `${totalUsuarios.toLocaleString('pt-BR')} usuários pelo Discord`, type: ActivityType.Watching },
    { name: 'o ranking global no /top', type: ActivityType.Watching },
    { name: 'pelo topo do /top', type: ActivityType.Competing },
  ];

  // Caso haja lista personalizada no Firebase, utiliza e substitui variáveis dinâmicas
  let activityList = [];
  if (Array.isArray(statusData.RandomStatus) && statusData.RandomStatus.length > 0) {
    activityList = statusData.RandomStatus.map(item => {
      if (typeof item === 'string') {
        const text = item
          .replace(/{servers}/g, totalServidores.toLocaleString('pt-BR'))
          .replace(/{users}/g, totalUsuarios.toLocaleString('pt-BR'));
        return { name: text };
      }
      return item;
    });
  } else {
    activityList = defaultActivities;
  }

  // Garante que a atividade mude e não se repita consecutivamente
  let selected = null;
  if (activityList.length > 1) {
    do {
      selected = activityList[Math.floor(Math.random() * activityList.length)];
    } while (selected.name === previousRandomMensagem);
  } else {
    selected = activityList[0] || { name: '/help', type: ActivityType.Playing };
  }
  previousRandomMensagem = selected.name;

  // Determina o tipo de atividade
  let chosenType = selected.type;
  if (chosenType === undefined) {
    const typeList = statusData.Type || [ActivityType.Watching, ActivityType.Playing, ActivityType.Custom];
    chosenType = typeList[Math.floor(Math.random() * typeList.length)] ?? ActivityType.Custom;
  }

  const activityPayload = {
    name: selected.name,
    type: chosenType,
  };

  if (chosenType === ActivityType.Custom) {
    activityPayload.state = selected.name;
  } else if (chosenType === ActivityType.Streaming) {
    activityPayload.url = selected.url || statusData.StreamUrl || 'https://www.twitch.tv/discord';
  }

  // Seleciona o status de presença (online, dnd, idle)
  const presenceList = statusData.Status || ['online', 'dnd', 'idle'];
  const chosenPresence = presenceList[Math.floor(Math.random() * presenceList.length)] || 'online';

  // Aplica a atividade e o status de presença de forma correta e dinâmica
  client.user.setPresence({
    activities: [activityPayload],
    status: chosenPresence
  });
}

function iniciarRotinaDeLimpeza() {
    // "0 0 * * *" significa: Rodar todos os dias à meia-noite (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log("[DB CLEANUP] Iniciando verificação de servidores inativos...");
        
        try {
            // Calcula quanto é 30 dias em milissegundos
            const TRINTA_DIAS_EM_MS = 30 * 24 * 60 * 60 * 1000;
            const tempoAtual = Date.now();

            // Puxa todos os servidores do banco de dados
            const snapshot = await database.ref('servers').once('value');
            const servidores = snapshot.val();

            if (!servidores) return;

            let apagados = 0;

            // Percorre servidor por servidor no banco
            for (const [guildId, data] of Object.entries(servidores)) {
                // Verifica se existe a propriedade 'leftAt' e se a diferença de tempo é maior que 30 dias
                if (data.leftAt && (tempoAtual - data.leftAt > TRINTA_DIAS_EM_MS)) {
                    
                    // Remove TUDO deste servidor do banco de dados
                    await database.ref(`servers/${guildId}`).remove();
                    apagados++;
                    console.log(`[DB CLEANUP] Servidor ${guildId} deletado com sucesso (Mais de 30 dias).`);
                }
            }

            console.log(`[DB CLEANUP] Verificação concluída. ${apagados} servidores removidos.`);

        } catch (error) {
            console.error("[DB CLEANUP] Erro durante a limpeza:", error);
        }
    });
}

function iniciarImpostoCasamento() {
    // "0 0 * * 0" significa: Rodar todos os domingos à meia-noite (00:00)
    cron.schedule('0 0 * * 0', async () => {
        console.log("[IMPOSTO CASAMENTO] Iniciando cobrança do imposto matrimonial semanal...");
        try {
            const snapshot = await database.ref('economia').once('value');
            const economiaData = snapshot.val();
            if (!economiaData) return;

            let totalCobrados = 0;
            let totalArrecadado = 0;

            for (const [userId, uData] of Object.entries(economiaData)) {
                if (!uData || !uData.Casamento || !uData.Casamento.casado) continue;

                // Verificação de VIP
                const vipData = uData.vip || {};
                const vipLevel = Number(vipData.vip || 0);
                const vipTempo = Number(vipData.tempo || 0);
                const vipDataTime = Number(vipData.data || 0);
                const isVipAtivo = (vipDataTime !== 0 && (vipTempo - (Date.now() - vipDataTime)) > 0);
                const isCreator = client.config?.cargos?.criador?.includes(userId);

                // VIP Gold/Diamante (Level >= 2) ou Criador = ISENTO (0 moedas)
                if (isCreator || (isVipAtivo && vipLevel >= 2)) {
                    continue;
                }

                // VIP Prata (Level 1) = 400 moedas; Usuário comum = 1.200 moedas
                const imposto = (isVipAtivo && vipLevel === 1) ? 400 : 1200;

                const carteira = Number(uData.saldo?.carteira || 0);
                const banco = Number(uData.saldo?.banco || 0);

                let debitadoBanco = 0;
                let debitadoCarteira = 0;

                if (banco >= imposto) {
                    debitadoBanco = imposto;
                } else {
                    debitadoBanco = Math.max(0, banco);
                    const restante = imposto - debitadoBanco;
                    debitadoCarteira = Math.min(carteira, restante);
                }

                const totalDebitado = debitadoBanco + debitadoCarteira;
                if (totalDebitado > 0) {
                    const novoBanco = Math.max(0, banco - debitadoBanco);
                    const novaCarteira = Math.max(0, carteira - debitadoCarteira);

                    await database.ref(`economia/${userId}/saldo`).update({
                        banco: novoBanco,
                        carteira: novaCarteira
                    });

                    const { recordTransaction } = require('../utils/functions.js');
                    await recordTransaction(null, userId, {
                        type: 'imposto_casamento',
                        amount: totalDebitado
                    });

                    totalCobrados++;
                    totalArrecadado += totalDebitado;
                }
            }

            console.log(`[IMPOSTO CASAMENTO] Cobrança concluída: ${totalCobrados} casados tributados. Total arrecadado: ${totalArrecadado} moedas.`);
        } catch (error) {
            console.error("[IMPOSTO CASAMENTO] Erro na rotina semanal:", error);
        }
    });
}

client.on('guildDelete', async (guild) => {
    try {
        // Pega o momento atual em milissegundos
        const tempoSaida = Date.now(); 
        
        // Salva no banco de dados na configuração deste servidor
        await database.ref(`servers/${guild.id}/leftAt`).set(tempoSaida);
        
        console.log(`Bot removido do servidor ${guild.name} (${guild.id}). Início da contagem de 30 dias.`);
    } catch (error) {
        console.error("Erro ao registrar a saída do servidor:", error);
    }
});
client.on('guildCreate', async (guild) => {
    try {
        // Remove a marcação de saída do banco de dados, se existir
        await database.ref(`servers/${guild.id}/leftAt`).remove();
        
        console.log(`Bot entrou no servidor ${guild.name} (${guild.id}). Exclusão agendada cancelada.`);
    } catch (error) {
        console.error("Erro ao remover o agendamento de exclusão:", error);
    }
});