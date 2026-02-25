const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  ChannelType,
  AttachmentBuilder
} = require('discord.js');

const paineis = new Map();
const tickets = new Map();
const contadores = new Map();
const sessoesTicket = new Map();

function getPaineis(guildId) {
  if (!paineis.has(guildId)) {
    paineis.set(guildId, new Map());
  }
  return paineis.get(guildId);
}

function getContador(guildId) {
  const atual = contadores.get(guildId) || 0;
  const novo = atual + 1;
  contadores.set(guildId, novo);
  return String(novo).padStart(4, '0');
}

function novaSessaoTicket() {
  return {
    titulo: 'Suporte',
    descricao: 'Selecione uma opcao abaixo para abrir seu ticket.',
    cor: '#2b2d31',
    autor: null,
    imagem: null,
    thumbnail: null,
    rodape: null,
    mensagemSelecao: 'Selecione o tipo de atendimento:',
    opcoes: [],
    categoriaId: null,
    logsId: null,
    cargoMarcadoId: null
  };
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

function montarSelectOpcoes(sessao, painelId) {
  if (!sessao.opcoes || sessao.opcoes.length === 0) return null;
  const options = sessao.opcoes.map(function(op, i) {
    const opt = { label: op.label, value: String(i) };
    if (op.descricao) opt.description = op.descricao;
    if (op.emoji) opt.emoji = op.emoji;
    return opt;
  });
  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_abrir_' + painelId)
    .setPlaceholder(sessao.mensagemSelecao)
    .addOptions(options);
  return new ActionRowBuilder().addComponents(select);
}

function menuPrincipalTicket() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_menu_principal')
    .setPlaceholder('O que deseja fazer?')
    .addOptions([
      { label: 'Criar Painel', value: 'criar', emoji: '➕' },
      { label: 'Editar Painel', value: 'editar', emoji: '✏️' },
      { label: 'Excluir Painel', value: 'excluir', emoji: '🗑️' }
    ]);
  return new ActionRowBuilder().addComponents(select);
}

function menuConfigPainel() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_config_painel')
    .setPlaceholder('Configure seu painel')
    .addOptions([
      { label: 'Titulo', value: 'titulo', emoji: '📝' },
      { label: 'Descricao', value: 'descricao', emoji: '📄' },
      { label: 'Cor', value: 'cor', emoji: '🎨' },
      { label: 'Autor', value: 'autor', emoji: '✍️' },
      { label: 'Imagem', value: 'imagem', emoji: '🖼️' },
      { label: 'Thumbnail', value: 'thumbnail', emoji: '🔲' },
      { label: 'Rodape', value: 'rodape', emoji: '📋' },
      { label: 'Configuracoes Gerais', value: 'geral', emoji: '🔧' },
      { label: 'Gerenciar Opcoes', value: 'opcoes', emoji: '📌' },
      { label: 'Salvar Painel', value: 'salvar', emoji: '💾' },
      { label: 'Salvar e Enviar', value: 'enviar', emoji: '📤' },
      { label: 'Cancelar', value: 'cancelar', emoji: '❌' }
    ]);
  return new ActionRowBuilder().addComponents(select);
}

function menuGerenciarOpcoes() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_config_opcoes')
    .setPlaceholder('Gerenciar opcoes do painel')
    .addOptions([
      { label: 'Alterar mensagem de selecao', value: 'msg_selecao', emoji: '✏️' },
      { label: 'Criar opcao', value: 'criar_opcao', emoji: '➕' },
      { label: 'Editar opcao', value: 'editar_opcao', emoji: '📝' },
      { label: 'Alterar ordem', value: 'ordem_opcao', emoji: '🔃' },
      { label: 'Remover opcao', value: 'remover_opcao', emoji: '🗑️' },
      { label: 'Voltar', value: 'voltar', emoji: '🔙' }
    ]);
  return new ActionRowBuilder().addComponents(select);
}

