const client = require("../../index");
const {
  TextInputStyle,
  ButtonStyle,
  Intents,
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  EmbedBuilder,
  SelectMenuBuilder
} = require('discord.js');

const firebase = require("firebase");
const database = firebase.database();

const emoji = require("../../src/utils/emoji.js")

client.on('interactionCreate', async (interaction) => {
  
  if (interaction.isChannelSelectMenu()) {
    // Modais do market
    
    //let valor = collected.values[0]
    if (['peixe'].includes(interaction.values[0])) {
      
      const modal = new ModalBuilder()
      .setCustomId('selectmarket_quantidade')
      .setTitle('Selecione a quantidade')
      
      const background_input = new TextInputBuilder()
      .setCustomId('market-input')
      .setLabel('Digite a quantidade de itens que deseja vender')
      .setStyle(TextInputStyle.Short)
      .setMinLength(1)
      .setMaxLength(1000)
      .setPlaceholder('Digite um número')
      .setRequired(true);
      
		  const secondActionRow = new ActionRowBuilder().addComponents(background_input);
      
      modal.addComponents(secondActionRow);
      
      await interaction.showModal(modal);
      
    }
  }
  
  if (interaction.isButton()) {
    
    // Modais do perfil
    if (interaction.customId === 'edit-profile-Sobremim') {
      
      const modal = new ModalBuilder()
      .setCustomId('editprofile-modal-sobremim')
      .setTitle('Edite seu perfil')
      
      const sobremim_input = new TextInputBuilder()
      .setCustomId('sobremim-input')
      .setLabel('Altere a mensagem de seu sobre mim')
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(1)
      .setMaxLength(200)
      .setPlaceholder('Sou uma linda borboleta')
      .setRequired(false);
      
      const firstActionRow = new ActionRowBuilder().addComponents(sobremim_input);
      
      modal.addComponents(firstActionRow);
      
      await interaction.showModal(modal);
    }
    
    if (interaction.customId === 'edit-profile-background') {
      
      const modal = new ModalBuilder()
      .setCustomId('editprofile-modal-background')
      .setTitle('Edite seu perfil')
      
      const background_input = new TextInputBuilder()
      .setCustomId('background-input')
      .setLabel('Envie o link para alterar seu background')
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(8)
      .setMaxLength(4000)
      .setPlaceholder('https://...')
      .setRequired(false);
      
		  const secondActionRow = new ActionRowBuilder().addComponents(background_input);
      
      modal.addComponents(secondActionRow);
      
      await interaction.showModal(modal);
    }
    
    if (interaction.customId === 'edit-profile-layout') {
      
      return database.ref(`/economia/${interaction.user.id}/Perfil/Layouts`).once('value').then(async function(snapshot) {
        let tema_azul = (snapshot.val() && snapshot.val().tema_azul);
        if (tema_azul === undefined || tema_azul === null) tema_azul = 1;

        let tema_azul_log = (snapshot.val() && snapshot.val().tema_azul_log);
        if (tema_azul_log === undefined || tema_azul_log === null) tema_azul_log = 0;

        let AtivadoAzul = false;

        ///////////////////////////////////////////////////////////////////////////

        let tema_branco = (snapshot.val() && snapshot.val().tema_branco);
        if (tema_branco === undefined || tema_branco === null) tema_branco = 0;

        let tema_branco_log = (snapshot.val() && snapshot.val().tema_branco_log);
        if (tema_branco_log === undefined || tema_branco_log === null) tema_branco_log = 0;

        let AtivadoBranco;
        if (tema_branco > 0) AtivadoBranco = false;
        else if (tema_branco < 1) AtivadoBranco = true;

        ///////////////////////////////////////////////////////////////////////////

        let tema_laranja = (snapshot.val() && snapshot.val().tema_laranja);
        if (tema_laranja === undefined || tema_laranja === null) tema_laranja = 0;

        let tema_laranja_log = (snapshot.val() && snapshot.val().tema_laranja_log);
        if (tema_laranja_log === undefined || tema_laranja_log === null) tema_laranja_log = 0;

        let AtivadoLaranja;
        if (tema_laranja > 0) AtivadoLaranja = false;
        else if (tema_laranja < 1) AtivadoLaranja = true

        ////////////////////////////////////////////////////////////////////////////////////

        let tema_preto = (snapshot.val() && snapshot.val().tema_preto);
        if (tema_preto === undefined || tema_preto === null) tema_preto = 0;

        let tema_preto_log = (snapshot.val() && snapshot.val().tema_preto_log);
        if (tema_preto_log === undefined || tema_preto_log === null) tema_preto_log = 0;

        let AtivadoPreto;
        if (tema_preto > 0) AtivadoPreto = false;
        else if (tema_preto < 1) AtivadoPreto = true;

        ////////////////////////////////////////////////////////////////////////////////////

        let tema_verde = (snapshot.val() && snapshot.val().tema_verde);
        if (tema_verde === undefined || tema_verde === null) tema_verde = 0;

        let tema_verde_log = (snapshot.val() && snapshot.val().tema_verde_log);
        if (tema_verde_log === undefined || tema_verde_log === null) tema_verde_log = 0;

        let AtivadoVerde;
        if (tema_verde > 0) AtivadoVerde = false;
        else if (tema_verde < 1) AtivadoVerde = true;

        ////////////////////////////////////////////////////////////////////////////////////

        let tema_vermelho = (snapshot.val() && snapshot.val().tema_vermelho);
        if (tema_vermelho === undefined || tema_vermelho === null) tema_vermelho = 0;

        let tema_vermelho_log = (snapshot.val() && snapshot.val().tema_vermelho_log);
        if (tema_vermelho_log === undefined || tema_vermelho_log === null) tema_vermelho_log = 0;

        let AtivadoVermelho
        if (tema_vermelho > 0) AtivadoVermelho = false;
        else if (tema_vermelho < 1) AtivadoVermelho = true;

        ////////////////////////////////////////////////////////////////////////////////////

        let tema_roxo = (snapshot.val() && snapshot.val().tema_roxo);
        if (tema_roxo === undefined || tema_roxo === null) tema_roxo = 0;

        let tema_roxo_log = (snapshot.val() && snapshot.val().tema_roxo_log);
        if (tema_roxo_log === undefined || tema_roxo_log === null) tema_roxo_log = 0;

        let AtivadoRoxo
        if (tema_roxo > 0) AtivadoRoxo = false;
        else if (tema_roxo < 1) AtivadoRoxo = true;
        
        /*let row = new ActionRowBuilder().addComponents( new SelectMenuBuilder()
        .setCustomId('menu')
        .setPlaceholder('Escolha qual o tema de seu perfil') // Mensagem estampada
        .addOptions([
          {
            label: `${emoji[1]} - Tema Azul`,
            description: 'Tema da cor Azul',
            emoji: emoji[1],
            value: 'layout_azul',
          },
          {
            label: `${AtivadoBranco ? '🔒' : emoji[2]} - Tema Branco`,
            description: 'Tema da cor Branca',
            emoji: AtivadoBranco ? '🔒' : emoji[2],
            value: 'layout_branco',
          },
          {
            label: `${AtivadoLaranja ? '🔒' : emoji[3]} - Tema Laranja`,
            description: 'Tema da cor Laranja',
            emoji: AtivadoLaranja ? '🔒' : emoji[3],
            value: 'layout_laranja',
          },
          {
            label: `${AtivadoPreto ? '🔒' : emoji[4]} - Tema Preto`,
            description: 'Tema da cor Preta',
            emoji: AtivadoPreto ? '🔒' : emoji[4],
            value: 'layout_preto',
          },
          {
            label: `${AtivadoVerde ? '🔒' : emoji[5]} - Tema Verde`,
            description: 'Tema da cor Verde',
            emoji: AtivadoVerde ? '🔒' : emoji[5],
            value: 'layout_verde',
          },
          {
            label: `${AtivadoVermelho ? '🔒' : emoji[6]} - Tema Vermelho`,
            description: 'Tema da cor Vermelho',
            emoji: AtivadoVermelho ? '🔒' : emoji[6],
            value: 'layout_vermelho',
          },
          {
            label: `${AtivadoRoxo ? '🔒' : emoji[7]} - Tema Roxo`,
            description: 'Tema da cor Roxo',
            emoji: AtivadoRoxo ? '🔒' : emoji[7],
            value: 'layout_roxo',
          },
        ]));*/
        
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("layout_azul").setStyle(ButtonStyle.Secondary).setEmoji(emoji[1]) .setDisabled(AtivadoAzul),

          new ButtonBuilder().setCustomId("layout_branco").setStyle(ButtonStyle.Secondary).setEmoji(AtivadoBranco ? '🔒' : emoji[2]).setDisabled(AtivadoBranco),

          new ButtonBuilder().setCustomId("layout_laranja").setStyle(ButtonStyle.Secondary).setEmoji(AtivadoLaranja ? '🔒' : emoji[3]).setDisabled(AtivadoLaranja),

          new ButtonBuilder().setCustomId("layout_preto").setStyle(ButtonStyle.Secondary).setEmoji(AtivadoPreto ? '🔒' : emoji[4]).setDisabled(AtivadoPreto),

        )

        const row2 = new ActionRowBuilder().addComponents(

          new ButtonBuilder().setCustomId("layout_verde").setStyle(ButtonStyle.Secondary).setEmoji(AtivadoVerde ? '🔒' : emoji[5]).setDisabled(AtivadoVerde),

          new ButtonBuilder().setCustomId("layout_vermelho").setStyle(ButtonStyle.Secondary).setEmoji(AtivadoVermelho ? '🔒' : emoji[6]).setDisabled(AtivadoVermelho),

          new ButtonBuilder().setCustomId("layout_roxo").setStyle(ButtonStyle.Secondary).setEmoji(AtivadoRoxo ? '🔒' : emoji[7]).setDisabled(AtivadoRoxo), 
        )

        const embed = new EmbedBuilder()
        .setAuthor({ name: `${client.user.username}・Perfil Inventário`, iconURL: client.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
        .setDescription(`${emoji[1]} ${tema_azul_log ? `✅ | Layout Blue - **Desativar**` : "❌ Layout Blue - **Ativar**"}\n` +
  `${emoji[2]} ${tema_branco ? `${tema_branco_log ? `✅ | Layout White - **Desativar**` : "❌ Layout White - **Ativar**"}\n` : `🔒 | Comprar Layout White\n`}` + 
  `${emoji[3]} ${tema_laranja ? `${tema_laranja_log ? `✅ | Layout Orange - **Desativar**` : "❌ Layout Orange - **Ativar**"}\n` : "🔒 | Comprar Layout Orange\n"}` + 
  `${emoji[4]} ${tema_preto ? `${tema_preto_log ? `✅ | Layout Black - **Desativar**` : "❌ Layout Black - **Ativar**"}\n` : "🔒 | Comprar Layout Black\n"}` + 
  `${emoji[5]} ${tema_verde ? `${tema_verde_log ? `✅ | Layout Green - **Desativar**` : "❌ Layout Green - **Ativar**"}\n` : "🔒 | Comprar Layout Green\n"}` + 
  `${emoji[6]} ${tema_vermelho ? `${tema_vermelho_log ? `✅ | Layout Red - **Desativar**` : "❌ Layout Red - **Ativar**"}\n` : "🔒 | Comprar Layout Red\n"}` + 
  `${emoji[7]} ${tema_roxo ? `${tema_roxo_log ? `✅ | Layout Purple - **Desativar**` : "❌ Layout Purple - **Ativar**"}\n` : "🔒 | Comprar Layout Purple\n"}`)
        .setColor("#AC28AE")
        .setTimestamp()
        .setFooter({ text: 'Inventário', iconURL: client.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) });
        
        const m = await interaction.reply({ embeds: [embed], components: [row, row2], ephemeral: true });
        
      });
      
    }
    
    if (interaction.customId) {
      if (!['layout_azul', 'layout_branco', 'layout_laranja', 'layout_preto', 'layout_verde', 'layout_vermelho', 'layout_roxo'].includes(interaction.customId)) return;
      
      return database.ref(`/economia/${interaction.user.id}/Perfil/Layouts`).once('value').then(async function(snapshot) {
        let tema_azul = (snapshot.val() && snapshot.val().tema_azul);
        if (tema_azul === undefined || tema_azul === null) tema_azul = 1;

        let tema_azul_log = (snapshot.val() && snapshot.val().tema_azul_log);
        if (tema_azul_log === undefined || tema_azul_log === null) tema_azul_log = 0;

        ///////////////////////////////////////////////////////////////////////////

        let tema_branco = (snapshot.val() && snapshot.val().tema_branco);
        if (tema_branco === undefined || tema_branco === null) tema_branco = 0;

        let tema_branco_log = (snapshot.val() && snapshot.val().tema_branco_log);
        if (tema_branco_log === undefined || tema_branco_log === null) tema_branco_log = 0;

        ///////////////////////////////////////////////////////////////////////////

        let tema_laranja = (snapshot.val() && snapshot.val().tema_laranja);
        if (tema_laranja === undefined || tema_laranja === null) tema_laranja = 0;

        let tema_laranja_log = (snapshot.val() && snapshot.val().tema_laranja_log);
        if (tema_laranja_log === undefined || tema_laranja_log === null) tema_laranja_log = 0;

        ////////////////////////////////////////////////////////////////////////////////////

        let tema_preto = (snapshot.val() && snapshot.val().tema_preto);
        if (tema_preto === undefined || tema_preto === null) tema_preto = 0;

        let tema_preto_log = (snapshot.val() && snapshot.val().tema_preto_log);
        if (tema_preto_log === undefined || tema_preto_log === null) tema_preto_log = 0;

        ////////////////////////////////////////////////////////////////////////////////////

        let tema_verde = (snapshot.val() && snapshot.val().tema_verde);
        if (tema_verde === undefined || tema_verde === null) tema_verde = 0;

        let tema_verde_log = (snapshot.val() && snapshot.val().tema_verde_log);
        if (tema_verde_log === undefined || tema_verde_log === null) tema_verde_log = 0;
        
        ////////////////////////////////////////////////////////////////////////////////////

        let tema_vermelho = (snapshot.val() && snapshot.val().tema_vermelho);
        if (tema_vermelho === undefined || tema_vermelho === null) tema_vermelho = 0;

        let tema_vermelho_log = (snapshot.val() && snapshot.val().tema_vermelho_log);
        if (tema_vermelho_log === undefined || tema_vermelho_log === null) tema_vermelho_log = 0;
        
        ////////////////////////////////////////////////////////////////////////////////////

        let tema_roxo = (snapshot.val() && snapshot.val().tema_roxo);
        if (tema_roxo === undefined || tema_roxo === null) tema_roxo = 0;

        let tema_roxo_log = (snapshot.val() && snapshot.val().tema_roxo_log);
        if (tema_roxo_log === undefined || tema_roxo_log === null) tema_roxo_log = 0;
        
        let NomeDB = '',
            Nome = '',
            DB = '',
            ativou;
        
        switch (interaction.customId) {
          case 'layout_azul':
            NomeDB = 'tema_azul'
            Nome = 'Layout Azul'
            DB = tema_azul;
            break;
            
          case 'layout_branco':
            NomeDB = 'tema_branco'
            Nome = 'Layout Branco'
            DB = tema_branco;
            break;
            
          case 'layout_laranja':
            NomeDB = 'tema_laranja'
            Nome = 'Layout Laranja'
            DB = tema_laranja;
            break;
            
          case 'layout_preto':
            NomeDB = 'tema_preto'
            Nome = 'Layout Preto'
            DB = tema_preto;
            break;
            
          case 'layout_verde':
            NomeDB = 'tema_verde'
            Nome = 'Layout Verde'
            DB = tema_verde;
            break;
            
          case 'layout_vermelho':
            NomeDB = 'tema_vermelho'
            Nome = 'Layout Vermelho'
            DB = tema_vermelho;
            break;
            
          case 'layout_roxo':
            NomeDB = 'tema_roxo'
            Nome = 'Layout Roxo'
            DB = tema_roxo;
            break;
        }
        
        if (DB ? false : true) {
          return interaction.reply({ content: `❌ **|** Você não possui este layout.`})
        } else {
          ativou = [DB+'log'] ? true : false
        }
        
        if (ativou == true) {
          
          await database.ref(`/economia/${interaction.user.id}/Perfil/Layouts`).update({
            tema_branco_log: 0,
            tema_laranja_log: 0,
            tema_preto_log: 0,
            tema_verde_log: 0,
            tema_vermelho_log: 0,
            tema_roxo_log: 0,
          });

          database.ref(`/economia/${interaction.user.id}/Perfil/Layouts`).update({
            [NomeDB]: 1,
            [NomeDB+'_log']: 1
          });
          
          return interaction.reply({ content: `✅ **|** Você ativou a cor: ${Nome} para em seu perfil.`})
        } else if (ativou == false) {
          
          await database.ref(`/economia/${interaction.user.id}/Perfil/Layouts`).update({
            tema_azul: 0,
            tema_azul_log: 0,
            tema_branco_log: 0,
            tema_laranja_log: 0,
            tema_preto_log: 0,
            tema_verde_log: 0,
            tema_vermelho_log: 0,
            tema_roxo_log: 0,
          });
          
          database.ref(`/economia/${interaction.user.id}/Perfil/Layouts`).update({
            tema_azul: 0,
            tema_azul_log: 0,
          });
          
          return interaction.reply({ content: `✅ **|** Você desativou a cor: **${Nome}** em seu perfil.`})
        }
        
      })
    }
    
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'editprofile-modal-sobremim') {
      
      return database.ref(`/economia/${interaction.user.id}/Perfil/Informações`).once('value').then(async function(snapshot) {
        let sobremim = (snapshot.val() && snapshot.val().sobremim);
        if (sobremim === undefined || sobremim === null) sobremim = `Você pode alterar esta mensagem utilizando /sobremim`;
        
        let response = interaction.fields.getTextInputValue('sobremim-input');
        if (response) {
          
          database.ref(`/economia/${interaction.user.id}/Perfil/Informações`).update({
            sobremim: response,
          });
          
          await interaction.reply({ content: `✅ **|** Sobremim alterado com sucesso`, ephemeral: true });
          let channellog = client.channels.cache.get(client.Canal['sobremimlog'])
          if (channellog) {
            const embed = new EmbedBuilder()
            .setColor('#FFFFFF')
            .setTitle(interaction.user.tag, interaction.user.avatarURL({ format: 'png', dynamic: true, size: 1024 }))
            .setDescription(`
**Sobremim atualizado**
Mensagem: "${response}"

> ${interaction.user} (${interaction.user.id}
**Servidor:**
> ${interaction.guild.name} (${interaction.guild.id})
**Canal:**
> <#${interaction.channel.id}> (${interaction.channel.id})`)
            
            channellog.send({ content: `"${response}"`, embeds: [embed] })
          }
          
        }
        
      })
    }
    else
      if (interaction.customId === 'editprofile-modal-background') {
        return database.ref(`economia/${interaction.user.id}/Perfil/Informações`).once('value').then(async function(snapshot) {
          let back = (snapshot.val() && snapshot.val().imagemperfil);
          if (back === undefined || back === null) back = '/src/utils/assets/backgrounds/wallhaven-1kp5jv.png';

          let response2 = interaction.fields.getTextInputValue('background-input');
          if (response2) {
            
            return database.ref(`economia/${interaction.user.id}/vip`).once('value').then(async function(snapshot) {
              let vip = (snapshot.val() && snapshot.val().vip);
              if (vip === undefined || vip === null) vip = 0;

              let tempo = (snapshot.val() && snapshot.val().tempo);
              if (tempo === undefined || tempo === null) tempo = 0;

              let data = (snapshot.val() && snapshot.val().data);
              if (data === undefined || data === null) data = 0;

              let TE = (tempo - (Date.now() - data));
              const time = require('parse-ms')(TE);

              if (vip < 1) {
                vip = 0;
              }
              else
                if (data !== null && tempo - (Date.now() - data) < 0) {
                  vip = 0;
                }

              return database.ref(`economia/${interaction.user.id}/inventario/Itens/`).once('value').then(async function(snapshot) {
                let backgroundticket = (snapshot.val() && snapshot.val().backgroundticket);
                if (backgroundticket === undefined || backgroundticket === null) backgroundticket = 0;
                
                if (vip < 0 && backgroundticket > 0) {
                  database.ref(`economia/${interaction.user.id}/inventario/Itens/`).update({
                    backgroundticket: backgroundticket - 1,
                  });
                }
                
                database.ref(`/economia/${interaction.user.id}/Perfil/Informações`).update({
                  imagemperfil: response2
                });

                await interaction.reply({ content: `✅ **|** Background alterado com sucesso`, ephemeral: true });
                
                let channellog = client.channels.cache.get(client.Canal['backgroundlog'])
                if (channellog) {
                  const embed = new EmbedBuilder()
                  .setColor('#FFFFFF')
                  .setTitle(interaction.user.tag, interaction.user.avatarURL({ format: 'png', dynamic: true, size: 1024 }))
                  .setDescription(`
**Background atualizado**
> ${interaction.user} (${interaction.user.id}
**Servidor:**
> ${interaction.guild.name} (${interaction.guild.id})
**Canal:**
> <#${interaction.channel.id}> (${interaction.channel.id})

VIP: ${vip}`)
                  
                  channellog.send({ content: `${response2}`, embeds: [embed], files: [response2] })
                }
                
              })
            })
          }
        })
      }
    
  }
});