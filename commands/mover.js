const { gameState, getRoomById, getPlayerLocation, setPlayerLocation, getRoomTasks, isPlayerBusy } = require('../gameState');

module.exports = {
    name: 'mover',
    async execute(message, args) {
        try {
            // Verificar si hay un juego activo
            if (!gameState.isActive) {
                return message.reply('No hay ningún juego activo. Usa !crear_juego para crear uno.');
            }

            // Verificar si el jugador está en el juego
            if (!gameState.players.includes(message.author.id)) {
                return message.reply('No estás en el juego. Usa !unirse para unirte.');
            }

            // Verificar si el jugador está ocupado
            if (isPlayerBusy(message.author.id)) {
                return message.reply('No puedes moverte mientras estás realizando una tarea. Espera a terminarla.');
            }

            // Verificar si se proporcionó una sala
            if (!args[0]) {
                return message.reply('Debes especificar una sala. Usa !salas para ver las salas disponibles.');
            }

            const targetRoom = args[0];
            const room = getRoomById(targetRoom);

            // Verificar si la sala existe
            if (!room) {
                return message.reply(`La sala "${targetRoom}" no existe. Usa !salas para ver las salas disponibles.`);
            }

            // Obtener la ubicación actual del jugador
            const currentLocation = getPlayerLocation(message.author.id);

            // Verificar si el jugador ya está en esa sala
            if (currentLocation === targetRoom) {
                return message.reply(`Ya estás en la ${room.name}.`);
            }

            // Encontrar jugadores en la sala destino antes de mover al jugador
            const playersInTargetRoom = gameState.players.filter(playerId => 
                gameState.locations[playerId] === targetRoom && playerId !== message.author.id
            );

            // Cambiar la ubicación del jugador
            const moved = setPlayerLocation(message.author.id, targetRoom);
            if (!moved) {
                return message.reply('No puedes moverte mientras estás realizando una tarea.');
            }

            // Notificar a los jugadores que están en la sala que alguien entró
            if (playersInTargetRoom.length > 0) {
                const enteringPlayer = await message.client.users.fetch(message.author.id);
                for (const playerId of playersInTargetRoom) {
                    try {
                        const playerInRoom = await message.client.users.fetch(playerId);
                        await playerInRoom.send(`🚪 ${enteringPlayer.username} ha entrado a la ${room.name}.`);
                    } catch (error) {
                        console.error(`Error al notificar al jugador ${playerId}:`, error);
                    }
                }
            }

            // Construir el mensaje de presencia para el jugador que entra
            let presenceMsg = '';
            if (playersInTargetRoom.length === 0) {
                presenceMsg = 'No hay nadie más en esta sala.';
            } else {
                const playerNames = await Promise.all(playersInTargetRoom.map(async playerId => {
                    const user = await message.client.users.fetch(playerId);
                    return user.username;
                }));
                presenceMsg = `También está${playersInTargetRoom.length === 1 ? '' : 'n'} aquí: ${playerNames.join(', ')}`;
            }

            // Verificar si hay tareas disponibles en la sala
            const roomTasks = getRoomTasks(message.author.id, targetRoom);
            let taskMsg = '';
            if (roomTasks.length > 0) {
                const taskCommands = roomTasks.map(task => {
                    // Convertir la descripción de la tarea a un formato válido para comando
                    const taskCommand = task.description.toLowerCase().replace(/ /g, '_');
                    return `📋 Tienes 1 tarea pendiente aquí: ${task.description}\nUsa !${taskCommand} para realizarla`;
                });
                taskMsg = '\n' + taskCommands.join('\n');
            }

            return message.reply(`Te has movido a la ${room.name}.\n${presenceMsg}${taskMsg}`);
        } catch (error) {
            console.error('Error al mover al jugador:', error);
            return message.reply('Hubo un error al moverte a la sala.');
        }
    }
}; 