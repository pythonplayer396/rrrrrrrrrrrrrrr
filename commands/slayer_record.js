const ticketSetup = require("../schema/ticketSchema");
const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slayer_record")
    .setDescription("Record a slayer carry with images")
    .addStringOption((option) =>
      option
        .setName("ticket")
        .setDescription("Ticket ID or reference")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("slayer_type")
        .setDescription("Slayer type")
        .addChoices(
          { name: "Revenant Horror", value: "Revenant Horror" },
          { name: "Tarantula Broodfather", value: "Tarantula Broodfather" },
          { name: "Sven Packmaster", value: "Sven Packmaster" },
          { name: "Voidgloom Seraph", value: "Voidgloom Seraph" },
          { name: "Inferno Demonlord", value: "Inferno Demonlord" }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("tier")
        .setDescription("Tier")
        .addChoices(
          { name: "T1", value: "T1" },
          { name: "T2", value: "T2" },
          { name: "T3", value: "T3" },
          { name: "T4", value: "T4" },
          { name: "T5", value: "T5" }
        )
        .setRequired(true)
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

      const slayerCarrierRoleId = entry.slayerCarrierRoleId;
      const highStaffRoleId = entry.highStaffRole;
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.roles.cache.has(slayerCarrierRoleId) && !member.roles.cache.has(highStaffRoleId)) {
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
      const slayerType = interaction.options.getString("slayer_type", true);
      const tier = interaction.options.getString("tier", true);

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
        .setTitle("Slayer Record")
        .setColor(0x4ffb3c)
        .addFields(
          { name: "Executed by", value: `<@${interaction.user.id}>`, inline: true },
          { name: "Ticket", value: ticket, inline: true },
          { name: "Slayer Type", value: slayerType, inline: true },
          { name: "Tier", value: tier, inline: true }
        )
        .setTimestamp();

      // Use first image in main embed
      embed.setImage(attachments[0].url);

      await recordChannel.send({ embeds: [embed] });
      // Additional images as separate embeds
      for (let i = 1; i < attachments.length; i++) {
        const imgEmbed = new EmbedBuilder().setColor(0x4ffb3c).setImage(attachments[i].url);
        await recordChannel.send({ embeds: [imgEmbed] });
      }

      return interaction.reply({
        content: "✅ Slayer record submitted to the record channel.",
        flags: 1 << 6,
      });
    } catch (error) {
      console.error("Error in slayer_record command:", error);
      return interaction.reply({
        content: "❌ An error occurred while processing your request.",
        flags: 1 << 6,
      });
    }
  },
};


