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
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Sessoes de configuracao do /auth
const sessoes = new Map();

function temPermissao(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

function montarEmbedPreview(s) {
  const embed = new EmbedBuilder().setColor('#2b2d31');
  if (s.titulo) embed.setTitle(s.titulo);
  if (s.descricao) embed.setDescription(s.descricao);
  if (s.autor) embed.setAuthor({ name: s.autor });
  return embed;
}

function menuConfigurar() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('auth_cfg_titulo')
      .setLabel('Titulo')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('auth_cfg_descricao')
      .setLabel('Descricao')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('auth_cfg_autor')
      .setLabel('Autor')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('auth_cfg_cargo')
      .setLabel('Cargo do Botao')
      .setStyle(ButtonStyle.Primary)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('auth_cfg_enviar')
      .setLabel('Enviar Painel')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('auth_cfg_cancelar')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Danger)
  );
  return [row1, row2];
}

// Registrar comandos
client.once(Events.ClientReady, async function(c) {
  console.log('Bot online como ' + c.user.tag);

  const commands = [
    new SlashCommandBuilder()
      .setName('painel')
      .setDescription('Mostra o painel de autenticacao'),
    new SlashCommandBuilder()
      .setName('auth')
      .setDescription('Cria um painel de cargos (apenas admins)')
  ].map(function(cmd) { return cmd.toJSON(); });

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
    console.log('Comandos registrados.');
  } catch (err) {
    console.error(err);
  }
});

