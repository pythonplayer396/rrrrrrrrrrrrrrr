const ticketSetup = require("../schema/ticketSchema");
const {
  SlashCommandBuilder,
  EmbedBuilder,
  TextInputBuilder,
  ModalBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextInputStyle,
  ActionRowBuilder,
  PermissionsBitField,
  ChannelType,
  Embed,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Form's A Ticket Panel In Current Channel."),

  run: async ({ interaction }) => {
    try {
      const guildId = interaction.guild.id;
      const entry = await ticketSetup.findOne({ guildId });

      if (!entry) {
        return interaction.reply({
          content: "❌ Ticket setup not found. Please run `/ticketsetup id` first to configure the bot.",
          flags: 1 << 6,
        });
      }

      let highStaffRoleId = entry.highStaffRole;
      const member = await interaction.guild.members.fetch(interaction.user.id);

      // Handle slash command /ticket
      if (interaction.isChatInputCommand()) {
        if (
          interaction.commandName === "panel" &&
          member.roles.cache.has(highStaffRoleId)
        ) {
          await interaction.reply({
            content: "⏳ Loading Panel...",
            flags: 1 << 6,
          });

          const panelEmbed = new EmbedBuilder()
            .setTitle("Carry Service")
            .setDescription("Need help with Slayer or Dungeon carries? Create a ticket to purchase a carry and get expert assistance.")
            .addFields(
              {
                name: "How to Request a Carry",
                value: "Select the category that matches your request.\n\nAfter your ticket is created, provide all necessary details for faster service.",
              },
              {
                name: "Available Services",
                value: "**Slayer Carry** – Assistance with slayer bosses\n**Dungeon Carry** – Efficient dungeon completion support",
              },
              {
                name: "Support",
                value: "Fakepixel Giveaway Carrier Staff will assist you as soon as possible.\nPlease be patient while we process your request.",
              }
            )
            .setThumbnail(
              "https://cdn.discordapp.com/icons/1246452712653062175/a_31b8d1bbd6633b72eff08a3a35f3bb0b.gif"
            )
            .setColor(0x4ffb3c)
            .setFooter({ text: "FxG Ticket System" });

          const ticketButton = new ButtonBuilder()
            .setCustomId("giveaway_claim_button")
            .setLabel("Dungeon Carry")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("🏰");

          const appealTicketButton = new ButtonBuilder()
            .setCustomId("punish_appeal_button")
            .setLabel("Slayer Carry")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("⚔️");

          const otherButton = new ButtonBuilder()
            .setCustomId("other_button")
            .setLabel("Other")
            .setStyle(ButtonStyle.Success)
            .setEmoji("📌");

          const row = new ActionRowBuilder().addComponents(
            ticketButton,
            appealTicketButton,
            otherButton
          );

          await interaction.channel.send({
            components: [row],
            embeds: [panelEmbed],
          });
        } else {
          return interaction.reply({
            content: "❌ You don't have permission to use this command. You need the High Staff role.",
            flags: 1 << 6,
          });
        }
      }
    } catch (error) {
      console.error("Error in panel command:", error);
      return interaction.reply({
        content: "❌ An error occurred while creating the panel.",
        flags: 1 << 6,
      });
    }
  },
};
