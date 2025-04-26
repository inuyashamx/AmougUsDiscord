const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle } = require('discord.js');
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

            // Dividir los canales en páginas de 25
            const channelsPerPage = 25;
            const pages = Math.ceil(channels.length / channelsPerPage);
            let currentPage = 0;

            const getCurrentPageChannels = () => {
                const start = currentPage * channelsPerPage;
                return channels.slice(start, start + channelsPerPage);
            };

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🔧 Cambiar Canal del Bot')
                .setDescription('Selecciona el nuevo canal donde quieres que funcione el bot:')
                .setFooter({ text: `Página ${currentPage + 1} de ${pages}` });

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('change_channel')
                        .setPlaceholder('Selecciona un canal')
                        .addOptions(getCurrentPageChannels())
                );

            const navigationRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('◀️ Anterior')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('Siguiente ▶️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === pages - 1)
                );

            const response = await message.reply({ 
                embeds: [embed], 
                components: [row, navigationRow] 
            });

            const filter = i => i.user.id === message.author.id;
            const collector = response.createMessageComponentCollector({ 
                filter, 
                time: 60000 
            });

            collector.on('collect', async i => {
                if (i.customId === 'change_channel') {
                    const selectedChannelId = i.values[0];
                    const selectedChannel = guild.channels.cache.get(selectedChannelId);
                    
                    setServerChannel(guild.id, selectedChannelId);
                    
                    await i.update({
                        content: `✅ Canal cambiado exitosamente a: ${selectedChannel}`,
                        embeds: [],
                        components: []
                    });
                } else if (i.customId === 'prev_page' || i.customId === 'next_page') {
                    currentPage = i.customId === 'prev_page' ? currentPage - 1 : currentPage + 1;
                    
                    embed.setFooter({ text: `Página ${currentPage + 1} de ${pages}` });
                    
                    row.components[0].setOptions(getCurrentPageChannels());
                    navigationRow.components[0].setDisabled(currentPage === 0);
                    navigationRow.components[1].setDisabled(currentPage === pages - 1);
                    
                    await i.update({
                        embeds: [embed],
                        components: [row, navigationRow]
                    });
                }
            });

            // Agregar un collector para interacciones no autorizadas
            const unauthorizedCollector = response.createMessageComponentCollector({
                filter: i => i.user.id !== message.author.id,
                time: 60000
            });

            unauthorizedCollector.on('collect', async i => {
                await i.reply({
                    content: '❌ No puedes interactuar con este menú porque alguien más lo está usando.',
                    ephemeral: true
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