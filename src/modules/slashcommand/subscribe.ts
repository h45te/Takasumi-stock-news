import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Registrations } from '@/_type/index.js';

export default {
	slash: {
        data: new SlashCommandBuilder()
            .setName('subscribe')
            .setDescription('株価情報の送信先としてこのチャンネルを登録します'),
        execute: async function(interaction: ChatInputCommandInteraction, r: Registrations) {
            const guild = interaction.guildId;
            const channel = interaction.channelId;
            if (guild === null) {
                throw new Error('Guildが不正です\nサーバー内のチャンネルで実行してください');
            };
            let embed: EmbedBuilder;
            const current = r.get(guild);
            if (current === undefined) {
                r.set(guild, {channel});
                embed = new EmbedBuilder().setTitle(`登録に成功しました`).setDescription(`送信先:<#${channel}>`);
            } else if (current.channel !== channel) {
                r.set(guild, {channel});
                embed = new EmbedBuilder().setTitle(`登録の変更に成功しました`).setDescription(`新しい送信先:<#${channel}>`);
            } else {
                r.delete(guild);
                embed = new EmbedBuilder().setTitle(`登録の解除に成功しました`)
            }
            embed.setColor(0x000000).setTimestamp();
            await interaction.reply({
                embeds: [embed]
            })
        }
    }
}