const { 
    gameState,
    getPlayerLocation,
    getPlayerRole,
    getUnreportedBodies,
    reportBody
} = require('../gameState');

// Duración de la discusión en milisegundos
const DISCUSSION_TIME = 60000; // 60 segundos
let votingActive = false;
let reportCooldown = new Map();

module.exports = {
    name: 'reportar',
    description: 'Reporta un cuerpo o inicia una discusión de emergencia',
    async execute(message) {
        try {
            // Verificaciones básicas
            if (!gameState.isActive) {
                return message.reply('❌ No hay ningún juego activo.');
            }

            if (!gameState.players.includes(message.author.id)) {
                return message.reply('❌ No estás en el juego.');
            }

            if (getPlayerRole(message.author.id) === 'muerto') {
                return message.reply('❌ Los jugadores muertos no pueden reportar.');
            }

            if (votingActive) {
                return message.reply('❌ Ya hay una votación en curso.');
            }

            // Verificar cooldown
            const lastReport = reportCooldown.get(message.author.id) || 0;
            const timeLeft = 30000 - (Date.now() - lastReport); // 30 segundos de cooldown
            if (timeLeft > 0) {
                return message.reply(`❌ Debes esperar ${Math.ceil(timeLeft/1000)} segundos antes de reportar de nuevo.`);
            }

            // Verificar si hay cadáveres en la sala
            const location = getPlayerLocation(message.author.id);
            const bodies = getUnreportedBodies(location);
            
            if (bodies.length === 0) {
                return message.reply('❌ No hay nada que reportar en esta sala.');
            }

            // Marcar el cadáver como reportado
            reportBody(location, message.author.id);

            // Iniciar discusión
            votingActive = true;
            
            // Obtener nombres de las víctimas
            const victimNames = await Promise.all(bodies.map(async body => {
                const user = await message.client.users.fetch(body.playerId);
                return user.username;
            }));
            
            // Mensaje inicial
            await message.channel.send(`
🚨 **¡CUERPO REPORTADO!** 🚨
${message.author} ha encontrado ${bodies.length === 1 ? 'el cuerpo de' : 'los cuerpos de'} ${victimNames.join(', ')} en ${location}

⏰ Tienen 60 segundos para discutir
Después podrán votar usando !votar @jugador
También pueden usar !votar skip para saltarse la votación

¡La discusión comienza AHORA!
            `);

            // Actualizar cooldown
            reportCooldown.set(message.author.id, Date.now());

            // Temporizador para la discusión
            setTimeout(async () => {
                if (votingActive) {
                    await message.channel.send(`
⚠️ **¡TIEMPO DE DISCUSIÓN TERMINADO!** ⚠️
Ahora tienen 30 segundos para votar:

Usar !votar @jugador para votar por alguien
Usar !votar skip para saltarse la votación

Los votos son finales y no se pueden cambiar.
                    `);

                    // Temporizador para la votación
                    setTimeout(async () => {
                        votingActive = false;
                        await message.channel.send('🗳️ ¡La votación ha terminado! Nadie fue expulsado.');
                    }, 30000); // 30 segundos para votar
                }
            }, DISCUSSION_TIME);

        } catch (error) {
            console.error('Error al reportar:', error);
            votingActive = false;
            return message.reply('❌ Hubo un error al procesar el reporte.');
        }
    },
}; 