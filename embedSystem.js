import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";

const sessions = new Map();

export default {
    data: new SlashCommandBuilder()
        .setName("embed")
        .setDescription("Criar embed personalizada")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        sessions.set(interaction.user.id, {
            titulo: null, descricao: null, cor: "#2b2d31",
            imagem: null, thumbnail: null, rodape: null,
            autor: null, botoes: []
        });

        const preview = new EmbedBuilder()
            .setTitle("Criador de Embed")
            .setDescription("Use o menu abaixo para configurar sua embed.")
            .setColor("#2b2d31");

        const menu = new StringSelectMenuBuilder()
            .setCustomId("embed_menu")
            .setPlaceholder("O que deseja configurar?")
            .addOptions([
                { label: "Titulo", value: "titulo", emoji: "📝" },
                { label: "Descricao", value: "descricao", emoji: "📄" },
                { label: "Cor", value: "cor", emoji: "🎨" },
                { label: "Imagem", value: "imagem", emoji: "🖼️" },
                { label: "Thumbnail", value: "thumbnail", emoji: "🔲" },
                { label: "Rodape", value: "rodape", emoji: "📋" },
                { label: "Autor", value: "autor", emoji: "✍️" },
                { label: "Enviar Embed", value: "enviar", emoji: "✅" },
                { label: "Cancelar", value: "cancelar", emoji: "❌" }
            ]);

        return interaction.reply({
            content: "## Configurador de Embed",
            embeds: [preview],
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true
        });
    },

    async handleInteraction(interaction) {
        // Aqui você pode colocar a lógica de modal, select e botões do embed
        // Igual seu código anterior, mantendo sessions Map para armazenar alterações
    }
};
