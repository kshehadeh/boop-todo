import path from "path";
import fs from "fs";
import os from "os";
import { z } from "zod";
import { deepmerge } from "deepmerge-ts";
import { Command } from "commander";

export const AiProviderSchema = z.enum(['openai']);
export type AiProvider = z.infer<typeof AiProviderSchema>;
const ConfigFileSchema = z.object({
    todoist: z.object({
        token: z.string(),
    }).optional(),
    ai: z.object({
        provider: AiProviderSchema.optional(),
        openai: z.object({
            apiKey: z.string(),
        }).optional(),
        anthropic: z.object({
            apiKey: z.string(),
        }).optional(),
        google: z.object({
            apiKey: z.string(),
        }).optional(),
    }).optional(),
});

export type Config = z.infer<typeof ConfigFileSchema>;

export function getConfigFilePath(): string {
    const configDir = path.join(os.homedir(), '.boop');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    const pathToFile = path.join(configDir, 'config.json');
    if (!fs.existsSync(pathToFile)) {
        fs.writeFileSync(pathToFile, JSON.stringify({
            todoist: {
                token: "",
            },
        }, null, 2));
    }

    return pathToFile;
}

export function updateConfig(configPartial: Partial<Config>) {
    const mergedConfig = mergeConfig(configPartial);
    const configFilePath = getConfigFilePath();
    fs.writeFileSync(configFilePath, JSON.stringify(mergedConfig, null, 2));
}

export function getConfig(): Config {
    const configFilePath = getConfigFilePath();
    if (!fs.existsSync(configFilePath)) {
        
    }
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    return ConfigFileSchema.parse(config);
}

export function mergeConfig(newConfig: Partial<Config>): Config {
    const currentConfig = getConfig();
    return deepmerge(currentConfig, newConfig);
}

export function getAndValidateToken(program: Command) {
    const token = getConfig().todoist?.token
    if (!token) {                
        program.error("No Todoist token found. Please run `boop login` to set one.", {
            exitCode: 1,
        });
    }
    return token;
}

export function getAndValidateAiKey(program: Command, provider: AiProvider) {
    const key = getConfig().ai?.[provider]?.apiKey
    if (!key) {
        program.error(`No API key found for ${provider}. Please run \`boop ai\` to set one.`, { exitCode: 1 });
    }
    return key;
}