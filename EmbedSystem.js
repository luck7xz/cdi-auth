const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Cria uma embed personalizada'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Título da Embed')
            .setDescription('Descrição da embed')
            .setColor('Green');

        await interaction.reply({ embeds: [embed] });
    }
};
