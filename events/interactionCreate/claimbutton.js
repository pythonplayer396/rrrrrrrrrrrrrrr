const fs = require("fs");
const path = require("path");
const ticketSetup = require("../../schema/ticketSchema");
const { claimedChannels } = require("../../claimedChannels"); // Importing the Map

const { Events, PermissionFlagsBits, MessageFlags } = require("discord.js");
const channelData = require("../../schema/ticketDetail");

module.exports = async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId !== "claim_button") return;

    if (!interaction.guild) {
        return interaction.reply({
            content: "❌ This command can only be used in a server.",
            flags: 1 << 6,
        }).catch(() => {});
    }

    // ✅ Defer reply immediately before database queries
    await interaction.deferReply({ flags: 1 << 6 });
    
    let claimer = interaction.user.id;
    const guildId = interaction.guild.id;
    const entry = await ticketSetup.findOne({ guildId });
    const channel = interaction.channel;
    const channelId = channel.id;

    const channelEntry = await channelData.findOne({ channelId });
    if (!channelEntry) {
        return interaction.editReply({
            content: "Not A Ticket Channel",
        });
    }

    const hasPermission =
        interaction.member.roles.cache.has(entry.highStaffRole) ||
        interaction.member.roles.cache.has(entry.slayerCarrierRoleId) ||
        interaction.member.roles.cache.has(entry.dungeonCarrierRoleId);

    if (!hasPermission) {
        return interaction.editReply({
            content: "❌ You do not have permission to use this button.",
        });
    }

    try {
        if (channelEntry.claimer) {
            return interaction.editReply({
                content: `⚠️ This ticket has already been claimed by A Staff Member.`,
            });
        }
    } catch (error) {}

    const openerId = channelEntry.userId;

    // Only prevent non-staff members from claiming their own tickets
    if (openerId === interaction.user.id && !hasPermission) {
      return interaction.editReply({
        content: "❌ You cannot claim your own ticket. Only staff members can claim tickets.",
      });
    }

    try {
        const everyoneRoleId = interaction.guild.roles.everyone.id;
        let openerId = channelEntry.userId;
        let opener;

        try {
            opener = await interaction.guild.members.fetch(openerId);
        } catch (error) {
            console.error("❌ Unable to fetch the user:", error);
            await interaction.editReply({
                content:
                    "❌ Failed to find the ticket opener. Please contact Bot DEV.",
            });
            return;
        }

        if (interaction.channel.parentId === entry.punishmentAppealC) {
            await channel.permissionOverwrites.set([
                {
                    id: interaction.guild.roles.everyone,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: opener.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
                {
                    id: entry.slayerCarrierRoleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                    deny: [PermissionFlagsBits.SendMessages],
                },
            ]);
        } else {
            await channel.permissionOverwrites.set([
                {
                    id: interaction.guild.roles.everyone,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: opener.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
                {
                    id: entry.dungeonCarrierRoleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                    deny: [PermissionFlagsBits.SendMessages],
                },
            ]);
        }

        channelEntry.claimer = claimer;
        channelEntry.save(),
            claimedChannels.add(channelId);

        await interaction.editReply({
            content: `✅ Ticket claimed by ${interaction.user}.`,
        });

    } catch (error) {
        console.error("Error claiming ticket:", error);
    }
};