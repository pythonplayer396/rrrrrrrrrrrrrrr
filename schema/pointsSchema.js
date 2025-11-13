const mongoose = require("mongoose");

const pointsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  guildId: {
    type: String,
    required: true,
  },
  totalPoints: {
    type: Number,
    default: 0,
  },
  carryHistory: [{
    ticketId: String,
    carryType: String, // "slayer" or "dungeon"
    tier: String,
    floor: String,
    points: Number,
    approvedBy: String,
    approvedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  pointAdjustments: [{
    points: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    adjustedBy: {
      type: String,
      required: true
    },
    adjustedAt: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      required: true,
      enum: ["add", "remove", "bonus"]
    },
  }],
});

module.exports = new mongoose.model("pointsSchema", pointsSchema);
