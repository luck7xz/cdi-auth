require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');

// Importa os sistemas separados
const authSystem = require('./authSystem.js');
const embedSystem = require('./embedSystem.js');
const ticketSystem = require('./ticketSystem.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Quando o bot estiver online
client.once(Events.ClientReady, async (c) => {
  console.log(`Bot online como ${c.user.tag}`);

  // Registrar comandos globais
  const commands = [
    authSystem.slashCommand(),
    embedSystem.slashCommand(),
    ticketSystem.slashCommand()
  ].map(cmd => cmd.toJSON());

  const { REST } = require('discord.js');
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
    console.log('Comandos registrados.');
  } catch (err) {
    console.error('Erro ao registrar comandos:', err);
  }
});

// Captura todas as interações
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // Auth System
    if (interaction.isChatInputCommand() && interaction.commandName === 'auth') {
      return authSystem.handle(interaction, client);
    }

    // Embed System
    if (interaction.isChatInputCommand() && interaction.commandName === 'embed') {
      return embedSystem.handle(interaction, client);
    }

    // Ticket System
    if (interaction.isChatInputCommand() && interaction.commandName === 'ticket') {
      return ticketSystem.handle(interaction, client);
    }

    // Botões, modais e selects
    if (interaction.isButton() || interaction.isModalSubmit() || interaction.isStringSelectMenu()) {
      // Auth buttons
      if (interaction.customId.startsWith('auth_')) {
        return authSystem.handleButton(interaction, client);
      }

      // Embed modals/buttons
      if (interaction.customId.startsWith('embed_')) {
        return
