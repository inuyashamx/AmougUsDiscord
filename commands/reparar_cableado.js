const { 
    gameState,
    getPlayerLocation,
    getPlayerTasks,
    setPlayerBusy,
    completeTask,
    getPlayerRole
} = require('../gameState');

module.exports = {
    name: 'reparar_cableado',
    description: 'Repara el cableado dañado de la nave',
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
            if (playerLocation !== 'SalaB') {
                return message.reply('❌ Debes estar en la Sala de Ingeniería para realizar esta tarea.');
            }

            // Verificar si el jugador tiene esta tarea pendiente
            const playerTasks = getPlayerTasks(message.author.id);
            const task = playerTasks.find(t => 
                t.room === 'SalaB' && 
                t.description === 'Reparar cableado' && 
                !t.completed
            );

            if (!task) {
                return message.reply('❌ No tienes pendiente la tarea de reparar el cableado.');
            }

            // Marcar al jugador como ocupado
            setPlayerBusy(message.author.id, true);

            // Proceso de reparación (simulado)
            const msg = await message.reply('🔌 Iniciando reparación del cableado...\n*No puedes moverte durante 10 segundos*\n▓░░░░░░░░░ 10%');
            
            // Fase 1: 2.5 segundos
            setTimeout(async () => {
                try {
                    await msg.edit('🔌 Diagnosticando cables dañados...\n▓▓▓░░░░░░░ 30%');
                    
                    // Fase 2: 5 segundos
                    setTimeout(async () => {
                        try {
                            await msg.edit('🔌 Reparando conexiones...\n▓▓▓▓▓░░░░░ 50%');
                            
                            // Fase 3: 7.5 segundos
                            setTimeout(async () => {
                                try {
                                    await msg.edit('🔌 Probando conductividad...\n▓▓▓▓▓▓▓░░░ 70%');
                                    
                                    // Fase 4: 10 segundos
                                    setTimeout(async () => {
                                        try {
                                            // Completar la tarea
                                            completeTask(message.author.id, 'SalaB', 'Reparar cableado');
                                            // Liberar al jugador
                                            setPlayerBusy(message.author.id, false);
                                            // Enviar mensaje de confirmación
                                            await msg.edit('✅ Cableado reparado correctamente\n▓▓▓▓▓▓▓▓▓▓ 100%');
                                        } catch (error) {
                                            console.error('Error al completar la tarea:', error);
                                            setPlayerBusy(message.author.id, false);
                                        }
                                    }, 2500); // 10 segundos total
                                } catch (error) {
                                    console.error('Error durante las pruebas:', error);
                                    setPlayerBusy(message.author.id, false);
                                }
                            }, 2500); // 7.5 segundos
                        } catch (error) {
                            console.error('Error durante la reparación:', error);
                            setPlayerBusy(message.author.id, false);
                        }
                    }, 2500); // 5 segundos
                } catch (error) {
                    console.error('Error durante el diagnóstico:', error);
                    setPlayerBusy(message.author.id, false);
                }
            }, 2500); // 2.5 segundos

        } catch (error) {
            console.error('Error al reparar cableado:', error);
            setPlayerBusy(message.author.id, false);
            return message.reply('❌ Hubo un error al reparar el cableado.');
        }
    }
}; 