// market/buttons.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function createMarketNavigationButtons(itemsArray, emojiMap) {
  const rows = [];
  let currentButtons = [];

  for (let i = 0; i < itemsArray.length; i++) {
    const button = new ButtonBuilder()
      .setCustomId(`${i + 1}`)
      .setEmoji(emojiMap[i + 1])
      .setStyle(ButtonStyle.Secondary);

    currentButtons.push(button);

    if (currentButtons.length === 5 || i === itemsArray.length - 1) {
      rows.push(new ActionRowBuilder().addComponents([...currentButtons]));
      currentButtons = [];
    }
  }
  return rows;
}

function createConfirmationRow(emojiMap) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('confirmar').setStyle(ButtonStyle.Success).setEmoji(emojiMap.positivo).setLabel('Confirmar'),
    new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setEmoji(emojiMap.negativo).setLabel('Cancelar')
  );
}

module.exports = { createMarketNavigationButtons, createConfirmationRow };