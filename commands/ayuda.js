module.exports = {
    name: 'ayuda',
    async execute(message, args) {
        const helpEmbed = {
            color: 0x0099ff,
            title: '🤖 Comandos del Bot',
            description: 'Lista de comandos disponibles:',
            fields: [
                {
                    name: 'Comandos de Juego',
                    value: '!crear_juego - Crea un nuevo juego (máximo 1 jugador para pruebas)\n!unirse - Únete al juego actual\n!iniciar [rol] - Inicia el juego y asigna roles (tripulante/impostor)\n!terminar_juego - Termina el juego actual',
                    inline: false
                },
                {
                    name: 'Comandos de Ayuda',
                    value: '!ayuda - Muestra esta lista de comandos',
                    inline: false
                }
            ],
            footer: {
                text: 'Recuerda que todos los comandos solo funcionan en #impostor'
            }
        };

        return message.reply({ embeds: [helpEmbed] });
    }
}; 