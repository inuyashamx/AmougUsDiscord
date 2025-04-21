const { 
    gameState,
    getPlayerLocation,
    getPlayerTasks,
    setPlayerBusy,
    completeTask,
    getPlayerRole
} = require('../gameState');

module.exports = {
    name: 'revisar_registros',
    description: 'Revisa los registros de la nave',
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

            // Verificar que no sea impostor
            const playerRole = getPlayerRole(message.author.id);
            if (playerRole === 'impostor') {
                return message.reply('❌ Los impostores no pueden realizar tareas.');
            }

            // Verificar si el jugador está en la sala correcta
            const playerLocation = getPlayerLocation(message.author.id);
            if (playerLocation !== 'SalaA') {
                return message.reply('❌ Debes estar en la Sala de Administración para realizar esta tarea.');
            }

            // Verificar si el jugador tiene esta tarea pendiente
            const playerTasks = getPlayerTasks(message.author.id);
            const task = playerTasks.find(t => 
                t.room === 'SalaA' && 
                t.description === 'Revisar registros' && 
                !t.completed
            );

            if (!task) {
                return message.reply('❌ No tienes pendiente la tarea de revisar registros.');
            }

            // Marcar al jugador como ocupado
            setPlayerBusy(message.author.id, true);

            // Proceso de revisión (simulado)
            const msg = await message.reply('📋 Iniciando revisión de registros...\n*No puedes moverte durante 10 segundos*\n▓░░░░░░░░░ 10%');
            
            // Fase 1: 2.5 segundos
            setTimeout(async () => {
                try {
                    await msg.edit('📋 Accediendo a la base de datos...\n▓▓▓░░░░░░░ 30%');
                    
                    // Fase 2: 5 segundos
                    setTimeout(async () => {
                        try {
                            await msg.edit('📋 Analizando registros del sistema...\n▓▓▓▓▓░░░░░ 50%');
                            
                            // Fase 3: 7.5 segundos
                            setTimeout(async () => {
                                try {
                                    await msg.edit('📋 Verificando anomalías...\n▓▓▓▓▓▓▓░░░ 70%');
                                    
                                    // Fase 4: 10 segundos
                                    setTimeout(async () => {
                                        try {
                                            // Completar la tarea
                                            completeTask(message.author.id, 'SalaA', 'Revisar registros');
                                            // Liberar al jugador
                                            setPlayerBusy(message.author.id, false);
                                            // Enviar mensaje de confirmación
                                            await msg.edit('✅ Registros revisados correctamente\n▓▓▓▓▓▓▓▓▓▓ 100%');
                                        } catch (error) {
                                            console.error('Error al completar la tarea:', error);
                                            setPlayerBusy(message.author.id, false);
                                        }
                                    }, 2500); // 10 segundos total
                                } catch (error) {
                                    console.error('Error durante la verificación:', error);
                                    setPlayerBusy(message.author.id, false);
                                }
                            }, 2500); // 7.5 segundos
                        } catch (error) {
                            console.error('Error durante el análisis:', error);
                            setPlayerBusy(message.author.id, false);
                        }
                    }, 2500); // 5 segundos
                } catch (error) {
                    console.error('Error durante el acceso:', error);
                    setPlayerBusy(message.author.id, false);
                }
            }, 2500); // 2.5 segundos

        } catch (error) {
            console.error('Error al revisar registros:', error);
            setPlayerBusy(message.author.id, false);
            return message.reply('❌ Hubo un error al revisar los registros.');
        }
    }
}; 