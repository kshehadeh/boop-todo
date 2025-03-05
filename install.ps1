# Ensure we stop on errors
$ErrorActionPreference = 'Stop'

# Colors for output
function Write-Step([string]$message) {
    Write-Host "==> $message" -ForegroundColor Blue
}

function Write-Error([string]$message) {
    Write-Host "Error: $message" -ForegroundColor Red
    exit 1
}

function Write-Success([string]$message) {
    Write-Host $message -ForegroundColor Green
}

# Detect architecture
function Get-Architecture {
    $arch = [System.Environment]::GetEnvironmentVariable("PROCESSOR_ARCHITECTURE")
    switch ($arch) {
        "AMD64" { return "amd64" }
        "ARM64" { return "arm64" }
        default { Write-Error "Unsupported architecture: $arch" }
    }
}

# Get the latest release version from GitHub
function Get-LatestVersion {
    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/kshehadeh/boop/releases/latest"
        return $release.tag_name
    }
    catch {
        Write-Error "Could not determine the latest version: $_"
    }
}

# Main installation
function Install-Boop {
    Write-Step "Detecting platform..."
    $arch = Get-Architecture
    Write-Host "Detected architecture: $arch"

    Write-Step "Getting latest version..."
    $version = Get-LatestVersion
    Write-Host "Latest version: $version"

    Write-Step "Downloading boop..."
    $binaryName = "boop-windows"
    $downloadUrl = "https://github.com/kshehadeh/boop/releases/download/$version/$binaryName"
    
    # Create installation directory in Program Files
    $installDir = "$env:LOCALAPPDATA\Programs\boop"
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null

    # Download the binary
    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile "$installDir\boop.exe"
    }
    catch {
        Write-Error "Failed to download boop: $_"
    }

    # Add to PATH if not already present
    $userPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
    if ($userPath -notlike "*$installDir*") {
        Write-Step "Adding boop to your PATH..."
        $newPath = "$userPath;$installDir"
        [System.Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
        $env:PATH = "$env:PATH;$installDir"
    }

    Write-Success "Installation successful!"
    Write-Host "`nYou can now run 'boop' from any new terminal window."
    Write-Host "To use boop in this terminal, please restart it or run:"
    Write-Host "`$env:PATH = [System.Environment]::GetEnvironmentVariable('PATH', 'User')"
}

# Run the installation
Install-Boop 