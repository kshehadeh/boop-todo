---
layout: default
title: Commands
---

# Boop Commands Reference

Boop offers a variety of commands to help you manage your Todoist tasks efficiently. Here's a comprehensive guide to all available commands.

## Basic Usage

```bash
boop [options] [command]
```

Global options:
- `-V, --version`: Output the version number
- `-h, --help`: Display help for command

## Command Details

### `today`

Lists all tasks that are due today or are overdue.

```bash
boop today
```

This provides a quick overview of your immediate priorities without any additional filtering.

### `create`

Launches an interactive prompt to create a new Todoist task.

```bash
boop create
```

The interactive prompt will guide you through specifying:
- Task name
- Due date
- Priority
- Project

### `complete`

Shows an interactive list of today's tasks, allowing you to select and mark multiple tasks as complete in one go.

```bash
boop complete
```

Use arrow keys to navigate, space to select tasks, and enter to confirm and complete the selected tasks.

### `summary [weeks]`

Generates a report of completed tasks within a specified time period.

```bash
boop summary --weeks 2
```

Options:
- `--weeks <number>`: The number of weeks to look back for completed tasks (default: 1)

### `start [duration] [name]`

Starts a timer that can be associated with a Todoist task.

```bash
boop start 25m "Work on project"
```

Parameters:
- `duration`: Optional time limit (e.g., "25m" for 25 minutes)
- `name`: Optional task name or identifier

If no parameters are provided, it will ask you to pick a todo list item to start on.

### `list`

Lists all tasks in your Todoist account with options to filter and sort.

```bash
boop list -f priority:1 -f today -s due_date -o asc
```

Options:
- `-f, --filter <filter>`: Filter tasks by specific properties (can be used multiple times)
  - `priority:1`, `priority:2`, `priority:3`, `priority:4`
  - `project:<project_name>`
  - `section:<section_name>`
  - `label:<label_name>`
  - `today`: Show only tasks due today
  - `overdue`: Show only tasks that are overdue
  - `completed`: Show only completed tasks
  - `search:<search_term>`: Search for tasks containing the term
- `-s, --sort <sort>`: Sort tasks by property
  - `priority`
  - `due_date`
  - `created`
- `-o, --order <order>`: Order tasks (default: ascending)
  - `asc`
  - `desc`

### `auth login`

Initiates the Todoist authentication flow.

```bash
boop auth login
```

You'll need to provide your Todoist API token, which can be found in the Todoist web app under Settings > Integrations.

### `auth status`

Checks if you're currently logged in to Todoist.

```bash
boop auth status
```

### `auth logout`

Logs you out of Todoist by removing stored credentials.

```bash
boop auth logout
```

### `ai`

Configure your AI provider settings.

```bash
boop ai
```

This interactive command helps you set up:
- Your preferred AI service
- API keys for the service

### `about`

Displays information about Boop.

```bash
boop about
```

Shows:
- Version number
- Author information
- Other relevant details

## Getting Help

To get help for any command:

```bash
boop help [command]
```

Replace `[command]` with the specific command you need help with. 