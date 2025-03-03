import ora from "ora";
import { confirm, input, number } from "@inquirer/prompts";
import { createTask, startTimer } from "../lib/todoist";
import { Command } from "commander";

export default function subcommand(program: Command) {
program
    .command("create")
    .description("Create a new Todoist task")
    .action(async () => {
        const taskContent = await input({
            message: "Describe the task:",
        });

        if (!taskContent) {
            console.log("Task content cannot be empty. Please try again.");
            return;
        }

        const spinner = ora("Creating new task...").start();
        try {
            const task = await createTask(taskContent);
            spinner.stop();

            const startNow = await confirm({
                message: "Do you want to start working on this task now?",
            });

            if (startNow) {
                const duration = await number({
                    required: true,
                    message: "Enter duration (in minutes):",
                    validate: (input) => ((input && input > 0) ? true : "Duration must be a positive number."),
                });

                if (!duration) {
                    console.log("Invalid duration. Please enter a valid number.");
                    return;
                }

                await startTimer(taskContent, task.id, duration);
            }
        } catch (error) {
            spinner.fail("Failed to create task.");
            console.error((error as Error).message);
            process.exit(1);
        }
    });
}