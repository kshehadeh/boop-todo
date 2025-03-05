# Boop - A Todoist CLI with Purpose

## Quick Install

### Unix-like Systems (macOS, Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/kshehadeh/boop/main/install.sh | bash
```

### Windows

Open PowerShell as Administrator and run:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/kshehadeh/boop/main/install.ps1'))
```

## Alternative Installation Methods

### Manual Installation

You can also download the latest binary directly from the [releases page](https://github.com/kshehadeh/boop/releases).

## Usage

```bash
Usage: boop [options] [command]

A Todoist CLI with purpose

Options:
  -V, --version            output the version number
  -h, --help               display help for command

Commands:
  today                    List tasks that are due today or overdue
  create                   Create a new Todoist task
  complete                 List today's tasks and mark selected ones as complete
  summary [weeks]         Get a summary of tasks completed in the specified time period
  login                    Login to Todoist
  start [duration] [name]  Start a timer associated with a todoist task or just start an anonymous timer.
  ai                       Configure AI provider and API key
  about                    About Boop
  help [command]           display help for command
```

## Command Details

### `today`

Lists all tasks that are due today or are overdue. This provides a quick overview of your immediate priorities.

### `create`

Launches an interactive prompt to create a new Todoist task. You can specify task name, due date, priority, and project.

### `complete`

Shows an interactive list of today's tasks, allowing you to select and mark multiple tasks as complete in one go.

### `summary [weeks]`

Generates a report of completed tasks within a specified time period. Options include:

- `--weeks`: The number of weeks to look back for completed tasks

### `login`

Initiates the Todoist authentication flow. You'll need to provide your API token to use Boop.

### `start [duration] [name]`

Starts a timer that can be associated with a Todoist task:

- `duration`: Optional time limit (e.g., "25m" for 25 minutes)
- `name`: Optional task name or identifier
If no parameters are provided, it will ask you to pick a todo list item to start on

### `ai`

Configure your AI provider settings:

- Set up your preferred AI service
- Configure API keys

### `about`

Displays information about Boop, including:

- Version number
- Author information


## Development

To add a new command, create a new file in the `src/commands` directory and register it in `src/index.ts`.

## License

MIT
