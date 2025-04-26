// Map para almacenar los canales configurados por servidor
const serverChannels = new Map();

// Función para obtener el canal configurado para un servidor
const getServerChannel = (guildId) => {
    return serverChannels.get(guildId);
};

// Función para configurar el canal de un servidor
const setServerChannel = (guildId, channelId) => {
    serverChannels.set(guildId, channelId);
};

// Función para verificar si un servidor tiene canal configurado
const hasServerChannel = (guildId) => {
    return serverChannels.has(guildId);
};

// Función para eliminar la configuración de canal de un servidor
const removeServerChannel = (guildId) => {
    serverChannels.delete(guildId);
};

module.exports = {
    getServerChannel,
    setServerChannel,
    hasServerChannel,
    removeServerChannel
}; 