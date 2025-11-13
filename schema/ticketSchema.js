const mongoose = require("mongoose");

const setup = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },
  highStaffRole: {
    type: String,
    required: true,
  },
  slayerCarrierRoleId: {
    type: String,
    required: false,
  },
  dungeonCarrierRoleId: {
    type: String,
    required: false,
  },
  transcriptChannelId: {
    type: String,
    required: true,
  },
  giveawayClaimC: {
    type: String,
    required: true,
  },
  punishmentAppealC: {
    type: String,
    required: true,
  },
  otherC: {
    type: String,
    required: true,
  },
  pointsLog: {
    type: String,
  },
  requestApproveChannelId: {
    type: String,
    required: false,
  },
  approvedChannelId: {
    type: String,
    required: false,
  },
  declinedChannelId: {
    type: String,
    required: false,
  },
  logChannelId: {
    type: String,
    required: false,
  },
  recordChannelId: {
    type: String,
    required: false,
  },
  feedbackChannelId: {
    type: String,
    required: false,
  },
  privateFeedbackChannelId: {
    type: String,
    required: false,
  },
});
module.exports = new mongoose.model("ticketSchema", setup);
