require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials, ChannelType } = require('discord.js');
const path = require('path');
const fs = require('fs');
const gameStateModule = require('./gameState');
const { gameState } = gameStateModule;

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

// Inicializar la colección de comandos
const commands = new Collection();

// Cargar comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('Archivos de comandos encontrados:', commandFiles);

for (const file of commandFiles) {
    try {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        // Verificar que el comando tenga las propiedades necesarias
        if ('name' in command && 'execute' in command) {
            commands.set(command.name, command);
            console.log(`✅ Comando registrado: ${command.name}`);
        } else {
            console.warn(`⚠️ El comando en ${file} no tiene las propiedades requeridas`);
        }
    } catch (error) {
        console.error(`❌ Error al cargar el comando ${file}:`, error);
    }
}

console.log('Comandos disponibles:', Array.from(commands.keys()).join(', '));

// Comandos que solo funcionan en MDs
const mdOnlyCommands = ['salas', 'tarea', 'mover'];

// Comandos que solo funcionan en el canal #impostor
const channelOnlyCommands = ['reportar'];

// Comandos que no requieren estar en un juego activo
const noGameRequiredCommands = ['crear_juego', 'ayuda', 'test'];

client.once('ready', async () => {
    console.log(`Bot está listo como ${client.user.tag}`);
    console.log('Comandos registrados:', Array.from(commands.keys()).join(', '));
    console.log('Intents activos:', client.options.intents.toArray().join(', '));
    
    try {
        // Encontrar el canal #impostor
        const channel = client.channels.cache.find(channel => channel.name === 'impostor');
        if (channel) {
            await channel.send('🎮 Bot iniciado y listo para jugar');
        } else {
            console.warn('⚠️ No se pudo encontrar el canal #impostor');
        }
    } catch (error) {
        console.error('❌ Error al enviar mensaje de inicio:', error);
    }
});

client.on('messageCreate', async message => {
    try {
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

        console.log(`\n=== Comando Recibido ===`);
        console.log(`Comando: ${commandName}`);
        console.log(`Usuario: ${message.author.tag}`);
        console.log(`Canal: ${message.channel.name}`);
        console.log('Estado del juego:', {
            activo: gameState.isActive,
            jugadores: gameState.players.length,
            jugadoresIds: gameState.players,
            roles: Object.keys(gameState.roles).length
        });
        console.log('========================\n');

        // Verificar si el comando existe
        const command = commands.get(commandName);
        if (!command) {
            console.log(`Comando no encontrado: ${commandName}`);
            return message.reply('❌ Comando no reconocido. Usa !ayuda para ver la lista de comandos disponibles.');
        }

        // Verificar el contexto del comando (MD vs Canal)
        if (message.channel.type === ChannelType.DM) {
            if (channelOnlyCommands.includes(commandName)) {
                return message.reply('❌ Este comando solo funciona en el canal #impostor.');
            }
        } else {
            if (message.channel.name !== 'impostor') {
                return message.reply('❌ Los comandos solo funcionan en el canal #impostor.');
            }
            if (mdOnlyCommands.includes(commandName)) {
                return message.reply('❌ Este comando solo funciona en mensajes directos.');
            }
        }

        // Verificar estado del juego si es necesario
        if (!noGameRequiredCommands.includes(commandName)) {
            console.log('Verificando estado del juego para:', commandName, {
                activo: gameState.isActive,
                jugadores: gameState.players,
                jugadorActual: message.author.id
            });
            
            if (!gameState.isActive) {
                return message.reply('❌ No hay ningún juego activo. Usa !crear_juego para crear uno nuevo.');
            }
            
            if (!gameState.players.includes(message.author.id) && commandName !== 'unirse') {
                return message.reply('❌ No estás en el juego. Usa !unirse para unirte.');
            }
        }

        // Ejecutar el comando
        await command.execute(message, args);
        
    } catch (error) {
        console.error('❌ Error al procesar el comando:', error);
        message.reply('❌ Hubo un error al ejecutar el comando. Por favor, inténtalo de nuevo.');
    }
});

// Manejar errores no capturados
process.on('unhandledRejection', error => {
    console.error('❌ Error no manejado:', error);
});

// Usar el token desde las variables de entorno
client.login(process.env.DISCORD_TOKEN); 