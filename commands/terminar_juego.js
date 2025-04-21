const { gameState, resetGame } = require('../gameState');

module.exports = {
    name: 'terminar_juego',
    async execute(message, args) {
        try {
            // Verificar si hay un juego activo
            if (!gameState.isActive) {
                return message.reply('No hay ningún juego activo.');
            }

            // Notificar a todos los jugadores
            for (const playerId of gameState.players) {
                try {
                    const player = await message.client.users.fetch(playerId);
                    await player.send('El juego ha terminado. ¡Gracias por jugar!');
                } catch (error) {
                    console.error(`Error al notificar al jugador ${playerId}:`, error);
                }
            }

            // Reiniciar el estado del juego
            resetGame();

            return message.reply('¡Juego terminado! Todos los jugadores han sido notificados.');
        } catch (error) {
            console.error('Error al terminar el juego:', error);
            return message.reply('Hubo un error al terminar el juego.');
        }
    }
}; 