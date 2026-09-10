const { ActivityType } = require("discord.js");
const client = require("../../index.js");
const firebase = require("firebase");
const database = firebase.database();
const cron = require('node-cron');

// Variáveis persistentes fora da função para lembrar o último status exibido de verdade
let previousRandomMensagem = '';
let previousRandomActivity = '';

client.on('clientReady', async () => {
  iniciarRotinaDeLimpeza();
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

  // Fallbacks locais caso não esteja configurado no Firebase
  const statusList = statusData.RandomStatus || [
    `${client.guilds.cache.size} servidores`,
    `${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)} usuários`,
    'Me convide para o seu servidor!',
  ];

  const typeList = statusData.Type || [ActivityType.Watching, ActivityType.Streaming, ActivityType.Playing];
  const presenceList = statusData.Status || ['online', 'dnd', 'idle'];

  let chosenMensagem = '';
  let chosenActivity = '';

  // Garante que o status mude e não se repita (se houver mais de 1 item na lista)
  if (statusList.length > 1) {
    do {
      chosenMensagem = statusList[Math.floor(Math.random() * statusList.length)];
    } while (chosenMensagem === previousRandomMensagem);
  } else {
    chosenMensagem = statusList[0] || '/help';
  }
  previousRandomMensagem = chosenMensagem;

  if (typeList.length > 1) {
    do {
      chosenActivity = typeList[Math.floor(Math.random() * typeList.length)];
    } while (chosenActivity === previousRandomActivity);
  } else {
    chosenActivity = typeList[0] || ActivityType.Custom;
  }
  previousRandomActivity = chosenActivity;

  // Seleciona um status de presença (online, dnd, idle) aleatório
  const chosenPresence = presenceList[Math.floor(Math.random() * presenceList.length)] || 'online';

  // CORREÇÃO: Aplica a atividade e o status de presença de forma correta e dinâmica
  client.user.setPresence({
    activities: [{ name: chosenMensagem, type: chosenActivity }],
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