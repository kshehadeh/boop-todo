#!/bin/bash

# Build the TypeScript code
echo "Building TypeScript code..."
npx tsc

# Make the CLI executable
echo "Making the CLI executable..."
chmod +x dist/index.js

echo "Build complete. You can now run the CLI with:"
echo "node dist/index.js"
echo "Or link it globally with:"
echo "npm link" 