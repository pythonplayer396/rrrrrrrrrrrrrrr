const {
	SlashCommandBuilder,
	EmbedBuilder,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("dungeon_points_guide")
		.setDescription("Send the Dungeon carry points guide."),

	run: async ({ interaction }) => {
		try {
			const description = "dungeon carry points guid"; // per user request

			const catacombsTable = [
				"Floor | Completion | S Grade | S+ Grade",
				"----- | ---------- | ------- | --------",
				"F1    | 1          | 2       | 3",
				"F2    | 2          | 3       | 4",
				"F3    | 3          | 4       | 5",
				"F4    | 4          | 5       | 6",
				"F5    | 5          | 6       | 8",
				"F6    | 6          | 8       | 10",
				"F7    | 8          | 10      | 14",
			].join("\n");

			const masterModeTable = [
				"Floor | Completion | S Grade | S+ Grade",
				"----- | ---------- | ------- | --------",
				"M1    | 4          | 6       | 8",
				"M2    | 5          | 7       | 9",
				"M3    | 6          | 8       | 10",
				"M4    | 7          | 9       | 12",
				"M5    | 8          | 10      | 14",
				"M6    | 10         | 14      | 18",
				"M7    | 14         | 18      | 24",
			].join("\n");

			const embed = new EmbedBuilder()
				.setTitle("Dungeon Carry Points Guide")
				.setDescription(description)
				.addFields(
					{
						name: "Catacombs – F1 to F7",
						value: "```\n" + catacombsTable + "\n```",
					},
					{
						name: "Master Mode – M1 to M7",
						value: "```\n" + masterModeTable + "\n```",
					}
				)
				.setColor(0x4ffb3c)
				.setImage(
					"https://media.discordapp.net/attachments/1250029348690464820/1401464879352643605/ChatGPT_Image_Aug_3_2025_03_20_28_AM.png?ex=68db84e1&is=68da3361&hm=f4a911c6ed18258bc7516281a4314f11374dd0ab30ccdddbe41b40ae2419038b&=&format=webp&quality=lossless&width=936&height=936"
				);

			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error("Error in /dungeon_points_guide:", error);
			if (interaction.deferred || interaction.replied) {
				return interaction.editReply({ content: "❌ Failed to send the guide." });
			}
			return interaction.reply({ content: "❌ Failed to send the guide.", flags: 1 << 6 });
		}
	},
};


