// Estado global del juego
const gameState = {
    isActive: false,
    players: [],
    maxPlayers: 10, // Aumentado a 10 jugadores
    minPlayers: 4, // Mínimo 4 jugadores para empezar
    roles: {}, // Almacenará los roles de los jugadores
    locations: {}, // Almacenará la ubicación de cada jugador
    tasks: {}, // Almacenará las tareas de cada jugador
    busyPlayers: {}, // Almacenará los jugadores que están realizando tareas
    gameTimer: null,
    totalPoints: 0,
    requiredPoints: 200, // Ajustado para 10 minutos incluyendo discusiones
    gameDuration: 600000, // 10 minutos en milisegundos
    bodies: {}, // Almacena los cadáveres: {roomId: [{playerId, reportedBy}]}
    rooms: [
        { 
            id: 'SalaA', 
            name: 'Sala de Administración', 
            description: 'Sala principal con controles de la nave',
            availableTasks: ['Descargar datos', 'Revisar registros'],
            pointsPerTask: 25 // Tareas administrativas importantes
        },
        { 
            id: 'SalaB', 
            name: 'Sala de Ingeniería', 
            description: 'Donde se reparan los sistemas de la nave',
            availableTasks: ['Calibrar motores', 'Reparar cableado'],
            pointsPerTask: 30 // Tareas técnicas más difíciles
        },
        { 
            id: 'SalaC', 
            name: 'Sala de Comunicaciones', 
            description: 'Centro de comunicaciones y datos',
            availableTasks: ['Establecer comunicación', 'Limpiar filtros'],
            pointsPerTask: 20 // Tareas de comunicación básicas
        },
        { 
            id: 'SalaD', 
            name: 'Sala de Seguridad', 
            description: 'Monitoreo de cámaras y sistemas de seguridad',
            availableTasks: ['Revisar cámaras', 'Actualizar sistema'],
            pointsPerTask: 25 // Tareas de seguridad importantes
        },
        { 
            id: 'SalaE', 
            name: 'Sala de Oxígeno', 
            description: 'Sistemas de soporte vital',
            availableTasks: ['Limpiar filtros de O2', 'Ajustar niveles'],
            pointsPerTask: 25 // Tareas vitales
        }
    ]
};

// Variable para almacenar el canal del juego
let gameChannel = null;

// Variable para almacenar los temporizadores activos
const activeTimers = new Map();

// Funciones para manipular el estado
const resetGame = () => {
    if (gameState.gameTimer) {
        clearTimeout(gameState.gameTimer);
    }
    gameState.isActive = false;
    gameState.players = [];
    gameState.roles = {};
    gameState.locations = {};
    gameState.tasks = {};
    gameState.busyPlayers = {};
    gameState.totalPoints = 0;
    gameState.gameTimer = null;
    gameState.bodies = {}; // Limpiar cadáveres
    clearAllTimers();
    gameChannel = null;
};

const addPlayer = (playerId) => {
    if (gameState.players.length >= gameState.maxPlayers) {
        return false;
    }
    if (!gameState.players.includes(playerId)) {
        gameState.players.push(playerId);
        gameState.locations[playerId] = 'SalaA'; // Ubicación inicial
        // Inicializar tareas del jugador
        gameState.tasks[playerId] = [];
        // Asignar todas las tareas de cada sala
        gameState.rooms.forEach(room => {
            room.availableTasks.forEach(taskDescription => {
                const task = {
                    room: room.id,
                    description: taskDescription,
                    completed: false
                };
                gameState.tasks[playerId].push(task);
            });
        });
        return true;
    }
    return false;
};

const setPlayerRole = (playerId, role) => {
    gameState.roles[playerId] = role;
};

const getPlayerRole = (playerId) => {
    return gameState.roles[playerId];
};

const getPlayerLocation = (playerId) => {
    return gameState.locations[playerId];
};

const setPlayerLocation = (playerId, location) => {
    // No permitir movimiento si el jugador está ocupado
    if (gameState.busyPlayers[playerId]) {
        return false;
    }
    gameState.locations[playerId] = location;
    return true;
};

const getRooms = () => {
    return gameState.rooms;
};

const getRoomById = (roomId) => {
    return gameState.rooms.find(room => room.id === roomId);
};

const getPlayerTasks = (playerId) => {
    return gameState.tasks[playerId] || [];
};

const getRoomTasks = (playerId, roomId) => {
    const playerTasks = getPlayerTasks(playerId);
    return playerTasks.filter(task => task.room === roomId && !task.completed);
};

const isPlayerBusy = (playerId) => {
    return !!gameState.busyPlayers[playerId];
};

const setPlayerBusy = (playerId, isBusy) => {
    if (isBusy) {
        gameState.busyPlayers[playerId] = true;
    } else {
        delete gameState.busyPlayers[playerId];
    }
};

// Función para establecer el canal del juego
const setGameChannel = (channel) => {
    gameChannel = channel;
};

