const { gameState, getPlayerLocation, getPlayerTasks, setPlayerBusy } = require('../gameState');

module.exports = {
    name: 'calibrar_motores',
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
            if (playerLocation !== 'SalaB') {
                return message.reply('Debes estar en la Sala de Motores para realizar esta tarea.');
            }

            // Verificar si el jugador tiene esta tarea pendiente
            const playerTasks = getPlayerTasks(message.author.id);
            const task = playerTasks.find(t => 
                t.room === 'SalaB' && 
                t.description === 'Calibrar motores' && 
                !t.completed
            );

            if (!task) {
                return message.reply('No tienes pendiente la tarea de calibrar los motores.');
            }

            // Marcar al jugador como ocupado
            setPlayerBusy(message.author.id, true);

            // Proceso de calibración (simulado)
            await message.reply('🔧 Iniciando calibración de motores...\n*No puedes moverte durante 10 segundos*\n▓░░░░░░░░░ 10%');
            
            // Simular el proceso con mensajes de progreso
            setTimeout(async () => {
                try {
                    await message.reply('🔧 Verificando presión...\n▓▓▓░░░░░░░ 30%');
                    setTimeout(async () => {
                        try {
                            await message.reply('🔧 Ajustando velocidad...\n▓▓▓▓▓░░░░░ 50%');
                            setTimeout(async () => {
                                try {
                                    await message.reply('🔧 Sincronizando motores...\n▓▓▓▓▓▓▓░░░ 70%');
                                    setTimeout(async () => {
                                        try {
                                            // Marcar la tarea como completada
                                            task.completed = true;
                                            // Liberar al jugador
                                            setPlayerBusy(message.author.id, false);
                                            // Enviar mensaje de confirmación
                                            await message.reply('✅ ¡Motores calibrados correctamente!\n▓▓▓▓▓▓▓▓▓▓ 100%\nTodos los motores están funcionando a máxima eficiencia.');
                                        } catch (error) {
                                            console.error('Error al completar la tarea:', error);
                                            setPlayerBusy(message.author.id, false);
                                        }
                                    }, 2500); // Cuarta parte
                                } catch (error) {
                                    console.error('Error durante la sincronización:', error);
                                    setPlayerBusy(message.author.id, false);
                                }
                            }, 2500); // Tercera parte
                        } catch (error) {
                            console.error('Error durante el ajuste:', error);
                            setPlayerBusy(message.author.id, false);
                        }
                    }, 2500); // Segunda parte
                } catch (error) {
                    console.error('Error durante la verificación:', error);
                    setPlayerBusy(message.author.id, false);
                }
            }, 2500); // Primera parte

        } catch (error) {
            console.error('Error al calibrar motores:', error);
            // Asegurarse de liberar al jugador si hay un error
            setPlayerBusy(message.author.id, false);
            return message.reply('Hubo un error al calibrar los motores.');
        }
    }
}; 