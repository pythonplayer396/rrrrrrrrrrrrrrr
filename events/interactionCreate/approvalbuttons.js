const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  EmbedBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const ticketSetup = require("../../schema/ticketSchema");
const pointsSchema = require("../../schema/pointsSchema");

// Points calculation function
function calculatePoints(carryType, tierFloor, grade = null) {
  const pointsChart = {
    dungeon: {
      catacombs: {
        "1": { "S": 2, "S+": 3 },
        "2": { "S": 3, "S+": 4 },
        "3": { "S": 4, "S+": 5 },
        "4": { "S": 5, "S+": 6 },
        "5": { "S": 6, "S+": 8 },
        "6": { "S": 8, "S+": 10 },
        "7": { "S": 10, "S+": 14 },
      },
      master: {
        "1": { "S": 6, "S+": 8 },
        "2": { "S": 7, "S+": 9 },
        "3": { "S": 8, "S+": 10 },
        "4": { "S": 9, "S+": 12 },
        "5": { "S": 10, "S+": 14 },
        "6": { "S": 14, "S+": 18 },
        "7": { "S": 18, "S+": 24 },
      }
    },
    slayer: {
      "revenant horror": { "2": 2, "3": 4 },
      "tarantula broodfather": { "2": 2, "3": 4 },
      "sven packmaster": { "2": 3, "3": 5 },
      "voidgloom seraph": { "1": 4, "2": 6 },
      "inferno demonlord": { "1": 6, "2": 10 },
    }
  };

  if (carryType === "dungeon") {
    const floor = tierFloor.toLowerCase();
    if (floor.startsWith("f")) {
      const floorNum = floor.replace("f", "");
      return pointsChart.dungeon.catacombs[floorNum]?.[grade] || 0;
    } else if (floor.startsWith("m")) {
      const floorNum = floor.replace("m", "");
      return pointsChart.dungeon.master[floorNum]?.[grade] || 0;
    }
  } else if (carryType === "slayer") {
    const slayerName = tierFloor.toLowerCase();
    for (const [name, tiers] of Object.entries(pointsChart.slayer)) {
      if (slayerName.includes(name.split(" ")[0])) {
        return tiers[grade] || 0;
      }
    }
  }
  return 0;
}