// Sistema de temporizador para tareas
const resetTaskTimer = (task) => {
    // Cancelar temporizador existente si hay uno
    if (activeTimers.has(task.description + task.room)) {
        clearTimeout(activeTimers.get(task.description + task.room));
    }

    const timeoutSeconds = Math.floor(Math.random() * (60 - 30 + 1)) + 30; // Entre 30 y 60 segundos
    const timerId = setTimeout(() => {
        if (gameState.isActive && task.completed) {
            task.completed = false;
            if (gameChannel) {
                gameChannel.send(`🚨 ¡Alerta! El sistema "${task.description}" en ${task.room} está fallando de nuevo y necesita atención.`);
            }
        }
        activeTimers.delete(task.description + task.room);
    }, timeoutSeconds * 1000);

    // Guardar referencia al temporizador
    activeTimers.set(task.description + task.room, timerId);
};

// Limpiar todos los temporizadores al terminar el juego
const clearAllTimers = () => {
    for (const timerId of activeTimers.values()) {
        clearTimeout(timerId);
    }
    activeTimers.clear();
};

// Función para iniciar el temporizador del juego
const startGameTimer = () => {
    if (gameChannel) {
        const minutes = Math.floor(gameState.gameDuration / 60000);
        gameChannel.send(`⏱️ El juego ha comenzado! Tienen ${minutes} minutos para completar las tareas.`);
        
        const gameStartTime = Date.now(); // Añadir esta línea para tracking del tiempo
        
        gameState.gameTimer = setTimeout(() => {
            if (gameState.isActive) {
                endGame('timeout');
            }
        }, gameState.gameDuration);

        // Actualizar cada minuto
        const updateInterval = setInterval(() => {
            if (!gameState.isActive) {
                clearInterval(updateInterval);
                return;
            }
            const timeLeft = gameState.gameDuration - (Date.now() - gameStartTime);
            const minutesLeft = Math.floor(timeLeft / 60000);
            const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
            
            if (timeLeft > 0) {
                gameChannel.send(`⏱️ Tiempo restante: ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`);
                
                // Mostrar progreso de puntos
                gameChannel.send(`🎯 Progreso: ${gameState.totalPoints}/${gameState.requiredPoints} puntos (${Math.floor((gameState.totalPoints/gameState.requiredPoints)*100)}%)`);
            }
        }, 60000); // Cada minuto
    }
};

// Función para terminar el juego
const endGame = (reason) => {
    if (!gameState.isActive) return;

    let message = '';
    switch (reason) {
        case 'timeout':
            message = '⏱️ ¡Se acabó el tiempo! Los tripulantes han perdido.';
            break;
        case 'tasks_completed':
            message = '🎉 ¡Los tripulantes han completado todas las tareas! ¡Victoria!';
            break;
        case 'impostor_caught':
            message = '👮 ¡El impostor ha sido descubierto! ¡Victoria para los tripulantes!';
            break;
        case 'crew_eliminated':
            message = '👻 ¡El impostor ha eliminado a suficientes tripulantes! ¡Victoria para el impostor!';
            break;
    }

    if (gameChannel) {
        gameChannel.send(message);
    }

    resetGame();
};

// Modificar la función completeTask para incluir puntos
const completeTask = (playerId, roomId, taskDescription) => {
    const playerTasks = getPlayerTasks(playerId);
    const task = playerTasks.find(t => t.room === roomId && t.description === taskDescription && !t.completed);
    if (task) {
        task.completed = true;
        resetTaskTimer(task);

        // Sumar puntos
        const room = gameState.rooms.find(r => r.id === roomId);
        if (room) {
            gameState.totalPoints += room.pointsPerTask;
            
            // Verificar si han alcanzado los puntos necesarios
            if (gameState.totalPoints >= gameState.requiredPoints) {
                endGame('tasks_completed');
            }
        }
        return true;
    }
    return false;
};

// Función para agregar un cadáver
const addBody = (playerId, roomId) => {
    if (!gameState.bodies[roomId]) {
        gameState.bodies[roomId] = [];
    }
    gameState.bodies[roomId].push({
        playerId,
        reportedBy: null
    });
};

// Función para marcar un cadáver como reportado
const reportBody = (roomId, reporterId) => {
    if (gameState.bodies[roomId]) {
        const unreportedBody = gameState.bodies[roomId].find(body => !body.reportedBy);
        if (unreportedBody) {
            unreportedBody.reportedBy = reporterId;
            return true;
        }
    }
    return false;
};

// Función para obtener cadáveres no reportados en una sala
const getUnreportedBodies = (roomId) => {
    if (!gameState.bodies[roomId]) return [];
    return gameState.bodies[roomId].filter(body => !body.reportedBy);
};

// Función para verificar si hay suficientes jugadores para empezar
const hasEnoughPlayers = () => {
    return gameState.players.length >= gameState.minPlayers;
};

module.exports = {
    gameState,
    resetGame,
    addPlayer,
    setPlayerRole,
    getPlayerRole,
    getPlayerLocation,
    setPlayerLocation,
    getRooms,
    getRoomById,
    getPlayerTasks,
    getRoomTasks,
    isPlayerBusy,
    setPlayerBusy,
    completeTask,
    resetTaskTimer,
    setGameChannel,
    clearAllTimers,
    startGameTimer,
    endGame,
    addBody,
    reportBody,
    getUnreportedBodies,
    hasEnoughPlayers
}; 