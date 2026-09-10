// market/utils.js
/**
 * Embaralha um array utilizando o algoritmo estável Fisher-Yates Shuffle
 * e retorna uma fatia (slice) com a quantidade solicitada.
 */
function getRandomItems(array, count) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

module.exports = { getRandomItems };