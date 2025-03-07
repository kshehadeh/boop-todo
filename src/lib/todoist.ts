import { setTimeout } from "timers/promises";
import { config } from "dotenv";
import { console as richConsole } from 'ansie';
import path from "path";
import { exec } from "child_process";
import { DateTime, Duration } from "luxon";
import { ask } from "./openai";
import { executeOAuthFlowAndReturnAuthInfo } from "./oauth";
import { AiProvider } from "./config";

// Get the location of this script file and then find the .env file two directories up
const rootPath = path.resolve(__dirname, "../../")
const dotenvPath = `${rootPath}/.env`;
const alarmPath = `${rootPath}/assets/sound/mixkit-bell-notification-933.wav`;

config({ path: dotenvPath });

import { z } from "zod";

export const TaskSchema = z.object({
    creator_id: z.string(),
    created_at: z.string(),
    assignee_id: z.string(),
    assigner_id: z.string(), 
    comment_count: z.number(),
    is_completed: z.boolean(),
    content: z.string(),
    description: z.string(),
    due: z.object({
        date: z.string(),
        is_recurring: z.boolean(),
        datetime: z.string(),
        string: z.string(),
        timezone: z.string()
    }).optional(),
    deadline: z.object({
        date: z.string()
    }).optional(),
    duration: z.null(),
    id: z.string(),
    labels: z.array(z.string()),
    order: z.number(),
    priority: z.number(),
    project_id: z.string(),
    section_id: z.string(),
    parent_id: z.string(),
    url: z.string()
});

export type Task = z.infer<typeof TaskSchema>;

export const CommentSchema = z.object({
    content: z.string(),
    id: z.string(),
    posted_at: z.string(),
    project_id: z.string().nullable(),
    task_id: z.string(),
    attachment: z.object({
        file_name: z.string(),
        file_type: z.string(),
        file_url: z.string(), 
        resource_type: z.string()
    }).optional()
});

export type Comment = z.infer<typeof CommentSchema>;

// Todoist API token (replace this with an environment variable for security)
const TODOIST_SECRETS = process.env.BUILD_TODOIST_SECRETS;
const TODOIST_API_BASE = "https://api.todoist.com/rest/v2";
const TODOIST_SYNC_API_BASE = "https://api.todoist.com/sync/v9";

export function decodeEmbeddedSecrets()  {
    const secrets = Buffer.from(TODOIST_SECRETS || '', 'base64').toString('utf-8');
    const [clientId, clientSecret] = secrets.split(':');
    return { clientId, clientSecret };
}

export async function connectWithOauthToTodist(output: (message: string) => void) {
    const { clientId, clientSecret } = decodeEmbeddedSecrets();
    const response = await executeOAuthFlowAndReturnAuthInfo({
        clientId,
        clientSecret,
        tokenUrl: "https://todoist.com/oauth/access_token",
        authUrl: "https://todoist.com/oauth/authorize",
        audience: "",
        redirectUrl: "http://localhost:3000/",
        scopes: ["data:read_write"],
        includeState: true,
        includePrompt: true,
        output,
    })
    if (!response) {        
        return null;
    }

    return response.access_token;
}

// Helper function to fetch completed tasks from Todoist
export async function fetchCompletedTasks(token: string, weeks: number = 2) {    
    try {        
        const weeksAgo = DateTime.now().minus({ weeks }).toISO();
        const response = await fetch(`${TODOIST_SYNC_API_BASE}/completed/get_all`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ since: weeksAgo }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.items;
    } catch (error) {        
        console.error((error as Error).message);
        process.exit(1);
    }
}

// Helper function to summarize tasks using OpenAI
export async function summarizeTasks(ai: AiProvider, apiKey: string, tasks: any[], weeks: number = 2) {    
    const taskDescriptions = tasks.map(task => task.content).join("\n");
    const prompt = `Summarize the following tasks completed in the last ${weeks} weeks:\n\n${taskDescriptions}`;

    try {
        return await ask(prompt, ai, apiKey);        
    } catch (error) {
        console.error("Failed to summarize tasks using OpenAI:", (error as Error).message);
        process.exit(1);
    }
}

