const { gameState, getPlayerLocation, getPlayerTasks, setPlayerBusy } = require('../gameState');

module.exports = {
    name: 'revisar_camaras',
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
            if (playerLocation !== 'SalaD') {
                return message.reply('Debes estar en la Sala de Seguridad para realizar esta tarea.');
            }

            // Verificar si el jugador tiene esta tarea pendiente
            const playerTasks = getPlayerTasks(message.author.id);
            const task = playerTasks.find(t => 
                t.room === 'SalaD' && 
                t.description === 'Revisar cámaras' && 
                !t.completed
            );

            if (!task) {
                return message.reply('No tienes pendiente la tarea de revisar las cámaras.');
            }

            // Marcar al jugador como ocupado
            setPlayerBusy(message.author.id, true);

            // Proceso de revisión (simulado)
            await message.reply('📹 Iniciando revisión de cámaras...\n*No puedes moverte durante 10 segundos*\n▓░░░░░░░░░ 10%');
            
            // Simular el proceso con mensajes de progreso
            setTimeout(async () => {
                try {
                    await message.reply('📹 Verificando Sala A y B...\n▓▓▓░░░░░░░ 30%');
                    setTimeout(async () => {
                        try {
                            await message.reply('📹 Verificando Sala C y D...\n▓▓▓▓▓░░░░░ 50%');
                            setTimeout(async () => {
                                try {
                                    await message.reply('📹 Verificando Sala E...\n▓▓▓▓▓▓▓░░░ 70%');
                                    setTimeout(async () => {
                                        try {
                                            // Marcar la tarea como completada
                                            task.completed = true;
                                            // Liberar al jugador
                                            setPlayerBusy(message.author.id, false);
                                            // Enviar mensaje de confirmación
                                            await message.reply('✅ ¡Cámaras revisadas!\n▓▓▓▓▓▓▓▓▓▓ 100%\nTodas las cámaras están funcionando correctamente.');
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
                            console.error('Error durante la revisión:', error);
                            setPlayerBusy(message.author.id, false);
                        }
                    }, 2500); // Segunda parte
                } catch (error) {
                    console.error('Error durante la verificación:', error);
                    setPlayerBusy(message.author.id, false);
                }
            }, 2500); // Primera parte

        } catch (error) {
            console.error('Error al revisar cámaras:', error);
            // Asegurarse de liberar al jugador si hay un error
            setPlayerBusy(message.author.id, false);
            return message.reply('Hubo un error al revisar las cámaras.');
        }
    }
}; 