const {
  SlashCommandBuilder,
  Routes,
  REST,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require('discord.js');

const CARGO_VERIFICADO = '1473662501769183327';
const CANAL_LOG = '1476107996437155871';

module.exports = (client) => {

  // Registrar comando
  client.once('ready', async () => {
    const commands = [
      new SlashCommandBuilder()
        .setName('auth')
        .setDescription('Enviar painel de verificação')
    ].map(cmd => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands }
      );
      console.log('✅ Comando /auth registrado.');
    } catch (err) {
      console.error('Erro ao registrar /auth:', err);
    }
  });

  // Interações
  client.on(Events.InteractionCreate, async (interaction) => {

    // Slash command
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'auth') {

        const embed = new EmbedBuilder()
          .setTitle('🔐 Sistema de Verificação')
          .setDescription('Clique no botão abaixo para se verificar no nosso servidor.')
          .setColor('Blue');

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('verificar_usuario')
            .setLabel('Verificar')
            .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({
          embeds: [embed],
          components: [row]
        });
      }
    }

    // Botão
    if (interaction.isButton()) {
      if (interaction.customId === 'verificar_usuario') {

        const membro = await interaction.guild.members.fetch(interaction.user.id);

        // Já verificado
        if (membro.roles.cache.has(CARGO_VERIFICADO)) {
          return interaction.reply({
            content: '⚠️ Você já está verificado.',
            ephemeral: true
          });
        }

        try {
          await membro.roles.add(CARGO_VERIFICADO);

          const canalLog = interaction.guild.channels.cache.get(CANAL_LOG);

          if (canalLog) {
            canalLog.send(
              `📋 O usuário ${interaction.user} (ID: ${interaction.user.id}) se verificou no servidor.`
            );
          }

          await interaction.reply({
            content: '✅ Você foi verificado com sucesso!',
            ephemeral: true
          });

        } catch (err) {
          console.error(err);
          await interaction.reply({
            content: '❌ Erro ao adicionar cargo. Verifique permissões.',
            ephemeral: true
          });
        }
      }
    }

  });

};
