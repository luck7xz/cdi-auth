const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SelectMenuBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Gerencie tickets'),
    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: 'Apenas administradores podem criar ou editar tickets.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('Painel de Tickets')
            .setDescription('Escolha uma opção abaixo para abrir um ticket.')
            .setColor('Blue');

        const select = new ActionRowBuilder().addComponents(
            new SelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('Escolha uma opção')
                .addOptions([
                    { label: '💬 Seja ADM', description: 'Abrir ticket de administração', value: 'adm' },
                    { label: '❓ Suporte', description: 'Abrir ticket de suporte', value: 'suporte' },
                    { label: '📝 Outros', description: 'Abrir outro tipo de ticket', value: 'outros' }
                ])
        );

        await interaction.reply({ embeds: [embed], components: [select], ephemeral: false });

        const collector = interaction.channel.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'ticket_select') {
                const category = await interaction.guild.channels.create({
                    name: `ticket-${i.user.username}`,
                    type: 4 // GuildCategory
                });

                const channel = await interaction.guild.channels.create({
                    name: `ticket-${i.user.username}`,
                    type: 0,
                    parent: category.id,
                    permissionOverwrites: [
                        { id: i.user.id, allow: ['ViewChannel', 'SendMessages'] },
                        { id: '1473653390834798653', allow: ['ViewChannel', 'SendMessages'] }, 
                        { id: '1473664213128974481', allow: ['ViewChannel', 'SendMessages'] }, 
                        { id: '1474839295989780622', allow: ['ViewChannel', 'SendMessages'] },
                        { id: interaction.guild.id, deny: ['ViewChannel'] }
                    ]
                });

                const ticketEmbed = new EmbedBuilder()
                    .setTitle('Ticket Criado')
                    .setDescription(`**Canal:** ${channel.name}\n**Opção:** ${i.values[0]}\n**Dono:** <@${i.user.id}> - **ID:** ${i.user.id}\n**Fechado por:** Ninguém\n**Responsável:** Ninguém\n**Motivo:** Aberto`)
                    .setColor('Blue');

                await channel.send({ embeds: [ticketEmbed] });
                await i.reply({ content: `Seu ticket foi criado em ${channel}`, ephemeral: true });
            }
        });
    }
};
