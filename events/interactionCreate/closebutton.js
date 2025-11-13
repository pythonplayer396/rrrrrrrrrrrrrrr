const {
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const ticketSetup = require("../../schema/ticketSchema");
const channelData = require("../../schema/ticketDetail");
const staffPoints = require("../../schema/staffPoints");
const couponSchema = require("../../schema/couponSchema");

module.exports = async (interaction, client) => {
  try {
    // BUTTON INTERACTION HANDLER
    if (interaction.isButton() && interaction.customId === "close_button") {
      if (!interaction.guild) {
        return interaction.reply({
          content: "❌ This command can only be used in a server.",
          flags: 1 << 6,
        }).catch(() => {});
      }
      
      // ✅ Show modal immediately without database query (validate permissions in modal submit)
      // Build and show the modal
      const modal = new ModalBuilder()
        .setCustomId("close_ticket_modal")
        .setTitle("Close Ticket");

      const reasonInput = new TextInputBuilder()
        .setCustomId("close_reason")
        .setLabel("Reason for closing the ticket")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const actionRow = new ActionRowBuilder().addComponents(reasonInput);
      modal.addComponents(actionRow);

      await interaction.showModal(modal);
    }

    // MODAL SUBMIT HANDLER
    if (
      interaction.isModalSubmit() &&
      interaction.customId === "close_ticket_modal"
    ) {
      // ✅ Defer reply immediately
    try {
        await interaction.deferReply({ ephemeral: true });
      } catch (err) {
        console.log("❗ Failed to defer modal interaction:", err);
        return;
      }

      
      const channel = interaction.channel;
      const guild = interaction.guild;
      const guildId = guild.id;

      const entry = await ticketSetup.findOne({ guildId });
      const channelEntry = await channelData.findOne({ channelId: channel.id });

      if (!entry || !channelEntry) {
        return interaction.editReply({
          content: "This is not a valid ticket channel.",
        });
      }
      
      // ✅ Check permissions here
      const hasPermission = interaction.member.roles.cache.has(entry.highStaffRole) || 
                           interaction.member.roles.cache.has(entry.slayerCarrierRoleId) || 
                           interaction.member.roles.cache.has(entry.dungeonCarrierRoleId);
      if (!hasPermission) {
        return interaction.editReply({
          content: "❌ You do not have permission to close tickets.",
        });
      }
      
      const staffPLogChannel = entry.pointsLog;
      const channelPLog = guild.channels.cache.get(staffPLogChannel);

      const reason = interaction.fields.getTextInputValue("close_reason");

      // Send initial message about transcript generation
      await interaction.editReply({
        content: "📄 Transcript is generating...",
      });

      // Generate transcript
      const messages = await channel.messages.fetch({ limit: 100 });
      const sortedMessages = messages.sort(
        (a, b) => a.createdTimestamp - b.createdTimestamp
      );

      let transcriptContent = `Transcript of ${channel.name}\nClosed by: ${interaction.user.tag}\nReason: ${reason}\n\n`;

      sortedMessages.forEach((msg) => {
        transcriptContent += `[${new Date(
          msg.createdTimestamp
        ).toLocaleString()}] ${msg.author.tag}: ${msg.content}\n`;

        if (msg.attachments.size > 0) {
          msg.attachments.forEach((attachment) => {
            transcriptContent += `    📎 Attachment: ${attachment.url}\n`;
          });
        }
      });

      // Save transcript file
      const transcriptsDir = path.join(__dirname, "../../transcripts");
      if (!fs.existsSync(transcriptsDir)) {
        fs.mkdirSync(transcriptsDir);
      }

      const fileName = `transcript-${channel.name}-${Date.now()}.txt`;
      const filePath = path.join(transcriptsDir, fileName);
      fs.writeFileSync(filePath, transcriptContent);

      const attachment = new AttachmentBuilder(filePath);

      // Send transcript to log channel and opener
      const logChannelId = entry.transcriptChannelId;
      const logsChannel = client.channels.cache.get(logChannelId);

      if (logsChannel) {
        const closeEmbed = new EmbedBuilder()
          .setTitle("🎫 Ticket Transcript")
          .setColor(0x9b7dfb)
          .addFields(
            { name: "Ticket Name:", value: channel.name },
            { name: "Ticket Type:", value: channel.parent?.name || "Unknown" },
            { name: "Ticket Closer:", value: interaction.user.username },
            { name: "Closing Reason:", value: reason }
          );

        await logsChannel.send({
          embeds: [closeEmbed],
          files: [attachment],
        });
        try {
          // Send transcript to opener (if they exist)
          const openerId = channelEntry.userId;
          const opener = await interaction.guild.members.fetch(openerId).catch(() => null);
          if (opener && opener.user) {
            await opener.user.send({
              embeds: [closeEmbed],
              files: [attachment],
            }).catch(() => {
              console.log(`❌ Could not send transcript to user ${openerId}`);
            });

            // Send feedback request
            const claimerId = channelEntry.claimer || "none";
            const carrierMention = claimerId !== "none" ? `<@${claimerId}>` : "the staff member";
            const feedbackEmbed = new EmbedBuilder()
              .setTitle("⭐ How do you rate our help?")
              .setDescription(`Dear <@${openerId}>,\n\nrecently you were contacting Staff by creating a ticket with ID **${channel.name}** on **${guild.name}**.\n\nTell us about your experience with ${carrierMention} and give them feedback.\n\nYou have **24 hours** to give a review.\n\nThank you for contacting us!\nYour feedback helps us improve our service! • ${new Date().toLocaleString()}\n\n> **⚠️ IMPORTANT - PRIVATE INFORMATION**\n> Do not show screenshots or details of this feedback to anyone, not even owners or staff members. Only you can see it. Staff will not ask for it, and carriers will not ask for it either. This is private information.`)
              .setColor(0xffa500);

            const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
            const ratingButtons = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`feedback_rating_1_${guildId}_${claimerId}`)
                .setLabel("1")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("⭐"),
              new ButtonBuilder()
                .setCustomId(`feedback_rating_2_${guildId}_${claimerId}`)
                .setLabel("2")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("⭐"),
              new ButtonBuilder()
                .setCustomId(`feedback_rating_3_${guildId}_${claimerId}`)
                .setLabel("3")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("⭐"),
              new ButtonBuilder()
                .setCustomId(`feedback_rating_4_${guildId}_${claimerId}`)
                .setLabel("4")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("⭐"),
              new ButtonBuilder()
                .setCustomId(`feedback_rating_5_${guildId}_${claimerId}`)
                .setLabel("5")
                .setStyle(ButtonStyle.Primary)
                .setEmoji("⭐")
            );

            await opener.user.send({
              embeds: [feedbackEmbed],
              components: [ratingButtons],
            }).catch(() => {
              console.log(`❌ Could not send feedback request to user ${openerId}`);
            });
          }
        } catch (error) { console.log(error) }
      }

      // Delete transcript file after sending (optional)
      fs.unlink(filePath, (err) => {
        if (err) console.error("❗ Error deleting transcript file:", err);
      });
      // Staff Points Logic
      const staffId = channelEntry.claimer;

      if (staffId) {
        let staff = await staffPoints.findOne({ staffId });

        if (!staff) {
          staff = new staffPoints({
            staffId,
            points: 1,
          });
        } else {
          staff.points += 1;
        }

        await staff.save();

        await channelEntry.deleteOne();

        const staffPEmbed = new EmbedBuilder()
          .setTitle(`✅ Staff Point Awarded`)
          .setDescription(
            `+1 point to <@${staffId}> for handling ticket **${channel.name}**`
          )
          .addFields({ name: "Total Points", value: `${staff.points}` })
          .setColor("Random");

        if (channelPLog) {
          await channelPLog.send({ embeds: [staffPEmbed] });
        }
      }

      // Coupon Generation Logic
      const carryData = channelEntry.carryData;
      if (carryData && carryData.totalCarries > 7) {
        try {
          // Generate unique coupon code
          const generateCouponCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 8; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
          };

          // Generate random discount between 10% and 60%
          const discountAmount = Math.floor(Math.random() * 51) + 10; // 10-60%
          
          let couponCode;
          let isUnique = false;
          
          // Ensure coupon code is unique
          while (!isUnique) {
            couponCode = generateCouponCode();
            const existingCoupon = await couponSchema.findOne({ couponCode });
            if (!existingCoupon) {
              isUnique = true;
            }
          }

          // Create coupon in database
          const newCoupon = new couponSchema({
            userId: channelEntry.userId,
            guildId: interaction.guild.id,
            couponCode,
            discountAmount,
            status: "unused",
            earnedFrom: {
              ticketId: channel.name,
              totalCarries: carryData.totalCarries,
              dungeonCarries: carryData.dungeonCarries,
              slayerCarries: carryData.slayerCarries,
            },
          });

          await newCoupon.save();

          // Send coupon message to user
          try {
            const opener = await interaction.guild.members.fetch(channelEntry.userId).catch(() => null);
            if (opener && opener.user) {
              const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
              
              const couponEmbed = new EmbedBuilder()
                .setTitle("Discount Coupon Earned")
                .setDescription(`You have qualified for a discount coupon for purchasing ${carryData.totalCarries} carries.`)
                .addFields(
                  { name: "Your coupon code", value: couponCode, inline: true },
                  { name: "Discount", value: `${discountAmount}% off your next purchase`, inline: true },
                  { name: "Status", value: "Each coupon can be used only once", inline: false }
                )
                .setColor(0x00ff00)
                .setTimestamp();

              await opener.user.send({
                embeds: [couponEmbed],
              }).catch(() => {
                console.log(`❌ Could not send coupon to user ${channelEntry.userId}`);
              });
            }
          } catch (error) {
            console.error("Error sending coupon message:", error);
          }
        } catch (error) {
          console.error("Error generating coupon:", error);
        }
      }

      // Finally, delete the ticket channel
      await channel.delete(
        `Ticket closed by ${interaction.user.tag} | Reason: ${reason}`
      );
    }
  } catch (error) {
    console.error("❗ Error in ticket close flow:", error);

    if (interaction.replied || interaction.deferred) {
      interaction.followUp({
        content: "❌ Something went wrong while closing the ticket.",
        flags: 1 << 6,
      });
    } else {
      interaction.reply({
        content: "❌ Something went wrong while closing the ticket.",
        flags: 1 << 6,
      });
    }
  }
};
