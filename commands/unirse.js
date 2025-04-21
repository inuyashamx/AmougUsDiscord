const { gameState, addPlayer } = require('../gameState');

module.exports = {
    name: 'unirse',
    async execute(message, args) {
        try {
            // Verificar que estamos en el canal correcto
            if (message.channel.name !== 'impostor') {
                console.log('Error: Canal incorrecto');
                return message.reply('❌ Este comando solo funciona en el canal #impostor');
            }

            console.log('\n=== Intento de Unirse al Juego ===');
            console.log('Estado actual del juego:', {
                activo: gameState.isActive,
                jugadoresActuales: gameState.players,
                cantidadJugadores: gameState.players.length
            });

            // Verificaciones básicas
            if (!gameState.isActive) {
                return message.reply('❌ No hay ningún juego activo. Usa !crear_juego para crear uno nuevo.');
            }

            if (gameState.players.includes(message.author.id)) {
                return message.reply('❌ Ya estás en el juego.');
            }

            if (gameState.players.length >= gameState.maxPlayers) {
                return message.reply(`❌ El juego está lleno (${gameState.players.length}/${gameState.maxPlayers} jugadores).`);
            }

            if (Object.keys(gameState.roles).length > 0) {
                return message.reply('❌ El juego ya ha comenzado. No puedes unirte ahora.');
            }

            // Intentar agregar al jugador
            console.log('Intentando agregar jugador:', message.author.id);
            const resultado = addPlayer(message.author.id);

            if (!resultado) {
                console.log('Error al agregar jugador');
                return message.reply('❌ Hubo un error al unirte al juego.');
            }

            console.log('Jugador agregado exitosamente:', {
                jugadoresActuales: gameState.players.length,
                maxJugadores: gameState.maxPlayers,
                minNecesarios: gameState.minPlayers
            });

            return message.reply(`
✅ ¡Te has unido al juego!

📊 Jugadores: ${gameState.players.length}/${gameState.maxPlayers}
⚠️ Mínimo necesario: ${gameState.minPlayers} jugadores
🎮 Estado: ${gameState.players.length}/${gameState.minPlayers} jugadores necesarios

Espera a que el anfitrión use !iniciar para comenzar.`);

        } catch (error) {
            console.error('Error al unirse al juego:', error);
            return message.reply('❌ Hubo un error al unirte al juego.');
        }
    }
}; 