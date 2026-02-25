const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'auth',
    description: 'Verifique-se no servidor',
    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('Verificação')
            .setDescription('Clique no botão abaixo para se verificar no nosso servidor.')
            .setColor('Blue');

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('auth_button')
                .setLabel('Verificar')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [button], ephemeral: true });

        const collector = interaction.channel.createMessageComponentCollector({ componentType: 'BUTTON', time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'auth_button') {
                await i.member.roles.add('1473662501769183327'); // Cargo ao clicar
                await i.reply({ content: 'Você foi verificado com sucesso!', ephemeral: true });

                const logChannel = await client.channels.fetch('1476107996437155871');
                logChannel.send(`O ${i.user} se verificou no servidor.`);
            }
        });
    }
};
