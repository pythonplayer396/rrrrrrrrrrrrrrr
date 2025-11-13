const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const couponSchema = require("../../schema/couponSchema");

module.exports = async (interaction) => {
  try {
    // Early return - only handle ticket coupon buttons
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;
    
    const isTicketRedeemButton = interaction.isButton() && interaction.customId === "ticket_redeem_coupon";
    const isTicketViewButton = interaction.isButton() && interaction.customId.startsWith("ticket_view_coupons_");
    const isTicketRedeemModal = interaction.isModalSubmit() && interaction.customId === "ticket_redeem_modal";
    
    if (!isTicketRedeemButton && !isTicketViewButton && !isTicketRedeemModal) {
      return; // Not a ticket coupon interaction
    }

    // Handle Ticket Redeem Button (opens modal)
    if (isTicketRedeemButton) {
      const modal = new ModalBuilder()
        .setCustomId("ticket_redeem_modal")
        .setTitle("Redeem Coupon Code");

      const couponCodeInput = new TextInputBuilder()
        .setCustomId("ticket_coupon_code")
        .setLabel("Enter your coupon code:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(8)
        .setMinLength(8);

      const actionRow = new ActionRowBuilder().addComponents(couponCodeInput);
      modal.addComponents(actionRow);

      await interaction.showModal(modal);
      return;
    }

    // Handle Ticket View Coupons Button
    if (isTicketViewButton) {
      const userId = interaction.customId.replace("ticket_view_coupons_", "");
      
      if (userId !== interaction.user.id) {
        return interaction.reply({
          content: "You can only view your own coupons.",
          flags: 1 << 6,
        });
      }

      await interaction.deferReply({ flags: 1 << 6 });

      const userCoupons = await couponSchema.find({ 
        userId: interaction.user.id,
        guildId: interaction.guild.id
      }).sort({ creationDate: -1 });

      if (userCoupons.length === 0) {
        return interaction.editReply({
          content: "You don't have any coupons yet. Purchase more than 7 carries to earn your first coupon!",
        });
      }

      const unusedCoupons = userCoupons.filter(c => c.status === "unused");
      const usedCoupons = userCoupons.filter(c => c.status === "used");

      const couponsEmbed = new EmbedBuilder()
        .setTitle("Your Coupons")
        .setColor(0x00ff00)
        .setTimestamp();

      if (unusedCoupons.length > 0) {
        const unusedList = unusedCoupons.map(coupon => {
          const expirationDate = new Date(coupon.creationDate.getTime() + (30 * 24 * 60 * 60 * 1000));
          const isExpired = new Date() > expirationDate;
          const status = isExpired ? "EXPIRED" : "Available";
          return `**${coupon.couponCode}** - ${coupon.discountAmount}% off (${status})`;
        }).join('\n');

        couponsEmbed.addFields({
          name: `Available Coupons (${unusedCoupons.length})`,
          value: unusedList,
          inline: false
        });
      }

      if (usedCoupons.length > 0) {
        const recentUsed = usedCoupons.slice(0, 3).map(coupon => {
          const usedDate = coupon.usedOn?.usedAt ? new Date(coupon.usedOn.usedAt).toLocaleDateString() : "Unknown";
          return `**${coupon.couponCode}** - ${coupon.discountAmount}% off (Used on ${usedDate})`;
        }).join('\n');

        couponsEmbed.addFields({
          name: `Recently Used`,
          value: recentUsed,
          inline: false
        });
      }

      await interaction.editReply({
        embeds: [couponsEmbed],
      });
      return;
    }

    // Handle Ticket Redeem Modal Submit
    if (isTicketRedeemModal) {
      const couponCode = interaction.fields.getTextInputValue("ticket_coupon_code").toUpperCase();
      
      await interaction.deferReply();

      const coupon = await couponSchema.findOne({ 
        couponCode, 
        userId: interaction.user.id,
        status: "unused"
      });

      if (!coupon) {
        return interaction.editReply({
          content: "This coupon is either invalid, already used, or does not belong to you.",
        });
      }

      // Check expiration
      const now = new Date();
      const expirationDate = new Date(coupon.creationDate.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      if (now > expirationDate) {
        return interaction.editReply({
          content: "This coupon has expired. Coupons are valid for 30 days from creation.",
        });
      }

      // Mark as used
      coupon.status = "used";
      coupon.usedOn = { usedAt: new Date() };
      await coupon.save();

      // Public redemption message
      await interaction.editReply({
        content: `<@${interaction.user.id}> has redeemed a ${coupon.discountAmount}% coupon! Your coupon code ${couponCode} has been marked as used.\n<@&1280539104832127008> ${coupon.discountAmount}% off now`,
      });
    }

  } catch (error) {
    console.error("Error in ticket coupon buttons:", error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: "An error occurred while processing your coupon request.",
      }).catch(() => {});
    } else {
      await interaction.reply({
        content: "An error occurred while processing your coupon request.",
        flags: 1 << 6,
      }).catch(() => {});
    }
  }
};