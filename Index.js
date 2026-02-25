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
  PermissionFlagsBits,
  ChannelType,
  OverwriteType
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const CARGO_PERMITIDO = '1474839295989780622';

// =====================
// STORAGE (em memória)
// =====================
// paineis: Map<guildId, Map<painelId, painelData>>
const paineis = new Map();
// tickets: Map<channelId, ticketData>
const tickets = new Map();
// contadores: Map<guildId, number>
const contadores = new Map();
// sessoes de criação/edição
const sessoesTicket = new Map();

function getPaineis(guildId) {
  if (!paineis.has(guildId)) paineis.set(guildId, new Map());
  return paineis.get(guildId);
}

function getContador(guildId) {
  if (!contadores.has(guildId)) contadores.set(guildId, 0);
  const n = contadores.get(guildId) + 1;
  contadores.set(guildId, n);
  return String(n).padStart(4, '0');
}

// =====================
// PERMISSÃO
// =====================
function temPermissao(member) {
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.roles.cache.has(CARGO_PERMITIDO)
  );
}

// =====================
// SESSÃO PADRÃO
// =====================
function novaSessao() {
  return {
    titulo: 'Suporte',
    descricao: 'Selecione uma opção abaixo para abrir seu ticket.',
    cor: '#2b2d31',
    autor: null,
    imagem: null,
    thumbnail: null,
    rodape: null,
    mensagemSelecao: '📋 Selecione o tipo de atendimento:',
    opcoes: [],
    canalId: null,
    categoriaId: null,
    logsId: null,
    cargoMarcadoId: null,
  };
}

// =====================
// MONTAR EMBED PAINEL
// =====================
function montarEmbedPainel(sessao) {
  const embed = new EmbedBuilder();
  if (sessao.titulo) embed.setTitle(sessao.titulo);
  if (sessao.descricao) embed.setDescription(sessao.descricao);
  if (sessao.cor) { try { embed.setColor(sessao.cor); } catch {} }
  if (sessao.autor) embed.setAuthor({ name: sessao.autor });
  if (sessao.imagem) embed.setImage(sessao.imagem);
  if (sessao.thumbnail) embed.setThumbnail(sessao.thumbnail);
  if (sessao.rodape) embed.setFooter({ text: sessao.rodape });
  return embed;
}

// =====================
// MONTAR SELECT DE OPÇÕES DO PAINEL (para usuários abrirem ticket)
// =====================
function montarSelectOpcoes(sessao, painelId) {
  if (!sessao.opcoes || sessao.opcoes.length === 0) return null;
  const select = new StringSelectMenuBuilder()
    .setCustomId(`ticket_abrir_${painelId}`)
    .setPlaceholder(sessao.mensagemSelecao)
    .addOptions(sessao.opcoes.map((op, i) => ({
      label: op.label,
      value: String(i),
      description: op.descricao || undefined,
      emoji: op.emoji || undefined
    })));
  return new ActionRowBuilder().addComponents(select);
}

// =====================
// MENU PRINCIPAL DO /ticket
// =====================
function menuPrincipal() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_menu_principal')
    .setPlaceholder('⚙️ O que deseja fazer?')
    .addOptions([
      { label: '➕ Criar Painel', value: 'criar', description: 'Cria um novo painel de tickets' },
      { label: '✏️ Editar Painel', value: 'editar', description: 'Edita um painel existente' },
      { label: '🗑️ Excluir Painel', value: 'excluir', description: 'Exclui um painel existente' },
    ]);
  return new ActionRowBuilder().addComponents(select);
}

// =====================
// MENU DE CONFIGURAÇÃO DO PAINEL
// =====================
function menuConfigPainel() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_config_painel')
    .setPlaceholder('⚙️ Configure seu painel')
    .addOptions([
      { label: '📝 Título', value: 'titulo' },
      { label: '📄 Descrição', value: 'descricao' },
      { label: '🎨 Cor', value: 'cor' },
      { label: '✍️ Autor', value: 'autor' },
      { label: '🖼️ Imagem', value: 'imagem' },
      { label: '🔲 Thumbnail', value: 'thumbnail' },
      { label: '📋 Rodapé', value: 'rodape' },
      { label: '🔧 Configurações Gerais', value: 'geral' },
      { label: '📌 Gerenciar Opções', value: 'opcoes' },
      { label: '💾 Salvar Painel', value: 'salvar' },
      { label: '📤 Salvar e Enviar Painel', value: 'enviar' },
      { label: '❌ Cancelar', value: 'cancelar' },
    ]);
  return new ActionRowBuilder().addComponents(select);
}

