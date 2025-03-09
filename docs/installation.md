---
layout: default
title: Installation
---

# Installing Boop

Boop can be installed on various operating systems using different methods. Choose the one that works best for you.

## Quick Install

### Unix-like Systems (macOS, Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/kshehadeh/boop/main/install.sh | bash
```

This script will:
1. Download the appropriate binary for your system
2. Place it in a suitable location in your PATH
3. Make it executable

### Windows

Open PowerShell as Administrator and run:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/kshehadeh/boop/main/install.ps1'))
```

## Manual Installation

If you prefer to install manually:

1. Download the latest binary for your platform from the [releases page](https://github.com/kshehadeh/boop/releases)
2. For Unix-like systems:
   ```bash
   chmod +x boop-*
   sudo mv boop-* /usr/local/bin/boop
   ```
3. For Windows:
   - Place the executable in a directory that's in your PATH
   - Rename it to `boop.exe` if needed

## Verifying Installation

To verify that Boop was installed correctly, open a new terminal window and run:

```bash
boop --version
```

You should see the current version number of Boop displayed.

## First-time Setup

After installation, you'll need to authenticate with Todoist:

```bash
boop login
```

Follow the prompts to enter your Todoist API token. You can find your API token in the Todoist web app under Settings > Integrations > API token. 