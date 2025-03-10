import { Command } from "commander";
import { console as richConsole } from 'ansie';
import ora from 'ora';
import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';

const execAsync = promisify(exec);

// Function to check if the current version is older than the latest version
function isVersionOlder(currentVersion: string, latestVersion: string): boolean {
    const current = currentVersion.split('.').map(Number);
    const latest = latestVersion.split('.').map(Number);
    
    for (let i = 0; i < Math.max(current.length, latest.length); i++) {
        const currentPart = current[i] || 0;
        const latestPart = latest[i] || 0;
        
        if (currentPart < latestPart) return true;
        if (currentPart > latestPart) return false;
    }
    
    return false; // Versions are equal
}

// Function to check for updates
async function checkForUpdates(): Promise<{ hasUpdate: boolean; latestVersion: string }> {
    try {
        // Get the current version from package.json
        const packageJson = require('../../package.json');
        const currentVersion = packageJson.version;
        
        // Fetch the latest version from GitHub releases
        const response = await fetch('https://api.github.com/repos/kshehadeh/boop/releases/latest');
        if (!response.ok) {
            throw new Error('Failed to fetch latest version from GitHub');
        }
        const releaseData = await response.json();
        const latestVersion = releaseData.tag_name.replace(/^v/, ''); 
        
        return {
            hasUpdate: isVersionOlder(currentVersion, latestVersion),
            latestVersion
        };
    } catch (error) {
        console.error('Error checking for updates:', error);
        return { hasUpdate: false, latestVersion: '' };
    }
}

// Function to install the update
async function installUpdate(platform: string): Promise<boolean> {
    try {
        const spinner = ora('Installing update...').start();
        
        // Determine the installation command based on the platform
        let command;
        if (platform === 'win32') {
            // For Windows, use PowerShell            
            command = 'Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(\'https://raw.githubusercontent.com/kshehadeh/boop/main/install.ps1\'))';
            await execAsync(`powershell -Command "${command}"`);
        } else {
            // For Unix-like systems (macOS, Linux)
            command = 'curl -fsSL https://raw.githubusercontent.com/kshehadeh/boop/main/install.sh | bash';
            await execAsync(command);
        }
        
        spinner.succeed('Update installed successfully!');
        return true;
    } catch (error) {
        console.error('Error installing update:', error);
        return false;
    }
}

export default function subcommand(program: Command) {
    program
        .command("update")
        .description("Check for updates and install if available")
        .option('-f, --force', 'Force update even if already on the latest version')
        .action(async (options) => {
            const spinner = ora('Checking for updates...').start();
            
            try {
                const { hasUpdate, latestVersion } = await checkForUpdates();
                const currentVersion = require('../../package.json').version;
                
                if (hasUpdate || options.force) {
                    spinner.succeed(`Update available: ${currentVersion} → ${latestVersion}`);
                    
                    // Ask for confirmation
                    richConsole.log('<p>Do you want to install the update? (y/n)</p>');
                    process.stdin.once('data', async (data) => {
                        const input = data.toString().trim().toLowerCase();
                        
                        if (input === 'y' || input === 'yes') {
                            const success = await installUpdate(platform());
                            
                            if (success) {
                                richConsole.log('<p fg="green">✓ Boop has been updated successfully!</p>');
                                richConsole.log('<p>Please restart any open terminal sessions to use the new version.</p>');
                            } else {
                                richConsole.log('<p fg="red">✗ Update failed. Please try again or update manually.</p>');
                                richConsole.log('<p>You can update manually by running:</p>');
                                richConsole.log('<p fg="yellow">curl -fsSL https://raw.githubusercontent.com/kshehadeh/boop/main/install.sh | bash</p>');
                            }
                        } else {
                            richConsole.log('<p>Update cancelled.</p>');
                        }
                        
                        process.exit(0);
                    });
                } else {
                    spinner.succeed(`You're already using the latest version (${currentVersion})!`);
                    process.exit(0);
                }
            } catch (error) {
                spinner.fail('Failed to check for updates');
                console.error(error);
                process.exit(1);
            }
        });
} 