const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const ticketSetup = require("../../schema/ticketSchema");

module.exports = async (interaction) => {
  try {
    // Handle star rating button clicks
    if (
      interaction.isButton() &&
      interaction.customId.startsWith("feedback_rating_")
    ) {
      const parts = interaction.customId.split("_");
      const rating = parts[2]; // Extract rating (1-5)
      const guildId = parts[3]; // Extract guild ID
      const claimerId = parts[4]; // Extract claimer ID
      const ticketId = interaction.message.embeds[0]?.description?.match(/ID \*\*(.*?)\*\*/)?.[1] || "Unknown";

      // Show modal for written feedback
      const modal = new ModalBuilder()
        .setCustomId(`feedback_modal_${rating}_${guildId}_${claimerId}_${ticketId}`)
        .setTitle(`Feedback - ${rating} Star${rating > 1 ? 's' : ''}`);

      const feedbackInput = new TextInputBuilder()
        .setCustomId("feedback_text")
        .setLabel("Please share your experience:")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setPlaceholder("Your feedback helps us improve our service...");

      const carryDescription = new TextInputBuilder()
        .setCustomId("carry_description")
        .setLabel("Describe the carry:")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder("bad, mid, well, good, amazing, fabulous");

      const firstRow = new ActionRowBuilder().addComponents(feedbackInput);
      const secondRow = new ActionRowBuilder().addComponents(carryDescription);
      modal.addComponents(firstRow, secondRow);

      await interaction.showModal(modal);
    }

    // Handle modal submission
    if (
      interaction.isModalSubmit() &&
      interaction.customId.startsWith("feedback_modal_")
    ) {
      await interaction.deferReply({ flags: 1 << 6 });

      const parts = interaction.customId.split("_");
      const rating = parts[2];
      const guildId = parts[3]; // Extract guild ID from modal custom ID
      const claimerId = parts[4]; // Extract claimer ID
      const ticketId = parts.slice(5).join("_");
      const feedbackText = interaction.fields.getTextInputValue("feedback_text") || "No additional feedback provided";
      const carryDescription = interaction.fields.getTextInputValue("carry_description") || "Not provided";

      if (!guildId) {
        return interaction.editReply({
          content: "❌ Could not determine server. Please contact support.",
        });
      }

      const entry = await ticketSetup.findOne({ guildId });
      if (!entry || !entry.feedbackChannelId) {
        return interaction.editReply({
          content: "✅ Thank you for your feedback!",
        });
      }

      // Get feedback channel
      const feedbackChannel = await interaction.client.channels.fetch(entry.feedbackChannelId).catch(() => null);
      if (!feedbackChannel) {
        return interaction.editReply({
          content: "✅ Thank you for your feedback!",
        });
      }

      // Create star display
      const stars = "⭐".repeat(parseInt(rating));
      
      // Format feedback message for public channel
      const carrierMention = claimerId !== "none" ? `<@${claimerId}>` : "Not claimed";
      const feedbackMessage = `-----------------------\nuser - <@${interaction.user.id}> | carrier - ${carrierMention}\n\nrating - ${stars} (${rating}/5)\n\nfeedback - ${feedbackText}\n-----------------------`;

      await feedbackChannel.send({ content: feedbackMessage });

      // Send detailed feedback to private channel if configured
      if (entry.privateFeedbackChannelId) {
        const privateFeedbackChannel = await interaction.client.channels.fetch(entry.privateFeedbackChannelId).catch(() => null);
        if (privateFeedbackChannel) {
          const ratingText = rating === "5" ? "Excellent" : rating === "4" ? "Good" : rating === "3" ? "Average" : rating === "2" ? "Poor" : "Very Poor";
          const timestamp = Math.floor(Date.now() / 1000);
          
          const privateFeedbackEmbed = new EmbedBuilder()
            .setTitle("📋 Detailed Feedback Report")
            .setColor(rating >= 4 ? 0x00ff00 : rating >= 3 ? 0xffaa00 : 0xff0000)
            .addFields(
              { name: "User", value: `<@${interaction.user.id}>\n\`${interaction.user.tag}\` (${interaction.user.id})` },
              { name: "Carrier", value: claimerId !== "none" ? `<@${claimerId}>` : "Not claimed" },
              { name: "Rating", value: `${stars} ${ratingText} (${rating}/5)` },
              { name: "Ticket ID", value: ticketId || "Unknown" },
              { name: "Submitted At", value: `<t:${timestamp}:F>\n\`\`\`<t:${timestamp}:R>\`\`\`` },
              { name: "Feedback", value: feedbackText },
              { name: "Description of the Carry", value: carryDescription }
            );

          await privateFeedbackChannel.send({ embeds: [privateFeedbackEmbed] });
        }
      }

      // Update the original message to show submitted feedback in code block
      try {
        const submittedEmbed = new EmbedBuilder()
          .setTitle("✅ Feedback Submitted")
          .setDescription(`Thank you for your ${rating}-star feedback!\n\n**Your feedback:**\n\`\`\`\n${feedbackText}\n\`\`\``)
          .setColor(0x00ff00)
          .setTimestamp();

        await interaction.message.edit({
          embeds: [submittedEmbed],
          components: [], // Remove buttons
        });
      } catch (error) {
        console.log("Could not update feedback message:", error);
      }

      // Confirm to user
      await interaction.editReply({
        content: `✅ Thank you for your ${rating}-star feedback! We appreciate your input.`,
      });
    }
  } catch (error) {
    console.error("Error in feedback handler:", error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: "❌ An error occurred while processing your feedback.",
      }).catch(() => {});
    } else {
      await interaction.reply({
        content: "❌ An error occurred while processing your feedback.",
        flags: 1 << 6,
      }).catch(() => {});
    }
  }
};
