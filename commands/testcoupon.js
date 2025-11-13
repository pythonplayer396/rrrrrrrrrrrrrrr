const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const couponSchema = require("../schema/couponSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("testcoupon")
    .setDescription("Generate a test coupon for testing purposes (Admin only)"),

  run: async ({ interaction }) => {
    try {
      // Check if user has admin permissions
      if (!interaction.member.permissions.has("Administrator")) {
        return interaction.reply({
          content: "❌ You need Administrator permissions to use this command.",
          flags: 1 << 6,
        });
      }

      await interaction.deferReply({ flags: 1 << 6 });

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

      // Create test coupon in database
      const newCoupon = new couponSchema({
        userId: interaction.user.id,
        guildId: interaction.guild.id,
        couponCode,
        discountAmount,
        status: "unused",
        earnedFrom: {
          ticketId: "test-ticket-123",
          totalCarries: 10,
          dungeonCarries: 10,
          slayerCarries: 0,
        },
      });

      await newCoupon.save();

      // Send test coupon message
      const couponEmbed = new EmbedBuilder()
        .setTitle("Test Coupon Generated")
        .setDescription(`A test coupon has been created for testing the redeem/view system.`)
        .addFields(
          { name: "Your coupon code", value: couponCode, inline: true },
          { name: "Discount", value: `${discountAmount}% off your next purchase`, inline: true },
          { name: "Status", value: "Each coupon can be used only once", inline: false }
        )
        .setColor(0x00ff00)
        .setTimestamp();

      const redeemButton = new ButtonBuilder()
        .setCustomId(`redeem_coupon_${couponCode}`)
        .setLabel("Redeem")
        .setStyle(ButtonStyle.Success);

      const viewCouponsButton = new ButtonBuilder()
        .setCustomId(`view_coupons_${interaction.user.id}`)
        .setLabel("View Coupons")
        .setStyle(ButtonStyle.Primary);

      const couponButtons = new ActionRowBuilder().addComponents(redeemButton, viewCouponsButton);

      await interaction.editReply({
        embeds: [couponEmbed],
        components: [couponButtons],
      });

    } catch (error) {
      console.error("Error in testcoupon command:", error);
      return interaction.editReply({
        content: "An error occurred while generating the test coupon.",
      });
    }
  },
};
