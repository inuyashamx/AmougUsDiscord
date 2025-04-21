const { gameState, addPlayer } = require('../gameState');

module.exports = {
    name: 'unirse',
    async execute(message, args) {
        try {
            // Verificar si hay un juego activo
            if (!gameState.isActive) {
                return message.reply('No hay ningún juego activo. Usa !crear_juego para crear uno.');
            }

            // Verificar si el juego ya ha comenzado (roles asignados)
            if (Object.keys(gameState.roles).length > 0) {
                return message.reply('El juego ya ha comenzado. No puedes unirte en este momento.');
            }

            // Verificar si el jugador ya está en el juego
            if (gameState.players.includes(message.author.id)) {
                return message.reply('Ya estás en el juego.');
            }

            // Verificar si hay espacio para más jugadores
            if (gameState.players.length >= gameState.maxPlayers) {
                return message.reply(`El juego está lleno. Máximo ${gameState.maxPlayers} jugador(es) para pruebas.`);
            }

            // Agregar al jugador al juego
            addPlayer(message.author.id);

            return message.reply(`${message.author.username} se ha unido al juego. (${gameState.players.length}/${gameState.maxPlayers} jugadores)`);
        } catch (error) {
            console.error('Error al unirse al juego:', error);
            return message.reply('Hubo un error al unirte al juego.');
        }
    }
}; 