import { Command, Option } from "commander";
import { getActiveTasks, getTaskComments, getTaskDetails, getTodayAndOverdueTasks, SortFields, SupportedFiltersAsStrings } from "../lib/todoist";
import { console as richConsole } from 'ansie';
import { getAndValidateToken } from "../lib/config";
import { ask } from "ansie";

function handleFilter(value: string, previous: string[]) {
    // Check if value starts with any of the strings in SupportedFiltersAsStrings
    const filter = SupportedFiltersAsStrings.find((filter) => value.startsWith(filter));
    if (!filter) {
        throw new Error(`Invalid filter: ${value}`);
    }        
    return [value, ...(previous ?? [])];
}

export default function subcommand(program: Command) {
    program
        .command("list")
        .description("List tasks that are due with support for filters and sorting")
        .addOption(new Option("-f, --filter <filter...>", "Add a filter").argParser(handleFilter))
        .addOption(new Option("-o, --order <order>", "Order the tasks").choices(["asc", "desc"]))
        .addOption(new Option("-s, --sort <sort>", "Sort the tasks").choices(SortFields))
        .action(async (options) => {
            try {
                const token = getAndValidateToken(program);
                const tasks = await getActiveTasks(token, options.filter, options.sort, options.order);

                if (tasks.length === 0) {
                    richConsole.log("<span bold>No tasks found.</span>");
                } else {
                    richConsole.log('<h2>Tasks</h2>');
                
                    const task = await ask.selectEx("Select a task to learn more about it:", tasks.map((task: any) => 
                        ({ name: task.content, value: task.id })));

                    if (task) {
                        const taskDetails = await getTaskDetails(token, task);
                        const comments = await getTaskComments(token, task);

                        richConsole.log(`<h2 marginBottom="1">Task ${taskDetails.content}</h2>`);
                        taskDetails.description && richConsole.log(`<p marginTop="0" marginBottom="1">${taskDetails.description}</p>`);
                        taskDetails.due?.string && richConsole.log(`<p marginTop="0" marginBottom="1">Date Due: ${taskDetails.due?.string}</p>`);
                        taskDetails.priority && richConsole.log(`<p marginTop="0" marginBottom="1">Priority: ${taskDetails.priority}</p>`);
                        taskDetails.labels?.length > 0 && richConsole.log(`<p marginTop="0" marginBottom="1">Labels: ${taskDetails.labels}</p>`);
                        
                        if (comments.length > 0) {
                            richConsole.log(`<h3>Comments</h3>`);
                            richConsole.log(`<ul marginTop="0">${comments.map((comment: any) => {
                                return `<li>${comment.content}</li>`;
                            }).join("")}</ul>`);
                        }
                    }

                }
            } catch (error) {
                console.error((error as Error).message);
                process.exit(1);
            }
        });
}

