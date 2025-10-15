#!/bin/bash

# Install Bun if not present
if ! command -v bun &> /dev/null; then
    echo "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi

# Install dependencies
echo "Installing dependencies with Bun..."
bun install

# Build the project
echo "Building the project..."
bun run build

echo "Deployment preparation complete!"
