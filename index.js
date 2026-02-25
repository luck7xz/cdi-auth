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
  StringSelectMenuBuilder,
  PermissionFlagsBits
} = require('discord.js');

const { handleTicket, menuPrincipalTicket } = require('./ticket.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const CARGO_PERMITIDO = '1474839295989780622';
const sessoes = new Map();

function temPermissao(member) {
  const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
  const hasCargo = member.roles.cache.has(CARGO_PERMITIDO);
  return isAdmin || hasCargo;
}

function montarEmbed(s) {
  const embed = new EmbedBuilder();
  if (s.titulo) embed.setTitle(s.titulo);
  if (s.descricao) embed.setDescription(s.descricao);
  if (s.autor) embed.setAuthor({ name: s.autor });
  if (s.imagem) embed.setImage(s.imagem);
  if (s.thumbnail) embed.setThumbnail(s.thumbnail);
  if (s.rodape) embed.setFooter({ text: s.rodape });
  try {
    if (s.cor) embed.setColor(s.cor);
  } catch (e) {
    embed.setColor('#2b2d31');
  }
  return embed;
}

function montarBotoesCustom(sessao) {
  if (!sessao.botoes || sessao.botoes.length === 0) return null;
  const row = new ActionRowBuilder();
  for (const btn of sessao.botoes) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(btn.label)
        .setStyle(ButtonStyle.Link)
        .setURL(btn.url)
    );
  }
  return row;
}

function menuConfigEmbed() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('embed_menu')
    .setPlaceholder('O que deseja configurar?')
    .addOptions([
      { label: 'Titulo', value: 'titulo', emoji: '📝' },
      { label: 'Descricao', value: 'descricao', emoji: '📄' },
      { label: 'Cor', value: 'cor', emoji: '🎨' },
      { label: 'Imagem', value: 'imagem', emoji: '🖼️' },
      { label: 'Thumbnail', value: 'thumbnail', emoji: '🔲' },
      { label: 'Rodape', value: 'rodape', emoji: '📋' },
      { label: 'Autor', value: 'autor', emoji: '✍️' },
      { label: 'Adicionar Botao', value: 'botao', emoji: '🔘' },
      { label: 'Remover Ultimo Botao', value: 'remover_botao', emoji: '🗑️' },
      { label: 'Enviar Embed', value: 'enviar', emoji: '✅' },
      { label: 'Cancelar', value: 'cancelar', emoji: '❌' }
    ]);
  return new ActionRowBuilder().addComponents(select);
}

