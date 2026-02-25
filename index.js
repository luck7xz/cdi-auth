require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

// Commands
client.commands = new Collection();
['AuthSystem', 'EmbedSystem', 'Ticket'].forEach(file => {
    const command = require(`./${file}.js`);
    client.commands.set(command.data.name, command);
});

client.once('ready', () => {
    console.log(`${client.user.tag} está online!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

    // Slash Commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Ocorreu um erro ao executar o comando!', ephemeral: true });
        }
    }

    // Buttons
    if (interaction.isButton()) {
        for (const command of client.commands.values()) {
            if (command.buttonExecute) {
                try {
                    await command.buttonExecute(interaction, client);
                } catch (error) {
                    console.error(error);
                }
            }
        }
    }
});

client.login(process.env.TOKEN);
