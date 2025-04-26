const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');
const { setServerChannel } = require('../channelConfig');

module.exports = {
    name: 'cambiar_canal',
    async execute(message, args) {
        try {
            const guild = message.guild;
            const channels = guild.channels.cache
                .filter(channel => channel.type === ChannelType.GuildText)
                .map(channel => ({
                    label: channel.name,
                    value: channel.id,
                    description: `#${channel.name}`
                }));

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🔧 Cambiar Canal del Bot')
                .setDescription('Selecciona el nuevo canal donde quieres que funcione el bot:')
                .setFooter({ text: 'Esta configuración afectará a todos los usuarios del servidor' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('change_channel')
                        .setPlaceholder('Selecciona un canal')
                        .addOptions(channels)
                );

            const response = await message.reply({ embeds: [embed], components: [row] });

            const filter = i => i.user.id === message.author.id;
            const collector = response.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                const selectedChannelId = i.values[0];
                const selectedChannel = guild.channels.cache.get(selectedChannelId);
                
                setServerChannel(guild.id, selectedChannelId);
                
                await i.update({
                    content: `✅ Canal cambiado exitosamente a: ${selectedChannel}`,
                    embeds: [],
                    components: []
                });
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    response.edit({
                        content: '❌ No se seleccionó ningún canal. Usa el comando nuevamente para cambiar el canal.',
                        embeds: [],
                        components: []
                    });
                }
            });
        } catch (error) {
            console.error('Error en cambiar_canal:', error);
            message.reply('❌ Hubo un error al intentar cambiar el canal. Por favor, inténtalo de nuevo.');
        }
    }
}; 