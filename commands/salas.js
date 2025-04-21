const { ChannelType } = require('discord.js');
const { gameState, getRooms, getPlayerLocation } = require('../gameState');

module.exports = {
    name: 'salas',
    async execute(message, args) {
        try {
            console.log(`[${new Date().toISOString()}] Comando !salas usado por ${message.author.tag} (${message.author.id})`);
            console.log(`Canal: ${message.channel.type === ChannelType.DM ? 'MD' : message.channel.name}`);
            console.log('Estado del juego:', gameState);

            // Verificar si hay un juego activo
            if (!gameState.isActive) {
                console.log('Error: No hay juego activo');
                return message.author.send('No hay ningún juego activo. Usa !crear_juego para crear uno.');
            }

            // Verificar si el jugador está en el juego
            if (!gameState.players.includes(message.author.id)) {
                console.log('Error: Jugador no está en el juego');
                return message.author.send('No estás en el juego. Usa !unirse para unirte.');
            }

            // Obtener la ubicación actual del jugador
            const currentLocation = getPlayerLocation(message.author.id);
            console.log(`Ubicación actual del jugador: ${currentLocation}`);

            // Obtener todas las salas
            const rooms = getRooms();
            console.log('Salas disponibles:', rooms.map(room => room.id).join(', '));

            // Crear un mensaje embebido con la lista de salas
            const roomsEmbed = {
                color: 0x0099ff,
                title: '🏠 Salas Disponibles',
                description: 'Estas son todas las salas a las que puedes moverte:',
                fields: rooms.map(room => ({
                    name: room.id,
                    value: `${room.description}\n${room.id === currentLocation ? '📍 **Estás aquí**' : ''}`,
                    inline: true
                })),
                footer: {
                    text: `Usa !mover [sala] para cambiar de ubicación. Ejemplo: !mover ${rooms[0].id}`
                }
            };

            console.log('Enviando mensaje embebido con las salas');
            try {
                const sent = await message.author.send({ embeds: [roomsEmbed] });
                console.log('Mensaje enviado exitosamente:', sent.id);
            } catch (sendError) {
                console.error('Error al enviar el mensaje:', sendError);
                return message.channel.send('Hubo un error al enviar el mensaje directo. ¿Tienes los MDs activados?');
            }
        } catch (error) {
            console.error('Error al mostrar las salas:', error);
            return message.author.send('Hubo un error al mostrar las salas.');
        }
    }
}; 