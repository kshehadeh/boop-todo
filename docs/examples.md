---
layout: default
title: Examples
---

# Boop Usage Examples

This page provides practical examples of how to use Boop in various scenarios. These examples will help you understand how to leverage Boop's features effectively.

## Daily Task Management

### Starting Your Day

Begin your workday by checking what tasks need attention:

```bash
boop today
```

### Completing Multiple Tasks

After finishing several tasks, mark them as complete in one go:

```bash
boop complete
```

### Creating a New Task with Priority

```bash
boop create
# Then follow the interactive prompts to set:
# - Task name: "Prepare presentation for meeting"
# - Due date: "tomorrow at 2pm"
# - Priority: "High"
# - Project: "Work"
```

## Task Organization

### Filtering Tasks by Project and Priority

View all high-priority tasks in your "Work" project:

```bash
boop list -f project:Work -f priority:1
```

### Sorting Tasks by Due Date

See all tasks sorted by their due dates in ascending order:

```bash
boop list -s due_date -o asc
```

### Finding Specific Tasks

Search for tasks containing the word "meeting":

```bash
boop list -f search:meeting
```

## Time Management

### Starting a 25-minute Pomodoro Session

```bash
boop start 25m "Write documentation"
```

### Working on a Specific Todoist Task

Start a timer for an existing task (you'll be prompted to select one):

```bash
boop start
```

## Productivity Analysis

### Reviewing Last Week's Completed Tasks

```bash
boop summary --weeks 1
```

### Checking Productivity for the Month

```bash
boop summary --weeks 4
```

## Advanced Usage

### Combining Multiple Filters

Find overdue high-priority tasks in a specific project:

```bash
boop list -f overdue -f priority:1 -f project:"Home Renovation"
```

### Custom Workflow: Morning Routine

Create a shell alias or script for your morning routine:

```bash
# Add to your .bashrc or .zshrc
alias morning="boop today && echo '--- Overdue Tasks ---' && boop list -f overdue"
```

### Integration with Other Tools

Pipe Boop output to other commands:

```bash
# Save today's tasks to a file
boop today > todays_tasks.txt

# Count how many tasks you have today
boop today | grep -c "•"
```

## Troubleshooting

### Checking Authentication Status

If commands aren't working, verify your authentication:

```bash
boop auth status
```

If not authenticated:

```bash
boop auth login
```

These examples demonstrate just a few ways to use Boop. As you become more familiar with the tool, you'll discover workflows that best suit your needs. 