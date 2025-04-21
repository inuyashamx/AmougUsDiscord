const { 
    gameState,
    getPlayerLocation,
    getPlayerTasks,
    setPlayerBusy
} = require('../gameState');

module.exports = {
    name: 'reparar_cableado',
    description: 'Repara el cableado dañado de la nave',
    async execute(message) {
        if (!gameState.isActive) {
            return message.reply('❌ No hay ningún juego activo.');
        }

        if (!gameState.players.includes(message.author.id)) {
            return message.reply('❌ No estás en el juego.');
        }

        const playerLocation = getPlayerLocation(message.author.id);
        if (playerLocation !== 'SalaB') {
            return message.reply('❌ Debes estar en la Sala de Ingeniería para realizar esta tarea.');
        }

        const playerTasks = getPlayerTasks(message.author.id);
        const task = playerTasks.find(t => t.room === 'SalaB' && t.description === 'Reparar cableado' && !t.completed);
        
        if (!task) {
            return message.reply('❌ No tienes pendiente la tarea de reparar el cableado.');
        }

        try {
            setPlayerBusy(message.author.id, true);
            const msg = await message.reply('🔌 Iniciando reparación del cableado...\n⏳ No te muevas durante el proceso (10 segundos)');

            // Fase 1: Diagnóstico
            setTimeout(async () => {
                await msg.edit('🔌 Diagnosticando cables dañados... [25%]\n▰▰▰▱▱▱▱▱▱▱');
                
                // Fase 2: Reparación
                setTimeout(async () => {
                    await msg.edit('🔌 Reparando conexiones defectuosas... [50%]\n▰▰▰▰▰▱▱▱▱▱');
                    
                    // Fase 3: Pruebas
                    setTimeout(async () => {
                        await msg.edit('🔌 Realizando pruebas de conductividad... [75%]\n▰▰▰▰▰▰▰▱▱▱');
                        
                        // Fase 4: Finalización
                        setTimeout(async () => {
                            task.completed = true;
                            setPlayerBusy(message.author.id, false);
                            await msg.edit('✅ Reparación del cableado completada exitosamente [100%]\n▰▰▰▰▰▰▰▰▰▰');
                        }, 2500);
                    }, 2500);
                }, 2500);
            }, 2500);

        } catch (error) {
            setPlayerBusy(message.author.id, false);
            message.reply('❌ Ocurrió un error al realizar la tarea.');
        }
    },
}; 