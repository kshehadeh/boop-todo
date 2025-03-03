import { Command } from "commander";
import { getTodayAndOverdueTasks, markTaskAsComplete } from "../lib/todoist";
import { console as richConsole } from 'ansie';
import ora from "ora";
import { checkbox } from "@inquirer/prompts";

// Command: complete-today
export default function subcommand(program: Command) {      
program
    .command("complete")
    .description("List today's tasks and mark selected ones as complete")
    .action(async () => {
        try {
            const todayTasks = await getTodayAndOverdueTasks();

            if (todayTasks.length === 0) {
                richConsole.log("<span bold>No tasks due today or overdue.</span>");
                return;
            }

            const selectedTasks = await checkbox<string>({
                message: 'Select tasks to mark as complete:',
                choices: todayTasks.map((task: any) => ({
                    name: task.content,
                    value: task.id,
                })),
            });

            if (selectedTasks.length === 0) {
                console.log("No tasks selected for completion.");
                return;
            }

            const completeSpinner = ora("Marking selected tasks as complete...").start();
            try {
                await Promise.all(
                    selectedTasks.map((t) => markTaskAsComplete(t))
                );
                completeSpinner.succeed("Selected tasks marked as complete.");
            } catch (error) {
                completeSpinner.fail("Failed to mark tasks as complete.");
                console.error((error as Error).message);
                process.exit(1);
            }
        } catch (error) {
            console.error((error as Error).message);
            process.exit(1);
        }
    });
}