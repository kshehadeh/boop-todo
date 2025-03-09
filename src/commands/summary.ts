import { fetchCompletedTasks, summarizeTasks } from "../lib/todoist";
import { Command } from "commander";
import { getAndValidateAiKey, getAndValidateToken } from "../lib/config";

const DEFAULT_WEEKS = 2;

export default function subcommand(program: Command) {
program
    .command("summary")
    .description("Get a summary of tasks completed in the specified time period. Requires AI configuration to be set")
    .option('-w, --weeks <number>', 'number of weeks to look back', String(DEFAULT_WEEKS))
    .action(async (options) => {
        const token = getAndValidateToken(program);
        const key = getAndValidateAiKey(program, 'openai');
        const weeks = parseInt(options.weeks, 10);
        
        if (isNaN(weeks) || weeks < 1) {
            program.error('Weeks must be a positive number');
        }
        
        const tasks = await fetchCompletedTasks(token, weeks);
        if (tasks.length === 0) {
            console.log(`No tasks completed in the last ${weeks} weeks.`);
            return;
        }

        const summary = await summarizeTasks('openai', key, tasks, weeks);

        console.log(summary);
    });
}
