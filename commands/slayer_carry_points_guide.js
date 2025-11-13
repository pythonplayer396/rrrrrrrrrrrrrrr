const {
	SlashCommandBuilder,
	EmbedBuilder,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("slayer_carry_points_guide")
		.setDescription("Send the Slayer carry points guide."),

	run: async ({ interaction }) => {
		try {
			const description = "slaye carry points guide"; // per user request

			const revenant = [
				"Tier | Points",
				"---- | ------",
				"T2   | 2",
				"T3   | 4",
				"T4   | 5",
				"T5   | 7",
			].join("\n");

			const tarantula = [
				"Tier | Points",
				"---- | ------",
				"T2   | 2",
				"T3   | 4",
				"T4   | 5",
			].join("\n");

			const sven = [
				"Tier | Points",
				"---- | ------",
				"T2   | 3",
				"T3   | 5",
				"T4   | 6",
			].join("\n");

			const voidgloom = [
				"Tier | Points",
				"---- | ------",
				"T1   | 4",
				"T2   | 6",
				"T3   | 8",
				"T4   | 12",
			].join("\n");

			const inferno = [
				"Tier | Points",
				"---- | ------",
				"T1   | 6",
				"T2   | 10",
				"T3   | 16",
				"T4   | 20",
			].join("\n");

			const embed = new EmbedBuilder()
				.setTitle("Slayer Carry Points Guide")
				.setDescription(description)
				.addFields(
					{ name: "Revenant Horror", value: "```\n" + revenant + "\n```" },
					{ name: "Tarantula Broodfather", value: "```\n" + tarantula + "\n```" },
					{ name: "Sven Packmaster", value: "```\n" + sven + "\n```" },
					{ name: "Advanced Slayers — Voidgloom Seraph", value: "```\n" + voidgloom + "\n```" },
					{ name: "Advanced Slayers — Inferno Demonlord", value: "```\n" + inferno + "\n```" },
				)
				.setColor(0x4ffb3c)
				.setImage(
					"https://media.discordapp.net/attachments/1250029348690464820/1401465507491741799/slayer_carry_points_chart.png?ex=68db8576&is=68da33f6&hm=da7a7a5104598ed47dc071cb0b741b3cb453bf97e4f86025f64141bd35fee2d0&=&format=webp&quality=lossless&width=1664&height=832"
				);

			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error("Error in /slayer_carry_points_guide:", error);
			if (interaction.deferred || interaction.replied) {
				return interaction.editReply({ content: "❌ Failed to send the guide." });
			}
			return interaction.reply({ content: "❌ Failed to send the guide.", flags: 1 << 6 });
		}
	},
};


