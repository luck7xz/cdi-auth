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

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const CARGO_PERMITIDO = '1474839295989780622';

// Sessões de criação de embed por usuário
const sessoes = new Map();

// Verifica permissão
function temPermissao(member) {
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.roles.cache.has(CARGO_PERMITIDO)
  );
}

// Monta a embed da sessão
function montarEmbed(sessao) {
  const embed = new EmbedBuilder();

  if (sessao.titulo) embed.setTitle(sessao.titulo);
  if (sessao.descricao) embed.setDescription(sessao.descricao);
  if (sessao.cor) embed.setColor(sessao.cor);
  if (sessao.imagem) embed.setImage(sessao.imagem);
  if (sessao.thumbnail) embed.setThumbnail(sessao.thumbnail);
  if (sessao.rodape) embed.setFooter({ text: sessao.rodape });
  if (sessao.autor) embed.setAuthor({ name: sessao.autor });

  return embed;
}

// Monta os botões da sessão
function montarBotoes(sessao) {
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

// Monta o menu de configuração
function montarMenuConfig() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('embed_menu')
    .setPlaceholder('⚙️ O que deseja configurar?')
    .addOptions([
      { label: '📝 Título', value: 'titulo', description: 'Definir o título da embed' },
      { label: '📄 Descrição', value: 'descricao', description: 'Definir a descrição da embed' },
      { label: '🎨 Cor', value: 'cor', description: 'Definir a cor da embed (hex, ex: #FF0000)' },
      { label: '🖼️ Imagem', value: 'imagem', description: 'URL da imagem grande (cdn.discordapp.com)' },
      { label: '🔲 Thumbnail', value: 'thumbnail', description: 'URL da imagem pequena (canto superior direito)' },
      { label: '📋 Rodapé', value: 'rodape', description: 'Texto do rodapé da embed' },
      { label: '✍️ Autor', value: 'autor', description: 'Texto do autor da embed' },
      { label: '🔘 Adicionar Botão', value: 'botao', description: 'Adicionar um botão com link (máx. 5)' },
      { label: '🗑️ Remover Último Botão', value: 'remover_botao', description: 'Remove o último botão adicionado' },
      { label: '✅ Enviar Embed', value: 'enviar', description: 'Envia a embed no canal atual' },
      { label: '❌ Cancelar', value: 'cancelar', description: 'Cancela a criação da embed' },
    ]);

  return new ActionRowBuilder().addComponents(menu);
}

