const ticketSetup = require("../schema/ticketSchema");
const {
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} = require("discord.js");
const EMOJI = require("../emoji");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("panel2")
    .setDescription("Form's A Ticket Panel In Current Channel."),

  run: async ({ interaction }) => {
    try {
      // ✅ Defer reply first to prevent timeout
      await interaction.deferReply({ flags: 1 << 6 });
      
      const guildId = interaction.guild.id;
      const entry = await ticketSetup.findOne({ guildId });

      if (!entry) {
        return interaction.editReply({
          content: "❌ Ticket setup not found. Please run `/ticketsetup id` first to configure the bot.",
        });
      }

      let highStaffRoleId = entry.highStaffRole;
      const member = await interaction.guild.members.fetch(interaction.user.id);

      if (interaction.isChatInputCommand()) {
        if (
          interaction.commandName === "panel2" &&
          member.roles.cache.has(highStaffRoleId)
        ) {
          await interaction.editReply({
            content: "⏳ Loading Panel...",
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
            .setColor(0x000000)
            .setFooter({ text: "FxG Ticket System", iconURL: "https://cdn.discordapp.com/emojis/1385107904813858947.png" });

          const ticketSelectMenu = new StringSelectMenuBuilder()
            .setCustomId("ticket_select_menu")
            .setPlaceholder("Select Ticket Type")
            .addOptions(
              new StringSelectMenuOptionBuilder()
                .setLabel("Dungeon Carry")
                .setDescription("Select this if you want to request a dungeon carry in FxG.")
                .setValue("dungeon"),
              new StringSelectMenuOptionBuilder()
                .setLabel("Slayer Carry")
                .setDescription("Select this if you want to request a slayer carry in FxG.")
                .setValue("slayer"),
              new StringSelectMenuOptionBuilder()
                .setLabel("Other")
                .setDescription("Select this if your issue is not listed above.")
                .setValue("other_ticket")
            );

          const row = new ActionRowBuilder().addComponents(ticketSelectMenu);

          await interaction.channel.send({
            embeds: [panelEmbed],
            components: [row],
          });
        } else {
          return interaction.editReply({
            content: "❌ You don't have permission to use this command. You need the High Staff role.",
          });
        }
      }
    } catch (error) {
      console.error("Error in panel2 command:", error);
      try {
        if (interaction.deferred || interaction.replied) {
          return interaction.editReply({
            content: "❌ An error occurred while creating the panel.",
          });
        } else {
          return interaction.reply({
            content: "❌ An error occurred while creating the panel.",
            flags: 1 << 6,
          });
        }
      } catch (_) {}
    }
  },
};
