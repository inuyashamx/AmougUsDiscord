const { gameState, setGameChannel, startGameTimer, hasEnoughPlayers } = require('../gameState');

module.exports = {
    name: 'iniciar',
    description: 'Inicia el juego',
    execute(message) {
        // Verificar si ya hay un juego activo
        if (gameState.isActive) {
            return message.reply('❌ Ya hay un juego en curso.');
        }

        // Verificar si hay jugadores
        if (gameState.players.length === 0) {
            return message.reply('❌ No hay jugadores unidos al juego. Usa !unirse para participar.');
        }

        // Verificar número mínimo de jugadores usando la función del gameState
        if (!hasEnoughPlayers()) {
            return message.reply(`❌ Se necesitan al menos ${gameState.minPlayers} jugadores para iniciar el juego (${gameState.players.length}/${gameState.minPlayers}).`);
        }

        // Verificar que no exceda el máximo de jugadores
        if (gameState.players.length > gameState.maxPlayers) {
            return message.reply(`❌ Hay demasiados jugadores. El máximo es ${gameState.maxPlayers}.`);
        }

        // Verificar que todos los jugadores tengan roles asignados
        const playersWithoutRole = gameState.players.filter(playerId => !gameState.roles[playerId]);
        if (playersWithoutRole.length > 0) {
            return message.reply('❌ No se han asignado todos los roles. Usa !asignar_roles primero.');
        }

        // Iniciar el juego
        gameState.isActive = true;
        setGameChannel(message.channel);
        
        // Mostrar información inicial
        const minutes = Math.floor(gameState.gameDuration / 60000);
        const pointsNeeded = gameState.requiredPoints;
        const totalPlayers = gameState.players.length;
        const impostor = gameState.players.find(playerId => gameState.roles[playerId] === 'impostor');

        // Enviar mensaje general
        message.channel.send(`
🎮 ¡El juego ha comenzado!

👥 Jugadores: ${totalPlayers}/${gameState.maxPlayers}
⏱️ Tiempo límite: ${minutes} minutos
🎯 Puntos necesarios: ${pointsNeeded}

Condiciones de victoria:
✅ Tripulantes: Conseguir ${pointsNeeded} puntos o descubrir al impostor
🔪 Impostor: Eliminar a los tripulantes o evitar que consigan los puntos

¡Suerte a todos!
        `);

        // Enviar mensaje privado al impostor
        const impostorUser = message.guild.members.cache.get(impostor);
        if (impostorUser) {
            impostorUser.send('🔪 Eres el impostor. Tu objetivo es eliminar a los tripulantes sin ser descubierto.');
        }

        // Iniciar el temporizador
        startGameTimer();
    },
}; 