module.exports = async (interaction) => {
  try {
    if (!interaction || !interaction.guild) {
      return;
    }
    
    // ✅ Check if this handler is relevant BEFORE database query
    const isApproveButton = interaction.isButton() && interaction.customId.startsWith("approve_carry_");
    const isDeclineButton = interaction.isButton() && interaction.customId.startsWith("decline_carry_");
    const isApproveModal = interaction.isModalSubmit() && interaction.customId === "approve_modal";
    const isDeclineModal = interaction.isModalSubmit() && interaction.customId === "decline_modal";
    
    if (!isApproveButton && !isDeclineButton && !isApproveModal && !isDeclineModal) {
      return; // Not for this handler
    }
    
    // ✅ Now query database only for relevant interactions
    const guildId = interaction.guild.id;
    const entry = await ticketSetup.findOne({ guildId });
    
    if (!entry) {
      return interaction.reply({
        content: "❌ Ticket setup not found. Please contact an administrator.",
        ephemeral: true,
      });
    }

    let hasHighStaffPermission = false;
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      hasHighStaffPermission = member.roles.cache.has(entry.highStaffRole);
    } catch (e) {
      hasHighStaffPermission = false;
    }

    // Handle approve button
    if (isApproveButton) {
      if (!hasHighStaffPermission) {
        return interaction.reply({
          content: "❌ You don't have permission to approve carry requests. Only high staff members can approve requests.",
          ephemeral: true,
        });
      }
      const modal = new ModalBuilder()
        .setCustomId("approve_modal")
        .setTitle("Approve Carry Request");

      const reason = new TextInputBuilder()
        .setCustomId("approve_reason")
        .setLabel("Reason for approval:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const points = new TextInputBuilder()
        .setCustomId("approve_points")
        .setLabel("Points to award (number):")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder("Enter number of points");

      const firstRow = new ActionRowBuilder().addComponents(reason);
      const secondRow = new ActionRowBuilder().addComponents(points);

      modal.addComponents(firstRow, secondRow);

      try {
        await interaction.showModal(modal);
      } catch (err) {
        // Ignore if interaction already acknowledged or expired
        if (err && (err.code === 40060 || err.code === 10062)) return;
        throw err;
      }
    }

    // Handle decline button
    if (isDeclineButton) {
      if (!hasHighStaffPermission) {
        return interaction.reply({
          content: "❌ You don't have permission to decline carry requests. Only high staff members can decline requests.",
          ephemeral: true,
        });
      }
      const modal = new ModalBuilder()
        .setCustomId("decline_modal")
        .setTitle("Decline Carry Request");

      const reason = new TextInputBuilder()
        .setCustomId("decline_reason")
        .setLabel("Reason for decline:")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const firstRow = new ActionRowBuilder().addComponents(reason);
      modal.addComponents(firstRow);

      try {
        await interaction.showModal(modal);
      } catch (err) {
        // Ignore if interaction already acknowledged or expired
        if (err && (err.code === 40060 || err.code === 10062)) return;
        throw err;
      }
    }

    // Handle approve modal submission
    if (isApproveModal) {
      if (!hasHighStaffPermission) {
        return interaction.reply({
          content: "❌ You don't have permission to approve carry requests. Only high staff members can approve requests.",
          ephemeral: true,
        });
      }
      
      try {
        await interaction.deferReply({ ephemeral: true });
      } catch (err) {
        // If already acknowledged, skip deferring and continue gracefully
        if (!(err && (err.code === 40060 || err.code === 10062))) throw err;
      }

      const reason = interaction.fields.getTextInputValue("approve_reason");
      const points = parseInt(interaction.fields.getTextInputValue("approve_points"));

      if (isNaN(points) || points <= 0) {
        return interaction.editReply({
          content: "❌ Please enter a valid number of points.",
        });
      }

      // Get original embed data from the message
      const originalEmbed = interaction.message.embeds[0];
      const staffMemberId = originalEmbed.fields.find(f => f.name === "Submitted By")?.value?.match(/<@(\d+)>/)?.[1];
      const carryType = originalEmbed.fields.find(f => f.name === "Carry Type")?.value?.toLowerCase();
      const tierFloor = originalEmbed.fields.find(f => f.name === "Tier" || f.name === "Floor")?.value;
      const ticketId = originalEmbed.fields.find(f => f.name === "Ticket ID")?.value;
      const carryCount = originalEmbed.fields.find(f => f.name === "Number of Carries")?.value;

      if (!staffMemberId) {
        return interaction.editReply({
          content: "❌ Could not find staff member information.",
        });
      }

      const guildId = interaction.guild.id;
      const entry = await ticketSetup.findOne({ guildId });

      if (!entry) {
        return interaction.editReply({
          content: "❌ Ticket setup not found.",
        });
      }

      // Update points in database
      let userPoints = await pointsSchema.findOne({ userId: staffMemberId, guildId });
      if (!userPoints) {
        userPoints = new pointsSchema({
          userId: staffMemberId,
          guildId,
          totalPoints: 0,
          carryHistory: [],
          pointAdjustments: [],
        });
      }

      userPoints.totalPoints += points;
      userPoints.carryHistory.push({
        ticketId,
        carryType,
        tier: carryType === "slayer" ? tierFloor : null,
        floor: carryType === "dungeon" ? tierFloor : null,
        points,
        approvedBy: interaction.user.id,
      });

      await userPoints.save();

      // Create approved embed
      const approvedEmbed = new EmbedBuilder()
        .setTitle("Carry Approved")
        .setDescription("Points awarded")
        .setColor(0x00ff00)
        .addFields(
          { name: "Ticket ID", value: ticketId, inline: true },
          { name: "Carry Type", value: carryType.charAt(0).toUpperCase() + carryType.slice(1), inline: true },
          { name: carryType === "slayer" ? "Tier" : "Floor", value: tierFloor, inline: true },
          { name: "Number of Carries", value: carryCount || "N/A", inline: true },
          { name: "Staff Member", value: `<@${staffMemberId}>`, inline: true },
          { name: "Points Awarded", value: points.toString(), inline: true },
          { name: "Total Points", value: userPoints.totalPoints.toString(), inline: true },
          { name: "Approved By", value: `<@${interaction.user.id}>`, inline: true },
          { name: "Reason", value: reason }
        );

      // Send to approved channel
      const approvedChannel = interaction.guild.channels.cache.get(entry.approvedChannelId);
      if (approvedChannel) {
        await approvedChannel.send({ embeds: [approvedEmbed] });
      }

      // Send DM to the carrier
      try {
        const staffMember = await interaction.guild.members.fetch(staffMemberId);
        if (staffMember) {
          const dmEmbed = new EmbedBuilder()
            .setTitle("✅ Carry Request Approved")
            .setDescription(`Your carry completion request has been approved!`)
            .setColor(0x00ff00)
            .addFields(
              { name: "Ticket ID", value: ticketId, inline: true },
              { name: "Carry Type", value: carryType.charAt(0).toUpperCase() + carryType.slice(1), inline: true },
              { name: carryType === "slayer" ? "Tier" : "Floor", value: tierFloor, inline: true },
              { name: "Number of Carries", value: carryCount || "N/A", inline: true },
              { name: "Points Awarded", value: points.toString(), inline: true },
              { name: "Total Points", value: userPoints.totalPoints.toString(), inline: true },
              { name: "Approved By", value: `<@${interaction.user.id}>`, inline: true },
              { name: "Reason", value: reason }
            )
            .setTimestamp();
          
          await staffMember.send({ embeds: [dmEmbed] }).catch(err => {
            console.log(`Could not send DM to ${staffMember.user.tag}: ${err.message}`);
          });
        }
      } catch (err) {
        console.error("Error sending DM to carrier:", err);
      }

      // Update original message
      await interaction.message.edit({
        content: "**APPROVED** - This request has been approved and points awarded.",
        embeds: [originalEmbed],
        components: [],
      });

      await interaction.editReply({
        content: "✅ Carry request approved and points awarded!",
      });
    }

    // Handle decline modal submission
    if (isDeclineModal) {
      if (!hasHighStaffPermission) {
        return interaction.reply({
          content: "❌ You don't have permission to decline carry requests. Only high staff members can decline requests.",
          ephemeral: true,
        });
      }
      
      try {
        await interaction.deferReply({ ephemeral: true });
      } catch (err) {
        // If already acknowledged, skip deferring and continue gracefully
        if (!(err && (err.code === 40060 || err.code === 10062))) throw err;
      }

      const reason = interaction.fields.getTextInputValue("decline_reason");

      // Get original embed data
      const originalEmbed = interaction.message.embeds[0];
      const staffMemberId = originalEmbed.fields.find(f => f.name === "Submitted By")?.value?.match(/<@(\d+)>/)?.[1];
      const carryType = originalEmbed.fields.find(f => f.name === "Carry Type")?.value?.toLowerCase();
      const tierFloor = originalEmbed.fields.find(f => f.name === "Tier" || f.name === "Floor")?.value;
      const ticketId = originalEmbed.fields.find(f => f.name === "Ticket ID")?.value;
      const carryCount = originalEmbed.fields.find(f => f.name === "Number of Carries")?.value;

      const guildId = interaction.guild.id;
      const entry = await ticketSetup.findOne({ guildId });

      if (!entry) {
        return interaction.editReply({
          content: "❌ Ticket setup not found.",
        });
      }

      // Create declined embed
      const declinedEmbed = new EmbedBuilder()
        .setTitle("Carry Declined")
        .setDescription("Request declined")
        .setColor(0xff0000)
        .addFields(
          { name: "Ticket ID", value: ticketId, inline: true },
          { name: "Carry Type", value: carryType.charAt(0).toUpperCase() + carryType.slice(1), inline: true },
          { name: carryType === "slayer" ? "Tier" : "Floor", value: tierFloor, inline: true },
          { name: "Number of Carries", value: carryCount || "N/A", inline: true },
          { name: "Staff Member", value: `<@${staffMemberId}>`, inline: true },
          { name: "Declined By", value: `<@${interaction.user.id}>`, inline: true },
          { name: "Reason", value: reason }
        );

      // Send to declined channel
      const declinedChannel = interaction.guild.channels.cache.get(entry.declinedChannelId);
      if (declinedChannel) {
        await declinedChannel.send({ embeds: [declinedEmbed] });
      }

      // Send DM to the carrier
      try {
        const staffMember = await interaction.guild.members.fetch(staffMemberId);
        if (staffMember) {
          const dmEmbed = new EmbedBuilder()
            .setTitle("❌ Carry Request Declined")
            .setDescription(`Your carry completion request has been declined.`)
            .setColor(0xff0000)
            .addFields(
              { name: "Ticket ID", value: ticketId, inline: true },
              { name: "Carry Type", value: carryType.charAt(0).toUpperCase() + carryType.slice(1), inline: true },
              { name: carryType === "slayer" ? "Tier" : "Floor", value: tierFloor, inline: true },
              { name: "Number of Carries", value: carryCount || "N/A", inline: true },
              { name: "Declined By", value: `<@${interaction.user.id}>`, inline: true },
              { name: "Reason", value: reason }
            )
            .setTimestamp();
          
          await staffMember.send({ embeds: [dmEmbed] }).catch(err => {
            console.log(`Could not send DM to ${staffMember.user.tag}: ${err.message}`);
          });
        }
      } catch (err) {
        console.error("Error sending DM to carrier:", err);
      }

      // Update original message
      await interaction.message.edit({
        content: "**DECLINED** - This request has been declined.",
        embeds: [originalEmbed],
        components: [],
      });

      await interaction.editReply({
        content: "❌ Carry request declined.",
      });
    }
  } catch (error) {
    console.error("Error in approval buttons handler:", error);
    try {
      if (interaction.deferred || interaction.replied) {
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
      // Ignore double-acknowledgement or expired interaction errors
      if (!(replyError && (replyError.code === 40060 || replyError.code === 10062))) {
        console.error("Error sending error reply:", replyError);
      }
    }
  }
};
