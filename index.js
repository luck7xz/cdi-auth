const { Client, GatewayIntentBits, Partials } = require('discord.js');

const authSystem = require('./authSystem');
const embedSystem = require('./embedSystem');
const ticketSystem = require('./ticketSystem');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} está online!`);
});

authSystem(client);
embedSystem(client);
ticketSystem(client);

client.login(process.env.TOKEN);
