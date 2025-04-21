const { 
    gameState,
    getPlayerLocation,
    getPlayerRole,
    isPlayerBusy,
    addBody
} = require('../gameState');

// Tiempo de enfriamiento entre asesinatos (en milisegundos)
const COOLDOWN_TIME = 30000; // 30 segundos
const cooldowns = new Map();

module.exports = {
    name: 'matar',
    description: 'Elimina a un jugador (solo para impostores)',
    async execute(message) {
        try {
            // Verificar si hay un juego activo
            if (!gameState.isActive) {
                return message.reply('❌ No hay ningún juego activo.');
            }

            // Verificar si el jugador está en el juego
            if (!gameState.players.includes(message.author.id)) {
                return message.reply('❌ No estás en el juego.');
            }

            // Verificar si es impostor
            const playerRole = getPlayerRole(message.author.id);
            if (playerRole !== 'impostor') {
                return message.reply('❌ Solo el impostor puede usar este comando.');
            }

            // Verificar si el jugador está ocupado
            if (isPlayerBusy(message.author.id)) {
                return message.reply('❌ No puedes matar mientras estás ocupado.');
            }

            // Verificar tiempo de enfriamiento
            const lastKill = cooldowns.get(message.author.id) || 0;
            const timeLeft = COOLDOWN_TIME - (Date.now() - lastKill);
            if (timeLeft > 0) {
                const secondsLeft = Math.ceil(timeLeft / 1000);
                return message.reply(`❌ Debes esperar ${secondsLeft} segundos antes de poder matar de nuevo.`);
            }

            // Obtener jugadores en la misma sala
            const killerLocation = getPlayerLocation(message.author.id);
            const playersInRoom = gameState.players.filter(playerId => 
                playerId !== message.author.id && // No incluir al impostor
                getPlayerLocation(playerId) === killerLocation && // Mismo lugar
                getPlayerRole(playerId) !== 'muerto' // No está muerto
            );

            if (playersInRoom.length === 0) {
                return message.reply('❌ No hay jugadores vivos en esta sala.');
            }

            // Seleccionar un jugador aleatorio de la sala
            const victimId = playersInRoom[Math.floor(Math.random() * playersInRoom.length)];
            
            // Marcar al jugador como muerto y dejar el cadáver
            gameState.roles[victimId] = 'muerto';
            addBody(victimId, killerLocation);
            
            // Actualizar tiempo de enfriamiento
            cooldowns.set(message.author.id, Date.now());

            // Enviar mensajes
            const victim = await message.client.users.fetch(victimId);
            await victim.send('💀 Has sido eliminado. No puedes comunicarte con los demás jugadores.');
            return message.reply('🔪 Eliminación exitosa.');

        } catch (error) {
            console.error('Error al ejecutar el comando matar:', error);
            return message.reply('❌ Hubo un error al intentar eliminar al jugador.');
        }
    },
}; 