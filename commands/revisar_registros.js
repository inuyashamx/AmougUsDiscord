const { 
    gameState,
    getPlayerLocation,
    getPlayerTasks,
    setPlayerBusy
} = require('../gameState');

module.exports = {
    name: 'revisar_registros',
    description: 'Revisa los registros de la nave',
    async execute(message) {
        if (!gameState.isActive) {
            return message.reply('❌ No hay ningún juego activo.');
        }

        if (!gameState.players.includes(message.author.id)) {
            return message.reply('❌ No estás en el juego.');
        }

        const playerLocation = getPlayerLocation(message.author.id);
        if (playerLocation !== 'SalaA') {
            return message.reply('❌ Debes estar en la Sala de Administración para realizar esta tarea.');
        }

        const playerTasks = getPlayerTasks(message.author.id);
        const task = playerTasks.find(t => t.room === 'SalaA' && t.description === 'Revisar registros' && !t.completed);
        
        if (!task) {
            return message.reply('❌ No tienes pendiente la tarea de revisar registros.');
        }

        try {
            setPlayerBusy(message.author.id, true);
            const msg = await message.reply('📋 Iniciando revisión de registros...\n⏳ No te muevas durante el proceso (10 segundos)');

            // Fase 1: Acceso
            setTimeout(async () => {
                await msg.edit('📋 Accediendo a la base de datos de registros... [25%]\n▰▰▰▱▱▱▱▱▱▱');
                
                // Fase 2: Análisis
                setTimeout(async () => {
                    await msg.edit('📋 Analizando registros del sistema... [50%]\n▰▰▰▰▰▱▱▱▱▱');
                    
                    // Fase 3: Verificación
                    setTimeout(async () => {
                        await msg.edit('📋 Verificando anomalías en registros... [75%]\n▰▰▰▰▰▰▰▱▱▱');
                        
                        // Fase 4: Finalización
                        setTimeout(async () => {
                            task.completed = true;
                            setPlayerBusy(message.author.id, false);
                            await msg.edit('✅ Revisión de registros completada exitosamente [100%]\n▰▰▰▰▰▰▰▰▰▰');
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