const client = require("../../index.js"); // Adapte para o caminho do seu index
const firebase = require("firebase");
const database = firebase.database();

// =======================================================
// EVENTO: CARGO AUTOMÁTICO (AUTOROLE)
// =======================================================
client.on('guildMemberAdd', async (member) => {
  try {
    // 1. Puxa as configurações do Autorole do banco de dados
    const dbSnap = await database.ref(`servers/${member.guild.id}/autorole`).once('value');
    const config = dbSnap.val();

    // 2. Verifica se o módulo existe e está ativado
    if (!config || config.status === false) return;

    // 3. Define qual lista de cargos usar (Verifica se quem entrou é um BOT ou um HUMANO)
    const rolesToAssign = member.user.bot ? (config.botRoles || []) : (config.roles || []);

    // Se a lista escolhida estiver vazia, encerra a função
    if (rolesToAssign.length === 0) return;

    // 4. Função interna que realmente aplica os cargos
    const applyRoles = async () => {
      try {
        // O Discord.js aceita uma array de IDs de cargos de uma só vez!
        await member.roles.add(rolesToAssign, 'Autorole: Sistema de Cargo Automático do Painel');
      } catch (err) {
        // Esse erro geralmente ocorre se o bot tentar dar um cargo mais alto que o dele
        console.error(`[AUTOROLE] Sem permissão/Hierarquia para dar os cargos em ${member.guild.name}:`, err.message);
      }
    };

    // 5. Verifica se há um tempo de espera (Delay) configurado
    const delayInSeconds = Number(config.delay) || 0;

    if (delayInSeconds > 0) {
      // Se tiver delay, agenda a execução para o futuro (convertendo os segundos do painel em milissegundos)
      setTimeout(() => {
        // Antes de dar o cargo no futuro, verifica se o usuário ainda está no servidor!
        if (member.guild.members.cache.has(member.id)) {
          applyRoles();
        }
      }, delayInSeconds * 1000);
    } else {
      // Se o delay for 0, entrega instantaneamente
      applyRoles();
    }

  } catch (error) { 
    console.error("[AUTOROLE] Erro geral no sistema:", error); 
  }
});