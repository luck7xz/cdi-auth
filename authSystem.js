import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";

const VERIFY_ROLE = "1473662501769183327"; // Cargo que será dado
const LOG_CHANNEL = "1476107996437155871"; // Canal de logs

export default {
    data: new SlashCommandBuilder()
        .setName("auth")
        .setDescription("Criar painel de verificação")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle("🔐 Verificação")
            .setDescription("Clique no botão abaixo para se verificar no nosso servidor abaixo")
            .setColor("Blue")
            .setFooter({ text: "CDI | Bot • Feito pelo Dev Luckxz_7" });

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("verify_button")
                .setLabel("Verificar")
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.channel.send({ embeds: [embed], components: [button] });
        return interaction.reply({ content: "✅ Painel de verificação enviado.", ephemeral: true });
    },

    async handleInteraction(interaction) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== "verify_button") return;

        const member = interaction.member;
        if (member.roles.cache.has(VERIFY_ROLE)) {
            return interaction.reply({ content: "❌ Você já está verificado.", ephemeral: true });
        }

        await member.roles.add(VERIFY_ROLE);

        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL);
        if (logChannel) {
            logChannel.send(`📥 O ${interaction.user} se verificou no servidor.`);
        }

        return interaction.reply({ content: "✅ Você foi verificado com sucesso!", ephemeral: true });
    }
};
