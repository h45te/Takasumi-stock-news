import dotenv from 'dotenv';
import cron from 'node-cron';
import { Client, Events, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { events, slashs } from './modules/index.js';
import type { Registrations } from './_type/index.js';
import REGISTRATIONS from '../files/registrations.json' with {type: 'json'};

dotenv.config();
const TOKEN = process.env.TOKEN;
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

const global: Registrations = new Map();
for (const e of REGISTRATIONS as any) {
    global.set(e.key, e.value);
}

client.once('clientReady', async(client) => {
    console.log(`${client.user.tag}で起動しました`);
});

const errorMake = (err: any) => {
    return {
        embeds: [
            new EmbedBuilder()
                .setColor(0x000000)
                .setTitle(`エラーが発生しました`)
                .setDescription(`\`\`\`${err}\`\`\``)
                .setTimestamp()
        ], flags: 64
    }
}

client.on(Events.InteractionCreate, async(interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = Object.values(slashs).filter(s => Object.hasOwn(s, 'slash')).find(s => s.slash.data.name === interaction.commandName)?.slash;
        if (command) {
            try {
                await command.execute(interaction, global);
            } catch(error) {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMake(error));
                } else {
                    await interaction.reply(errorMake(error));
                }
                console.log(Date());
                console.error(error);
            }
        } else {
            console.error(`${interaction.commandName}というコマンドは存在しません`);
        }
    };
})

// 毎時30秒に更新することで更新との入れ違いを回避(この値が適切かは不明)
cron.schedule('30 0 * * * *', async() => {
  await events.sendstock(client, global);
});

client.login(TOKEN);