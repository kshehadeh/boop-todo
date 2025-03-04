import { Command } from 'commander';
import { ask, console as richConsole } from 'ansie';
import { updateConfig, getConfig, AiProviderSchema, AiProvider } from '../lib/config';

const helpLinksMap: Record<AiProvider, string> = {
    openai: 'https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key',
}

export default function(program: Command) {
    program
        .command('ai')
        .description('Configure AI provider and API key')
        .action(async () => {
            const currentConfig = getConfig();
            
            const availableProviders = [
                { name: 'OpenAI', value: 'openai' },
            ]

            richConsole.info(`<h2>Setup your AI Provider</h2>`)
            
            const provider = await ask.selectEx('Select AI provider:', availableProviders, currentConfig.ai?.provider || 'openai');
            const providerVerified = AiProviderSchema.parse(provider);
            const providerName = availableProviders.find(p => p.value === providerVerified)?.name;

            // Check if there's an existing API key for this provider
            if (currentConfig.ai?.[providerVerified]?.apiKey) {
                const shouldOverwrite = await ask.confirm(
                    `An API key for ${providerName} already exists. Do you want to overwrite it?`,
                    false
                );
                
                if (!shouldOverwrite) {
                    richConsole.log('✅ Keeping existing API key configuration');
                    process.exit(0) 
                }
            }

            richConsole.info(`<h2 marginBottom="0">Setup ${providerName}</h2>`)
            richConsole.info(`<h3 fg="gray">You can find your API key at ${helpLinksMap[providerVerified]}</h3>`)

            const apiKey = await ask.text(`Enter your ${providerName} API key:`);
            if (!apiKey.trim()) {
                throw new Error('API key cannot be empty');
            }

            // Update the configuration
            updateConfig({
                ai: {
                    provider: providerVerified,
                    [providerVerified]: {
                        apiKey
                    }
                }
            });

            console.log(`✅ Successfully configured ${providerName} as your AI provider`);
        });
} 