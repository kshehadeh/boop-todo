import OpenAI from 'openai';
import { config } from 'dotenv';

config();


export async function ask(question: string) {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
    
    const chatCompletion = await client.chat.completions.create({
        messages: [{ role: 'user', content: question }],
        model: 'gpt-4o',
        n: 1
      });

    return chatCompletion.choices[0].message.content;
}

