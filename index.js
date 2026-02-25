import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

import ticketCommand from "./ticketSystem.js";
import embedCommand from "./embedSystem.js";
import authCommand from "./authSystem.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
client.commands.set(ticketCommand.data.name, ticketCommand);
client.commands.set(embedCommand.data.name, embedCommand);
client.commands.set(authCommand.data.name, authCommand);

client.once(Events.ClientReady, () => {
    console.log(`✅ ${client.user.tag} está online!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            await command.execute(interaction, client);
        }

        if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
            if (ticketCommand.handleInteraction) await ticketCommand.handleInteraction(interaction, client);
            if (embedCommand.handleInteraction) await embedCommand.handleInteraction(interaction, client);
            if (authCommand.handleInteraction) await authCommand.handleInteraction(interaction, client);
        }
    } catch (err) {
        console.error("Erro no interactionCreate:", err);
    }
});

client.login(process.env.TOKEN);
