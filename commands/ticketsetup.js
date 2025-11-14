const ticketSchema = require("../schema/ticketSchema");
const ticketSetup = require("../schema/ticketSchema");
const {
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionsBitField,
  EntitlementOwnerType,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticketsetup")
    .setDescription("Setup Tickets")

    // Subcommand: check
    .addSubcommand((subcommand) =>
      subcommand.setName("check").setDescription("Check your setup.")
    )

    // Subcommand: set
    .addSubcommand((subcommand) =>
      subcommand
        .setName("id")
        .setDescription("Set the Staff Role ID.")
        .addStringOption((option) =>
          option
            .setName("highstaff")
            .setDescription("Role Id Will Have Access To /panel Command")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("slayercarrierrole")
            .setDescription("Role Id For Slayer Carrier")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("dungeoncarrierrole")
            .setDescription("Role Id For Dungeon Carrier")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("transcriptchannel")
            .setDescription("Channel Id Of Ticket Transcript Channel ")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("giveawaycategory")
            .setDescription(
              "Category Where All Giveaway Tickets Will Be Created"
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("punishmentcategory")
            .setDescription(
              "Category Where All Punishment Appeal Tickets Will Be Created"
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("othercategory")
            .setDescription("Category Where Other Type Tickets Will Be Created")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("recordchannel")
            .setDescription("Channel ID where /record logs will be sent")
            .setRequired(true)
        )
    )

    // Subcommand: channels
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channels")
        .setDescription("Set the carry system channel IDs")
        .addStringOption((option) =>
          option
            .setName("requestapprovechannel")
            .setDescription("Channel ID for carry request approvals")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("approvedchannel")
            .setDescription("Channel ID for approved carries")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("declinedchannel")
            .setDescription("Channel ID for declined carries")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("logchannel")
            .setDescription("Channel ID for logging point adjustments")
            .setRequired(true)
        )
    ),

  run: async ({ interaction }) => {
    try {
      // Check if it's a chat input command first
      if (!interaction.isChatInputCommand()) return;

      const guildId = interaction.guild.id;

      // Check for administrator permissions once
      const hasAdmin = interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      );
      if (!hasAdmin) {
        return interaction.reply({
          content: "You don't have permission to use this command.",
          flags: 1 << 6,
        });
      }
      const setup = await ticketSetup.findOne({ guildId });

      // Now it's safe to get the subcommand
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "id") {
        const highStaffRoleId = interaction.options.getString("highstaff");
        const slayerCarrierRoleId = interaction.options.getString("slayercarrierrole");
        const dungeonCarrierRoleId = interaction.options.getString("dungeoncarrierrole");
        const tcId = interaction.options.getString("transcriptchannel");
        const gcId = interaction.options.getString("giveawaycategory");
        const pacId = interaction.options.getString("punishmentcategory");
        const ocId = interaction.options.getString("othercategory");
        const recordChannelId = interaction.options.getString("recordchannel");

        let existingId = await ticketSetup.findOne({ guildId });

        if (existingId) {
          existingId.highStaffRole = highStaffRoleId;
          existingId.slayerCarrierRoleId = slayerCarrierRoleId;
          existingId.dungeonCarrierRoleId = dungeonCarrierRoleId;
          existingId.transcriptChannelId = tcId;
          existingId.giveawayClaimC = gcId;
          existingId.punishmentAppealC = pacId;
          existingId.otherC = ocId;
          existingId.recordChannelId = recordChannelId;
          await existingId.save();
          console.log(`Updated Id's Of Guild: ${guildId},\n
             highStaffRole: ${highStaffRoleId},\n
            slayerCarrierRoleId: ${slayerCarrierRoleId},\n
            dungeonCarrierRoleId: ${dungeonCarrierRoleId},\n
            transcriptChannelId: ${tcId},\n
            giveawayClaimC: ${gcId},\n
            punishmentAppealC: ${pacId},\n
            otherC: ${ocId},\n
            recordChannelId: ${recordChannelId},\n
            ----------END----------`);

          return interaction.reply({
            content: `Role ID updated,\n High Staff:**${highStaffRoleId}** \n Slayer Carrier Role Id: **${slayerCarrierRoleId}** \n Dungeon Carrier Role Id: **${dungeonCarrierRoleId}** \n Transcript ChannelID: ${tcId}\n PunishmentAppealC-ID: ${pacId}\n GiveawayClaimC-ID: ${gcId}\n OtherC-ID: ${ocId}\n Record-Channel-ID: ${recordChannelId}.\n\n💡 Use \`^feedbackchannel\` in a channel to set it as the feedback channel.`,
          });
        } else {
          const newEntry = new ticketSetup({
            guildId,
            highStaffRole: highStaffRoleId,
            slayerCarrierRoleId: slayerCarrierRoleId,
            dungeonCarrierRoleId: dungeonCarrierRoleId,
            transcriptChannelId: tcId,
            giveawayClaimC: gcId,
            punishmentAppealC: pacId,
            otherC: ocId,
            recordChannelId,
          });

          await newEntry.save();
          console.log(`Created New  Id's Setup Of Guild: ${guildId},\n
            highStaffRole: ${highStaffRoleId},\n
            slayerCarrierRoleId: ${slayerCarrierRoleId},\n
            dungeonCarrierRoleId: ${dungeonCarrierRoleId},\n
            transcriptChannelId: ${tcId},\n
            giveawayClaimC: ${gcId},\n
            punishmentAppealC: ${pacId},\n
            otherC: ${ocId},\n
            recordChannelId: ${recordChannelId},\n
            ----------END----------`);

          return interaction.reply({
            content: `New Data Saved! Use Command **/ticketsetup check** To Check New Set Of Id's`,
          });
        }
      } else if (subcommand === "channels") {
        const requestApproveChannelId = interaction.options.getString("requestapprovechannel");
        const approvedChannelId = interaction.options.getString("approvedchannel");
        const declinedChannelId = interaction.options.getString("declinedchannel");
        const logChannelId = interaction.options.getString("logchannel");

        let existingId = await ticketSetup.findOne({ guildId });

        if (existingId) {
          existingId.requestApproveChannelId = requestApproveChannelId;
          existingId.approvedChannelId = approvedChannelId;
          existingId.declinedChannelId = declinedChannelId;
          existingId.logChannelId = logChannelId;
          await existingId.save();

          return interaction.reply({
            content: `Carry system channels updated,\n Request Approve Channel: ${requestApproveChannelId}\n Approved Channel: ${approvedChannelId}\n Declined Channel: ${declinedChannelId}\n Log Channel: ${logChannelId}.`,
          });
        } else {
          return interaction.reply({
            content: "❌ Please run `/ticketsetup id` first to set up the basic ticket system.",
            flags: 1 << 6,
          });
        }
      } else if (subcommand === "check") {
        const entry = await ticketSetup.findOne({ guildId });

        if (entry) {
          console.log(` Guild: ${guildId} Has Tried To View Their Setup,\n
             highStaffRole: ${entry.highStaffRole},\n
            slayerCarrierRoleId: ${entry.slayerCarrierRoleId},\n
            dungeonCarrierRoleId: ${entry.dungeonCarrierRoleId},\n
            transcriptChannelId: ${entry.transcriptChannelId},\n
            giveawayClaimC: ${entry.giveawayClaimC},\n
            punishmentAppealC: ${entry.punishmentAppealC},\n
            otherC: ${entry.otherC},\n
            ----------END----------`);
          const checkEmbed = new EmbedBuilder()
            .setTitle(
              `Ticket Setup! Of Your Guild: ***${interaction.guild.name}***`
            )
            .setDescription("Id Allowence Setup Of Your Guild")
            .addFields(
              { name: "High-Staff-RoleID:", value: entry.highStaffRole },
              { name: "Slayer-Carrier-RoleID:", value: entry.slayerCarrierRoleId || "Not set" },
              { name: "Dungeon-Carrier-RoleID:", value: entry.dungeonCarrierRoleId || "Not set" },
              {
                name: "Transcript-Channel-ID:",
                value: entry.transcriptChannelId,
              },
              { name: "Giveaway-Category-ID:", value: entry.giveawayClaimC },
              {
                name: "PunishmentAppeal-Category-ID:",
                value: entry.punishmentAppealC,
              },
              { name: "Other-Ticket-Category-ID:", value: entry.otherC },
              { name: "Record-Channel-ID:", value: entry.recordChannelId || "Not set" },
              { name: "Feedback-Channel-ID:", value: entry.feedbackChannelId || "Not set" },
              { name: "Request-Approve-Channel-ID:", value: entry.requestApproveChannelId || "Not set" },
              { name: "Approved-Channel-ID:", value: entry.approvedChannelId || "Not set" },
              { name: "Declined-Channel-ID:", value: entry.declinedChannelId || "Not set" },
              { name: "Log-Channel-ID:", value: entry.logChannelId || "Not set" }
            )
            .setColor(0x7ffb3f);

          return interaction.reply({
            //   content: `Your Role ID is currently set to \n High Staff:**${entry.highStaffRole}** \n Staff Id: **${entry.staffRole}** \n Transcript ChannelID: ${entry.transcriptChannelId}\n PunishmentAppealC-ID: ${entry.punishmentAppealC}\n GiveawayClaimC-ID: ${entry.giveawayClaimC}\n OtherC-ID: ${entry.otherC}.`,
            embeds: [checkEmbed],
          });
        } else {
          console.log(
            `Guild: ${guildId} Has Tried To Check Their Setup But The Have'nt Setted It up Yet.`
          );
          return interaction.reply({
            content: "No Role ID found. Please set one first!",
          });
        }
      }

      // Default fallback (shouldn't be reached)
      return interaction.reply({
        content: "Unknown subcommand used.",
        flags: 1 << 6,
      });
    } catch (error) {
      console.error("Error in ticketsetup command:", error);
      return interaction.reply({
        content: "An error occurred while processing your request.",
        flags: 1 << 6,
      });
    }
  },
};
