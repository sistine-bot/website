let emojiConfig;
try {
  emojiConfig = require('../core/emoji.js');
} catch (e) {
  emojiConfig = require('../emoji.js');
}

function Format(number, symbol = '') {
  return `${symbol} ${new Intl.NumberFormat().format(number)}`;
}

async function sendError(ctx, content, ephemeral = true) {
  const negativoEmoji = emojiConfig?.negativo || '❌';
  const msg = `${negativoEmoji} **|** ${content}`;
  try {
    if (ctx.isChatInputCommand?.()) {
      if (ctx.replied || ctx.deferred) {
        return await ctx.followUp({ content: msg, ephemeral });
      }
      return await ctx.reply({ content: msg, ephemeral });
    }
    return await ctx.reply({ content: msg });
  } catch (error) {
    console.error('[sendError]', error);
  }
}

function ParseDuration(text) {
  if (!text) return null;
  text = text.toLowerCase().trim();
  if (text === '0') return 0;

  const match = text.match(/^(\d+)\s*(min|h|d|w|m|y)$/);
  if (!match) return null;

  const value = Number(match[1]);
  const unit = match[2];

  const units = {
    min: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    m: 30 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000
  };

  return value * units[unit];
}

function FormatDuration(duration) {
  if (!duration) return "0 segundos";

  const match = String(duration).trim().toLowerCase().match(/^(\d+)\s*([yMwdhms])$/i);
  if (!match) return duration;

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  const units = {
    y: ["ano", "anos"],
    w: ["semana", "semanas"],
    m: ["mês", "meses"],
    d: ["dia", "dias"],
    h: ["hora", "horas"],
    s: ["segundo", "segundos"]
  };

  const text = units[unit];
  if (!text) return duration;

  return `${value} ${value === 1 ? text[0] : text[1]}`;
}

function NumberConvert(value = "0") {
  value = String(value).trim();
  const suffix = value.slice(-1).toLowerCase();

  if (suffix === "k") return parseFloat(value) * 1e3;
  if (suffix === "m" || value.slice(-2).toLowerCase() === "kk") return parseFloat(value) * 1e6;
  if (suffix === "b") return parseFloat(value) * 1e9;
  if (suffix === "t") return parseFloat(value) * 1e12;

  return Number(value);
}

module.exports = {
  Format,
  sendError,
  ParseDuration,
  FormatDuration,
  NumberConvert
};
