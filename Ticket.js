const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Sistema de tickets'),

    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: 'Você não tem permissão para criar tickets.', ephemeral: true });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ticket-menu')
                    .setPlaceholder('Selecione uma opção')
                    .addOptions([
                        {
                            label: '💬 Seja ADM',
                            value: 'adm',
                            description: 'Abra um ticket para suporte administrativo'
                        },
                        {
                            label: '🛠️ Suporte',
                            value: 'suporte',
                            description: 'Abra um ticket de suporte'
                        },
                        {
                            label: '❌ Cancelar',
                            value: 'cancelar',
                            description: 'Cancelar ticket'
                        }
                    ])
            );

        await interaction.reply({ content: 'Selecione uma opção abaixo:', components: [row], ephemeral: true });
    },

    async buttonExecute(interaction, client) {
        // Aqui você pode colocar a lógica de tickets caso queira usar botões também
    }
};
