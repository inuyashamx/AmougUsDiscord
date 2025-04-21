const { 
    gameState,
    getPlayerLocation,
    getPlayerRole,
    getUnreportedBodies,
    reportBody
} = require('../gameState');

// Duración de la discusión y votación en milisegundos
const DISCUSSION_TIME = 60000; // 60 segundos
const VOTING_TIME = 30000; // 30 segundos
const REPORT_COOLDOWN = 30000; // 30 segundos de cooldown

// Sistema de votación
let votingActive = false;
let currentVotes = new Map();
let reportCooldown = new Map();
let votingTimeout = null;
let discussionTimeout = null;

const command = {
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

            const playerRole = getPlayerRole(message.author.id);
            if (playerRole === 'muerto') {
                return message.reply('❌ Los jugadores muertos no pueden reportar.');
            }

            if (votingActive) {
                return message.reply('❌ Ya hay una votación en curso.');
            }

            // Verificar cooldown
            const lastReport = reportCooldown.get(message.author.id) || 0;
            const timeLeft = REPORT_COOLDOWN - (Date.now() - lastReport);
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
            currentVotes.clear();
            
            // Obtener nombres de las víctimas
            const victimNames = await Promise.all(bodies.map(async body => {
                try {
                    const user = await message.client.users.fetch(body.playerId);
                    return user.username;
                } catch (error) {
                    console.error('Error al obtener nombre de víctima:', error);
                    return 'Jugador Desconocido';
                }
            }));
            
            // Mensaje inicial
            const initialMessage = await message.channel.send(`
🚨 **¡CUERPO REPORTADO!** 🚨
${message.author} ha encontrado ${bodies.length === 1 ? 'el cuerpo de' : 'los cuerpos de'} ${victimNames.join(', ')} en ${location}

⏰ Tienen 60 segundos para discutir
Después podrán votar usando !votar @jugador
También pueden usar !votar skip para saltarse la votación

¡La discusión comienza AHORA!
            `);

            // Actualizar cooldown
            reportCooldown.set(message.author.id, Date.now());

            // Limpiar timeouts anteriores si existen
            if (discussionTimeout) clearTimeout(discussionTimeout);
            if (votingTimeout) clearTimeout(votingTimeout);

            // Temporizador para la discusión
            discussionTimeout = setTimeout(async () => {
                if (votingActive) {
                    await message.channel.send(`
⚠️ **¡TIEMPO DE DISCUSIÓN TERMINADO!** ⚠️
Ahora tienen 30 segundos para votar:

Usar !votar @jugador para votar por alguien
Usar !votar skip para saltarse la votación

Los votos son finales y no se pueden cambiar.
                    `);

                    // Temporizador para la votación
                    votingTimeout = setTimeout(async () => {
                        if (votingActive) {
                            // Contar votos
                            const voteCount = new Map();
                            let skipVotes = 0;

                            for (const [voter, votedFor] of currentVotes) {
                                if (votedFor === 'skip') {
                                    skipVotes++;
                                } else {
                                    voteCount.set(votedFor, (voteCount.get(votedFor) || 0) + 1);
                                }
                            }

                            // Determinar resultado
                            let maxVotes = 0;
                            let ejectedPlayer = null;

                            for (const [player, votes] of voteCount) {
                                if (votes > maxVotes) {
                                    maxVotes = votes;
                                    ejectedPlayer = player;
                                }
                            }

                            // Mensaje final
                            let resultMessage = '🗳️ **Resultados de la votación:**\n';
                            if (skipVotes > maxVotes) {
                                resultMessage += 'La mayoría decidió saltarse la votación. Nadie fue expulsado.';
                            } else if (ejectedPlayer) {
                                const ejectedUser = await message.client.users.fetch(ejectedPlayer);
                                gameState.roles[ejectedPlayer] = 'muerto';
                                resultMessage += `${ejectedUser.username} fue expulsado de la nave.\n`;
                                resultMessage += gameState.roles[ejectedPlayer] === 'impostor' ? 
                                    '🎯 ¡Era el impostor!' : 
                                    '😱 ¡No era el impostor!';
                            } else {
                                resultMessage += 'No hubo suficientes votos. Nadie fue expulsado.';
                            }

                            await message.channel.send(resultMessage);
                            votingActive = false;
                            currentVotes.clear();
                        }
                    }, VOTING_TIME);
                }
            }, DISCUSSION_TIME);

        } catch (error) {
            console.error('Error al reportar:', error);
            votingActive = false;
            currentVotes.clear();
            if (discussionTimeout) clearTimeout(discussionTimeout);
            if (votingTimeout) clearTimeout(votingTimeout);
            return message.reply('❌ Hubo un error al procesar el reporte.');
        }
    }
};

// Exportar el comando y las variables necesarias para el sistema de votación
module.exports = {
    ...command,
    votingActive,
    currentVotes
}; 