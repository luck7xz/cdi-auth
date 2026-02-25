require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const authSystem = require('./authSystem.js');
const embedSystem = require('./embedSystem.js');
const ticketSystem = require('./ticketSystem.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel]
});

client.commands = new Collection();

// Comandos
client.commands.set('auth', authSystem);
client.commands.set('embed', embedSystem);
client.commands.set('ticket', ticketSystem);

client.once('ready', () => {
    console.log(`Bot logado como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'Ocorreu um erro ao executar este comando.', ephemeral: true });
    }
});

client.login(process.env.TOKEN);
