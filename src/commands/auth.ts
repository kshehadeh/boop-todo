import { Command } from "commander";
import { connectWithOauthToTodist, getProductivityStats } from "../lib/todoist";
import { getConfig, updateConfig } from "../lib/config";
import ora from "ora";
import { config } from "dotenv";

config();

export default function subcommand(program: Command) {
    
    const authCommand = program
        .command("auth")
        .description("Authentication related tasks with Todoist")
        
    authCommand.command('login')
        .description('Login to Todoist')
        .action(async (options) => {
            const spinner = ora("Connecting to Todoist...").start();
            const token = await connectWithOauthToTodist((message: string) => {
                spinner.text = message;
            })

            if (!token) {
                spinner.fail("Failed to connect to Todoist.");
                return;
            }

            spinner.text = "Connected to Todoist - updating config...";

            updateConfig({
                todoist: { token }
            })

            spinner.succeed("Login successful and config updated");
        });

    authCommand.command('status')
        .description('Check the current status of your connection to Todoist')
        .action(async (options) => {            
            const spinner = ora("Checking status...").start();
            const token = getConfig().todoist?.token;
            if (!token) {
                spinner.fail("Not connected to Todoist");
                return;
            }

            // Check to see if it's a valid token
            try {
                const stats = await getProductivityStats(token)
                spinner.succeed("Connected to Todoist");
            } catch (error) {                
                spinner.fail(`Not connected to Todoist.  Use \`boop auth login\` to connect (${(error as Error).message})`);

                // Clear the token if it doesn't work.
                updateConfig({
                    todoist: { token: "" }
                })
            }
        });

    authCommand.command('logout')
        .description('Logout of Todoist')
        .action(async (options) => {
            updateConfig({
                todoist: { token: "" }
            })
        });
        
}