const mongoose = require("mongoose");

const Cdata = new mongoose.Schema({
  channelId: {
    type: String,
  },
  userId: {
    type: String,
  },
  claimer: {
    type: String,
  },
  carryData: {
    dungeonCarries: {
      type: Number,
      default: 0,
    },
    slayerCarries: {
      type: Number,
      default: 0,
    },
    totalCarries: {
      type: Number,
      default: 0,
    },
    dungeonFloor: String,
    ign: String,
  },
});
module.exports = new mongoose.model("channelData", Cdata);
