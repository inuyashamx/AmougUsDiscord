const { gameState, setGameChannel, startGameTimer } = require('../gameState');

module.exports = {
    name: 'iniciar',
    description: 'Inicia el juego',
    execute(message) {
        if (gameState.isActive) {
            return message.reply('❌ Ya hay un juego en curso.');
        }

        if (gameState.players.length === 0) {
            return message.reply('❌ No hay jugadores unidos al juego.');
        }

        gameState.isActive = true;
        setGameChannel(message.channel);
        
        // Mostrar información inicial
        const minutes = Math.floor(gameState.gameDuration / 60000);
        const pointsNeeded = gameState.requiredPoints;
        message.channel.send(`
🎮 ¡El juego ha comenzado!

⏱️ Tiempo límite: ${minutes} minutos
🎯 Puntos necesarios: ${pointsNeeded}

Condiciones de victoria:
✅ Tripulantes: Conseguir ${pointsNeeded} puntos o descubrir al impostor
🔪 Impostor: Eliminar a los tripulantes o evitar que consigan los puntos

¡Suerte a todos!
        `);

        // Iniciar el temporizador
        startGameTimer();
    },
}; 