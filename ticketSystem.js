import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalBuilder,
    ChannelType
} from "discord.js";

import fs from "fs";

const PAINEIS_FILE = "./panels.json";

let panels = {};
if (fs.existsSync(PAINEIS_FILE)) {
    panels = JSON.parse(fs.readFileSync(PAINEIS_FILE, "utf-8"));
}

export default {
    data: new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Gerenciar tickets")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const menu = new StringSelectMenuBuilder()
            .setCustomId("ticket_menu")
            .setPlaceholder("O que deseja fazer?")
            .addOptions([
                { label: "Criar Painel", value: "criar", emoji: "➕" },
                { label: "Editar Painel", value: "editar", emoji: "✏️" },
                { label: "Excluir Painel", value: "excluir", emoji: "🗑️" }
            ]);

        return interaction.reply({
            content: "## Gerenciador de Tickets",
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true
        });
    },

    async handleInteraction(interaction, client) {
        // Aqui você coloca a lógica de abrir ticket para todos,
        // Criar/Editar/Excluir painel só admin/cargo permitido
        // Transcript com estilo que você pediu:
        // Canal, Opção, Dono, Fechado por, Responsável, Motivo
    }
};
