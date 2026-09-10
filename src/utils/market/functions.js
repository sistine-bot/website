module.exports = {

    // Função para obter n elementos aleatórios do array
    obterItensAleatórios: function (array, quantidade) {
        // Verifica se a quantidade desejada não é maior que o comprimento do array
        if (quantidade > array.length) {
            console.error("A quantidade desejada é maior que o comprimento do array.");
            return;
        }

        // Cria uma cópia do array para não modificar o original
        // array = array.map((item, index) => ({ ...item, posição: index }));
        let arrayAleatório = array.slice();

        // Array para armazenar os itens aleatórios
        let itensAleatórios = [];

        // Loop para obter os itens aleatórios
        for (let i = 0; i < quantidade; i++) {
            // Gera um índice aleatório
            let índiceAleatório = Math.floor(Math.random() * arrayAleatório.length);

            // Adiciona o item aleatório ao array de itens aleatórios
            itensAleatórios.push(arrayAleatório[índiceAleatório]);

            // Remove o item escolhido do array para evitar repetições
            arrayAleatório.splice(índiceAleatório, 1);
        }

        return itensAleatórios;
    }
}