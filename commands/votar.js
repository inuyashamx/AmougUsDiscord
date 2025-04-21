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
                return message.reply('✅ Has votado por saltarte la votación.');
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
            
            // Confirmar el voto
            return message.reply(`✅ Has votado por ${votedPlayer.username}.`);

        } catch (error) {
            console.error('Error al votar:', error);
            return message.reply('❌ Hubo un error al procesar tu voto.');
        }
    }
}; 