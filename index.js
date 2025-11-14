require("./keep_alive");
require("dotenv/config");
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const { CommandHandler } = require("djs-commander");
const path = require("path");
const mongoose = require("mongoose");

// Web server is handled by keep_alive.js

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Remember to enable in Dev Portal!
    GatewayIntentBits.GuildMembers,   // Add this if you need member data
  ],
});

// MongoDB Connection
async function connectToDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI not found in environment variables!");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully!");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Initialize djs-commander for command + event handling
new CommandHandler({
  client,
  commandsPath: path.join(__dirname, "commands"),
  eventsPath: path.join(__dirname, "events"), // Optional if you have events
});

// Web server is now handled by keep_alive.js

// ================================ DISCORD BOT SETUP ==========================================

client.on("ready", () => {
  console.log("✅ Bot Online Successfully!");

  client.user.setActivity({
    name: " Made by darkwall solely for FxG",
    type: ActivityType.Watching,
  });
});

// Error handling for the bot
client.on("error", (error) => {
  console.error("❌ Discord client error:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled promise rejection:", error);
});

// ================================ STARTUP SEQUENCE ==========================================

// Initialize bot
async function startBot() {
  try {
    console.log("🚀 Starting FakePixel Discord Bot...");
    
    await connectToDatabase();

    if (!process.env.TOKEN) {
      console.error("❌ TOKEN not found in environment variables!");
      process.exit(1);
    }

    await client.login(process.env.TOKEN);
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

// Export client for use in other modules
module.exports = { client };

startBot();
