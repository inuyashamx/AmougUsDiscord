const { gameState, resetGame, addPlayer } = require('../gameState');

module.exports = {
    name: 'crear_juego',
    async execute(message, args) {
        try {
            // Verificar si ya hay un juego activo
            if (gameState.isActive) {
                return message.reply('Ya hay un juego en curso. Usa !terminar_juego para finalizarlo.');
            }

            // Reiniciar el estado del juego
            resetGame();
            gameState.isActive = true;

            // Agregar al creador del juego automáticamente
            addPlayer(message.author.id);

            return message.reply(`¡Juego creado! ${message.author.username} se ha unido al juego. Usa !unirse para unirte. (Máximo 1 jugador para pruebas)`);
        } catch (error) {
            console.error('Error al crear el juego:', error);
            return message.reply('Hubo un error al crear el juego.');
        }
    }
}; 