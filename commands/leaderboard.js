const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const pointsSchema = require("../schema/pointsSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Shows the carry points leaderboard")
    .addIntegerOption((option) =>
      option
        .setName("page")
        .setDescription("Page number to view (default: 1)")
        .setMinValue(1)
        .setRequired(false)
    ),

  run: async ({ interaction }) => {
    try {
      const guildId = interaction.guild.id;
      const page = interaction.options.getInteger("page") || 1;
      const pageSize = 10;

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

      // Get all users with points, sorted by totalPoints descending
      const leaderboard = await pointsSchema.find({ guildId }).sort({ totalPoints: -1 });
      
      if (!leaderboard.length) {
        const noDataEmbed = new EmbedBuilder()
          .setTitle("🏆 Carry Points Leaderboard 🏆")
          .setDescription("No carry points have been recorded yet.")
          .setColor(0x808080)
          .setFooter({ text: "Carry Points System" });

        return interaction.reply({ embeds: [noDataEmbed] });
      }

      const totalPages = Math.ceil(leaderboard.length / pageSize);
      const currentPage = Math.min(Math.max(page, 1), totalPages);
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;

      const generateEmbed = async (pageNum) => {
        const leaderboardData = await pointsSchema.find({ guildId }).sort({ totalPoints: -1 });
        const totalPages = Math.ceil(leaderboardData.length / pageSize);
        const start = (pageNum - 1) * pageSize;
        const end = start + pageSize;
        const pageData = leaderboardData.slice(start, end);

        const embed = new EmbedBuilder()
          .setTitle("🏆 Carry Points Leaderboard 🏆")
          .setColor(0xffd700)
          .setFooter({ 
            text: `Page ${pageNum} of ${totalPages} | Total Staff: ${leaderboardData.length}`,
            iconURL: interaction.client.user.displayAvatarURL()
          })
          .setTimestamp();

        if (pageData.length === 0) {
          embed.setDescription("No data available for this page.");
          return embed;
        }

        let description = "";
        for (let i = 0; i < pageData.length; i++) {
          const userData = pageData[i];
          const position = start + i + 1;
          
          try {
            const user = await interaction.client.users.fetch(userData.userId);
            const carryCount = userData.carryHistory ? userData.carryHistory.length : 0;
            const avgPoints = carryCount > 0 ? (userData.totalPoints / carryCount).toFixed(1) : "0";
            
            // Add position emoji
            let positionEmoji = "";
            if (position === 1) positionEmoji = "🥇";
            else if (position === 2) positionEmoji = "🥈";
            else if (position === 3) positionEmoji = "🥉";
            else positionEmoji = `**#${position}**`;

            description += `${positionEmoji} **${user.username}**\n`;
            description += `└ Points: **${userData.totalPoints}** | Carries: **${carryCount}** | Avg: **${avgPoints}**\n\n`;
          } catch (error) {
            // User not found, show as Unknown
            const positionEmoji = position <= 3 ? (position === 1 ? "🥇" : position === 2 ? "🥈" : "🥉") : `**#${position}**`;
            description += `${positionEmoji} **Unknown User**\n`;
            description += `└ Points: **${userData.totalPoints}** | Carries: **${userData.carryHistory ? userData.carryHistory.length : 0}**\n\n`;
          }
        }

        embed.setDescription(description);
        return embed;
      };

      const createButtons = (disabled = false, currentPageNum = 1, totalPagesNum = 1) => {
        const row = new ActionRowBuilder();
        
        row.addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("⬅️ Previous")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled || currentPageNum <= 1),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next ➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled || currentPageNum >= totalPagesNum)
        );

        return row;
      };

      const firstEmbed = await generateEmbed(currentPage);
      const row = createButtons(false, currentPage, totalPages);

      const leaderboardMessage = await interaction.reply({
        embeds: [firstEmbed],
        components: [row],
        fetchReply: true
      });

      // Only add button collector if there are multiple pages
      if (totalPages > 1) {
        const filter = (buttonInteraction) => buttonInteraction.user.id === interaction.user.id;
        const collector = leaderboardMessage.createMessageComponentCollector({
          filter,
          time: 300000, // 5 minutes
        });

        let currentPageNum = currentPage;

        collector.on("collect", async (buttonInteraction) => {
          try {
            await buttonInteraction.deferUpdate();

            if (buttonInteraction.customId === "prev" && currentPageNum > 1) {
              currentPageNum--;
            } else if (buttonInteraction.customId === "next" && currentPageNum < totalPages) {
              currentPageNum++;
            }

            const newEmbed = await generateEmbed(currentPageNum);
            const newRow = createButtons(false, currentPageNum, totalPages);
            
            await buttonInteraction.editReply({
              embeds: [newEmbed],
              components: [newRow]
            });
          } catch (error) {
            console.error("Error updating leaderboard:", error);
          }
        });

        collector.on("end", async () => {
          try {
            const disabledRow = createButtons(true, currentPageNum, totalPages);
            await leaderboardMessage.edit({
              components: [disabledRow]
            });
          } catch (error) {
            console.error("Error disabling buttons:", error);
          }
        });
      }
    } catch (error) {
      console.error("Error in leaderboard command:", error);
      await interaction.reply({
        content: "❌ An error occurred while fetching the leaderboard.",
        flags: 1 << 6,
      });
    }
  },
};
