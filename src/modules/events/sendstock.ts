import fs from 'node:fs';
import { z } from 'zod';
import { EmbedBuilder } from 'discord.js';
import type { APIEmbedField, Client } from 'discord.js';
import type { Registrations } from '@/_type/index.js';

const FILE_NAME = 'registrations.json';
const takasumiResSchema = z.array(
    z.object({
        name: z.string(),
        id: z.string(),
        description: z.string(),
        dividendAmount: z.number(),
        dividendRate: z.number(),
        prices: z.array(z.number())
    })
);

const getAverage = (ary: number[], range: number) => {
    const a = ary.slice(-range);
    return a.reduce((p, c) => p + c) / a.length;
};
const getRate = (v: number, b: number) => v / b * 100;
const mark = (gap: number, rate: number) => {
    const c = Math.abs(rate) > 15;
    const b = c ? '**' : '';
    const u = c ? '__' : '';
    return b + u + (gap > 0 ? '+' : '') + gap.toFixed(1) + 'コイン (' + (rate > 0 ? '+' : '') + rate.toFixed(1) + '%)' + u + b;
};

export default async function(client: Client, r: Registrations) {
    const raw = takasumiResSchema.parse(await (await fetch('https://api.takasumibot.com/v3/stock/')).json());

    const summaryAry: APIEmbedField[] = [];
    for (const e of raw) {
        const { prices } = e;

        const current = prices[prices.length - 1];
        const previous = prices[prices.length - 2];
        const gapPrevious = current - previous;
        const ratePrevious = getRate(gapPrevious, previous);
        const average3day = getAverage(prices, 24*3);
        const gapAverage3day = current - average3day;
        const rateAverage3day = getRate(gapAverage3day, average3day);

        const name = `${e.name}(${e.id})`;
        const value = `現在の株価: ${current}コイン\n変動額: ${mark(gapPrevious, ratePrevious)}\n3日平均比: ${mark(gapAverage3day, rateAverage3day)}`;
        summaryAry.push({name, value});
    }
    const embeds = [
        new EmbedBuilder()
            .setTitle('株価情報')
            .setColor(0x00bfff)
            .addFields(summaryAry)
            .setTimestamp()
    ];

    const subs = Array.from(r.values()).map((e) => e.channel);
    for (const sub of subs) {
        try {
            const channel = await client.channels.fetch(sub);
            if (channel === null) {
              throw new Error('null channel received');
            } else if (!channel.isSendable()) {
              throw new Error('not sendable channel');
            } else {
              await channel.send({embeds});
            };
        } catch (e) {
            console.log("送信失敗:", sub, '\n' + e);
        }
    }

    const subsString = JSON.stringify(Array.from(r.entries()).map(([s, r]) => {return {key: s, value: r}}));
    fs.writeFileSync('./files/' + FILE_NAME + '.tmp', subsString, 'utf8');
    fs.renameSync('./files/' + FILE_NAME + '.tmp', './files/' + FILE_NAME);
}