// Helper function to fetch tasks from Todoist
export async function fetchTasks(token: string) {
    try {
        const response = await fetch(`${TODOIST_API_BASE}/tasks`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        throw new Error(`Failed to fetch tasks: ${(error as Error).message}`);
    }
}

export async function markTaskAsComplete(token: string, taskId: string) {
    try {
        const response = await fetch(
            `${TODOIST_API_BASE}/tasks/${taskId}/close`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        return true;
    } catch (error) {
        throw new Error(`Failed to mark task as complete: ${(error as Error).message}`);        
    }
}

export async function addComment(token: string, taskId: string, comment: string) {
    
    try {
        const response = await fetch(
            `${TODOIST_API_BASE}/comments`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ task_id: taskId, content: comment })
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
    } catch (error) {
        throw new Error(`Failed to add comment: ${(error as Error).message}`);
    }
}

export async function createTask(token: string, taskContent: string) {
    const response = await fetch(
        `${TODOIST_API_BASE}/tasks`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: taskContent })
        }
    );
    
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
}

export const SupportedFiltersAsStrings = ["today", "overdue", "project:", "completed", "priority:*", "label:", "section:", "search:"] as const;
export type SupportedFilters = "today" | "overdue" | `project:${string}` | "completed" | `priority:${string}` | `label:${string}` | `section:${string}` | `order:${string}` | `search:${string}`;

export const SortOrder = ["asc", "desc"] as const;
export type Sort = typeof SortOrder[number];

export const SortFields = ["due_date", "priority", "created"] as const;
export type SortField = typeof SortFields[number];

async function buildFilterParams(filters: SupportedFilters[], token: string): Promise<URLSearchParams> {
    const paramaters = new URLSearchParams();
    for (const filter of filters) {
        if (filter.startsWith("project:")) {
            const projectName = filter.split(":")[1];
            const project = await findProjectByName(token, projectName);
            if (!project) {
                throw new Error(`Project ${projectName} not found`);
            }            
            paramaters.append("project_id", project.id);
        } else if (filter.startsWith("label:")) {
            paramaters.append("label", filter.split(":")[1]);
        } else if (filter.startsWith("section:")) {
            const sectionName = filter.split(":")[1];
            const section = await getSectionByName(token, sectionName);
            if (!section) {
                throw new Error(`Section ${sectionName} not found`);
            }
            paramaters.append("section_id", section.id);
        }
    }
    return paramaters;
}

/**
 * Get active tasks from Todoist
 * @param token - The Todoist API token
 * @param filters - The filters to apply to the tasks
 * @returns The tasks
 */
