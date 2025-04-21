const { gameState, resetGame, addPlayer, setGameChannel, startGameTimer } = require('../gameState');

module.exports = {
    name: 'iniciar_test',
    description: 'Inicia el juego en modo de pruebas',
    execute(message) {
        // Reiniciar el estado del juego (esto limpia cualquier juego anterior)
        resetGame();

        // Agregar al jugador que ejecuta el comando
        addPlayer(message.author.id);

        // Asignar rol de impostor al jugador en modo test
        gameState.roles[message.author.id] = 'impostor';

        // Iniciar el juego
        gameState.isActive = true;
        setGameChannel(message.channel);
        
        // Mostrar información inicial
        const minutes = Math.floor(gameState.gameDuration / 60000);
        const pointsNeeded = gameState.requiredPoints;
        message.channel.send(`
🧪 MODO PRUEBAS ACTIVADO 🧪

🎮 ¡El juego ha comenzado!

👤 Jugador de prueba: ${message.author.username}
⏱️ Tiempo límite: ${minutes} minutos
🎯 Puntos necesarios: ${pointsNeeded}

Rol asignado: 🔪 Impostor
Puedes probar todas las funciones del juego.

Comandos disponibles:
- !mover [sala] - Moverte entre salas
- !matar - Eliminar jugadores simulados
- !reportar - Reportar cuerpos
- !tarea - Ver tus tareas pendientes
- !salas - Ver todas las salas

¡Suerte en las pruebas!
        `);

        // Iniciar el temporizador
        startGameTimer();
    },
}; 