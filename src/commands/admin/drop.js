const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const { CheckUserBlacklisted, Format, getUserInventory, UpdateMoneyWallet, getUser } = require('../../utils/functions.js');

module.exports = {
    name: "drop",
    aliases: ["airdrop"],

    run: async (client, message, args, prefixo, color, database, emoji) => {

        try {

            if (!(client.config.cargos.criador).includes(message.author.id)) {
                return;
            }

            const ImagemDrop = 'https://i.redd.it/sesjas1u9pz41.jpg';

            const participantes = [];

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('participar')
                    .setLabel('Coletar')
                    .setEmoji('📦')
                    .setStyle(ButtonStyle.Secondary)
            );

            const msg = await message.channel.send({
                content: `**Um airdrop comum apareceu**

> Para ter a chance de pegar clique em: **Coletar**.`,
                files: [ImagemDrop],
                components: [row]
            });

            const coletor = msg.createMessageComponentCollector({
                time: 15 * 1000
            });

            coletor.on('collect', async (interaction) => {

                if (interaction.customId !== 'participar') return;

                await interaction.deferUpdate();

                const blacklist = await CheckUserBlacklisted(interaction.user);

                if (blacklist?.blacklisted) {
                    return;
                }
                
                if (participantes.includes(interaction.user.id)) {
                    return;
                }

                participantes.push(interaction.user.id);

                await msg.edit({
                    content: `**Um airdrop comum apareceu**

> Para ter a chance de pegar clique em: **Coletar**.

> Participantes:
${participantes.map((p, i) => `\`${i + 1}.\` <@${p}>`).join('\n')}`,
                    files: [ImagemDrop],
                    components: [row]
                });
            });

            coletor.on('end', async () => {

                try {

                    const rowDisabled = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('participar')
                            .setLabel('Coletar')
                            .setEmoji('📦')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    );

                    await msg.edit({
                        components: [rowDisabled]
                    });

                    if (participantes.length < 1) {
                        return message.channel.send(
                            '😢 **|** O baú foi ignorado! Ninguém tentou participar e foi cancelado.'
                        );
                    }

                    const ganhadorID =
                        participantes[Math.floor(Math.random() * participantes.length)];
                    const ganhador = message.guild.members.cache.get(ganhadorID)

                    const premio = Math.floor(Math.random() * 7) + 1;
                    
                    const inventario = await getUserInventory(ganhadorID);
                    let mensagemWin = "";

                    // Dinheiro
                    if (premio === 1) {
                        const quantia = Math.floor(Math.random() * 15000) + 230;

                        mensagemWin = `💵 \`${Format(quantia)}\``;
                        
                        await UpdateMoneyWallet(message, ganhador.user, '+', quantia, `{emoji.entrada} {mensagem.airdrop} | ${quantia}`);

                    } else {

                        const premios = {
                            2: {
                                item: "carne",
                                nome: "carne",
                                quantidade: () => Math.floor(Math.random() * 5) + 1
                            },
                            3: {
                                item: "peixe",
                                nome: "peixe",
                                quantidade: () => Math.floor(Math.random() * 5) + 1
                            },
                            4: {
                                item: "munição",
                                nome: "munições",
                                quantidade: () => Math.floor(Math.random() * 20) + 5
                            },
                            5: {
                                item: "Trigo",
                                nome: "Trigos",
                                quantidade: () => Math.floor(Math.random() * 31) + 10
                            },
                            6: {
                                item: "Milho",
                                nome: "Milhos",
                                quantidade: () => Math.floor(Math.random() * 16) + 10
                            },
                            7: {
                                item: "Feijão",
                                nome: "Feijões",
                                quantidade: () => Math.floor(Math.random() * 8) + 5
                            }
                        };
                        
                        const drops = { 
                            Trigo: Math.floor(Math.random() * 31) + 10,// 10-40 
                            Milho: Math.floor(Math.random() * 16) + 10, // 10-25
                            Feijão: Math.floor(Math.random() * 8) + 5, // 5-12
                            CanaDeAçucar: Math.floor(Math.random() * 5) + 4, // 4-8 
                            Cenoura: Math.floor(Math.random() * 4) + 3, // 3-6
                            Abóbora: Math.floor(Math.random() * 2) + 2, // 2-3 
                        };

                        const premioInfo = premios[premio];
                        
                        if (premioInfo) {
                            const quantia = drops[premioInfo.item];

                            if (typeof quantia !== 'number') {
                                console.log('Item sem quantidade configurada:', premioInfo.item);
                                return;
                            }

                            await database
                                .ref(`/economia/${ganhadorID}/inventario/itens/Consumíveis`)
                                .update({
                                    [premioInfo.item]: (inventario[premioInfo.item] || 0) + quantia,
                                });

                            mensagemWin = `\`${Format(quantia)}\` ${premioInfo.nome}`;
                        }
                    }


                    return message.channel.send(
                        `🎉 **|** Parabéns <@${ganhadorID}>!\n\nVocê recebeu: ${mensagemWin}`
                    );

                } catch (err) {
                    console.error(err);
                }
            });

        } catch (error) {
            console.error(error);

            if (message.error) {
                return message.error();
            }
        }
    }
};