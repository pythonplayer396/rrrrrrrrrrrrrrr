const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  guildId: {
    type: String,
    required: true,
  },
  couponCode: {
    type: String,
    required: true,
    unique: true,
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 10,
    max: 60,
  },
  status: {
    type: String,
    enum: ["unused", "used"],
    default: "unused",
  },
  creationDate: {
    type: Date,
    default: Date.now,
  },
  earnedFrom: {
    ticketId: String,
    totalCarries: Number,
    dungeonCarries: Number,
    slayerCarries: Number,
  },
  usedOn: {
    ticketId: String,
    usedAt: Date,
  },
});

module.exports = mongoose.model("couponSchema", couponSchema);
