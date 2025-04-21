const { gameState, getPlayerLocation } = require('../gameState');

module.exports = {
    name: 'tarea',
    async execute(message, args) {
        try {
            // Verificar si hay un juego activo
            if (!gameState.isActive) {
                return message.author.send('No hay ningún juego activo. Usa !crear_juego para crear uno.');
            }

            // Verificar si el jugador está en el juego
            if (!gameState.players.includes(message.author.id)) {
                return message.author.send('No estás en el juego. Usa !unirse para unirte.');
            }

            // Verificar si el jugador es tripulante
            if (gameState.roles[message.author.id] !== 'tripulante') {
                return message.author.send('Solo los tripulantes pueden realizar tareas.');
            }

            // Obtener la ubicación actual del jugador
            const currentLocation = getPlayerLocation(message.author.id);

            // Por ahora, mostrar un mensaje de ejemplo
            const taskEmbed = {
                color: 0x00ff00,
                title: '📋 Tus Tareas',
                description: `Estás en la sala: ${currentLocation}`,
                fields: [
                    {
                        name: 'Tarea 1',
                        value: 'Reparar el sistema de oxígeno',
                        inline: true
                    },
                    {
                        name: 'Tarea 2',
                        value: 'Calibrar los escáneres',
                        inline: true
                    }
                ],
                footer: {
                    text: 'Usa !mover [sala] para ir a la sala donde está tu tarea'
                }
            };

            return message.author.send({ embeds: [taskEmbed] });
        } catch (error) {
            console.error('Error al mostrar las tareas:', error);
            return message.author.send('Hubo un error al mostrar tus tareas.');
        }
    }
}; 