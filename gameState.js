// Estado global del juego
const gameState = {
    isActive: false,
    players: [],
    maxPlayers: 1, // Por ahora solo 1 jugador para pruebas
    roles: {}, // Almacenará los roles de los jugadores
    locations: {}, // Almacenará la ubicación de cada jugador
    tasks: {}, // Almacenará las tareas de cada jugador
    busyPlayers: {}, // Almacenará los jugadores que están realizando tareas
    rooms: [
        { 
            id: 'SalaA', 
            name: 'Sala de Administración', 
            description: 'Sala principal con controles de la nave',
            availableTasks: ['Descargar datos', 'Revisar registros']
        },
        { 
            id: 'SalaB', 
            name: 'Sala de Ingeniería', 
            description: 'Donde se reparan los sistemas de la nave',
            availableTasks: ['Calibrar motores', 'Reparar cableado']
        },
        { 
            id: 'SalaC', 
            name: 'Sala de Comunicaciones', 
            description: 'Centro de comunicaciones y datos',
            availableTasks: ['Establecer comunicación', 'Limpiar filtros']
        },
        { 
            id: 'SalaD', 
            name: 'Sala de Seguridad', 
            description: 'Monitoreo de cámaras y sistemas de seguridad',
            availableTasks: ['Revisar cámaras', 'Actualizar sistema']
        },
        { 
            id: 'SalaE', 
            name: 'Sala de Oxígeno', 
            description: 'Sistemas de soporte vital',
            availableTasks: ['Limpiar filtros de O2', 'Ajustar niveles']
        }
    ]
};

// Funciones para manipular el estado
const resetGame = () => {
    gameState.isActive = false;
    gameState.players = [];
    gameState.roles = {};
    gameState.locations = {};
    gameState.tasks = {};
    gameState.busyPlayers = {};
};

const addPlayer = (playerId) => {
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
    setPlayerBusy
}; 