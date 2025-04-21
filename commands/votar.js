const { 
    gameState,
    getPlayerRole,
    endGame
} = require('../gameState');

// Sistema de votación
let votes = new Map();
let hasVoted = new Set();
let votingActive = false;

const resetVoting = () => {
    votes.clear();
    hasVoted.clear();
    votingActive = false;
};

const countVotes = (message) => {
    let voteCount = new Map();
    voteCount.set('skip', 0);

    // Contar votos
    for (const [targetId, count] of votes) {
        voteCount.set(targetId, count);
    }

    // Encontrar el más votado
    let maxVotes = 0;
    let ejected = 'skip';
    let tie = false;

    for (const [targetId, count] of voteCount) {
        if (count > maxVotes) {
            maxVotes = count;
            ejected = targetId;
            tie = false;
        } else if (count === maxVotes) {
            tie = true;
        }
    }

    // Si hay empate o la mayoría votó skip, nadie es expulsado
    if (tie || ejected === 'skip') {
        message.channel.send('🗳️ No se llegó a un consenso. Nadie fue expulsado.');
        return;
    }

    // Expulsar al jugador
    const ejectedRole = getPlayerRole(ejected);
    gameState.roles[ejected] = 'muerto';

    message.channel.send(`
🗳️ Los jugadores han votado...
👉 ${message.guild.members.cache.get(ejected)} ha sido expulsado.
${ejectedRole === 'impostor' ? '✅ ¡Era el impostor!' : '❌ No era el impostor...'}
    `);

    // Si expulsaron al impostor, terminar el juego
    if (ejectedRole === 'impostor') {
        endGame('impostor_caught');
    }
};

module.exports = {
    name: 'votar',
    description: 'Vota para expulsar a un jugador',
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

            if (!votingActive) {
                return message.reply('❌ No hay ninguna votación en curso.');
            }

            if (hasVoted.has(message.author.id)) {
                return message.reply('❌ Ya has votado. Los votos son finales.');
            }

            // Procesar el voto
            let targetId;
            if (args[0]?.toLowerCase() === 'skip') {
                targetId = 'skip';
            } else {
                // Obtener el ID del jugador mencionado
                const mention = message.mentions.users.first();
                if (!mention) {
                    return message.reply('❌ Debes mencionar a un jugador o usar "skip".');
                }
                if (!gameState.players.includes(mention.id)) {
                    return message.reply('❌ Ese jugador no está en el juego.');
                }
                if (getPlayerRole(mention.id) === 'muerto') {
                    return message.reply('❌ No puedes votar por un jugador muerto.');
                }
                targetId = mention.id;
            }

            // Registrar el voto
            votes.set(targetId, (votes.get(targetId) || 0) + 1);
            hasVoted.add(message.author.id);

            // Confirmar el voto
            if (targetId === 'skip') {
                message.reply('✅ Has votado por saltar la votación.');
            } else {
                message.reply(`✅ Has votado por ${message.guild.members.cache.get(targetId)}.`);
            }

            // Si todos han votado, contar votos inmediatamente
            const livingPlayers = gameState.players.filter(id => getPlayerRole(id) !== 'muerto').length;
            if (hasVoted.size >= livingPlayers) {
                countVotes(message);
                resetVoting();
            }

        } catch (error) {
            console.error('Error al votar:', error);
            return message.reply('❌ Hubo un error al procesar tu voto.');
        }
    },
}; 