import { DateTime, Duration } from "luxon";
import ora from "ora";
import { startTimer } from "./todoist";

export async function runTimer(token: string, name: string, duration: number, taskId?: string) {
    const countdown = ora().start();
    await startTimer(token, name || "Anonymous timer", taskId || "", duration, {
        onStart: (endTime: DateTime) => {
            countdown.text = `Starting timer that ends at ${endTime.toLocaleString()}`;
        },
        onUpdate: (remainingTime: Duration) => {
            countdown.text = `Time Remaining: ${remainingTime.shiftTo('minutes', 'seconds').toHuman()}`;
        },
        onComplete: () => {
            countdown.succeed("Timer completed");
        },
        onError: (error: Error) => {
            countdown.fail(error.message);
        }
    }
    );
}