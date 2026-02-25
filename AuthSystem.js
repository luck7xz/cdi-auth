const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('auth')
        .setDescription('Sistema de verificação'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Clique para se verificar!')
            .setDescription('Clique no botão abaixo para se verificar no nosso servidor.')
            .setColor('Blue');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify')
                    .setLabel('Verificar')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },

    async buttonExecute(interaction) {
        if (interaction.customId !== 'verify') return;

        const role = interaction.guild.roles.cache.get('1473662501769183327');
        if (role) await interaction.member.roles.add(role);

        const logChannel = interaction.guild.channels.cache.get('1476107996437155871');
        if (logChannel) logChannel.send(`O ${interaction.user.tag} se verificou no servidor.`);

        await interaction.reply({ content: 'Você foi verificado com sucesso!', ephemeral: true });
    }
};
