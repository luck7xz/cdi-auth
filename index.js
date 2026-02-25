const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ ${c.user.tag} está online!`);

  const commands = [
    new SlashCommandBuilder()
      .setName('painel')
      .setDescription('Envia o painel de ticket')
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(c.user.id),
    { body: commands }
  );

  console.log('✅ Comando /painel registrado.');
});

client.on(Events.InteractionCreate, async interaction => {

  // Slash command
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'painel') {

      const embed = new EmbedBuilder()
        .setTitle('🎫 CDI | Auth - Suporte')
        .setDescription('Clique no botão abaixo para abrir um ticket.')
        .setColor('Blue');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('abrir_ticket')
          .setLabel('Abrir Ticket')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({ embeds: [embed], components: [row] });
    }
  }

  // Botões
  if (interaction.isButton()) {

    // ABRIR TICKET
    if (interaction.customId === 'abrir_ticket') {

      const canal = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages
            ]
          }
        ]
      });

      const embed = new EmbedBuilder()
        .setTitle('🎫 Ticket Aberto')
        .setDescription('Nossa equipe irá te atender em breve.\n\nClique no botão abaixo para fechar.')
        .setColor('Green');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('fechar_ticket')
          .setLabel('Fechar Ticket')
          .setStyle(ButtonStyle.Danger)
      );

      await canal.send({ embeds: [embed], components: [row] });

      await interaction.reply({
        content: `✅ Seu ticket foi criado: ${canal}`,
        ephemeral: true
      });
    }

    // FECHAR TICKET
    if (interaction.customId === 'fechar_ticket') {
      await interaction.reply({ content: '🔒 Fechando ticket...', ephemeral: true });

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 3000);
    }
  }
});

client.login(process.env.TOKEN);
