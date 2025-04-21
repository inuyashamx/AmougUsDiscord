const { gameState, setGameChannel, startGameTimer, hasEnoughPlayers } = require('../gameState');

module.exports = {
    name: 'iniciar',
    description: 'Inicia el juego',
    async execute(message) {
        try {
            console.log('\n=== Iniciando Juego ===');
            console.log('Estado actual:', {
                activo: gameState.isActive,
                jugadores: gameState.players.length,
                roles: Object.keys(gameState.roles).length
            });

            // Verificar si hay un juego creado
            if (!gameState.isActive) {
                return message.reply('❌ No hay ningún juego activo. Usa !crear_juego para crear uno.');
            }

            // Verificar si el juego ya comenzó
            if (Object.keys(gameState.roles).length > 0) {
                return message.reply('❌ El juego ya ha comenzado.');
            }

            // Verificar si quien ejecuta el comando es el creador del juego
            if (message.author.id !== gameState.players[0]) {
                return message.reply('❌ Solo el creador del juego puede iniciarlo.');
            }

            // Verificar si hay jugadores suficientes
            if (!hasEnoughPlayers()) {
                return message.reply(`❌ Se necesitan al menos ${gameState.minPlayers} jugadores para iniciar el juego (${gameState.players.length}/${gameState.minPlayers}).`);
            }

            // Verificar que no exceda el máximo de jugadores
            if (gameState.players.length > gameState.maxPlayers) {
                return message.reply(`❌ Hay demasiados jugadores. El máximo es ${gameState.maxPlayers}.`);
            }

            // Asignar roles
            console.log('Asignando roles...');
            const playersCopy = [...gameState.players];
            const impostorIndex = Math.floor(Math.random() * playersCopy.length);
            const impostor = playersCopy[impostorIndex];

            // Asignar rol de impostor y tripulantes
            gameState.players.forEach(playerId => {
                gameState.roles[playerId] = playerId === impostor ? 'impostor' : 'tripulante';
            });

            console.log('Roles asignados:', {
                totalJugadores: gameState.players.length,
                rolesAsignados: Object.keys(gameState.roles).length
            });

            // Configurar el juego
            setGameChannel(message.channel);
            
            // Mostrar información inicial
            const minutes = Math.floor(gameState.gameDuration / 60000);
            const pointsNeeded = gameState.requiredPoints;
            const totalPlayers = gameState.players.length;

            // Enviar mensaje general
            await message.channel.send(`
🎮 **¡El juego ha comenzado!**

👥 Jugadores: ${totalPlayers}/${gameState.maxPlayers}
⏱️ Tiempo límite: ${minutes} minutos
🎯 Puntos necesarios: ${pointsNeeded}

Condiciones de victoria:
✅ Tripulantes: Conseguir ${pointsNeeded} puntos o descubrir al impostor
🔪 Impostor: Eliminar a los tripulantes o evitar que consigan los puntos

📝 Comandos disponibles:
• !mover [sala] - Para moverte entre salas
• !tarea - Ver tus tareas pendientes
• !reportar - Reportar un cuerpo
• !salas - Ver todas las salas disponibles

¡Suerte a todos! Revisen sus mensajes directos para ver su rol.
            `);

            // Enviar mensajes privados con los roles
            console.log('Enviando mensajes privados...');
            for (const playerId of gameState.players) {
                try {
                    const player = await message.guild.members.cache.get(playerId);
                    const role = gameState.roles[playerId];
                    const roleMessage = role === 'impostor' 
                        ? '🔪 **¡Eres el Impostor!**\n\nTu objetivo es eliminar a los tripulantes sin ser descubierto.\n\nComandos especiales:\n• !matar - Para eliminar a un jugador cercano'
                        : '👨‍🚀 **¡Eres Tripulante!**\n\nTu objetivo es completar tareas y descubrir al impostor.\n\nMantente alerta y reporta cualquier comportamiento sospechoso.';
                    
                    await player.send(roleMessage);
                } catch (error) {
                    console.error(`Error al enviar mensaje a ${playerId}:`, error);
                }
            }

            // Iniciar el temporizador
            startGameTimer();
            console.log('=== Juego Iniciado ===\n');

        } catch (error) {
            console.error('Error al iniciar el juego:', error);
            return message.reply('❌ Hubo un error al iniciar el juego.');
        }
    },
}; 