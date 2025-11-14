const ticketSetup = require("../schema/ticketSchema");
const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dungeon_record")
    .setDescription("Record a dungeon carry with images")
    .addStringOption((option) =>
      option
        .setName("ticket")
        .setDescription("Ticket ID or reference")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("floor")
        .setDescription("Dungeon floor")
        .addChoices(
          { name: "Entrance", value: "E" },
          { name: "F1", value: "F1" },
          { name: "F2", value: "F2" },
          { name: "F3", value: "F3" },
          { name: "F4", value: "F4" },
          { name: "F5", value: "F5" },
          { name: "F6", value: "F6" },
          { name: "F7", value: "F7" },
          { name: "M1", value: "M1" },
          { name: "M2", value: "M2" },
          { name: "M3", value: "M3" },
          { name: "M4", value: "M4" },
          { name: "M5", value: "M5" },
          { name: "M6", value: "M6" },
          { name: "M7", value: "M7" }
        )
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("mages")
        .setDescription("Number of mages involved")
        .setRequired(false)
    )
    // Up to 20 attachments supported by adding multiple optional slots
    .addAttachmentOption((o) => o.setName("image1").setDescription("Image 1").setRequired(false))
    .addAttachmentOption((o) => o.setName("image2").setDescription("Image 2").setRequired(false))
    .addAttachmentOption((o) => o.setName("image3").setDescription("Image 3").setRequired(false))
    .addAttachmentOption((o) => o.setName("image4").setDescription("Image 4").setRequired(false))
    .addAttachmentOption((o) => o.setName("image5").setDescription("Image 5").setRequired(false))
    .addAttachmentOption((o) => o.setName("image6").setDescription("Image 6").setRequired(false))
    .addAttachmentOption((o) => o.setName("image7").setDescription("Image 7").setRequired(false))
    .addAttachmentOption((o) => o.setName("image8").setDescription("Image 8").setRequired(false))
    .addAttachmentOption((o) => o.setName("image9").setDescription("Image 9").setRequired(false))
    .addAttachmentOption((o) => o.setName("image10").setDescription("Image 10").setRequired(false))
    .addAttachmentOption((o) => o.setName("image11").setDescription("Image 11").setRequired(false))
    .addAttachmentOption((o) => o.setName("image12").setDescription("Image 12").setRequired(false))
    .addAttachmentOption((o) => o.setName("image13").setDescription("Image 13").setRequired(false))
    .addAttachmentOption((o) => o.setName("image14").setDescription("Image 14").setRequired(false))
    .addAttachmentOption((o) => o.setName("image15").setDescription("Image 15").setRequired(false))
    .addAttachmentOption((o) => o.setName("image16").setDescription("Image 16").setRequired(false))
    .addAttachmentOption((o) => o.setName("image17").setDescription("Image 17").setRequired(false))
    .addAttachmentOption((o) => o.setName("image18").setDescription("Image 18").setRequired(false))
    .addAttachmentOption((o) => o.setName("image19").setDescription("Image 19").setRequired(false))
    .addAttachmentOption((o) => o.setName("image20").setDescription("Image 20").setRequired(false)),

  run: async ({ interaction }) => {
    try {
      if (!interaction.isChatInputCommand()) return;

      const guildId = interaction.guild.id;
      const entry = await ticketSetup.findOne({ guildId });
      if (!entry) {
        return interaction.reply({
          content:
            "❌ Ticket setup not found. Please run `/ticketsetup id` first to configure the bot.",
          flags: 1 << 6,
        });
      }

      const dungeonCarrierRoleId = entry.dungeonCarrierRoleId;
      const highStaffRoleId = entry.highStaffRole;
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.roles.cache.has(dungeonCarrierRoleId) && !member.roles.cache.has(highStaffRoleId)) {
        return interaction.reply({
          content: "❌ You don't have permission to use this command.",
          flags: 1 << 6,
        });
      }

      const recordChannelId = entry.recordChannelId;
      const recordChannel = recordChannelId
        ? interaction.guild.channels.cache.get(recordChannelId)
        : null;
      if (!recordChannel) {
        return interaction.reply({
          content:
            "❌ Record channel not set. Ask an admin to set it with `/ticketsetup id recordchannel:<channelId>`.",
          flags: 1 << 6,
        });
      }

      const ticket = interaction.options.getString("ticket", true);
      const floor = interaction.options.getString("floor", true);
      const mages = interaction.options.getInteger("mages");

      const attachments = [];
      for (let i = 1; i <= 20; i++) {
        const att = interaction.options.getAttachment(`image${i}`);
        if (att && att.contentType && att.contentType.startsWith("image")) {
          attachments.push(att);
        }
      }

      if (attachments.length < 1) {
        return interaction.reply({
          content: "❌ Please attach at least 1 image (max 20).",
          flags: 1 << 6,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("Dungeon Record")
        .setColor(0x4ffb3c)
        .addFields(
          { name: "Executed by", value: `<@${interaction.user.id}>`, inline: true },
          { name: "Ticket", value: ticket, inline: true },
          { name: "Floor", value: floor, inline: true },
          ...(mages !== null && mages !== undefined ? [{ name: "Mages", value: String(mages), inline: true }] : [])
        )
        .setTimestamp();

      embed.setImage(attachments[0].url);
      await recordChannel.send({ embeds: [embed] });
      for (let i = 1; i < attachments.length; i++) {
        const imgEmbed = new EmbedBuilder().setColor(0x4ffb3c).setImage(attachments[i].url);
        await recordChannel.send({ embeds: [imgEmbed] });
      }

      return interaction.reply({
        content: "✅ Dungeon record submitted to the record channel.",
        flags: 1 << 6,
      });
    } catch (error) {
      console.error("Error in dungeon_record command:", error);
      return interaction.reply({
        content: "❌ An error occurred while processing your request.",
        flags: 1 << 6,
      });
    }
  },
};


