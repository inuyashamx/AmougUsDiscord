module.exports = {
    name: 'test',
    async execute(message, args) {
        try {
            console.log(`[${new Date().toISOString()}] Comando !test usado por ${message.author.tag} (${message.author.id})`);
            console.log(`Canal: ${message.channel.type === 'DM' ? 'MD' : message.channel.name}`);
            
            // Enviar un mensaje simple de prueba
            return message.author.send('¡Prueba exitosa! El bot puede enviar mensajes directos.');
        } catch (error) {
            console.error('Error en comando test:', error);
            return message.author.send('Hubo un error al enviar el mensaje de prueba.');
        }
    }
}; 