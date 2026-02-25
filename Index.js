const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
  console.log(`Logado como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'painel') {

      const embed = new EmbedBuilder()
        .setTitle('📌 Painel Discloud')
        .setDescription('Clique no botão abaixo')
        .setColor(0x5865F2);

      const botao = new ButtonBuilder()
        .setCustomId('botao1')
        .setLabel('Clique aqui')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(botao);

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'botao1') {
      await interaction.reply({
        content: 'Você clicou 🔥',
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);