async function gerarTranscript(channel, ticketData) {
  let messages = [];
  try {
    const fetched = await channel.messages.fetch({ limit: 100 });
    messages = Array.from(fetched.values()).reverse();
  } catch (e) {}

  const linhas = messages.map(function(m) {
    const time = new Date(m.createdTimestamp).toLocaleString('pt-BR');
    const tag = m.author.tag;
    const content = (m.content || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const temEmbed = m.embeds.length > 0 ? ' [embed]' : '';
    return '<div class="msg">'
      + '<span class="time">' + time + '</span> '
      + '<span class="author">' + tag + '</span>: '
      + content + temEmbed
      + '</div>';
  }).join('\n');

  const nomeCanal = channel.name;
  const abriuPor = ticketData.abrirPor || 'Desconhecido';
  const tipo = ticketData.tipo || 'Geral';
  const dataFechamento = new Date().toLocaleString('pt-BR');

  return '<!DOCTYPE html>\n'
    + '<html lang="pt-BR">\n'
    + '<head><meta charset="UTF-8"><title>Transcript</title>\n'
    + '<style>\n'
    + 'body{background:#36393f;color:#dcddde;font-family:sans-serif;padding:20px}\n'
    + 'h1{color:#fff;border-bottom:1px solid #4f545c;padding-bottom:10px}\n'
    + '.info{background:#2f3136;padding:10px;border-radius:8px;margin-bottom:20px}\n'
    + '.msg{padding:4px 0;border-bottom:1px solid #2f3136;font-size:14px}\n'
    + '.time{color:#72767d;font-size:12px}\n'
    + '.author{font-weight:bold;color:#7289da}\n'
    + '</style></head>\n'
    + '<body>\n'
    + '<h1>Transcript do Ticket</h1>\n'
    + '<div class="info">'
    + '<b>Canal:</b> #' + nomeCanal + '<br>'
    + '<b>Aberto por:</b> ' + abriuPor + '<br>'
    + '<b>Tipo:</b> ' + tipo + '<br>'
    + '<b>Fechado em:</b> ' + dataFechamento
    + '</div>\n'
    + linhas + '\n'
    + '</body></html>';
}

async function handleTicket(interaction, client) {

  // Abrir ticket (usuario)
  if (interaction.customId.startsWith('ticket_abrir_')) {
    const painelId = interaction.customId.replace('ticket_abrir_', '');
    const guildPaineis = getPaineis(interaction.guild.id);
    const painel = guildPaineis.get(painelId);

    if (!painel) {
      return interaction.reply({ content: 'Painel nao encontrado.', ephemeral: true });
    }

    const jaAberto = Array.from(tickets.values()).find(function(t) {
      return t.abrirPorId === interaction.user.id
        && t.guildId === interaction.guild.id;
    });

    if (jaAberto) {
      return interaction.reply({
        content: 'Voce ja tem um ticket aberto! <#' + jaAberto.channelId + '>',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const opcaoIndex = parseInt(interaction.values[0]);
      const opcao = painel.opcoes[opcaoIndex];
      const numero = getContador(interaction.guild.id);
      const nomeBase = interaction.user.username
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const nomeCanal = nomeBase + '-' + numero;

      const permissoes = [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        },
        {
          id: client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ReadMessageHistory
          ]
        }
      ];

      if (painel.cargoMarcadoId) {
        permissoes.push({
          id: painel.cargoMarcadoId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        });
      }

      const canalOpts = {
        name: nomeCanal,
        type: ChannelType.GuildText,
        permissionOverwrites: permissoes
      };
      if (painel.categoriaId) canalOpts.parent = painel.categoriaId;

      const canalTicket = await interaction.guild.channels.create(canalOpts);

      let descTicket = 'Ola ' + interaction.user.toString() + '!\n';
      descTicket += 'Aguarde a equipe responsavel lhe atender.';
      if (painel.cargoMarcadoId) {
        descTicket += '\n\n<@&' + painel.cargoMarcadoId + '>';
      }

      const ticketEmbed = new EmbedBuilder()
        .setTitle('Ticket #' + numero + ' - ' + (opcao ? opcao.label : 'Suporte'))
        .setDescription(descTicket)
        .setFooter({ text: 'Aberto por ' + interaction.user.tag })
        .setTimestamp();

      try {
        if (painel.cor) ticketEmbed.setColor(painel.cor);
      } catch (e) {
        ticketEmbed.setColor('#2b2d31');
      }

      const fecharBtn = new ButtonBuilder()
        .setCustomId('fechar_ticket_' + canalTicket.id)
        .setLabel('Fechar Ticket')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(fecharBtn);
      await canalTicket.send({ embeds: [ticketEmbed], components: [row] });

      tickets.set(canalTicket.id, {
        channelId: canalTicket.id,
        guildId: interaction.guild.id,
        abrirPorId: interaction.user.id,
        abrirPor: interaction.user.tag,
        tipo: opcao ? opcao.label : 'Geral',
        logsId: painel.logsId
      });

      return interaction.editReply({
        content: 'Ticket aberto! ' + canalTicket.toString()
      });

    } catch (err) {
      console.error(err);
      return interaction.editReply({
        content: 'Erro ao criar ticket. Verifique as permissoes do bot.'
      });
    }
  }

  // Fechar ticket (botao)
  if (interaction.customId.startsWith('fechar_ticket_')) {
    const channelId = interaction.channel.id;
    const ticketData = tickets.get(channelId);

    const { temPermissao } = require('./index.js');
    const podeFechar = temPermissao(interaction.member)
      || (ticketData && interaction.user.id === ticketData.abrirPorId);

    if (!podeFechar) {
      return interaction.reply({
        content: 'Sem permissao para fechar este ticket.',
        ephemeral: true
      });
    }

    await interaction.reply({ content: 'Fechando ticket e gerando transcript...' });

    try {
      const html = await gerarTranscript(interaction.channel, ticketData || {});
      const buffer = Buffer.from(html, 'utf-8');
      const nomeArq = 'transcript-' + interaction.channel.name + '.html';
      const attachment = new AttachmentBuilder(buffer, { name: nomeArq });

      if (ticketData && ticketData.logsId) {
        const logCh = interaction.guild.channels.cache.get(ticketData.logsId);
        if (logCh) {
          const logEmbed = new EmbedBuilder()
            .setTitle('Ticket Fechado')
            .setColor('#ff4444')
            .addFields(
              { name: 'Canal', value: '#' + interaction.channel.name, inline: true },
              { name: 'Aberto por', value: ticketData.abrirPor || 'Desconhecido', inline: true },
              { name: 'Tipo', value: ticketData.tipo || 'Geral', inline: true },
              { name: 'Fechado por', value: interaction.user.tag, inline: true },
              { name: 'Data', value: new Date().toLocaleString('pt-BR'), inline: true }
            )
            .setTimestamp();
          await logCh.send({ embeds: [logEmbed], files: [attachment] });
        }
      }

      tickets.delete(channelId);
      await interaction.channel.delete();
    } catch (err) {
      console.error(err);
      try {
        await interaction.editReply({ content: 'Erro ao fechar ticket.' });
      } catch (e) {}
    }
    return;
  }

  // Menu principal
  if (interaction.customId === 'ticket_menu_principal') {
    const escolha = interaction.values[0];
    const guildPaineis = getPaineis(interaction.guild.id);

    if (escolha === 'criar') {
      const sessao = novaSessaoTicket();
      sessoesTicket.set(interaction.user.id, {
        sessao: sessao,
        modo: 'criar',
        painelId: null
      });
      const preview = montarEmbed(sessao);
      return interaction.update({
        content: '## Criando Novo Painel',
        embeds: [preview],
        components: [menuConfigPainel()]
      });
    }

    if (escolha === 'editar') {
      if (guildPaineis.size === 0) {
        return interaction.reply({
          content: 'Nenhum painel salvo ainda.',
          ephemeral: true
        });
      }
      const options = Array.from(guildPaineis.entries()).map(function(e) {
        return { label: e[1].titulo || 'Sem titulo', value: e[0] };
      });
      const select = new StringSelectMenuBuilder()
        .setCustomId('ticket_selecionar_editar')
        .setPlaceholder('Selecione o painel para editar')
        .addOptions(options);
      return interaction.update({
        content: '## Editar Painel',
        embeds: [],
        components: [new ActionRowBuilder().addComponents(select)]
      });
    }

    if (escolha === 'excluir') {
      if (guildPaineis.size === 0) {
        return interaction.reply({
          content: 'Nenhum painel salvo ainda.',
          ephemeral: true
        });
      }
      const options = Array.from(guildPaineis.entries()).map(function(e) {
        return { label: e[1].titulo || 'Sem titulo', value: e[0] };
      });
      const select = new StringSelectMenuBuilder()
        .setCustomId('ticket_selecionar_excluir')
        .setPlaceholder('Selecione o painel para excluir')
        .addOptions(options);
      return interaction.update({
        content: '## Excluir Painel',
        embeds: [],
        components: [new ActionRowBuilder().addComponents(select)]
      });
    }
  }

  if (interaction.customId === 'ticket_selecionar_editar') {
    const painelId = interaction.values[0];
    const guildPaineis = getPaineis(interaction.guild.id);
    const painel = guildPaineis.get(painelId);
    if (!painel) {
      return interaction.reply({ content: 'Painel nao encontrado.', ephemeral: true });
    }
    sessoesTicket.set(interaction.user.id, {
      sessao: Object.assign({}, painel, { opcoes: painel.opcoes.slice() }),
      modo: 'editar',
      painelId: painelId
    });
    const preview = montarEmbed(painel);
    return interaction.update({
      content: '## Editando: ' + (painel.titulo || 'Sem titulo'),
      embeds: [preview],
      components: [menuConfigPainel()]
    });
  }

  if (interaction.customId === 'ticket_selecionar_excluir') {
    const painelId = interaction.values[0];
    const guildPaineis = getPaineis(interaction.guild.id);
    const painel = guildPaineis.get(painelId);
    if (!painel) {
      return interaction.reply({ content: 'Painel nao encontrado.', ephemeral: true });
    }
    guildPaineis.delete(painelId);
    return interaction.update({
      content: 'Painel ' + (painel.titulo || 'Sem titulo') + ' excluido!',
      embeds: [],
      components: [menuPrincipalTicket()]
    });
  }

  if (interaction.customId === 'ticket_config_painel') {
    const escolha = interaction.values[0];
    const dados = sessoesTicket.get(interaction.user.id);
    if (!dados) {
      return interaction.reply({
        content: 'Sessao expirada. Use /ticket novamente.',
        ephemeral: true
      });
    }

    if (escolha === 'cancelar') {
      sessoesTicket.delete(interaction.user.id);
      return interaction.update({
        content: 'Cancelado.',
        embeds: [],
        components: [menuPrincipalTicket()]
      });
    }

    if (escolha === 'opcoes') {
      return interaction.update({
        content: '## Gerenciar Opcoes',
        components: [menuGerenciarOpcoes()]
      });
    }

    if (escolha === 'geral') {
      const inputCat = new TextInputBuilder()
        .setCustomId('categoriaId')
        .setLabel('ID da Categoria')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(dados.sessao.categoriaId || '');
      const inputLog = new TextInputBuilder()
        .setCustomId('logsId')
        .setLabel('ID do Canal de Logs')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(dados.sessao.logsId || '');
      const inputCargo = new TextInputBuilder()
        .setCustomId('cargoMarcadoId')
        .setLabel('ID do Cargo marcado')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(dados.sessao.cargoMarcadoId || '');
      const modal = new ModalBuilder()
        .setCustomId('ticket_modal_geral')
        .setTitle('Configuracoes Gerais')
        .addComponents(
          new ActionRowBuilder().addComponents(inputCat),
          new ActionRowBuilder().addComponents(inputLog),
          new ActionRowBuilder().addComponents(inputCargo)
        );
      return interaction.showModal(modal);
    }

    if (escolha === 'salvar') {
      const guildPaineis = getPaineis(interaction.guild.id);
      const painelId = dados.painelId || ('painel_' + Date.now());
      guildPaineis.set(painelId, Object.assign({}, dados.sessao));
      sessoesTicket.delete(interaction.user.id);
      return interaction.update({
        content: 'Painel ' + (dados.sessao.titulo || 'Sem titulo') + ' salvo!',
        embeds: [],
        components: [menuPrincipalTicket()]
      });
    }

    if (escolha === 'enviar') {
      if (!dados.sessao.opcoes || dados.sessao.opcoes.length === 0) {
        return interaction.reply({
          content: 'Adicione ao menos uma opcao antes de enviar.',
          ephemeral: true
        });
      }
      const guildPaineis = getPaineis(interaction.guild.id);
      const painelId = dados.painelId || ('painel_' + Date.now());
      guildPaineis.set(painelId, Object.assign({}, dados.sessao));
      const embed = montarEmbed(dados.sessao);
      const selectRow = montarSelectOpcoes(dados.sessao, painelId);
      const components = selectRow ? [selectRow] : [];
      try {
        await interaction.channel.send({ embeds: [embed], components: components });
        sessoesTicket.delete(interaction.user.id);
        return interaction.update({
          content: 'Painel enviado e salvo!',
          embeds: [],
          components: [menuPrincipalTicket()]
        });
      } catch (err) {
        console.error(err);
        return interaction.reply({ content: 'Erro ao enviar painel.', ephemeral: true });
      }
    }

    const labelsMap = {
      titulo: 'Titulo', descricao: 'Descricao', cor: 'Cor (ex: #FF0000)',
      autor: 'Autor', imagem: 'Imagem (URL)', thumbnail: 'Thumbnail (URL)', rodape: 'Rodape'
    };
    const label = labelsMap[escolha] || escolha;
    const valorAtual = dados.sessao[escolha] || '';
    const isLong = escolha === 'descricao';
    const input = new TextInputBuilder()
      .setCustomId('valor')
      .setLabel(label)
      .setStyle(isLong ? TextInputStyle.Paragraph : TextInputStyle.Short)
      .setRequired(false)
      .setValue(valorAtual);
    const modal = new ModalBuilder()
      .setCustomId('ticket_modal_campo_' + escolha)
      .setTitle('Editar ' + label)
      .addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  if (interaction.customId === 'ticket_config_opcoes') {
    const escolha = interaction.values[0];
    const dados = sessoesTicket.get(interaction.user.id);
    if (!dados) {
      return interaction.reply({ content: 'Sessao expirada.', ephemeral: true });
    }

    if (escolha === 'voltar') {
      const preview = montarEmbed(dados.sessao);
      return interaction.update({
        content: '## Configurando Painel',
        embeds: [preview],
        components: [menuConfigPainel()]
      });
    }

    if (escolha === 'msg_selecao') {
      const input = new TextInputBuilder()
   