client.once(Events.ClientReady, async function(c) {
  console.log('Bot online como ' + c.user.tag);

  const commands = [
    new SlashCommandBuilder()
      .setName('painel')
      .setDescription('Mostra o painel de autenticacao'),
    new SlashCommandBuilder()
      .setName('embed')
      .setDescription('Cria uma embed personalizada'),
    new SlashCommandBuilder()
      .setName('ticket')
      .setDescription('Gerencia os paineis de ticket')
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

    if (interaction.commandName === 'embed') {
      if (!temPermissao(interaction.member)) {
        return interaction.reply({
          content: 'Sem Permissao! Tente novamente.',
          ephemeral: true
        });
      }
      sessoes.set(interaction.user.id, {
        titulo: null, descricao: null, cor: '#2b2d31',
        imagem: null, thumbnail: null, rodape: null,
        autor: null, botoes: []
      });
      const preview = new EmbedBuilder()
        .setTitle('Criador de Embed')
        .setDescription('Use o menu abaixo para configurar sua embed.')
        .setColor('#2b2d31');
      return interaction.reply({
        content: '## Configurador de Embed',
        embeds: [preview],
        components: [menuConfigEmbed()],
        ephemeral: true
      });
    }

    if (interaction.commandName === 'ticket') {
      if (!temPermissao(interaction.member)) {
        return interaction.reply({
          content: 'Sem Permissao! Tente novamente.',
          ephemeral: true
        });
      }
      return interaction.reply({
        content: '## Gerenciador de Tickets',
        components: [menuPrincipalTicket()],
        ephemeral: true
      });
    }
  }

  if (interaction.isButton() && interaction.customId === 'auth_button') {
    return interaction.reply({
      content: 'Voce foi autenticado com sucesso!',
      ephemeral: true
    });
  }

  const isTicketBtn = interaction.isButton()
    && interaction.customId.startsWith('fechar_ticket_');
  const isTicketSelect = interaction.isStringSelectMenu()
    && interaction.customId.startsWith('ticket_');
  const isTicketModal = interaction.isModalSubmit()
    && interaction.customId.startsWith('ticket_');

  if (isTicketBtn || isTicketSelect || isTicketModal) {
    return handleTicket(interaction, client);
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'embed_menu') {
    const escolha = interaction.values[0];
    const userId = interaction.user.id;
    const sessao = sessoes.get(userId);

    if (!sessao) {
      return interaction.reply({
        content: 'Sessao expirada. Use /embed novamente.',
        ephemeral: true
      });
    }

    if (escolha === 'cancelar') {
      sessoes.delete(userId);
      return interaction.update({ content: 'Cancelado.', embeds: [], components: [] });
    }

    if (escolha === 'remover_botao') {
      if (sessao.botoes.length === 0) {
        return interaction.reply({ content: 'Nenhum botao para remover.', ephemeral: true });
      }
      sessao.botoes.pop();
      sessoes.set(userId, sessao);
      const preview = montarEmbed(sessao);
      const bRow = montarBotoesCustom(sessao);
      const comps = [menuConfigEmbed()];
      if (bRow) comps.push(bRow);
      return interaction.update({
        content: '## Configurador\nBotao removido. (' + sessao.botoes.length + '/5)',
        embeds: [preview],
        components: comps
      });
    }

    if (escolha === 'enviar') {
      const embed = montarEmbed(sessao);
      const bRow = montarBotoesCustom(sessao);
      const comps = bRow ? [bRow] : [];
      try {
        await interaction.channel.send({ embeds: [embed], components: comps });
        sessoes.delete(userId);
        return interaction.update({ content: 'Embed enviada!', embeds: [], components: [] });
      } catch (err) {
        return interaction.reply({ content: 'Erro ao enviar embed.', ephemeral: true });
      }
    }

    if (escolha === 'botao') {
      if (sessao.botoes.length >= 5) {
        return interaction.reply({ content: 'Limite de 5 botoes!', ephemeral: true });
      }
      const iLabel = new TextInputBuilder()
        .setCustomId('btn_label')
        .setLabel('Texto do botao')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(80);
      const iUrl = new TextInputBuilder()
        .setCustomId('btn_url')
        .setLabel('URL do botao')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('https://...');
      const modal = new ModalBuilder()
        .setCustomId('embed_modal_botao')
        .setTitle('Adicionar Botao')
        .addComponents(
          new ActionRowBuilder().addComponents(iLabel),
          new ActionRowBuilder().addComponents(iUrl)
        );
      return interaction.showModal(modal);
    }

    const labels = {
      titulo: 'Titulo', descricao: 'Descricao', cor: 'Cor (ex: #FF0000)',
      imagem: 'Imagem (URL)', thumbnail: 'Thumbnail (URL)',
      rodape: 'Rodape', autor: 'Autor'
    };
    const label = labels[escolha] || escolha;
    const isLong = escolha === 'descricao';
    const input = new TextInputBuilder()
      .setCustomId('valor')
      .setLabel(label)
      .setStyle(isLong ? TextInputStyle.Paragraph : TextInputStyle.Short)
      .setRequired(false)
      .setValue(sessao[escolha] || '');
    const modal = new ModalBuilder()
      .setCustomId('embed_modal_campo_' + escolha)
      .setTitle('Editar ' + label)
      .addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit()) {

    if (interaction.customId.startsWith('embed_modal_campo_')) {
      const campo = interaction.customId.replace('embed_modal_campo_', '');
      const userId = interaction.user.id;
      const sessao = sessoes.get(userId);
      if (!sessao) {
        return interaction.reply({ content: 'Sessao expirada.', ephemeral: true });
      }
      const valor = interaction.fields.getTextInputValue('valor');
      sessao[campo] = valor || null;
      sessoes.set(userId, sessao);
      let preview;
      try { preview = montarEmbed(sessao); } catch (e) {
        return interaction.reply({ content: 'Valor invalido.', ephemeral: true });
      }
      const bRow = montarBotoesCustom(sessao);
      const comps = [menuConfigEmbed()];
      if (bRow) comps.push(bRow);
      return interaction.update({
        content: '## Configurador de Embed\n' + campo + ' atualizado!',
        embeds: [preview],
        components: comps
      });
    }

    if (interaction.customId === 'embed_modal_botao') {
      const userId = interaction.user.id;
      const sessao = sessoes.get(userId);
      if (!sessao) {
        return interaction.reply({ content: 'Sessao expirada.', ephemeral: true });
      }
      const label = interaction.fields.getTextInputValue('btn_label');
      const url = interaction.fields.getTextInputValue('btn_url');
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return interaction.reply({ content: 'URL invalida! Use https://', ephemeral: true });
      }
      sessao.botoes.push({ label: label, url: url });
      sessoes.set(userId, sessao);
      const preview = montarEmbed(sessao);
      const bRow = montarBotoesCustom(sessao);
      const comps = [menuConfigEmbed()];
      if (bRow) comps.push(bRow);
      return interaction.update({
        content: '## Configurador de Embed\nBotao adicionado! (' + sessao.botoes.length + '/5)',
        embeds: [preview],
        components: comps
      });
    }
  }
});

module.exports = { temPermissao };

client.login(process.env.TOKEN);
