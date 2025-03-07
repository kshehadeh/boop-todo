import { Command } from "commander";
import { getActiveTasks, markTaskAsComplete, addComment, startTimer, renderTask, Task } from "../lib/todoist";
import { ask, console as richConsole } from 'ansie';
import { getAndValidateToken } from "../lib/config";
import { runTimer } from "../lib/timer";
export default function subcommand(program: Command) {
    program
        .command("today")
        .description("List tasks that are due today or overdue")
        .action(async () => {
            try {
                const token = getAndValidateToken(program);
                const todayTasks = await getActiveTasks(token, ["today", "overdue"], "due_date", "asc");

                if (todayTasks.length === 0) {
                    richConsole.log("<span bold>No tasks due today or overdue.</span>");
                } else {
                    const task = await ask.selectEx<Task>("Pick a task to take action:",
                        todayTasks.map((task: Task) =>
                            ({ name: task.content, value: task })));

                    if (task) {
                        renderTask(task);

                        const action = await ask.select("Pick an action:", [
                            "Mark as complete", "Add a comment", "Start timer"]);

                        if (action === "Mark as complete") {
                            await markTaskAsComplete(token, task.id);
                        } else if (action === "Add a comment") {
                            const comment = await ask.text("Enter a comment:");
                            await addComment(token, task.id, comment);
                        } else if (action === "Start timer") {
                            const duration = await ask.text("Enter a duration in minutes:");
                            await runTimer(token, task.id, parseInt(duration));
                        }
                    }
                }
            } catch (error) {
                console.error((error as Error).message);
                process.exit(1);
            }
        });
}

