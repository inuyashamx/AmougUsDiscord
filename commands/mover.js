const { 
    gameState,
    getPlayerLocation,
    setPlayerLocation,
    getRoomById,
    getRoomTasks,
    getPlayerRole,
    getUnreportedBodies
} = require('../gameState');

module.exports = {
    name: 'mover',
    description: 'Muévete a otra sala',
    async execute(message, args) {
        try {
            // Verificaciones básicas
            if (!gameState.isActive) {
                return message.reply('❌ No hay ningún juego activo.');
            }

            if (!gameState.players.includes(message.author.id)) {
                return message.reply('❌ No estás en el juego.');
            }

            if (getPlayerRole(message.author.id) === 'muerto') {
                return message.reply('❌ Los jugadores muertos no pueden moverse.');
            }

            if (!args[0]) {
                return message.reply('❌ Debes especificar una sala (ejemplo: !mover SalaA)');
            }

            const targetRoom = args[0];
            const room = getRoomById(targetRoom);

            if (!room) {
                return message.reply('❌ Sala no válida. Usa !salas para ver las salas disponibles.');
            }

            // Intentar mover al jugador
            if (!setPlayerLocation(message.author.id, targetRoom)) {
                return message.reply('❌ No puedes moverte mientras estás ocupado.');
            }

            // Obtener jugadores en la sala
            const playersInRoom = gameState.players.filter(playerId => 
                getPlayerLocation(playerId) === targetRoom &&
                playerId !== message.author.id &&
                getPlayerRole(playerId) !== 'muerto'
            );

            // Obtener cadáveres en la sala
            const bodies = getUnreportedBodies(targetRoom);

            // Construir mensaje de entrada
            let entryMessage = `🚪 Has entrado a ${room.name}`;

            // Agregar información de jugadores presentes
            if (playersInRoom.length > 0) {
                const playerNames = await Promise.all(playersInRoom.map(async id => {
                    const user = await message.client.users.fetch(id);
                    return user.username;
                }));
                entryMessage += `\n👥 Jugadores presentes: ${playerNames.join(', ')}`;
            }

            // Agregar información de cadáveres
            if (bodies.length > 0) {
                entryMessage += `\n💀 ¡Has encontrado ${bodies.length} ${bodies.length === 1 ? 'cadáver' : 'cadáveres'} en esta sala!\nUsa !reportar para iniciar una discusión.`;
            }

            // Obtener tareas pendientes en la sala
            const playerTasks = getRoomTasks(message.author.id, targetRoom);
            if (playerTasks.length > 0) {
                entryMessage += '\n\n📋 Tareas pendientes en esta sala:';
                playerTasks.forEach(task => {
                    // Convertir el nombre de la tarea a formato de comando
                    const commandName = task.description.toLowerCase().replace(/ /g, '_');
                    entryMessage += `\n• ${task.description} (!${commandName})`;
                });
            }

            return message.reply(entryMessage);

        } catch (error) {
            console.error('Error al mover:', error);
            return message.reply('❌ Hubo un error al intentar moverte.');
        }
    },
}; 