export async function getActiveTasks(token: string, filters: SupportedFilters[] = [], orderBy: SortField = "due_date", order: Sort = "desc") {
    const filterParams = await buildFilterParams(filters, token);

    try {
        const url = `${TODOIST_API_BASE}/tasks${filterParams.size > 0 ? `?${filterParams.toString()}` : ""}`;
        console.log(url);
        const response = await fetch(url, {
            method: 'GET',            
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }            
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        let tasks = await response.json();

        // Filter to tasks that are overdue
        const today = new Date().toISOString().split("T")[0];

        // Filter to tasks that are due today or overdue        
        if (filters.includes("today") || filters.includes("overdue")) {
            tasks = tasks.filter((task: any) => {
                const dueDate = task.due?.date;
                if (filters.includes("today")) {
                    return dueDate && dueDate === today;
                } else if (filters.includes("overdue")) {
                    return dueDate && dueDate < today;
                }
            });
        }

        // Filter to tasks that match the search term
        if (filters.includes("search:")) {
            const searchTerm = filters.find((filter) => filter.startsWith("search:"))?.split(":")[1];
            tasks = tasks.filter((task: any) => task.content.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        const sortedTasks = tasks.sort((a: any, b: any) => {
            const aValue = a[orderBy];
            const bValue = b[orderBy];
            return order === "desc" ? bValue - aValue : aValue - bValue;
        });

        return sortedTasks; 
    } catch (error) {
        throw new Error(`Failed to fetch today's tasks: ${(error as Error).message}`);
    }
}

export async function renderTask(task: Task, comments?: Comment[]) {
    richConsole.log(`<h2 marginBottom="1">Task ${task.content}</h2>`);
    task.description && richConsole.log(`<p marginTop="0" marginBottom="1">${task.description}</p>`);
    task.due?.string && richConsole.log(`<p marginTop="0" marginBottom="1">Date Due: ${task.due?.string}</p>`);
    task.priority && richConsole.log(`<p marginTop="0" marginBottom="1">Priority: ${task.priority}</p>`);
    task.labels?.length > 0 && richConsole.log(`<p marginTop="0" marginBottom="1">Labels: ${task.labels}</p>`);
    
    if (comments && comments.length > 0) {
        richConsole.log(`<h3>Comments</h3>`);
        richConsole.log(`<ul marginTop="0">${comments.map((comment: any) => {
            return `<li>${comment.content}</li>`;
        }).join("")}</ul>`);
    }
}

export async function getSectionByName(token: string, name: string) {
    const sections = await fetchSections(token);
    return sections.find((section: any) => section.name === name);
}

export async function fetchSections(token: string) {
    const response = await fetch(`${TODOIST_API_BASE}/sections`, {
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
}


export async function findProjectByName(token: string, name: string) {
    const projects = await fetchProjects(token);
    return projects.find((project: any) => project.name === name);
}

export async function fetchProjects(token: string) {
    const response = await fetch(`${TODOIST_API_BASE}/projects`, {
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
}

export async function getTodayAndOverdueTasks(token: string) {
    try {
        const response = await fetch(`${TODOIST_API_BASE}/tasks`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const tasks = await response.json();
        const today = new Date().toISOString().split("T")[0];

        const todayTasks = tasks.filter((task: any) => {
            const dueDate = task.due?.date;
            return dueDate && dueDate <= today;
        });

        return todayTasks;
    } catch (error) {
        throw new Error(`Failed to fetch today's tasks: ${(error as Error).message}`);
    }
}

export async function postOsNotification(title: string, message: string) {
    // Use osascript to display a notification on macOS
    const script = `
    display notification "${message}" with title "${title}"
    `;

    exec(`osascript -e '${script}'`);
    exec(`afplay ${alarmPath}`);
}

// Timer function
export async function startTimer(token: string, taskName: string, taskId: string, duration: number, events: {
    onComplete: () => void,
    onUpdate: (remainingTime: Duration) => void,
    onError: (error: Error) => void,
    onStart: (endTime: DateTime) => void,
}) {

    const endTime = DateTime.now().plus({ minutes: duration });
    events.onStart(endTime);
    const updateTimer = async () => {
        const remainingTime = endTime.diff(DateTime.now())
        if (remainingTime.as("seconds") <= 0) {            
            events.onComplete();
            
            if (taskId) {
                // Add a comment to the task
                const comment = `Focused for ${duration} minute(s) on this task.`;

                try {
                    await addComment(token, taskId, comment);
                } catch (error) {
                    events.onError(error as Error);
                }
            }
        } else {
            events.onUpdate(remainingTime);            
            setTimeout(1000).then(updateTimer);
        }        
    };
    setTimeout(1000).then(updateTimer)
}

export async function getTaskDetails(token: string, taskId: string) {
    const response = await fetch(`${TODOIST_API_BASE}/tasks/${taskId}`, {
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
}

export async function getTaskComments(token: string, taskId: string) {
    const response = await fetch(`${TODOIST_API_BASE}/comments?task_id=${taskId}`, {
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
}
