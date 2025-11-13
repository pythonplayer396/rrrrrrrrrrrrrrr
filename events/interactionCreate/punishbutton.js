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
const ticketSetup = require("../../schema/ticketSchema");
const channelData = require("../../schema/ticketDetail");
const EMOJI = require("../../emoji");
require("dotenv").config();

module.exports = async (interaction) => {
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "ticket_select_menu"
  ) {
    const selected = interaction.values[0];

    if (selected === "slayer") {
      const modal = new ModalBuilder()
        .setCustomId("appeal_modal")
        .setTitle("Slayer Carry");

      const ign = new TextInputBuilder()
        .setCustomId("ign")
        .setLabel("What's Your IGN:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const slayerType = new TextInputBuilder()
        .setCustomId("slayer_type")
        .setLabel("Which Slayer:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const tier = new TextInputBuilder()
        .setCustomId("tier")
        .setLabel("Which Tier:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const carryCount = new TextInputBuilder()
        .setCustomId("carry_count")
        .setLabel("How Many Carries:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const additionalNotes = new TextInputBuilder()
        .setCustomId("additional_notes")
        .setLabel("Any Additional Notes:")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      const firstRow = new ActionRowBuilder().addComponents(ign);
      const secondRow = new ActionRowBuilder().addComponents(slayerType);
      const thirdRow = new ActionRowBuilder().addComponents(tier);
      const fourthRow = new ActionRowBuilder().addComponents(carryCount);
      const fifthRow = new ActionRowBuilder().addComponents(additionalNotes);

      modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);

      await interaction.showModal(modal);
    }
  }

  if (
    interaction.isButton() &&
    interaction.customId === "punish_appeal_button"
  ) {
      const modal = new ModalBuilder()
        .setCustomId("appeal_modal")
        .setTitle("Slayer Carry");

      const ign = new TextInputBuilder()
        .setCustomId("ign")
        .setLabel("What's Your IGN:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const slayerType = new TextInputBuilder()
        .setCustomId("slayer_type")
        .setLabel("Which Slayer:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const tier = new TextInputBuilder()
        .setCustomId("tier")
        .setLabel("Which Tier:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const carryCount = new TextInputBuilder()
        .setCustomId("carry_count")
        .setLabel("How Many Carries:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const additionalNotes = new TextInputBuilder()
        .setCustomId("additional_notes")
        .setLabel("Any Additional Notes:")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      const firstRow = new ActionRowBuilder().addComponents(ign);
      const secondRow = new ActionRowBuilder().addComponents(slayerType);
      const thirdRow = new ActionRowBuilder().addComponents(tier);
      const fourthRow = new ActionRowBuilder().addComponents(carryCount);
      const fifthRow = new ActionRowBuilder().addComponents(additionalNotes);

      modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);

    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === "appeal_modal") {
    // ✅ Defer reply immediately before database query
    await interaction.deferReply({ flags: 1 << 6 });
    
    const guildId = interaction.guild.id;
    const entry = await ticketSetup.findOne({ guildId });
    let slayerCarrierRoleId = entry.slayerCarrierRoleId;
    const p_ign = interaction.fields.getTextInputValue("ign");
    const p_slayerType = interaction.fields.getTextInputValue("slayer_type");
    const p_tier = interaction.fields.getTextInputValue("tier");
    const carryCountInput = interaction.fields.getTextInputValue("carry_count");
    const p_additionalNotes = interaction.fields.getTextInputValue("additional_notes") || "None";

    // Validate carry count is a number
    if (!/^\d+$/.test(carryCountInput)) {
      return interaction.editReply({
        content: "❌ Number of Carries must be a valid number (digits only).",
      });
    }

    const p_carryCount = parseInt(carryCountInput);
    
    if (p_carryCount < 1 || p_carryCount > 100) {
      return interaction.editReply({
        content: "❌ Number of Carries must be between 1 and 100.",
      });
    }

    const openerResponse = new EmbedBuilder()
      .setTitle("Slayer Carry Request")
      .setDescription("Request details")
      .setColor(0x2dfbd2)
      .addFields(
        { name: "IGN", value: p_ign },
        { name: "Slayer Type", value: p_slayerType },
        { name: "Tier", value: p_tier },
        { name: "Number of Carries", value: p_carryCount.toString() },
        { name: "Additional Notes", value: p_additionalNotes }
      );

    try {

      const sanitizedUsername = interaction.user.username
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();

      const channel = await interaction.guild.channels.create({
        name: `slayer-${p_slayerType}-${p_tier}-${p_carryCount}`.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase().slice(0, 90),
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
          },
          {
            id: slayerCarrierRoleId,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
          },
        ],
      });

      await channel.setParent(entry.punishmentAppealC, {
        lockPermissions: false,
      });

      const newChannelData = new channelData({
        channelId: channel.id,
        userId: interaction.user.id,
        carryData: {
          dungeonCarries: 0,
          slayerCarries: parseInt(p_carryCount) || 0,
          totalCarries: parseInt(p_carryCount) || 0,
          dungeonFloor: "N/A",
          ign: p_ign,
        },
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

       const carried = new ButtonBuilder()
         .setCustomId("carried_button")
         .setLabel("Carried")
         .setStyle(ButtonStyle.Success)
         .setEmoji("✅");

       // Add ticket coupon buttons
       const ticketRedeemButton = new ButtonBuilder()
         .setCustomId("ticket_redeem_coupon")
         .setLabel("Redeem Coupon")
         .setStyle(ButtonStyle.Success);
       const ticketViewButton = new ButtonBuilder()
         .setCustomId(`ticket_view_coupons_${interaction.user.id}`)
         .setLabel("View Coupons")
         .setStyle(ButtonStyle.Secondary);
       
       const ccButton = new ActionRowBuilder().addComponents(close, claim, carried);
       const couponButtonRow = new ActionRowBuilder().addComponents(ticketRedeemButton, ticketViewButton);

      await channel.send({
        content: `Welcome to FakePixel Giveaway's Carry Service!\nA carrier will be with you shortly to assist you.`,
      });
      await channel.send({
        content: `Dear <@${interaction.user.id}>, the <@&${slayerCarrierRoleId}> will be here soon to help you.`
      });
      await channel.send({
        embeds: [openerResponse],
        components: [ccButton, couponButtonRow],
      });

      await interaction.editReply({
        content: `✅ Your slayer carry ticket has been created: <#${channel.id}>`,
      });
    } catch (error) {
      console.error("Error creating appeal ticket:", error);

      await interaction.editReply({
        content: "❌ Failed to create ticket. Please contact staff.",
      });
    }
  }
};