const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Enviar embed personalizado'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Título do Embed')
            .setDescription('Descrição do embed')
            .setColor('Blue')
            .setAuthor({ name: 'CDI | Bot' })
            .setFooter({ text: 'Feito pelo Dev Luckxz_7' });

        await interaction.reply({ embeds: [embed] });
    }
};