// =====================
// MENU DE OPÇÕES DO PAINEL
// =====================
function menuOpcoesPainel() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_config_opcoes')
    .setPlaceholder('📌 Gerenciar opções do painel')
    .addOptions([
      { label: '✏️ Alterar mensagem de seleção', value: 'msg_selecao' },
      { label: '➕ Criar opção', value: 'criar_opcao' },
      { label: '✏️ Editar opção', value: 'editar_opcao' },
      { label: '🔃 Alterar ordem', value: 'ordem_opcao' },
      { label: '🗑️ Remover opção', value: 'remover_opcao' },
      { label: '🔙 Voltar', value: 'voltar' },
    ]);
  return new ActionRowBuilder().addComponents(select);
}

// =====================
// GERAR TRANSCRIPT HTML
// =====================
async function gerarTranscript(channel, ticketData) {
  let messages = [];
  try {
    const fetched = await channel.messages.fetch({ limit: 100 });
    messages = [...fetched.values()].reverse();
  } catch {}

  const linhas = messages.map(m => {
    const time = new Date(m.createdTimestamp).toLocaleString('pt-BR');
    const content = m.content ? m.content.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
    const embeds = m.embeds.length > 0 ? `<span style="color:#7289da">[embed]</span>` : '';
    return `<div class="msg"><span class="time">${time}</span> <span class="author" style="color:#${m.author.accentColor ? m.author.accentColor.toString(16) : '7289da'}">${m.author.tag}</span>: ${content}${embeds}</div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Transcript - ${channel.name}</title>
<style>
  body { background: #36393f; color: #dcddde; font-family: 'Segoe UI', sans-serif; padding: 20px; }
  h1 { color: #ffffff; border-bottom: 1px solid #4f545c; padding-bottom: 10px; }
  .info { background: #2f3136; padding: 10px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; color: #b9bbbe; }
  .msg { padding: 4px 0; border-bottom: 1px solid #2f3136; font-size: 14px; }
  .time { color: #72767d; font-size: 12px; }
  .author { font-weight: bold; }
</style>
</head>
<body>
<h1>📋 Transcript do Ticket</h1>
<div class="info">
  <b>Canal:</b> #${channel.name}<br>
  <b>Aberto por:</b> ${ticketData.abrirPor || 'Desconhecido'}<br>
  <b>Tipo:</b> ${ticketData.tipo || 'Geral'}<br>
  <b>Data de fechamento:</b> ${new Date().toLocaleString('pt-BR')}
</div>
${linhas}
</body>
</html>`;
}

// =====================
// REGISTRAR COMANDOS
// =====================
client.once(Events.ClientReady, async (c) => {
  console.log(`🎫 Bot online como ${c.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('painel')
      .setDescription('Mostra o painel de autenticação'),
    new SlashCommandBuilder()
      .setName('embed')
      .setDescription('Cria uma embed personalizada'),
    new SlashCommandBuilder()
      .setName('ticket')
      .setDescription('Gerencia os painéis de ticket')
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
    console.log('✅ Comandos registrados.');
  } catch (err) {
    console.error(err);
  }
});

// =====================
// INTERAÇÕES
// =====================
client.on(Events.InteractionCreate, async (interaction) => {

  // ========================
  // SLASH COMMANDS
  // ========================
  if (interaction.isChatInputCommand()) {

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
      return interaction.reply({ embeds: [embed], components: [row] });
    }

    if (interaction.commandName === 'embed') {
      // mesmo sistema anterior de embed
      if (!temPermissao(interaction.member)) {
        return interaction.reply({ content: '❌ **Sem Permissão!** Tente novamente.', ephemeral: true });
      }
      // reutiliza sessão do embed anterior (simplificado aqui)
      return interaction.reply({ content: 'Use o sistema de embed normalmente.', ephemeral: true });
    }

    if (interaction.commandName === 'ticket') {
      if (!temPermissao(interaction.member)) {
        return interaction.reply({ content: '❌ **Sem Permissão!** Tente novamente.', ephemeral: true });
      }

      return interaction.reply({
        content: '## 🎫 Gerenciador de Tickets\nO que deseja fazer?',
        components: [menuPrincipal()],
        ephemeral: true
      });
    }
  }

  // ========================
  // BOTÃO AUTH
  // ========================
  if (interaction.isButton()) {
    if (interaction.customId === 'auth_button') {
      return interaction.reply({ content: '✅ Você foi autenticado com sucesso!', ephemeral: true });
    }

    // Fechar ticket
    if (interaction.customId.startsWith('fechar_ticket_')) {
      const channelId = interaction.channel.id;
      const ticketData = tickets.get(channelId);

      if (!temPermissao(interaction.member) && interaction.user.id !== ticketData?.abrirPorId) {
        return interaction.reply({ content: '❌ Sem permissão para fechar este ticket.', ephemeral: true });
      }

      await interaction.reply({ content: '🔒 Fechando ticket e gerando transcript...' });

      try {
        const html = await gerarTranscript(interaction.channel, ticketData || {});
        const buffer = Buffer.from(html, 'utf-8');
        const { AttachmentBuilder } = require('discord.js');
        const attachment = new AttachmentBuilder(buffer, { name: `transcript-${interaction.channel.name}.html` });

        if (ticketData?.logsId) {
          const logsChannel = interaction.guild.channels.cache.get(ticketData.logsId);
          if (logsChannel) {
            const logEmbed = new EmbedBuilder()
              .setTitle('🎫 Ticket Fechado')
              .setColor('#ff4444')
              .addFields(
                { name: 'Canal', value: `#${interaction.channel.name}`, inline: true },
                { name: 'Aberto por', value: ticketData.abrirPor || 'Desconhecido', inline: true },
                { name: 'Tipo', value: ticketData.tipo || 'Geral', inline: true },
                { name: 'Fechado por', value: interaction.user.tag, inline: true },
                { name: 'Data', value: new Date().toLocaleString('pt-BR'), inline: true }
              )
              .setTimestamp();
            await logsChannel.send({ embeds: [logEmbed], files: [attachment] });
          }
        }

        tickets.delete(channelId);
        await interaction.channel.delete();
      } catch (err) {
        console.error(err);
        await interaction.editReply({ content: '❌ Erro ao fechar ticket.' });
      }
      return;
    }
  }

  // ========================
  // SELECT - ABRIR TICKET (usuário)
  // ========================
  if (interaction.isStringSelectMenu()) {

    if (interaction.customId.startsWith('ticket_abrir_')) {
      const painelId = interaction.customId.replace('ticket_abrir_', '');
      const guildPaineis = getPaineis(interaction.guild.id);
      const painel = guildPaineis.get(painelId);

      if (!painel) return interaction.reply({ content: '❌ Painel não encontrado.', ephemeral: true });

      const opcaoIndex = parseInt(interaction.values[0]);
      const opcao = painel.opcoes[opcaoIndex];

      // Verificar se já tem ticket aberto
      const jaAberto = [...tickets.values()].find(t => t.abrirPorId === interaction.user.id && t.guildId === interaction.guild.id);
      if (jaAberto) {
        return interaction.reply({ content: `❌ Você já tem um ticket aberto! <#${jaAberto.channelId}>`, ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        const numero = getContador(interaction.guild.id);
        const nomeCanal = `${interaction.user.username}-${numero}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

        const permissoes = [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          },
          {
            id: client.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory]
          }
        ];

        if (painel.cargoMarcadoId) {
          permissoes.push({
            id: painel.cargoMarcadoId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          });
        }

        const canalTicket = await interaction.guild.channels.create({
          name: nomeCanal,
          type: ChannelType.GuildText,
          parent: painel.categoriaId || null,
          permissionOverwrites: permissoes
        });

        const ticketEmbed = new EmbedBuilder()
          .setTitle(`🎫 Ticket #${numero} — ${opcao?.label || 'Suporte'}`)
          .setDescription(`Olá ${interaction.user}! Aguarde a equipe responsável lhe atender.${painel.cargoMarcadoId ? `\n\n<@&${painel.cargoMarcadoId}>` : ''}`)
          .setColor(painel.cor || '#2b2d31')
          .setFooter({ text: `Aberto por ${interaction.user.tag}` })
          .setTimestamp();

        const fecharBtn = new ButtonBuilder()
          .setCustomId(`fechar_ticket_${canalTicket.id}`)
          .setLabel('🔒 Fechar Ticket')
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(fecharBtn);

        await canalTicket.send({ embeds: [ticketEmbed], components: [row] });

        tickets.set(canalTicket.id, {
          channelId: canalTicket.id,
          guildId: interaction.guild.id,
          abrirPorId: interaction.user.id,
          abrirPor: interaction.user.tag,
          tipo: opcao?.label || 'Geral',
          logsId: painel.logsId
        });

        await interaction.editReply({ content: `✅ Ticket aberto! ${canalTicket}` });
      } catch (err) {
        console.error(err);
        await interaction.editReply({ content: '❌ Erro ao criar ticket. Verifique as permissões do bot.' });
      }
      return;
    }

    // ========================
    // MENU PRINCIPAL DO /ticket
    // ========================
    if (interaction.customId === 'ticket_menu_principal') {
      const escolha = interaction.values[0];

      if (escolha === 'criar') {
        const sessao = novaSessao();
        sessoesTicket.set(interaction.user.id, { sessao, modo: 'criar', painelId: null });

        const preview = montarEmbedPainel(sessao);
        return interaction.update({
          content: '## 🎫 Criando Novo Painel\nConfigure abaixo:',
          embeds: [preview],
          components: [menuConfigPainel()]
        });
      }

      if (escolha === 'editar') {
        const guildPaineis = getPaineis(interaction.guild.id);
        if (guildPaineis.size === 0) {
          return interaction.reply({ content: '❌ Nenhum painel salvo ainda.', ephemeral: true });
        }
        const options = [...guildPaineis.entries()].map(([id, p]) => ({
          label: p.titulo || 'Sem título',
          value: id,
          description: `ID: ${id}`
        }));
        const select = new StringSelectMenuBuilder()
          .setCustomId('ticket_selecionar_editar')
          .setPlaceholder('Selecione o painel para editar')
          .addOptions(options);
        return interaction.update({
          content: '## ✏️ Editar Painel\nQual painel deseja editar?',
          embeds: [],
          components: [new ActionRowBuilder().addComponents(select)]
        });
      }

      if (escolha === 'excluir') {
        const guildPaineis = getPaineis(interaction.guild.id);
        if (guildPaineis.size === 0) {
          return interaction.reply({ content: '❌ Nenhum painel salvo ainda.', ephemeral: true });
        }
        const options = [...guildPaineis.entries()].map(([id, p]) => ({
          label: p.titulo || 'Sem título',
          value: id
        }));
        const select = new StringSelectMenuBuilder()
          .setCustomId('ticket_selecionar_excluir')
          .setPlaceholder('Selecione o painel para excluir')
          .addOptions(options);
        return interaction.update({
          content: '## 🗑️ Excluir Painel\nQual painel deseja excluir?',
          embeds: [],
          components: [new ActionRowBuilder().addComponents(select)]
        });
      }
    }

    // Selecionar painel para editar
    if (interaction.customId === 'ticket_selecionar_editar') {
      const painelId = interaction.values[0];
      const guildPaineis = getPaineis(interaction.guild.id);
      const painel = guildPaineis.get(painelId);
      if (!painel) return interaction.reply({ content: '❌ Painel não encontrado.', ephemeral: true });
      sessoesTicket.set(interaction.user.id, { sessao: { ...painel }, modo: 'editar', painelId });
      const preview = montarEmbedPainel(painel);
      return interaction.update({
        content: `## ✏️ Editando Painel: **${painel.titulo || 'Sem título'}**`,
        embeds: [preview],
        components: [menuConfigPainel()]
      });
    }

    // Selecionar painel para excluir
    if (interaction.customId === 'ticket_selecionar_excluir') {
      const painelId = interaction.values[0];
      const guildPaineis = getPaineis(interaction.guild.id);
      const painel = guildPaineis.get(painelId);
      if (!painel) return interaction.reply({ content: '❌ Painel não encontrado.', ephemeral: true });

      guildPaineis.delete(painelId);
      return interaction.update({
        content: `## ✅ Painel **${painel.titulo || 'Sem título'}** excluído com sucesso!`,
        embeds: [],
        components: [menuPrincipal()]
      });
    }

    // ========================
    // MENU CONFIG PAINEL
    // ========================
    if (interaction.customId === 'ticket_config_painel') {
      const escolha = interaction.values[0];
      const dados = sessoesTicket.get(interaction.user.id);
      if (!dados) return interaction.reply({ content: '❌ Sessão expirada. Use /ticket novamente.', ephemeral: true });

      if (escolha === 'cancelar') {
        sessoesTicket.delete(interaction.user.id);
        return interaction.update({ content: '❌ Cancelado.', embeds: [], components: [menuPrincipal()] });
      }

      if (escolha === 'opcoes') {
        return interaction.update({
          content: '## 📌 Gerenciar Opções\nEscolha o que deseja fazer:',
          components: [menuOpcoesPainel()]
        });
      }

      if (escolha === 'geral') {
        const modal = new ModalBuilder()
          .setCustomId('ticket_modal_geral')
          .setTitle('Configurações Gerais')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('categoriaId').setLabel('ID da Categoria dos 
