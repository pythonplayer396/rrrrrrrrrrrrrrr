const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const couponSchema = require("../schema/couponSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewcoupons")
    .setDescription("View all your available coupons"),

  run: async ({ interaction }) => {
    try {
      await interaction.deferReply({ flags: 1 << 6 });

      // Get all user's coupons
      const userCoupons = await couponSchema.find({ 
        userId: interaction.user.id,
        guildId: interaction.guild.id
      }).sort({ creationDate: -1 });

      if (userCoupons.length === 0) {
        return interaction.editReply({
          content: "You don't have any coupons yet. Purchase more than 7 carries to earn your first coupon!",
        });
      }

      // Separate unused and used coupons
      const unusedCoupons = userCoupons.filter(c => c.status === "unused");
      const usedCoupons = userCoupons.filter(c => c.status === "used");

      const couponsEmbed = new EmbedBuilder()
        .setTitle("Your Coupons")
        .setColor(0x00ff00)
        .setTimestamp();

      // Add unused coupons
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

      // Add recently used coupons (last 5)
      if (usedCoupons.length > 0) {
        const recentUsed = usedCoupons.slice(0, 5).map(coupon => {
          const usedDate = coupon.usedOn?.usedAt ? new Date(coupon.usedOn.usedAt).toLocaleDateString() : "Unknown";
          return `**${coupon.couponCode}** - ${coupon.discountAmount}% off (Used on ${usedDate})`;
        }).join('\n');

        couponsEmbed.addFields({
          name: `Recently Used Coupons`,
          value: recentUsed,
          inline: false
        });
      }

      couponsEmbed.addFields({
        name: "How to use",
        value: "Use `/redeem <code>` to redeem a coupon code",
        inline: false
      });

      await interaction.editReply({
        embeds: [couponsEmbed],
      });

    } catch (error) {
      console.error("Error in viewcoupons command:", error);
      return interaction.editReply({
        content: "An error occurred while fetching your coupons.",
      });
    }
  },
};
