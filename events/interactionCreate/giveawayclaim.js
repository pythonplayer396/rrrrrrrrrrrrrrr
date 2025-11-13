const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  EmbedBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
} = require("discord.js");
require("dotenv").config();
const ticketSetup = require("../../schema/ticketSchema");
const channelData = require("../../schema/ticketDetail");
const EMOJI = require("../../emoji");

module.exports = async (interaction) => {
  try {
    // SELECT MENU INTERACTION
    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "ticket_select_menu"
    ) {
      const selected = interaction.values[0];

      if (selected === "dungeon") {
        const modal = new ModalBuilder()
          .setCustomId("giveaway_claim")
          .setTitle("Dungeon Carry Ticket");

        const winnerIGN = new TextInputBuilder()
          .setCustomId("winner_ign")
          .setLabel("What's Your IGN:")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const dungeonFloor = new TextInputBuilder()
          .setCustomId("dungeon_floor")
          .setLabel("Which Dungeon Floor:")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const carryCount = new TextInputBuilder()
          .setCustomId("carry_count")
          .setLabel("How Many Carries Do You Want:")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const tier = new TextInputBuilder()
          .setCustomId("tier")
          .setLabel("Which Tier (S or S+):")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const additionalNotes = new TextInputBuilder()
          .setCustomId("additional_notes")
          .setLabel("Any Additional Notes:")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false);

        const firstActionRow = new ActionRowBuilder().addComponents(winnerIGN);
        const secondActionRow = new ActionRowBuilder().addComponents(dungeonFloor);
        const thirdActionRow = new ActionRowBuilder().addComponents(carryCount);
        const fourthActionRow = new ActionRowBuilder().addComponents(tier);
        const fifthActionRow = new ActionRowBuilder().addComponents(additionalNotes);

        modal.addComponents(
          firstActionRow,
          secondActionRow,
          thirdActionRow,
          fourthActionRow,
          fifthActionRow
        );

        await interaction.showModal(modal);
        return;
      }
    }

    // BUTTON INTERACTION
    if (
      interaction.isButton() &&
      interaction.customId === "giveaway_claim_button"
    ) {
      const modal = new ModalBuilder()
        .setCustomId("giveaway_claim")
        .setTitle("Dungeon Carry Ticket");

      const winnerIGN = new TextInputBuilder()
        .setCustomId("winner_ign")
        .setLabel("What's Your IGN:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const dungeonFloor = new TextInputBuilder()
        .setCustomId("dungeon_floor")
        .setLabel("Which Dungeon Floor:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const carryCount = new TextInputBuilder()
        .setCustomId("carry_count")
        .setLabel("How Many Carries Do You Want:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const tier = new TextInputBuilder()
        .setCustomId("tier")
        .setLabel("Which Tier (S or S+):")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const additionalNotes = new TextInputBuilder()
        .setCustomId("additional_notes")
        .setLabel("Any Additional Notes:")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      const firstActionRow = new ActionRowBuilder().addComponents(winnerIGN);
      const secondActionRow = new ActionRowBuilder().addComponents(dungeonFloor);
      const thirdActionRow = new ActionRowBuilder().addComponents(carryCount);
      const fourthActionRow = new ActionRowBuilder().addComponents(tier);
      const fifthActionRow = new ActionRowBuilder().addComponents(additionalNotes);

      modal.addComponents(
        firstActionRow,
        secondActionRow,
        thirdActionRow,
        fourthActionRow,
        fifthActionRow
      );

      await interaction.showModal(modal);
      return;
    }

    // MODAL SUBMIT INTERACTION
    if (
      interaction.isModalSubmit() &&
      interaction.customId === "giveaway_claim"
    ) {
      if (!interaction.guild) {
        return interaction.reply({
          content: "❌ This command can only be used in a server.",
          flags: 1 << 6,
        }).catch(() => {});
      }
      
      await interaction.deferReply({ flags: 1 << 6 }); // Prevent interaction timeout

      const guildId = interaction.guild.id;
      const entry = await ticketSetup.findOne({ guildId });

      if (!entry) {
        return interaction.editReply({
          content: "❌ Ticket setup not found. Please contact an administrator.",
        });
      }

      const dungeonCarrierRoleId = entry.dungeonCarrierRoleId;

      const g_winnerIGN = interaction.fields.getTextInputValue("winner_ign");
      const g_dungeonFloor = interaction.fields.getTextInputValue("dungeon_floor");
      const carryCountInput = interaction.fields.getTextInputValue("carry_count");
      const g_tier = interaction.fields.getTextInputValue("tier");
      const g_additionalNotes = interaction.fields.getTextInputValue("additional_notes") || "None";

      // Validate carry count is a number
      if (!/^\d+$/.test(carryCountInput)) {
        return interaction.editReply({
          content: "❌ Number of Carries must be a valid number (digits only).",
        });
      }

      const g_carryCount = parseInt(carryCountInput);
      
      if (g_carryCount < 1 || g_carryCount > 100) {
        return interaction.editReply({
          content: "❌ Number of Carries must be between 1 and 100.",
        });
      }

      const giveawayDetails = new EmbedBuilder()
        .setTitle("Dungeon Carry Request")
        .setDescription("Request details")
        .setColor(0x2dfbd2)
        .addFields(
          { name: "IGN", value: g_winnerIGN },
          { name: "Dungeon Floor", value: g_dungeonFloor },
          { name: "Number of Carries", value: g_carryCount.toString() },
          { name: "Tier", value: g_tier },
          { name: "Additional Notes", value: g_additionalNotes }
        );

      try {
        const channel = await interaction.guild.channels.create({
          name: `dungeon-${g_dungeonFloor}-${g_tier}-${g_carryCount}`.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase().slice(0, 90),
          type: 0, // GUILD_TEXT
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
              id: dungeonCarrierRoleId,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
          ],
        });

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

        await channel.setParent(entry.giveawayClaimC, {
          lockPermissions: false,
        });

        const newChannelData = new channelData({
          channelId: channel.id,
          userId: interaction.user.id,
          carryData: {
            dungeonCarries: g_carryCount,
            slayerCarries: 0,
            totalCarries: g_carryCount,
            dungeonFloor: g_dungeonFloor,
            ign: g_winnerIGN,
          },
        });
        await newChannelData.save();

        await channel.send({
          content: `Welcome to FakePixel Giveaway's Carry Service!\nA carrier will be with you shortly to assist you.`,
        });
        await channel.send({
          content: `Dear <@${interaction.user.id}>, the <@&${dungeonCarrierRoleId}> will be here soon to help you.`
        });
        await channel.send({
          embeds: [giveawayDetails],
          components: [ccButton, couponButtonRow],
        });

        await interaction.editReply({
          content: `✅ Your dungeon carry ticket has been created: ${channel}`,
        });
      } catch (error) {
        console.error("Error creating giveaway ticket:", error);
        await interaction.editReply({
          content: "❌ Failed to create ticket. Please try again or contact an administrator.",
        });
      }
    }
  } catch (error) {
    console.error("Error in giveaway claim handler:", error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: "❌ An error occurred while processing your request.",
        });
      } else {
        await interaction.reply({
          content: "❌ An error occurred while processing your request.",
          ephemeral: true,
        });
      }
    } catch (replyError) {
      console.error("Error sending error reply:", replyError);
    }
  }
};
