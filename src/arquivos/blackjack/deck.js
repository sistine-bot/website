const Card = require("./cards.js");

var Deck = function() {
  this.cards = new Array(); // Definição correta na instância
  
  Card.prototype.suites.forEach((suite) => {
    Card.prototype.faces.forEach((face) => {
      this.cards.push(new Card(face, suite));
    });
  });
};

Deck.prototype.draw = function() {
  return this.cards.pop(); // Puxa da instância
};

Deck.prototype.shuffle = function() {
  for (
    var j, x, i = this.cards.length;
    i;
    j = Math.floor(Math.random() * i),
      x = this.cards[--i],
      this.cards[i] = this.cards[j],
      this.cards[j] = x
  );
  return this;
};

module.exports = Deck;