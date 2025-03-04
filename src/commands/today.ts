import { Command } from "commander";
import { getTodayAndOverdueTasks } from "../lib/todoist";
import { console as richConsole } from 'ansie';
import { getAndValidateToken } from "../lib/config";
export default function subcommand(program: Command) {
    program
        .command("today")
        .description("List tasks that are due today or overdue")
        .action(async () => {
            try {
                const token = getAndValidateToken(program);
                const todayTasks = await getTodayAndOverdueTasks(token);

                if (todayTasks.length === 0) {
                    richConsole.log("<span bold>No tasks due today or overdue.</span>");
                } else {
                    richConsole.log('<h2>Tasks due today (⏳) or overdue (🚨):</h2>');
                    const today = new Date().toISOString().split("T")[0];
                    richConsole.log(`<ul>${todayTasks.map((task: any) => {
                        const overdue = task.due.date < today;
                        return `<li>${overdue ? "🔴" : "🟢"} ${task.content} (Due: ${task.due.date})</li>`;
                    }).join("")}</ul>`);
                }
            } catch (error) {
                console.error((error as Error).message);
                process.exit(1);
            }
        });
}

