const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const pointsSchema = require("../schema/pointsSchema");
const ticketSetup = require("../schema/ticketSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rv_points")
    .setDescription("Remove points from a staff member with a reason")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The staff member to remove points from")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("points")
        .setDescription("Number of points to remove")
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for removing points")
        .setRequired(true)
    ),

  run: async ({ interaction }) => {
    try {
      const guildId = interaction.guild.id;
      const targetUser = interaction.options.getUser("user");
      const pointsToRemove = interaction.options.getInteger("points");
      const reason = interaction.options.getString("reason");

      // Check if user has admin permissions
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const hasPermission = member.permissions.has(PermissionsBitField.Flags.Administrator);

      if (!hasPermission) {
        return interaction.reply({
          content: "❌ You need Administrator permissions to use this command.",
          flags: 1 << 6,
        });
      }

      // Find user's points
      let userPoints = await pointsSchema.findOne({ 
        userId: targetUser.id, 
        guildId 
      });

      if (!userPoints) {
        return interaction.reply({
          content: "❌ This user has no points to remove.",
          flags: 1 << 6,
        });
      }

      if (userPoints.totalPoints < pointsToRemove) {
        return interaction.reply({
          content: `❌ Cannot remove ${pointsToRemove} points. User only has ${userPoints.totalPoints} points.`,
          flags: 1 << 6,
        });
      }

      // Remove points
      userPoints.totalPoints -= pointsToRemove;
      userPoints.pointAdjustments.push({
        points: -pointsToRemove,
        reason,
        adjustedBy: interaction.user.id,
        type: "remove",
      });

      await userPoints.save();

      // Log to log channel
      const entry = await ticketSetup.findOne({ guildId });
      if (entry && entry.logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(entry.logChannelId);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("Points Removed")
            .setColor(0xff0000)
            .addFields(
              { name: "Staff Member", value: `<@${targetUser.id}>`, inline: true },
              { name: "Points Removed", value: pointsToRemove.toString(), inline: true },
              { name: "New Total", value: userPoints.totalPoints.toString(), inline: true },
              { name: "Reason", value: reason },
              { name: "Removed By", value: `<@${interaction.user.id}>` }
            );

          await logChannel.send({ embeds: [logEmbed] });
        }
      }

      const successEmbed = new EmbedBuilder()
        .setTitle("Points Removed")
        .setDescription(`Removed ${pointsToRemove} points from **${targetUser.username}**`)
        .setColor(0xff0000)
        .addFields(
          { name: "Points Removed", value: pointsToRemove.toString(), inline: true },
          { name: "New Total", value: userPoints.totalPoints.toString(), inline: true },
          { name: "Reason", value: reason }
        );

      await interaction.reply({ embeds: [successEmbed] });
    } catch (error) {
      console.error("Error in rv_points command:", error);
      await interaction.reply({
        content: "❌ An error occurred while removing points.",
        flags: 1 << 6,
      });
    }
  },
};
