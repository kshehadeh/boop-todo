import { Command } from "commander";
import { getTodayAndOverdueTasks } from "../lib/todoist";
import { console as richConsole } from 'ansie';
export default function subcommand(program: Command) {
program
    .command("today")
    .description("List tasks that are due today or overdue")
    .action(async () => {
        try {
            const todayTasks = await getTodayAndOverdueTasks();

            if (todayTasks.length === 0) {
                richConsole.log("<span bold>No tasks due today or overdue.</span>");
            } else {
                richConsole.log('<span bold underline="single">Tasks due today (👉🏼) or overdue (🚨):</span>');
                const today = new Date().toISOString().split("T")[0];
                todayTasks.forEach((task: any) => {
                    const overdue = task.due.date < today;
                    console.log(`${overdue ? "🚨" : "👉🏼"} ${task.content} (Due: ${task.due.date})`);
                });
            }
        } catch (error) {
            console.error((error as Error).message);
            process.exit(1);
        }
    });
}

