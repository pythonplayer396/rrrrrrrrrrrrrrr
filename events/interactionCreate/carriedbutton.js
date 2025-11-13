const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  EmbedBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const ticketSetup = require("../../schema/ticketSchema");

module.exports = async (interaction) => {
  try {
    // Handle Carried button click
    if (interaction.isButton() && interaction.customId === "carried_button") {
      // Check if the button is disabled (already used)
      if (interaction.component.disabled) {
        return interaction.reply({
          content: "❌ This button has already been used and cannot be clicked again.",
          flags: 1 << 6,
        });
      }
      
      if (!interaction.guild) {
        return interaction.reply({
          content: "❌ This command can only be used in a server.",
          flags: 1 << 6,
        }).catch(() => {});
      }
      
      // ✅ Show modal immediately without database query
      // Create modal for carry completion
      const modal = new ModalBuilder()
        .setCustomId("carried_modal")
        .setTitle("Carry Completion Form");

      const ticketId = new TextInputBuilder()
        .setCustomId("ticket_id")
        .setLabel("Which Ticket (Channel Name or ID):")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const carryType = new TextInputBuilder()
        .setCustomId("carry_type")
        .setLabel("Carry Type (Slayer/Dungeon):")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder("Enter 'Slayer' or 'Dungeon'");

      const tierFloor = new TextInputBuilder()
        .setCustomId("tier_floor")
        .setLabel("Tier (for Slayer) or Floor (for Dungeon):")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const carryCount = new TextInputBuilder()
        .setCustomId("carry_count")
        .setLabel("How many carries:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder("Enter number of carries completed");

      const firstRow = new ActionRowBuilder().addComponents(ticketId);
      const secondRow = new ActionRowBuilder().addComponents(carryType);
      const thirdRow = new ActionRowBuilder().addComponents(tierFloor);
      const fourthRow = new ActionRowBuilder().addComponents(carryCount);

      modal.addComponents(firstRow, secondRow, thirdRow, fourthRow);

      try {
        await interaction.showModal(modal);
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expired, ignore
          return;
        }
        console.error("Error showing modal:", error);
      }
    }

    // Handle modal submission
    if (interaction.isModalSubmit() && interaction.customId === "carried_modal") {
      if (!interaction.guild) {
        return interaction.reply({
          content: "❌ This command can only be used in a server.",
          flags: 1 << 6,
        }).catch(() => {});
      }
      
      await interaction.deferReply({ flags: 1 << 6 });

      const ticketId = interaction.fields.getTextInputValue("ticket_id");
      const carryType = interaction.fields.getTextInputValue("carry_type").toLowerCase();
      const tierFloor = interaction.fields.getTextInputValue("tier_floor");
      const carryCount = interaction.fields.getTextInputValue("carry_count");

      const guildId = interaction.guild.id;
      const entry = await ticketSetup.findOne({ guildId });

      if (!entry) {
        return interaction.editReply({
          content: "❌ Ticket setup not found. Please contact an administrator.",
        });
      }

      // Create approval request embed
      const approvalEmbed = new EmbedBuilder()
        .setTitle("Carry Completion Request")
        .setDescription("Staff member requesting approval")
        .setColor(0x00ff00)
        .addFields(
          { name: "Ticket ID", value: ticketId, inline: true },
          { name: "Carry Type", value: carryType.charAt(0).toUpperCase() + carryType.slice(1), inline: true },
          { name: carryType === "slayer" ? "Tier" : "Floor", value: tierFloor, inline: true },
          { name: "Number of Carries", value: carryCount, inline: true },
          { name: "Submitted By", value: `<@${interaction.user.id}>`, inline: true },
          { name: "Staff Member", value: interaction.user.username, inline: true }
        );

      // Create approve/decline buttons
      const approveButton = new ButtonBuilder()
        .setCustomId(`approve_carry_${interaction.user.id}_${Date.now()}`)
        .setLabel("✅ Approve")
        .setStyle(ButtonStyle.Success);

      const declineButton = new ButtonBuilder()
        .setCustomId(`decline_carry_${interaction.user.id}_${Date.now()}`)
        .setLabel("❌ Decline")
        .setStyle(ButtonStyle.Danger);

      const buttonRow = new ActionRowBuilder().addComponents(approveButton, declineButton);

      try {
        // Send to approval channel
        const approvalChannel = interaction.guild.channels.cache.get(entry.requestApproveChannelId);
        if (!approvalChannel) {
          return interaction.editReply({
            content: "❌ Approval channel not found. Please contact an administrator.",
          });
        }

        await approvalChannel.send({
          embeds: [approvalEmbed],
          components: [buttonRow],
        });

        // Disable the "Carried" button in the original ticket message
        try {
          // Find the original message with the carried button
          const messages = await interaction.channel.messages.fetch({ limit: 50 });
          const originalMessage = messages.find(msg => 
            msg.components.length > 0 && 
            msg.components.some(row => 
              row.components.some(component => 
                component.customId === "carried_button"
              )
            )
          );

          if (originalMessage) {
            // Create disabled version of the carried button
            const disabledCarriedButton = new ButtonBuilder()
              .setCustomId("carried_button")
              .setLabel("Carried")
              .setStyle(ButtonStyle.Success)
              .setEmoji("✅")
              .setDisabled(true);

            // Find the original button row and replace the carried button
            const newComponents = originalMessage.components.map(row => {
              const newRow = new ActionRowBuilder();
              row.components.forEach(component => {
                if (component.customId === "carried_button") {
                  newRow.addComponents(disabledCarriedButton);
                } else {
                  newRow.addComponents(component);
                }
              });
              return newRow;
            });

            await originalMessage.edit({ components: newComponents });
          }
        } catch (error) {
          console.error("Error disabling carried button:", error);
        }

        await interaction.editReply({
          content: "✅ Your carry completion request has been submitted for approval!",
        });
      } catch (error) {
        console.error("Error sending approval request:", error);
        await interaction.editReply({
          content: "❌ Failed to submit approval request. Please try again.",
        });
      }
    }
  } catch (error) {
      console.error("Error in carried button handler:", error);
      try {
        if (error.code === 10062) {
          // Interaction expired, ignore
          return;
        }
        if (interaction.deferred) {
          await interaction.editReply({
            content: "❌ An error occurred while processing your request.",
          });
        } else {
          await interaction.reply({
            content: "❌ An error occurred while processing your request.",
            flags: 1 << 6,
          });
        }
      } catch (replyError) {
        if (replyError.code === 10062) {
          // Interaction expired, ignore
          return;
        }
        console.error("Error sending error reply:", replyError);
      }
    }
};
