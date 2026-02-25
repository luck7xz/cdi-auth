const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { token, guildId } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// banco simples em memória
const users = {};

const commands = [
  new SlashCommandBuilder()
    .setName('register')
    .setDescription('Registra seu usuário')
    .addStringOption(option => 
      option.setName('username')
            .setDescription('Seu nome de usuário')
            .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('login')
    .setDescription('Faz login')
    .addStringOption(option => 
      option.setName('username')
            .setDescription('Seu nome de usuário')
            .setRequired(true)
    )
].map(cmd => cmd.toJSON());

// registra os comandos no servidor
const rest = new REST({ version: '10' }).setToken(token);
(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(Routes.applicationGuildCommands(client.user?.id || 'CLIENT_ID_AQUI', guildId), { body: commands });
    console.log('Comandos registrados com sucesso!');
  } catch (error) {
    console.error(error);
  }
})();

client.on('ready', () => {
  console.log(`Logado como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName, options, user } = interaction;

  if (commandName === 'register') {
    const username = options.getString('username');

    if (users[user.id]) {
      return interaction.reply({ content: 'Você já está registrado!', ephemeral: true });
    }

    users[user.id] = { username };
    return interaction.reply({ content: `Registrado com sucesso como **${username}**!`, ephemeral: true });
  }

  if (commandName === 'login') {
    const username = options.getString('username');

    if (!users[user.id] || users[user.id].username !== username) {
      return interaction.reply({ content: 'Usuário não encontrado ou incorreto!', ephemeral: true });
    }

    return interaction.reply({ content: `Login feito com sucesso, **${username}**!`, ephemeral: true });
  }
});

client.login(token);
