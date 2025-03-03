import { fetchCompletedTasks, summarizeTasks } from "../lib/todoist";
import { console as richConsole } from 'ansie';
import { Command } from "commander";

export default function subcommand(program: Command) {
program
    .command("summary")
    .description("Get a summary of tasks completed in the last 2 weeks")
    .action(async () => {
        const tasks = await fetchCompletedTasks();
        if (tasks.length === 0) {
            console.log("No tasks completed in the last 2 weeks.");
            return;
        }

        const summary = await summarizeTasks(tasks);
        richConsole.log('<span bold underline="single">Summary of completed tasks:</span>');
        console.log(summary);
    });
}
