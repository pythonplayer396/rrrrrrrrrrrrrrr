const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const ticketSetup = require("../../schema/ticketSchema");

module.exports = async (message) => {
  const prefix = "^";
  const command = "pvfeedback";

  // Check if message starts with the command
  if (!message.content.toLowerCase().startsWith(`${prefix}${command}`)) return;

  // Check for administrator permissions
  if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return message.reply({
      content: "❌ You need Administrator permissions to use this command.",
    });
  }

  const guildId = message.guild.id;
  const channelId = message.channel.id;

  try {
    // Find or create ticket setup entry
    let entry = await ticketSetup.findOne({ guildId });

    if (!entry) {
      return message.reply({
        content: "❌ Please set up the ticket system first using `/ticketsetup id`",
      });
    }

    // Update private feedback channel
    entry.privateFeedbackChannelId = channelId;
    await entry.save();

    const successEmbed = new EmbedBuilder()
      .setTitle("✅ Private Feedback Channel Set!")
      .setDescription(`This channel (<#${channelId}>) has been set as the **private feedback channel** for high staff.\n\nDetailed feedback with user information will be sent here.`)
      .setColor(0x00ff00)
      .setTimestamp();

    await message.reply({
      embeds: [successEmbed],
    });

    console.log(`[PRIVATE FEEDBACK SETUP] Guild: ${guildId} | Channel: ${channelId}`);
  } catch (error) {
    console.error("Error setting private feedback channel:", error);
    await message.reply({
      content: "❌ An error occurred while setting up the private feedback channel. Please try again.",
    });
  }
};
