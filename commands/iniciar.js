const { gameState, setPlayerRole } = require('../gameState');

module.exports = {
    name: 'iniciar',
    async execute(message, args) {
        try {
            // Verificar si hay un juego activo
            if (!gameState.isActive) {
                return message.reply('No hay ningún juego activo. Usa !crear_juego para crear uno.');
            }

            // Verificar si hay suficientes jugadores
            if (gameState.players.length < 1) {
                return message.reply('No hay suficientes jugadores para iniciar el juego.');
            }

            // Asignar rol al primer jugador (por ahora solo hay uno para pruebas)
            const playerId = gameState.players[0];
            const role = args[0]?.toLowerCase() || 'tripulante';
            setPlayerRole(playerId, role);

            // Enviar mensaje privado al jugador con su rol y comandos
            const player = await message.client.users.fetch(playerId);
            const roleMessage = role === 'tripulante' 
                ? `Eres un TRIPULANTE! 👨‍🚀\nTu objetivo es completar tus tareas y encontrar al impostor.\n\nComandos disponibles:\n!salas - Para ver las salas disponibles\n!mover [sala] - Para moverte entre salas\n!tarea - Para ver y realizar tus tareas\n!reportar - Para reportar un cuerpo`
                : `Eres un IMPOSTOR! 👿\nTu objetivo es eliminar a los tripulantes sin ser descubierto.\n\nComandos disponibles:\n!mover [sala] - Para moverte entre salas\n!matar - Para eliminar a un tripulante`;

            await player.send(roleMessage);

            return message.reply('¡El juego ha comenzado! Los roles han sido asignados y los jugadores han recibido sus instrucciones por mensaje privado.');
        } catch (error) {
            console.error('Error al iniciar el juego:', error);
            return message.reply('Hubo un error al iniciar el juego.');
        }
    }
}; 