client.on(Events.InteractionCreate, async function(interaction) {

  // ====================
  // SLASH COMMANDS
  // ====================

  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === 'painel') {
      const embed = new EmbedBuilder()
        .setTitle('CDI | Auth')
        .setDescription('Clique no botao abaixo para autenticar sua conta.')
        .setColor(0x2b2d31)
        .setFooter({ text: 'Bot feito por Luckxz_7' })
        .setTimestamp();
      const btn = new ButtonBuilder()
        .setCustomId('auth_button')
        .setLabel('Autenticar')
        .setStyle(ButtonStyle.Success);
      const row = new ActionRowBuilder().addComponents(btn);
      return interaction.reply({ embeds: [embed], components: [row] });
    }

    if (interaction.commandName === 'auth') {
      if (!temPermissao(interaction.member)) {
        return interaction.reply({
          content: 'Sem Permissao! Apenas administradores podem usar este comando.',
          ephemeral: true
        });
      }

      sessoes.set(interaction.user.id, {
        titulo: null,
        descricao: null,
        autor: null,
        cargoId: null,
        labelBotao: 'Receber Cargo'
      });

      const preview = new EmbedBuilder()
        .setTitle('Configurador de Painel')
        .setDescription('Use os botoes abaixo para configurar seu painel.')
        .setColor('#2b2d31');

      return interaction.reply({
        content: '## Configure seu painel:',
        embeds: [preview],
        components: menuConfigurar(),
        ephemeral: true
      });
    }
  }

  // ====================
  // BOTOES
  // ====================

  if (interaction.isButton()) {

    // Autenticar (/painel)
    if (interaction.customId === 'auth_button') {
      return interaction.reply({
        content: 'Voce foi autenticado com sucesso!',
        ephemeral: true
      });
    }

    // Botao de cargo (painel enviado)
    if (interaction.customId.startsWith('cargo_dar_')) {
      const cargoId = interaction.customId.replace('cargo_dar_', '');
      const member = interaction.member;

      try {
        if (member.roles.cache.has(cargoId)) {
          await member.roles.remove(cargoId);
          return interaction.reply({
            content: 'Cargo removido com sucesso!',
            ephemeral: true
          });
        } else {
          await member.roles.add(cargoId);
          return interaction.reply({
            content: 'Cargo adicionado com sucesso!',
            ephemeral: true
          });
        }
      } catch (err) {
        console.error(err);
        return interaction.reply({
          content: 'Erro ao gerenciar cargo. Verifique se o bot tem permissao para gerenciar cargos.',
          ephemeral: true
        });
      }
    }

    // Botoes de configuracao do /auth
    if (interaction.customId === 'auth_cfg_cancelar') {
      sessoes.delete(interaction.user.id);
      return interaction.update({
        content: 'Cancelado.',
        embeds: [],
        components: []
      });
    }

    if (interaction.customId === 'auth_cfg_enviar') {
      const sessao = sessoes.get(interaction.user.id);
      if (!sessao) {
        return interaction.reply({ content: 'Sessao expirada. Use /auth novamente.', ephemeral: true });
      }
      if (!sessao.cargoId) {
        return interaction.reply({
          content: 'Configure o cargo do botao antes de enviar!',
          ephemeral: true
        });
      }

      const embed = montarEmbedPreview(sessao);
      const btn = new ButtonBuilder()
        .setCustomId('cargo_dar_' + sessao.cargoId)
        .setLabel(sessao.labelBotao)
        .setStyle(ButtonStyle.Primary);
      const row = new ActionRowBuilder().addComponents(btn);

      try {
        await interaction.channel.send({ embeds: [embed], components: [row] });
        sessoes.delete(interaction.user.id);
        return interaction.update({
          content: 'Painel enviado com sucesso!',
          embeds: [],
          components: []
        });
      } catch (err) {
        console.error(err);
        return interaction.reply({ content: 'Erro ao enviar painel.', ephemeral: true });
      }
    }

    // Abrir modais de configuracao
    const modaisMap = {
      auth_cfg_titulo: { id: 'modal_titulo', title: 'Definir Titulo', campo: 'titulo', label: 'Titulo' },
      auth_cfg_descricao: { id: 'modal_descricao', title: 'Definir Descricao', campo: 'descricao', label: 'Descricao' },
      auth_cfg_autor: { id: 'modal_autor', title: 'Definir Autor', campo: 'autor', label: 'Autor' },
      auth_cfg_cargo: { id: 'modal_cargo', title: 'Configurar Botao', campo: 'cargo', label: 'cargo' }
    };

    const cfg = modaisMap[interaction.customId];
    if (cfg) {
      const sessao = sessoes.get(interaction.user.id);
      if (!sessao) {
        return interaction.reply({ content: 'Sessao expirada. Use /auth novamente.', ephemeral: true });
      }

      if (cfg.campo === 'cargo') {
        const inputCargo = new TextInputBuilder()
          .setCustomId('cargoId')
          .setLabel('ID do cargo a ser adicionado')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('Ex: 123456789012345678');
        const inputLabel = new TextInputBuilder()
          .setCustomId('labelBotao')
          .setLabel('Texto do botao')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(sessao.labelBotao || 'Receber Cargo')
          .setPlaceholder('Ex: Receber Cargo');
        const modal = new ModalBuilder()
          .setCustomId('modal_cargo')
          .setTitle('Configurar Botao')
          .addComponents(
            new ActionRowBuilder().addComponents(inputCargo),
            new ActionRowBuilder().addComponents(inputLabel)
          );
        return interaction.showModal(modal);
      }

      const input = new TextInputBuilder()
        .setCustomId('valor')
        .setLabel(cfg.label)
        .setStyle(cfg.campo === 'descricao' ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setRequired(false)
        .setValue(sessao[cfg.campo] || '');

      const modal = new ModalBuilder()
        .setCustomId(cfg.id)
        .setTitle(cfg.title)
        .addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }
  }

  // ====================
  // MODALS
  // ====================

  if (interaction.isModalSubmit()) {
    const sessao = sessoes.get(interaction.user.id);
    if (!sessao) {
      return interaction.reply({ content: 'Sessao expirada. Use /auth novamente.', ephemeral: true });
    }

    if (interaction.customId === 'modal_titulo') {
      sessao.titulo = interaction.fields.getTextInputValue('valor') || null;
      sessoes.set(interaction.user.id, sessao);
      const preview = montarEmbedPreview(sessao);
      return interaction.update({
        content: '## Configure seu painel:\nTitulo atualizado!',
        embeds: [preview],
        components: menuConfigurar()
      });
    }

    if (interaction.customId === 'modal_descricao') {
      sessao.descricao = interaction.fields.getTextInputValue('valor') || null;
      sessoes.set(interaction.user.id, sessao);
      const preview = montarEmbedPreview(sessao);
      return interaction.update({
        content: '## Configure seu painel:\nDescricao atualizada!',
        embeds: [preview],
        components: menuConfigurar()
      });
    }

    if (interaction.customId === 'modal_autor') {
      sessao.autor = interaction.fields.getTextInputValue('valor') || null;
      sessoes.set(interaction.user.id, sessao);
      const preview = montarEmbedPreview(sessao);
      return interaction.update({
        content: '## Configure seu painel:\nAutor atualizado!',
        embeds: [preview],
        components: menuConfigurar()
      });
    }

    if (interaction.customId === 'modal_cargo') {
      sessao.cargoId = interaction.fields.getTextInputValue('cargoId');
      const labelVal = interaction.fields.getTextInputValue('labelBotao');
      sessao.labelBotao = labelVal || 'Receber Cargo';
      sessoes.set(interaction.user.id, sessao);
      const preview = montarEmbedPreview(sessao);
      return interaction.update({
        content: '## Configure seu painel:\nCargo configurado! ID: ' + sessao.cargoId,
        embeds: [preview],
        components: menuConfigurar()
      });
    }
  }
});

client.login(process.env.TOKEN);
