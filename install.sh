#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print step with color
step() {
    echo -e "${BLUE}==>${NC} $1"
}

error() {
    echo -e "${RED}Error:${NC} $1"
    exit 1
}

# Detect OS and architecture
detect_platform() {
    local os arch

    os=$(uname -s | tr '[:upper:]' '[:lower:]')
    arch=$(uname -m)

    case "$os" in
        "darwin")
            os="mac"
            ;;
        "linux")
            os="linux"
            ;;
        "msys"*|"cygwin"*|"mingw"*|"windows"*)
            os="windows"
            ;;
        *)
            error "Unsupported operating system: $os"
            ;;
    esac

    case "$arch" in
        "x86_64"|"amd64")
            arch="amd64"
            ;;
        "arm64"|"aarch64")
            arch="arm64"
            ;;
        *)
            error "Unsupported architecture: $arch"
            ;;
    esac

    echo "$os"
}

# Get the latest release version from GitHub
get_latest_version() {
    local latest_release
    latest_release=$(curl -s "https://api.github.com/repos/kshehadeh/boop-todo/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    if [ -z "$latest_release" ]; then
        error "Could not determine the latest version"
    fi
    echo "$latest_release"
}

# Main installation
main() {
    step "Detecting platform..."
    local platform
    platform=$(detect_platform)
    echo "Detected platform: $platform"

    step "Getting latest version..."
    local version
    version=$(get_latest_version)
    echo "Latest version: $version"

    step "Downloading boop..."
    local binary_name="boop-${platform}"
    local download_url="https://github.com/kshehadeh/boop-todo/releases/download/${version}/${binary_name}"
    
    # Create the bin directory if it doesn't exist
    local install_dir="$HOME/.local/bin"
    mkdir -p "$install_dir"

    # Download the binary
    if ! curl -L --progress-bar "$download_url" -o "$install_dir/boop"; then
        error "Failed to download boop"
    fi

    # Make it executable
    chmod +x "$install_dir/boop"

    # Check if the installation directory is in PATH
    if [[ ":$PATH:" != *":$install_dir:"* ]]; then
        echo -e "${GREEN}Installation successful!${NC}"
        echo
        echo "Please add the following line to your shell configuration file (.bashrc, .zshrc, etc.):"
        echo "export PATH=\"\$PATH:$install_dir\""
        echo
        echo "Then restart your shell or run:"
        echo "export PATH=\"\$PATH:$install_dir\""
    else
        echo -e "${GREEN}Installation successful!${NC}"
    fi

    echo
    echo "You can now run 'boop' from your terminal."
}

main 