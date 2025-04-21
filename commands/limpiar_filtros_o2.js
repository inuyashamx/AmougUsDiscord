const { gameState, getPlayerLocation, getPlayerTasks, setPlayerBusy } = require('../gameState');

module.exports = {
    name: 'limpiar_filtros_o2',
    async execute(message, args) {
        try {
            // Verificar si hay un juego activo
            if (!gameState.isActive) {
                return message.reply('No hay ningún juego activo.');
            }

            // Verificar si el jugador está en el juego
            if (!gameState.players.includes(message.author.id)) {
                return message.reply('No estás en el juego.');
            }

            // Verificar si el jugador está en la sala correcta
            const playerLocation = getPlayerLocation(message.author.id);
            if (playerLocation !== 'SalaE') {
                return message.reply('Debes estar en la Sala de Oxígeno para realizar esta tarea.');
            }

            // Verificar si el jugador tiene esta tarea pendiente
            const playerTasks = getPlayerTasks(message.author.id);
            const task = playerTasks.find(t => 
                t.room === 'SalaE' && 
                t.description === 'Limpiar filtros de O2' && 
                !t.completed
            );

            if (!task) {
                return message.reply('No tienes pendiente la tarea de limpiar los filtros de O2.');
            }

            // Marcar al jugador como ocupado
            setPlayerBusy(message.author.id, true);

            // Proceso de limpieza (simulado)
            await message.reply('🧬 Iniciando limpieza de filtros de O2...\n*No puedes moverte durante 10 segundos*\n▓░░░░░░░░░ 10%');
            
            // Simular el proceso con mensajes de progreso
            setTimeout(async () => {
                try {
                    await message.reply('🧬 Removiendo impurezas...\n▓▓▓░░░░░░░ 30%');
                    setTimeout(async () => {
                        try {
                            await message.reply('🧬 Desinfectando filtros...\n▓▓▓▓▓░░░░░ 50%');
                            setTimeout(async () => {
                                try {
                                    await message.reply('🧬 Verificando calidad del aire...\n▓▓▓▓▓▓▓░░░ 70%');
                                    setTimeout(async () => {
                                        try {
                                            // Marcar la tarea como completada
                                            task.completed = true;
                                            // Liberar al jugador
                                            setPlayerBusy(message.author.id, false);
                                            // Enviar mensaje de confirmación
                                            await message.reply('✅ ¡Filtros de O2 limpios!\n▓▓▓▓▓▓▓▓▓▓ 100%\nLa calidad del aire es óptima.');
                                        } catch (error) {
                                            console.error('Error al completar la tarea:', error);
                                            setPlayerBusy(message.author.id, false);
                                        }
                                    }, 2500); // Cuarta parte
                                } catch (error) {
                                    console.error('Error durante la verificación:', error);
                                    setPlayerBusy(message.author.id, false);
                                }
                            }, 2500); // Tercera parte
                        } catch (error) {
                            console.error('Error durante la desinfección:', error);
                            setPlayerBusy(message.author.id, false);
                        }
                    }, 2500); // Segunda parte
                } catch (error) {
                    console.error('Error durante la limpieza:', error);
                    setPlayerBusy(message.author.id, false);
                }
            }, 2500); // Primera parte

        } catch (error) {
            console.error('Error al limpiar filtros de O2:', error);
            // Asegurarse de liberar al jugador si hay un error
            setPlayerBusy(message.author.id, false);
            return message.reply('Hubo un error al limpiar los filtros de O2.');
        }
    }
}; 