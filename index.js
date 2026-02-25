const { Client, GatewayIntentBits } = require('discord.js');

// === CONFIGURAÇÕES DIRETAS ===
const BOT_TOKEN ='MTQ3NjA1MTgxMjM1NTI3Njg1Mw.GprRje.f4CZ6svVNrWdJSfPsXcQhMFbOQCWoWyCS0jJe8';
const AUTORIZED_USERS = ['1473652628209532940']; // Coloque IDs que podem usar o auth

// Criando o client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Evento quando o bot estiver pronto
client.once('ready', () => {
    console.log(`Bot logado como ${client.user.tag}`);
});

// Evento de mensagem
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Comando de autenticação
    if (message.content.startsWith('!auth')) {
        if (AUTORIZED_USERS.includes(message.author.id)) {
            message.reply('✅ Você está autorizado!');
        } else {
            message.reply('❌ Você não tem permissão para usar este comando.');
        }
    }
});

// Login do bot
client.login(BOT_TOKEN);
