const {
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  PermissionsBitField,
  Events
} = require('discord.js');

module.exports = (client) => {

  // Registrar comando
  client.once('ready', async () => {

    const commands = [
      new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Criar uma embed personalizada')
        .addStringOption(option =>
          option.setName('titulo')
            .setDescription('Título da embed')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('descricao')
            .setDescription('Descrição da embed')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('cor')
            .setDescription('Cor em HEX (ex: #2f3136)')
            .setRequired(false))
    ].map(cmd => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands }
      );
      console.log('✅ Comando /embed registrado.');
    } catch (err) {
      console.error('Erro ao registrar /embed:', err);
    }

  });

  // Interação
  client.on(Events.InteractionCreate, async (interaction) => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'embed') {

      // Permissão
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({
          content: '❌ Apenas administradores podem usar este comando.',
          ephemeral: true
        });
      }

      const titulo = interaction.options.getString('titulo');
      const descricao = interaction.options.getString('descricao');
      const cor = interaction.options.getString('cor') || '#2f3136';

      try {
        const embed = new EmbedBuilder()
          .setTitle(titulo)
          .setDescription(descricao)
          .setColor(cor);

        await interaction.reply({
          embeds: [embed]
        });

      } catch (err) {
        console.error(err);
        await interaction.reply({
          content: '❌ Erro ao criar embed. Verifique a cor HEX.',
          ephemeral: true
        });
      }

    }

  });

};
