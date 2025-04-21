const { 
    gameState,
    getPlayerRole,
    endGame
} = require('../gameState');

// Referencia al módulo reportar para acceder a sus variables
const reportar = require('./reportar');

module.exports = {
    name: 'votar',
    description: 'Vota por un jugador durante una discusión',
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
                return message.reply('❌ Los jugadores muertos no pueden votar.');
            }

            if (!reportar.votingActive) {
                return message.reply('❌ No hay ninguna votación en curso.');
            }

            // Verificar si el jugador ya votó
            if (reportar.currentVotes.has(message.author.id)) {
                return message.reply('❌ Ya has votado. Los votos son finales y no se pueden cambiar.');
            }

            // Manejar el voto "skip"
            if (args[0]?.toLowerCase() === 'skip') {
                reportar.currentVotes.set(message.author.id, 'skip');
                
                // Mostrar estado de la votación
                const totalVotes = reportar.currentVotes.size;
                const alivePlayers = gameState.players.filter(id => getPlayerRole(id) !== 'muerto').length;
                const remainingVoters = alivePlayers - totalVotes;

                let voteMessage = '✅ Has votado por saltarte la votación.\n\n';
                voteMessage += await getVotingStatus(message.client, totalVotes, alivePlayers, remainingVoters);

                return message.reply(voteMessage);
            }

            // Obtener el jugador mencionado
            const mentions = message.mentions.users;
            if (mentions.size === 0) {
                return message.reply('❌ Debes mencionar a un jugador (@jugador) o usar "skip".');
            }

            const votedPlayer = mentions.first();

            // Verificar si el jugador votado está en el juego
            if (!gameState.players.includes(votedPlayer.id)) {
                return message.reply('❌ El jugador votado no está en el juego.');
            }

            // Verificar si el jugador votado está muerto
            if (getPlayerRole(votedPlayer.id) === 'muerto') {
                return message.reply('❌ No puedes votar por un jugador muerto.');
            }

            // No permitir votar por uno mismo
            if (votedPlayer.id === message.author.id) {
                return message.reply('❌ No puedes votarte a ti mismo.');
            }

            // Registrar el voto
            reportar.currentVotes.set(message.author.id, votedPlayer.id);
            
            // Mostrar estado de la votación
            const totalVotes = reportar.currentVotes.size;
            const alivePlayers = gameState.players.filter(id => getPlayerRole(id) !== 'muerto').length;
            const remainingVoters = alivePlayers - totalVotes;

            let voteMessage = `✅ Has votado por ${votedPlayer.username}.\n\n`;
            voteMessage += await getVotingStatus(message.client, totalVotes, alivePlayers, remainingVoters);

            return message.reply(voteMessage);

        } catch (error) {
            console.error('Error al votar:', error);
            return message.reply('❌ Hubo un error al procesar tu voto.');
        }
    }
};

// Función auxiliar para obtener el estado de la votación
async function getVotingStatus(client, totalVotes, alivePlayers, remainingVoters) {
    let status = `📊 Estado de la votación: ${totalVotes}/${alivePlayers} votos emitidos\n`;
    
    // Mostrar votos actuales
    const voteCount = new Map();
    let skipVotes = 0;

    for (const [voterId, votedForId] of reportar.currentVotes) {
        try {
            if (votedForId === 'skip') {
                skipVotes++;
            } else {
                voteCount.set(votedForId, (voteCount.get(votedForId) || 0) + 1);
            }
        } catch (error) {
            console.error('Error al contar votos:', error);
        }
    }

    // Mostrar resumen de votos
    if (skipVotes > 0) {
        status += `Skip: ${skipVotes} votos\n`;
    }

    for (const [playerId, votes] of voteCount) {
        try {
            const player = await client.users.fetch(playerId);
            status += `${player.username}: ${votes} votos\n`;
        } catch (error) {
            console.error('Error al obtener nombre de jugador:', error);
        }
    }

    // Mostrar jugadores restantes
    if (remainingVoters > 0) {
        status += `\n⏳ Faltan ${remainingVoters} jugadores por votar`;
    } else {
        status += `\n✨ ¡Todos los jugadores han votado!`;
    }

    return status;
} 