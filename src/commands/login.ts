import { Command } from "commander";
import { connectWithOauthToTodist } from "../lib/todoist";
import { updateConfig } from "../lib/config";
import ora from "ora";
import { config } from "dotenv";

config();

export default function subcommand(program: Command) {
    program
        .command("login")
        .description("Login to Todoist")
        .action(async () => {
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

}