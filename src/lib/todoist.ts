import { setTimeout } from "timers/promises";
import { config } from "dotenv";

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
