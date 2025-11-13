const { SlashCommandBuilder } = require("discord.js");
const couponSchema = require("../schema/couponSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("redeem")
    .setDescription("Redeem a coupon code")
    .addStringOption(option =>
      option
        .setName("code")
        .setDescription("The coupon code to redeem")
        .setRequired(true)
        .setMaxLength(8)
        .setMinLength(8)
    ),

  run: async ({ interaction }) => {
    try {
      const couponCode = interaction.options.getString("code").toUpperCase();
      
      await interaction.deferReply();

      // Find the coupon
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

      // Check if coupon is expired
      const now = new Date();
      const expirationDate = new Date(coupon.creationDate.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      if (now > expirationDate) {
        return interaction.editReply({
          content: "This coupon has expired. Coupons are valid for 30 days from creation.",
        });
      }

      // Mark coupon as used
      coupon.status = "used";
      coupon.usedOn = {
        usedAt: new Date(),
      };
      await coupon.save();

      // Send public redemption message
      await interaction.editReply({
        content: `<@${interaction.user.id}> has redeemed a ${coupon.discountAmount}% coupon! Your coupon code ${couponCode} has been marked as used.\n<@&1280539104832127008> ${coupon.discountAmount}% off now`,
      });

    } catch (error) {
      console.error("Error in redeem command:", error);
      return interaction.editReply({
        content: "An error occurred while processing your coupon request.",
      });
    }
  },
};
