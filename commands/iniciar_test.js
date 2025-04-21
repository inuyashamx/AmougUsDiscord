const { gameState, resetGame, addPlayer, setGameChannel, startGameTimer } = require('../gameState');

module.exports = {
    name: 'iniciar_test',
    description: 'Inicia el juego en modo de pruebas',
    execute(message, args) {
        // Verificar que se especificó un rol
        if (!args[0]) {
            return message.reply('❌ Debes especificar un rol: !iniciar_test [impostor/tripulante]');
        }

        // Validar el rol especificado
        const rol = args[0].toLowerCase();
        if (rol !== 'impostor' && rol !== 'tripulante') {
            return message.reply('❌ Rol no válido. Usa: !iniciar_test [impostor/tripulante]');
        }

        // Reiniciar el estado del juego
        resetGame();

        // Agregar al jugador que ejecuta el comando
        addPlayer(message.author.id);

        // Asignar el rol especificado
        gameState.roles[message.author.id] = rol;

        // Iniciar el juego
        gameState.isActive = true;
        setGameChannel(message.channel);
        
        // Mostrar información inicial
        const minutes = Math.floor(gameState.gameDuration / 60000);
        const pointsNeeded = gameState.requiredPoints;

        // Mensaje personalizado según el rol
        let roleInfo = '';
        if (rol === 'impostor') {
            roleInfo = '🔪 Impostor\nPuedes eliminar tripulantes y sabotear sistemas.';
        } else {
            roleInfo = '👨‍🚀 Tripulante\nDebes completar tareas y encontrar al impostor.';
        }

        message.channel.send(`
🧪 MODO PRUEBAS ACTIVADO 🧪

🎮 ¡El juego ha comenzado!

👤 Jugador de prueba: ${message.author.username}
⏱️ Tiempo límite: ${minutes} minutos
🎯 Puntos necesarios: ${pointsNeeded}

Rol asignado: ${roleInfo}

Comandos disponibles:
• !mover [sala] - Moverte entre salas
${rol === 'impostor' ? '• !matar - Eliminar jugadores simulados\n' : ''}• !reportar - Reportar cuerpos
• !tarea - Ver tus tareas pendientes
• !salas - Ver todas las salas

¡Suerte en las pruebas!
        `);

        // Iniciar el temporizador
        startGameTimer();
    },
}; 