import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import config from '../files/config.json' with { type: 'json' };
import { slashs } from '../build/modules/index.js';

dotenv.config();
const TOKEN = process.env.TOKEN;
const { applicationId, guildId } = config;
const rest = new REST({ version: '10'}).setToken(TOKEN);

const commands = (() => Object.values(slashs).map(scr => scr.slash.data.toJSON()))();
console.log(commands);

(async () => {
    try {
        // await rest.put(Routes.applicationGuildCommands(applicationId, guildId),{ body: commands });
        await rest.put(Routes.applicationCommands(applicationId),{ body: commands });
        console.log(`${commands.length}個のスラコマ登録に成功しました`);
    } catch (error) {
        console.error(`スラコマ登録中にエラーが発生しました`, error);
    }
})();