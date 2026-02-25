const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes,
  SlashCommandBuilder,
  Events
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 🔐 Bot online
client.once(Events.ClientReady, async (c) => {
  console.log(`🔐 CDI | Auth online como ${c.user.tag}`);

  // Registrar comando automaticamente
  const commands = [
    new SlashCommandBuilder()
      .setName('painel')
      .setDescription('Mostra o painel de autenticação')
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(c.user.id),
      { body: commands }
    );
    console.log('✅ Comando /painel registrado.');
  } catch (err) {
    console.error(err);
  }
});

// 🔘 Interações
client.on(Events.InteractionCreate, async (interaction) => {

  // Slash command /painel
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'painel') {

      const embed = new EmbedBuilder()
        .setTitle('🔐 CDI | Auth')
        .setDescription('Clique no botão abaixo para autenticar sua conta.')
        .setColor(0x2b2d31)
        .setFooter({ text: 'Bot feito por Luckxz_7' })
        .setTimestamp();

      const button = new ButtonBuilder()
        .setCustomId('auth_button')
        .setLabel('Autenticar')
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(button);

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }
  }

  // Botão de autenticação
  if (interaction.isButton()) {
    if (interaction.customId === 'auth_button') {
      await interaction.reply({
        content: '✅ Você foi autenticado com sucesso!',
        ephemeral: true
      });
    }
  }
});

// 🔑 Login seguro com variável de ambiente
client.login(process.env.TOKEN);
