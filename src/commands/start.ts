import { Command } from "commander";
import { number, search } from "@inquirer/prompts";
import { fetchTasks, startTimer } from "../lib/todoist";


export default function subcommand(program: Command) {
// Command: start
program
    .command("start")
    .description("Start a timer associated with a todoist task or just start an anonymous timer.")
    .argument("[duration]", "Duration of the timer in minutes. If given, then it just starts an anonymous timer")
    .argument("[name]", "Give the timer a name for convenience")
    .action(async (d, name) => {        

        if (d) {
            // Step 4: Start timer
            await startTimer(name || "Anonymous timer", "", parseInt(d));
            return;
        }

        // Step 1: Fetch tasks
        const tasks = await fetchTasks();
        if (tasks.length === 0) {
            console.log("No tasks available in Todoist.");
            return;
        }

        // Step 2: Prompt user to select a task
        const answer = await search<string>({
            message: "Select a task to focus on:",
            source: async (input?: string) => {
                if (!input) {
                    return tasks.map((task: any) => ({ name: task.content, value: task.id }));
                }
                return tasks
                    .filter((task: any) => task.content.toLowerCase().includes(input.toLowerCase()))
                    .map((task: any) => ({ name: task.content, value: task.id }));
            }
        });
        if (!answer) {
            console.log("Invalid task selection. Please try again.");
            return;
        }

        const selectedTaskDetails = tasks.find((task: any) => task.id === answer);

        // Step 3: Prompt user for timer duration
        const duration = await number({
            required: true,
            message: "Enter duration (in minutes):",
            validate: (input) => ((input && input > 0) ? true : "Duration must be a positive number."),
        });

        if (!duration) {
            console.log("Invalid duration. Please enter a valid number.");
            return;
        }

        // Step 4: Start timer
        await startTimer(selectedTaskDetails.content, answer, duration);
    });
}


