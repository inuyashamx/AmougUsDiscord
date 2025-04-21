const { gameState, resetGame, addPlayer } = require('../gameState');

module.exports = {
    name: 'crear_juego',
    async execute(message, args) {
        try {
            // Verificar que estamos en el canal correcto
            if (message.channel.name !== 'impostor') {
                console.log('Error: Canal incorrecto');
                return message.reply('❌ Este comando solo funciona en el canal #impostor');
            }

            console.log('\n=== Creando Nuevo Juego ===');
            console.log('Solicitado por:', {
                usuario: message.author.username,
                id: message.author.id,
                canal: message.channel.name
            });

            // Verificar si ya hay un juego activo
            if (gameState.isActive) {
                console.log('Error: Ya hay un juego activo');
                return message.reply('❌ Ya hay un juego en curso. Usa !terminar_juego para finalizarlo.');
            }

            // Reiniciar el estado del juego
            console.log('Reiniciando estado del juego...');
            if (!resetGame()) {
                console.log('Error al reiniciar el estado del juego');
                return message.reply('❌ Hubo un error al reiniciar el estado del juego.');
            }

            // Activar el juego ANTES de agregar jugadores
            gameState.isActive = true;
            console.log('Juego activado:', {
                activo: gameState.isActive,
                maxJugadores: gameState.maxPlayers,
                minJugadores: gameState.minPlayers
            });
            
            // Agregar al creador del juego
            console.log('Intentando agregar al creador del juego...');
            if (!addPlayer(message.author.id)) {
                console.log('Error al agregar al creador del juego');
                // Si falla, desactivar el juego
                gameState.isActive = false;
                resetGame();
                return message.reply('❌ Hubo un error al agregarte al juego.');
            }

            console.log('Estado final del juego:', {
                activo: gameState.isActive,
                jugadores: gameState.players,
                ubicaciones: gameState.locations,
                tareas: Object.keys(gameState.tasks).length
            });
            console.log('=== Juego Creado Exitosamente ===\n');

            // Enviar mensaje de éxito con emojis
            return message.reply(`
🎮 **¡Juego creado con éxito!**

👤 ${message.author.username} se ha unido al juego
📊 Jugadores: 1/${gameState.maxPlayers}

Comandos disponibles:
• !unirse - Para que otros jugadores se unan
• !iniciar - Para comenzar cuando todos estén listos
• !terminar_juego - Para cancelar el juego

⚠️ El juego necesita mínimo ${gameState.minPlayers} jugadores para iniciar.
`);

        } catch (error) {
            console.error('Error al crear el juego:', error);
            // Asegurarse de que el juego no quede en estado inconsistente
            resetGame();
            return message.reply('❌ Hubo un error al crear el juego. Por favor, inténtalo de nuevo.');
        }
    }
}; 