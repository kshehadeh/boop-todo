import OpenAI from 'openai';
import { config } from 'dotenv';
import { AiProvider } from './config';

config();


export async function ask(question: string, ai: AiProvider, apiKey: string) {

    if (ai === 'openai') {
        const client = new OpenAI({
            apiKey: apiKey
        });

        const chatCompletion = await client.chat.completions.create({
            messages: [{ role: 'user', content: question }],
            model: 'gpt-4o',
            n: 1
        });

        return chatCompletion.choices[0].message.content;
    } else {
        throw new Error(`Unsupported AI provider: ${ai}`);
    }
}