// Bot online
client.once(Events.ClientReady, async (c) => {
  console.log(`🔐 CDI | Auth online como ${c.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('painel')
      .setDescription('Mostra o painel de autenticação'),
    new SlashCommandBuilder()
      .setName('embed')
      .setDescription('Cria uma embed personalizada')
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
    console.log('✅ Comandos registrados.');
  } catch (err) {
    console.error(err);
  }
});

// Interações
client.on(Events.InteractionCreate, async (interaction) => {

  // ========================
  // SLASH COMMANDS
  // ========================
  if (interaction.isChatInputCommand()) {

    // /painel
    if (interaction.commandName === 'painel') {
      const embed = new EmbedBuilder()
        .setTitle('🔐 CDI | Auth')
        .setDescription('Clique no botão abaixo para autenticar sua conta.')
        .setColor(0x2b2d31)
        .setFooter({ text: 'Bot feito por Luckxz_7' })
        .setTimestamp();

      const button = new ButtonBuilder()
        .setCustomId('auth_button')
        .setLabel('Autenticar')
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(button);

      await interaction.reply({ embeds: [embed], components: [row] });
    }

    // /embed
    if (interaction.commandName === 'embed') {
      if (!temPermissao(interaction.member)) {
        return interaction.reply({
          content: '❌ **Sem Permissão!** Tente novamente.',
          ephemeral: true
        });
      }

      // Cria sessão nova para o usuário
      sessoes.set(interaction.user.id, {
        titulo: null,
        descricao: null,
        cor: '#2b2d31',
        imagem: null,
        thumbnail: null,
        rodape: null,
        autor: null,
        botoes: []
      });

      const previewEmbed = new EmbedBuilder()
        .setTitle('✨ Criador de Embed')
        .setDescription('Use o menu abaixo para configurar sua embed.\nUma prévia aparecerá aqui conforme você edita.')
        .setColor('#2b2d31');

      await interaction.reply({
        content: '## ⚙️ Configurador de Embed',
        embeds: [previewEmbed],
        components: [montarMenuConfig()],
        ephemeral: true
      });
    }
  }

  // ========================
  // BOTÃO DE AUTH
  // ========================
  if (interaction.isButton()) {
    if (interaction.customId === 'auth_button') {
      await interaction.reply({
        content: '✅ Você foi autenticado com sucesso!',
        ephemeral: true
      });
    }
  }

  // ========================
  // MENU DE CONFIGURAÇÃO
  // ========================
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'embed_menu') {
      const userId = interaction.user.id;
      const sessao = sessoes.get(userId);

      if (!sessao) {
        return interaction.reply({ content: '❌ Sessão expirada. Use /embed novamente.', ephemeral: true });
      }

      const escolha = interaction.values[0];

      // Cancelar
      if (escolha === 'cancelar') {
        sessoes.delete(userId);
        return interaction.update({
          content: '❌ Criação cancelada.',
          embeds: [],
          components: []
        });
      }

      // Remover último botão
      if (escolha === 'remover_botao') {
        if (sessao.botoes.length === 0) {
          return interaction.reply({ content: '⚠️ Nenhum botão para remover.', ephemeral: true });
        }
        sessao.botoes.pop();
        sessoes.set(userId, sessao);

        const preview = montarEmbed(sessao);
        const botoesRow = montarBotoes(sessao);
        const components = [montarMenuConfig()];
        if (botoesRow) components.push(botoesRow);

        return interaction.update({
          content: `## ⚙️ Configurador de Embed\n🗑️ Último botão removido. (${sessao.botoes.length}/5 botões)`,
          embeds: [preview],
          components
        });
      }

      // Enviar embed
      if (escolha === 'enviar') {
        const embed = montarEmbed(sessao);
        const botoesRow = montarBotoes(sessao);
        const components = botoesRow ? [botoesRow] : [];

        try {
          await interaction.channel.send({ embeds: [embed], components });
          sessoes.delete(userId);
          return interaction.update({
            content: '✅ Embed enviada com sucesso!',
            embeds: [],
            components: []
          });
        } catch (err) {
          return interaction.reply({ content: '❌ Erro ao enviar embed. Verifique as configurações.', ephemeral: true });
        }
      }

      // Abrir modal para as outras opções
      const titulos = {
        titulo: 'Definir Título',
        descricao: 'Definir Descrição',
        cor: 'Definir Cor (Hex)',
        imagem: 'Definir Imagem (URL)',
        thumbnail: 'Definir Thumbnail (URL)',
        rodape: 'Definir Rodapé',
        autor: 'Definir Autor',
        botao: 'Adicionar Botão'
      };

      const modal = new ModalBuilder()
        .setCustomId(`embed_modal_${escolha}`)
        .setTitle(titulos[escolha]);

      if (escolha === 'botao') {
        if (sessao.botoes.length >= 5) {
          return interaction.reply({ content: '⚠️ Limite de 5 botões atingido!', ephemeral: true });
        }
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('btn_label')
              .setLabel('Texto do botão')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMaxLength(80)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('btn_url')
              .setLabel('URL do botão')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setPlaceholder('https://...')
          )
        );
      } else {
        const isLong = escolha === 'descricao';
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('valor')
              .setLabel(titulos[escolha])
              .setStyle(isLong ? TextInputStyle.Paragraph : TextInputStyle.Short)
              .setRequired(false)
              .setPlaceholder(escolha === 'cor' ? '#FF0000' : '')
          )
        );
      }

      await interaction.showModal(modal);
    }
  }

  // ========================
  // MODAL SUBMIT
  // ========================
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith('embed_modal_')) {
      const userId = interaction.user.id;
      const sessao = sessoes.get(userId);

      if (!sessao) {
        return interaction.reply({ content: '❌ Sessão expirada. Use /embed novamente.', ephemeral: true });
      }

      const campo = interaction.customId.replace('embed_modal_', '');

      if (campo === 'botao') {
        const label = interaction.fields.getTextInputValue('btn_label');
        const url = interaction.fields.getTextInputValue('btn_url');

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return interaction.reply({ content: '❌ URL inválida! Deve começar com http:// ou https://', ephemeral: true });
        }

        sessao.botoes.push({ label, url });
      } else {
        const valor = interaction.fields.getTextInputValue('valor');
        sessao[campo] = valor || null;
      }

      sessoes.set(userId, sessao);

      let preview;
      try {
        preview = montarEmbed(sessao);
      } catch {
        return interaction.reply({ content: '❌ Valor inválido! Verifique e tente novamente.', ephemeral: true });
      }

      const botoesRow = montarBotoes(sessao);
      const components = [montarMenuConfig()];
      if (botoesRow) components.push(botoesRow);

      await interaction.update({
        content: `## ⚙️ Configurador de Embed\n✅ **${campo}** atualizado! (${sessao.botoes.length}/5 botões)`,
        embeds: [preview],
        components
      });
    }
  }
});

client.login(process.env.TOKEN);
