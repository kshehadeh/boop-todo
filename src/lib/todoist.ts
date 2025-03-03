#!/usr/bin/env node

import { Command } from "commander";

import ora from "ora";
import { setTimeout } from "timers/promises";
import { config } from "dotenv";

import path from "path";
import { exec } from "child_process";
import { DateTime } from "luxon";
import { ask } from "./openai";
import { executeOAuthFlowAndReturnAuthInfo } from "./oauth";

// Get the location of this script file and then find the .env file two directories up
const rootPath = path.resolve(__dirname, "../../")
const dotenvPath = `${rootPath}/.env`;
const alarmPath = `${rootPath}/assets/sound/mixkit-bell-notification-933.wav`;

config({ path: dotenvPath });

// Todoist API token (replace this with an environment variable for security)
const TODOIST_API_TOKEN = process.env.TODOIST_TOKEN;
const TODOIST_CLIENT_ID = process.env.TODOIST_CLIENT_ID;
const TODOIST_CLIENT_SECRET = process.env.TODOIST_CLIENT_SECRET;
const TODOIST_API_BASE = "https://api.todoist.com/rest/v2";
const TODOIST_SYNC_API_BASE = "https://api.todoist.com/sync/v9";

export async function connectWithOauthToTodist() {
    const spinner = ora("Connecting to Todoist...").start();

    const response = await executeOAuthFlowAndReturnAuthInfo({
        clientId: TODOIST_CLIENT_ID || '',
        clientSecret: TODOIST_CLIENT_SECRET || '',
        tokenUrl: "https://todoist.com/oauth/access_token",
        authUrl: "https://todoist.com/oauth/authorize",
        audience: "",
        redirectUrl: "http://localhost:3000",
        scopes: ["data:read_write"],
        includeState: true,
        includePrompt: true,
        output: (message: string) => {
            spinner.text = message;
        },
    })
    if (!response) {
        spinner.fail("Failed to connect to Todoist.");
        process.exit(1);
    }

    spinner.succeed(`Connected to Todoist: ${response.access_token}`);

    return response.access_token;
}

// Helper function to fetch completed tasks from Todoist
export async function fetchCompletedTasks() {
    const spinner = ora("Fetching completed tasks from Todoist...").start();
    try {
        const bearer = await connectWithOauthToTodist();
        console.log("Bearer:", bearer);
        const twoWeeksAgo = DateTime.now().minus({ weeks: 2 }).toISO();
        const response = await fetch(`${TODOIST_SYNC_API_BASE}/completed/get_all`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${bearer}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ since: twoWeeksAgo }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        spinner.stop();
        const data = await response.json();
        return data.items;
    } catch (error) {
        spinner.fail("Failed to fetch completed tasks.");
        console.error((error as Error).message);
        process.exit(1);
    }
}

// Helper function to summarize tasks using OpenAI
export async function summarizeTasks(tasks: any[]) {
    const taskDescriptions = tasks.map(task => task.content).join("\n");
    const prompt = `Summarize the following tasks completed in the last 2 weeks:\n\n${taskDescriptions}`;

    try {
        return await ask(prompt);        
    } catch (error) {
        console.error("Failed to summarize tasks using OpenAI:", (error as Error).message);
        process.exit(1);
    }
}

// Helper function to fetch tasks from Todoist
export async function fetchTasks() {
    const spinner = ora("Fetching tasks from Todoist...").start();
    try {
        const response = await fetch(`${TODOIST_API_BASE}/tasks`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${TODOIST_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        spinner.stop();
        return await response.json();
    } catch (error) {
        spinner.fail("Failed to fetch tasks.");
        console.error((error as Error).message);
        process.exit(1);
    }
}

export async function markTaskAsComplete(taskId: string) {
    try {
        const response = await fetch(
            `${TODOIST_API_BASE}/tasks/${taskId}/close`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TODOIST_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        return true;
    } catch (error) {
        console.error((error as Error).message);
        return null;
    }
}

export async function addComment(taskId: string, comment: string) {
    const spinner = ora("Adding comment to the task...").start();
    try {
        const response = await fetch(
            `${TODOIST_API_BASE}/comments`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TODOIST_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ task_id: taskId, content: comment })
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        spinner.stop();
    } catch (error) {
        spinner.fail("Failed to add comment.");
        console.error((error as Error).message);
        process.exit(1);
    }
}

export async function createTask(taskContent: string) {
    const response = await fetch(
        `${TODOIST_API_BASE}/tasks`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TODOIST_API_TOKEN}`,
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

export async function getTodayAndOverdueTasks() {
    const spinner = ora("Fetching today's tasks from Todoist...").start();
    try {
        const response = await fetch(`${TODOIST_API_BASE}/tasks`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${TODOIST_API_TOKEN}`,
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

        spinner.stop();
        return todayTasks;
    } catch (error) {
        spinner.fail("Failed to fetch today's tasks.");
        console.error((error as Error).message);
        process.exit(1);
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
export async function startTimer(taskName: string, taskId: string, duration: number) {
    console.log(`⏰ Timer for "${taskName}"...`);
    console.log(`Duration: ${duration} minute(s)`);

    const countdown = ora({
        text: `Time Remaining: ${duration} minute(s)`,
        spinner: "runner",
    }).start();

    const endTime = DateTime.now().plus({ minutes: duration });

    const updateTimer = async () => {
        const remainingTime = endTime.diff(DateTime.now())
        if (remainingTime.as("seconds") <= 0) {            
            countdown.stop();            

            postOsNotification("Todoist Timer", `Timer complete for: ${taskName}`);
            console.log("\n⏰ Time's up! Timer complete for:", taskName);
            console.log("\u0007");
            
            if (taskId) {
                // Add a comment to the task
                const comment = `Focused for ${duration} minute(s) on this task.`;
                await addComment(taskId, comment);
            }
        } else {
            countdown.text = `Time Remaining: ${remainingTime.shiftTo('minutes', 'seconds').toHuman()}`;
            setTimeout(1000).then(updateTimer);
        }        
    };
    setTimeout(1000).then(updateTimer)
}
