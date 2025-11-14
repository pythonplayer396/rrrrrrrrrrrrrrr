const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const pointsSchema = require("../schema/pointsSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cpoints")
    .setDescription("Shows total carry points for a staff member")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The staff member to check points for")
        .setRequired(true)
    ),

  run: async ({ interaction }) => {
    try {
      const guildId = interaction.guild.id;
      const targetUser = interaction.options.getUser("user");

      // Check if user has staff permissions
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const hasPermission = member.permissions.has(PermissionsBitField.Flags.ManageRoles) || 
                           member.permissions.has(PermissionsBitField.Flags.Administrator);

      if (!hasPermission) {
        return interaction.reply({
          content: "❌ You don't have permission to use this command.",
          flags: 1 << 6,
        });
      }

      // Find user's points
      const userPoints = await pointsSchema.findOne({ 
        userId: targetUser.id, 
        guildId 
      });

      if (!userPoints || userPoints.totalPoints === 0) {
        const noPointsEmbed = new EmbedBuilder()
          .setTitle("Carry Points")
          .setDescription(`**${targetUser.username}** has no carry points yet.`)
          .setColor(0x808080)
          .setThumbnail(targetUser.displayAvatarURL())
          .setFooter({ text: "Carry Points System" });

        return interaction.reply({ embeds: [noPointsEmbed] });
      }

      // Calculate recent activity (last 10 carries)
      const recentCarries = userPoints.carryHistory
        .sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt))
        .slice(0, 10);

      const recentCarriesText = recentCarries.length > 0 
        ? recentCarries.map(carry => 
            `• ${carry.carryType.charAt(0).toUpperCase() + carry.carryType.slice(1)} ${carry.tier || carry.floor} - ${carry.points} pts`
          ).join('\n')
        : "No recent carries";

      const pointsEmbed = new EmbedBuilder()
        .setTitle("Carry Points")
        .setDescription(`**${targetUser.username}**'s carry statistics`)
        .setColor(0x00ff00)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { 
            name: "Total Points", 
            value: userPoints.totalPoints.toString(), 
            inline: true 
          },
          { 
            name: "Total Carries", 
            value: userPoints.carryHistory.length.toString(), 
            inline: true 
          },
          { 
            name: "Average Points per Carry", 
            value: userPoints.carryHistory.length > 0 
              ? (userPoints.totalPoints / userPoints.carryHistory.length).toFixed(1)
              : "0", 
            inline: true 
          },
          { 
            name: "Recent Carries (Last 10)", 
            value: recentCarriesText.length > 1000 
              ? recentCarriesText.substring(0, 1000) + "..."
              : recentCarriesText || "No recent carries"
          }
        )
        .setTimestamp()
        .setFooter({ text: "Carry Points System" });

      await interaction.reply({ embeds: [pointsEmbed] });
    } catch (error) {
      console.error("Error in cpoints command:", error);
      await interaction.reply({
        content: "❌ An error occurred while fetching points data.",
        flags: 1 << 6,
      });
    }
  },
};
