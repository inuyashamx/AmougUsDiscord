const { 
    gameState,
    getPlayerLocation,
    getPlayerRole,
    getUnreportedBodies,
    reportBody,
    endGame
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
let updateInterval = null;
let voteUpdateInterval = null;
let currentDiscussionMessage = null;
let currentVotingMessage = null;

const cleanupTimeouts = () => {
    if (discussionTimeout) clearTimeout(discussionTimeout);
    if (votingTimeout) clearTimeout(votingTimeout);
    if (updateInterval) clearInterval(updateInterval);
    if (voteUpdateInterval) clearInterval(voteUpdateInterval);
};

// Función para verificar si un jugador sigue en el juego
const isPlayerStillInGame = (playerId) => {
    return gameState.players.includes(playerId) && getPlayerRole(playerId) !== 'muerto';
};

// Función para limpiar votos de jugadores que se desconectaron o murieron
const cleanupVotes = () => {
    // Crear una copia del Map para iterar
    const votesToCheck = new Map(currentVotes);
    
    // Eliminar votos de jugadores que ya no están en el juego
    for (const [voterId] of votesToCheck) {
        if (!isPlayerStillInGame(voterId)) {
            currentVotes.delete(voterId);
        }
    }
    
    // Crear otra copia para el segundo bucle
    const votesToCheck2 = new Map(currentVotes);
    
    // Eliminar votos para jugadores que ya no están en el juego
    for (const [voterId, votedForId] of votesToCheck2) {
        if (votedForId !== 'skip' && !isPlayerStillInGame(votedForId)) {
            currentVotes.delete(voterId);
        }
    }
};

// Función para actualizar el mensaje de discusión
const updateDiscussionMessage = async () => {
    if (currentDiscussionMessage && currentDiscussionMessage.editable) {
        try {
            const timeLeft = Math.ceil((discussionTimeout._idleStart + discussionTimeout._idleTimeout - Date.now()) / 1000);
            if (timeLeft > 0) {
                const content = currentDiscussionMessage.content.replace(/⌛ Tiempo restante: \d+s/, `⌛ Tiempo restante: ${timeLeft}s`);
                await currentDiscussionMessage.edit(content);
            }
        } catch (error) {
            console.error('Error al actualizar mensaje de discusión:', error);
        }
    }
};

// Función para actualizar el mensaje de votación
const updateVotingMessage = async () => {
    if (currentVotingMessage && currentVotingMessage.editable) {
        try {
            const timeLeft = Math.ceil((votingTimeout._idleStart + votingTimeout._idleTimeout - Date.now()) / 1000);
            if (timeLeft > 0) {
                const content = currentVotingMessage.content.replace(/⌛ Tiempo restante: \d+s/, `⌛ Tiempo restante: ${timeLeft}s`);
                await currentVotingMessage.edit(content);
            }
        } catch (error) {
            console.error('Error al actualizar mensaje de votación:', error);
        }
    }
};

// Función para obtener un resumen de la votación
async function getVotingSummary(client) {
    let summary = '';
    const voteCount = new Map();
    let skipVotes = 0;
    const alivePlayers = gameState.players.filter(id => getPlayerRole(id) !== 'muerto').length;
    
    // Contar votos
    for (const [voterId, votedForId] of currentVotes) {
        if (votedForId === 'skip') {
            skipVotes++;
        } else {
            voteCount.set(votedForId, (voteCount.get(votedForId) || 0) + 1);
        }
    }

    // Mostrar estado actual
    summary += `📊 Votos actuales (${currentVotes.size}/${alivePlayers}):\n`;
    
    if (skipVotes > 0) {
        summary += `• Skip: ${skipVotes} votos\n`;
    }

    // Mostrar votos por jugador
    for (const [playerId, votes] of voteCount) {
        try {
            const user = await client.users.fetch(playerId);
            summary += `• ${user.username}: ${votes} votos\n`;
        } catch (error) {
            console.error('Error al obtener nombre de jugador:', error);
            summary += `• Jugador desconocido (${playerId}): ${votes} votos\n`;
        }
    }

    // Mostrar jugadores que no han votado
    const nonVoters = gameState.players.filter(id => 
        getPlayerRole(id) !== 'muerto' && !currentVotes.has(id)
    );

    if (nonVoters.length > 0) {
        summary += '\n💤 Faltan por votar:\n';
        for (const id of nonVoters) {
            try {
                const user = await client.users.fetch(id);
                summary += `• ${user.username}\n`;
            } catch (error) {
                console.error('Error al obtener nombre de jugador:', error);
                summary += `• Jugador desconocido (${id})\n`;
            }
        }
    }

    return summary;
}

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

            // Verificar si hay suficientes jugadores vivos para una votación
            const alivePlayers = gameState.players.filter(id => getPlayerRole(id) !== 'muerto').length;
            if (alivePlayers < 3) {
                return message.reply('❌ No hay suficientes jugadores vivos para iniciar una votación (mínimo 3).');
            }

            // Limpiar timeouts anteriores
            cleanupTimeouts();

            // Marcar el cadáver como reportado
            reportBody(location, message.author.id);

            // Iniciar discusión
            votingActive = true;
            currentVotes.clear();
            
            // Obtener nombres de las víctimas y jugadores vivos
            const [victimNames, alivePlayersList] = await Promise.all([
                Promise.all(bodies.map(async body => {
                    try {
                        const user = await message.client.users.fetch(body.playerId);
                        return user.username;
                    } catch (error) {
                        console.error('Error al obtener nombre de víctima:', error);
                        return 'Jugador Desconocido';
                    }
                })),
                Promise.all(
                    gameState.players
                        .filter(id => getPlayerRole(id) !== 'muerto')
                        .map(async id => {
                            try {
                                const user = await message.client.users.fetch(id);
                                return { id, username: user.username };
                            } catch (error) {
                                console.error('Error al obtener nombre de jugador:', error);
                                return { id, username: 'Jugador Desconocido' };
                            }
                        })
                )
            ]);

            // Mensaje inicial de discusión
            currentDiscussionMessage = await message.channel.send(`
🚨 **¡CUERPO REPORTADO!** 🚨
${message.author} ha encontrado ${bodies.length === 1 ? 'el cuerpo de' : 'los cuerpos de'} ${victimNames.join(', ')} en ${location}

📍 Estado de las salas cuando se reportó:
${await getPlayerLocations(message.client)}

👥 Jugadores vivos (${alivePlayersList.length}):
${alivePlayersList.map(player => `• ${player.username}`).join('\n')}

⏰ Fase de discusión
⌛ Tiempo restante: 60s

💭 Discutan quién podría ser el impostor...

❗ Información importante:
• Usen este tiempo para compartir información
• Observen la ubicación de cada jugador
• Consideren quién estaba cerca de la escena
• Recuerden que el impostor puede mentir
• Los cuerpos reportados ya no serán visibles
`);

            // Actualizar contador de discusión
            updateInterval = setInterval(updateDiscussionMessage, 1000);

            // Actualizar cooldown
            reportCooldown.set(message.author.id, Date.now());

            // Temporizador para la discusión
            discussionTimeout = setTimeout(async () => {
                if (updateInterval) clearInterval(updateInterval);
                
                if (votingActive) {
                    // Mensaje de votación
                    currentVotingMessage = await message.channel.send(`
⚠️ **¡COMIENZA LA VOTACIÓN!** ⚠️
Tienen 30 segundos para decidir:

${await getVotingSummary(message.client)}

📝 Comandos disponibles:
• !votar @jugador - Para votar por un jugador
• !votar skip - Para saltarse la votación

⏰ Fase de votación
⌛ Tiempo restante: 30s

❗ Recuerden:
• Los votos son finales y no se pueden cambiar
• No votar cuenta como "skip"
• La mayoría decide
• En caso de empate, nadie es expulsado
• El impostor también debe votar para no levantar sospechas
`);

                    // Actualizar contador de votación y resumen
                    voteUpdateInterval = setInterval(async () => {
                        try {
                            const timeLeft = Math.ceil((votingTimeout._idleStart + votingTimeout._idleTimeout - Date.now()) / 1000);
                            if (timeLeft > 0) {
                                const content = `
⚠️ **¡VOTACIÓN EN CURSO!** ⚠️
Tiempo restante: ${timeLeft}s

${await getVotingSummary(message.client)}

📝 Comandos disponibles:
• !votar @jugador - Para votar por un jugador
• !votar skip - Para saltarse la votación
`;
                                await currentVotingMessage.edit(content);
                            }
                        } catch (error) {
                            console.error('Error al actualizar mensaje de votación:', error);
                        }
                    }, 5000); // Actualizar cada 5 segundos

                    // Temporizador para la votación
                    votingTimeout = setTimeout(async () => {
                        if (voteUpdateInterval) clearInterval(voteUpdateInterval);
                        
                        if (votingActive) {
                            // Limpiar votos de jugadores desconectados
                            cleanupVotes();

                            // Contar votos
                            const voteCount = new Map();
                            let skipVotes = 0;
                            let votesMessage = '🗳️ **Resultados de la votación:**\n\n';
                            
                            // Procesar votos emitidos
                            for (const [voterId, votedForId] of currentVotes) {
                                try {
                                    const voter = await message.client.users.fetch(voterId);
                                    if (votedForId === 'skip') {
                                        skipVotes++;
                                        votesMessage += `• ${voter.username} ➡️ skip\n`;
                                    } else {
                                        try {
                                            const votedFor = await message.client.users.fetch(votedForId);
                                            votesMessage += `• ${voter.username} ➡️ ${votedFor.username}\n`;
                                            voteCount.set(votedForId, (voteCount.get(votedForId) || 0) + 1);
                                        } catch (error) {
                                            console.error('Error al obtener nombre del jugador votado:', error);
                                            votesMessage += `• ${voter.username} ➡️ Jugador desconocido (${votedForId})\n`;
                                            voteCount.set(votedForId, (voteCount.get(votedForId) || 0) + 1);
                                        }
                                    }
                                } catch (error) {
                                    console.error('Error al procesar voto:', error);
                                    currentVotes.delete(voterId);
                                }
                            }

                            // Mostrar jugadores que no votaron
                            const nonVoters = gameState.players.filter(id => 
                                isPlayerStillInGame(id) && !currentVotes.has(id)
                            );
                            
                            if (nonVoters.length > 0) {
                                votesMessage += '\n💤 **No votaron:**\n';
                                for (const id of nonVoters) {
                                    try {
                                        const user = await message.client.users.fetch(id);
                                        votesMessage += `• ${user.username}\n`;
                                    } catch (error) {
                                        console.error('Error al obtener no votante:', error);
                                        votesMessage += `• Jugador desconocido (${id})\n`;
                                    }
                                }
                            }

                            // Determinar resultado
                            let maxVotes = skipVotes;
                            let ejectedPlayers = [];
                            let tie = false;

                            // Encontrar el máximo de votos
                            for (const [player, votes] of voteCount) {
                                if (votes > maxVotes) {
                                    maxVotes = votes;
                                    ejectedPlayers = [player];
                                    tie = false;
                                } else if (votes === maxVotes && votes > skipVotes) {
                                    ejectedPlayers.push(player);
                                    tie = true;
                                }
                            }
                            
                            // Si el máximo es igual a skipVotes, es un empate con skip
                            if (maxVotes === skipVotes && ejectedPlayers.length === 0) {
                                tie = true;
                            }

                            // Mensaje final con el resultado
                            votesMessage += '\n📢 **Resultado final:**\n';
                            
                            if (tie || maxVotes === 0) {
                                votesMessage += '🤝 No hubo consenso en la votación. Nadie fue expulsado.';
                            } else if (skipVotes === maxVotes) {
                                votesMessage += '🤷 La mayoría decidió saltarse la votación. Nadie fue expulsado.';
                            } else if (ejectedPlayers.length === 1) {
                                const ejectedPlayer = ejectedPlayers[0];
                                const ejectedUser = await message.client.users.fetch(ejectedPlayer);
                                const wasImpostor = gameState.roles[ejectedPlayer] === 'impostor';
                                gameState.roles[ejectedPlayer] = 'muerto';
                                
                                votesMessage += `⛔ ${ejectedUser.username} fue expulsado de la nave.\n`;
                                votesMessage += wasImpostor ? 
                                    '🎯 ¡Era el impostor!' : 
                                    '😱 ¡No era el impostor!';
                                
                                const remainingAlive = gameState.players.filter(id => getPlayerRole(id) !== 'muerto').length;
                                votesMessage += `\n\n👥 Quedan ${remainingAlive} jugadores vivos.`;

                                // Terminar el juego si el impostor fue expulsado
                                if (wasImpostor) {
                                    await message.channel.send(votesMessage);
                                    // Limpiar variables antes de terminar el juego
                                    votingActive = false;
                                    currentVotes.clear();
                                    cleanupTimeouts();
                                    endGame('impostor_caught');
                                    return;
                                }
                            }

                            await message.channel.send(votesMessage);
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
            cleanupTimeouts();
            return message.reply('❌ Hubo un error al procesar el reporte.');
        }
    }
};

// Exportar el comando y las variables necesarias
module.exports = {
    ...command,
    get votingActive() {
        return votingActive;
    },
    get currentVotes() {
        return currentVotes;
    },
    set votingActive(value) {
        votingActive = value;
    }
};

// Función auxiliar para obtener las ubicaciones de los jugadores
async function getPlayerLocations(client) {
    let locationInfo = '';
    const locationGroups = new Map();

    // Agrupar jugadores por ubicación
    for (const playerId of gameState.players) {
        const role = getPlayerRole(playerId);
        if (role !== 'muerto') {
            const location = getPlayerLocation(playerId);
            if (!locationGroups.has(location)) {
                locationGroups.set(location, { players: [], bodies: [] });
            }
            locationGroups.get(location).players.push(playerId);
        }
    }

    // Agregar información de cadáveres
    for (const [location, bodies] of Object.entries(gameState.bodies)) {
        if (!locationGroups.has(location)) {
            locationGroups.set(location, { players: [], bodies: [] });
        }
        locationGroups.get(location).bodies = bodies.filter(body => !body.reportedBy);
    }

    // Construir el mensaje de ubicaciones
    for (const [location, info] of locationGroups) {
        const room = getRoomById(location);
        let roomInfo = '';
        
        if (room) {
            roomInfo = `${room.name} (${location}):\n`;
        } else {
            roomInfo = `Sala desconocida (${location}):\n`;
        }

        // Agregar jugadores vivos
        if (info.players.length > 0) {
            const playerNames = await Promise.all(
                info.players.map(async id => {
                    try {
                        const user = await client.users.fetch(id);
                        return user.username;
                    } catch (error) {
                        console.error('Error al obtener nombre de jugador:', error);
                        return 'Jugador Desconocido';
                    }
                })
            );
            roomInfo += `👥 Jugadores: ${playerNames.join(', ')}\n`;
        }

        // Agregar cadáveres no reportados
        if (info.bodies.length > 0) {
            roomInfo += `💀 Cadáveres: ${info.bodies.length}\n`;
        }

        locationInfo += roomInfo + '\n';
    }

    return locationInfo || 'No hay información de ubicación disponible';
} 