require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials, ChannelType } = require('discord.js');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildMessageTyping
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
        Partials.Reaction
    ]
});

client.commands = new Collection();

// Cargar comandos
const commands = {};
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = require('fs').readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('Archivos de comandos encontrados:', commandFiles);

for (const file of commandFiles) {
    try {
        const command = require(path.join(commandsPath, file));
        commands[command.name] = command;
        console.log(`Comando registrado: ${command.name}`);
    } catch (error) {
        console.error(`Error al cargar el comando ${file}:`, error);
    }
}

console.log('Comandos disponibles:', Object.keys(commands).join(', '));

client.once('ready', async () => {
    console.log(`Bot está listo como ${client.user.tag}`);
    console.log('Comandos registrados:', Object.keys(commands).join(', '));
    console.log('Intents activos:', client.options.intents.toArray().join(', '));
    
    // Encontrar el canal #impostor
    const channel = client.channels.cache.find(channel => channel.name === 'impostor');
    if (channel) {
        await channel.send('Bot iniciado');
    } else {
        console.error('No se pudo encontrar el canal #impostor');
    }
});

client.on('messageCreate', async message => {
    // Ignorar mensajes de bots
    if (message.author.bot) return;

    // Mostrar todos los mensajes MD en la consola
    if (message.channel.type === ChannelType.DM) {
        console.log('\n=== Mensaje Directo Recibido ===');
        console.log(`De: ${message.author.tag} (${message.author.id})`);
        console.log(`Contenido: ${message.content}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log('==============================\n');
    }

    // Verificar si el mensaje comienza con !
    if (!message.content.startsWith('!')) return;

    // Obtener el comando y los argumentos
    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    console.log(`Comando recibido: ${commandName}`);
    console.log('Comandos disponibles:', Object.keys(commands).join(', '));

    // Verificar si el comando existe
    if (!commands[commandName]) {
        console.log(`Comando no encontrado: ${commandName}`);
        return;
    }

    // Comandos que solo funcionan en MDs
    const mdOnlyCommands = ['salas', 'tarea', 'mover'];
    
    // Comandos que solo funcionan en el canal #impostor
    const channelOnlyCommands = ['reportar'];

    try {
        // Verificar si es un MD
        if (message.channel.type === ChannelType.DM) {
            console.log('Mensaje recibido en MD');
            // Para MDs, verificar si el jugador está en el juego
            const { gameState } = require('./gameState');
            if (!gameState.isActive || !gameState.players.includes(message.author.id)) {
                return message.reply('No estás en un juego activo. Los comandos de juego solo funcionan en el canal #impostor.');
            }

            // Si es un comando que solo funciona en el canal, rechazarlo
            if (channelOnlyCommands.includes(commandName)) {
                return message.reply('Este comando solo funciona en el canal #impostor.');
            }

            // Ejecutar el comando
            await commands[commandName].execute(message, args);
        } else {
            // Para canales del servidor
            if (message.channel.name !== 'impostor') return;

            // Si es un comando que solo funciona en MDs, rechazarlo
            if (mdOnlyCommands.includes(commandName)) {
                return message.reply('Este comando solo funciona en mensajes directos.');
            }

            // Ejecutar el comando
            await commands[commandName].execute(message, args);
        }
    } catch (error) {
        console.error('Error al ejecutar el comando:', error);
        message.reply('Hubo un error al ejecutar el comando.');
    }
});

// Usar el token desde las variables de entorno
client.login(process.env.DISCORD_TOKEN); 