function Hand() {
  this.cards = new Array();
}

Hand.prototype.limit = 21;

Hand.prototype.add = function(card) {
  if (card) this.cards.push(card); // Evita dar push em 'undefined'
};

Hand.prototype.score = function() {
  var score = 0, aces = 0;
  
  this.cards.forEach((card) => {
    if (card.face == "A") {
      aces++;
      score += 11;
    } else if (card.face == "J" || card.face == "Q" || card.face == "K") {
      score += 10;
    } else {
      score += parseInt(card.face, 10);
    }
  });

  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
};

Hand.prototype.toString = function() {
  var string = "";
  this.cards.forEach((card) => {
    string += `${card.face} de ${card.suite}\n`;
  });
  return string || "Nenhuma carta";
};

module.exports = Hand;