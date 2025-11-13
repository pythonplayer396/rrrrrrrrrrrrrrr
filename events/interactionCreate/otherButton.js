const ticketSetup = require("../../schema/ticketSchema");

const {
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const channelData = require("../../schema/ticketDetail");
require("dotenv").config();
const EMOJI = require("../../emoji");

module.exports = async (interaction) => {
  if (!interaction || !interaction.guild) {
    return;
  }
  
  // ✅ Handle select menu and button interactions FIRST (show modal immediately without DB query)
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "ticket_select_menu"
  ) {
    const selected = interaction.values[0];

    if (selected === "other_ticket") {
      const modal = new ModalBuilder()
        .setCustomId("other_modal")
        .setTitle("Other Ticket");

      const otherType = new TextInputBuilder()
        .setCustomId("other_type")
        .setLabel("Ticket Topic: (Eg.Member Report,etc)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const otherIssue = new TextInputBuilder()
        .setCustomId("other_issue")
        .setLabel("Explain Your Issue: ")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const firstRow = new ActionRowBuilder().addComponents(otherType);
      const secondRow = new ActionRowBuilder().addComponents(otherIssue);

      modal.addComponents(firstRow, secondRow);

      try {
        await interaction.showModal(modal);
      } catch (_) {}
      return;
    }
  }
  
  if (interaction.isButton() && interaction.customId === "other_button") {
    const modal = new ModalBuilder()
      .setCustomId("other_modal")
      .setTitle("Other Ticket");

    const otherType = new TextInputBuilder()
      .setCustomId("other_type")
      .setLabel("Ticket Topic: (Eg.Member Report,etc)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const otherIssue = new TextInputBuilder()
      .setCustomId("other_issue")
      .setLabel("Explain Your Issue: ")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const firstRow = new ActionRowBuilder().addComponents(otherType);
    const secondRow = new ActionRowBuilder().addComponents(otherIssue);

    modal.addComponents(firstRow, secondRow);

    try {
      await interaction.showModal(modal);
    } catch (_) {}
    return;
  }
  
  // ✅ Only query database for modal submission (which will be deferred below)
  if (!interaction.isModalSubmit() || interaction.customId !== "other_modal") {
    return;
  }
  
  const guildId = interaction.guild.id;
  const entry = await ticketSetup.findOne({ guildId });
  if (!entry) {
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: "❌ Ticket setup not found. Please contact an administrator.", flags: 1 << 6 });
      } else if (interaction.isRepliable && interaction.isRepliable()) {
        await interaction.reply({ content: "❌ Ticket setup not found. Please contact an administrator.", flags: 1 << 6 });
      }
    } catch (_) {}
    return;
  }

  // Modal Submission Handling (already validated above)
  const other_type = interaction.fields.getTextInputValue("other_type");
  const other_matter = interaction.fields.getTextInputValue("other_issue");
  // const other_optional =
  //   interaction.fields.getTextInputValue("other_optional") || "N/A";

  const openerResponse = new EmbedBuilder()
    .setTitle(`${EMOJI.other} Other`)
    .setDescription("Ticket details")
    .setColor(0x2dfbd2)
    .addFields(
      { name: "Ticket Topic:", value: other_type },
      { name: "Issue:", value: other_matter }
    );

  try {
    // ✅ Defer the reply first!
    try {
      await interaction.deferReply({ flags: 1 << 6 });
    } catch (_) {}

    const sanitizedUsername = interaction.user.username
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id, // @everyone
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: interaction.user.id, // Ticket creator
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
          ],
        },
        ...(entry.highStaffRole ? [{
          id: entry.highStaffRole,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
          ],
        }] : []),
      ],
    });

    if (entry.otherC) {
      await channel.setParent(entry.otherC, {
        lockPermissions: false,
      });
    }

    const newChannelData = new channelData({
      channelId: channel.id,
      userId: interaction.user.id,
    });
    await newChannelData.save();

    const close = new ButtonBuilder()
      .setCustomId("close_button")
      .setLabel("Close")
      .setStyle(ButtonStyle.Danger);

    const claim = new ButtonBuilder()
      .setCustomId("claim_button")
      .setLabel("Claim")
      .setStyle(ButtonStyle.Primary);

    const ccButton = new ActionRowBuilder().addComponents(close, claim);

    const channelName = interaction.channel.name;

    await channel.send({
      content: `Welcome to FakePixel Giveaway's Carry Service!\nA carrier will be with you shortly to assist you.`,
    });
    await channel.send({
      content: `Dear <@${interaction.user.id}>, the <@&${entry.highStaffRole}> will be here soon to help you.`
    });
    await channel.send({
      embeds: [openerResponse],
      components: [ccButton],
    });

    // ✅ Edit the deferred reply instead of reply()
    try {
      await interaction.editReply({
        content: `✅ Your ticket has been created: <#${channel.id}>`,
      });
    } catch (_) {}
  } catch (error) {
    console.error("Error creating appeal ticket:", error);

    // ✅ Edit reply for error handling too!
    try {
      await interaction.editReply({
        content: "❌ Failed to create ticket. Please contact staff.",
      });
    } catch (_) {}
  }
};
