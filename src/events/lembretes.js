const client = require("../../index.js");
const firebase = require("firebase");
const database = firebase.database();

client.on('clientReady', () => {
    console.log(`🤖 ${client.user.username} online! Iniciando sistema de lembretes...`);

    // 1. ISOLAMOS A FUNÇÃO DE CHECAGEM
    async function checarLembretes() {
        try {
            const snapshot = await database.ref('servidores').once('value');
            if (!snapshot.exists()) return;

            const agora = Date.now();

            snapshot.forEach((userSnap) => {
                const userId = userSnap.key;
                const lembretes = userSnap.val().Lembretes;

                if (lembretes) {
                    Object.keys(lembretes).forEach(async (idLembrete) => {
                        const dados = lembretes[idLembrete];
                        
                        if (dados && dados.data && dados.tempo) {
                            const tempoEntrega = dados.data + dados.tempo;

                            if (agora >= tempoEntrega) {
                                const canal = client.channels.cache.get(dados.canal) 
                                    || await client.channels.fetch(dados.canal).catch(() => null);

                                if (canal) {
                                    canal.send(`⏰ **|** <@${userId}>, você me pediu para te lembrar: \`${dados.mensagem}\``).catch(() => {});
                                } else {
                                    const usuario = await client.users.fetch(userId).catch(() => null);
                                    if (usuario) usuario.send(`⏰ **|** Lembrete: \`${dados.mensagem}\` (O canal original não foi encontrado).`).catch(() => {});
                                }

                                await database.ref(`servidores/${userId}/Lembretes/${idLembrete}`).remove();
                            }
                        }
                    });
                }
            });
        } catch (error) {
            console.error("Erro no sistema global de checagem de lembretes:", error);
        }
    }

    checarLembretes();
    setInterval(checarLembretes, 15000); 
});