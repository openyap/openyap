#!/bin/bash

# Code Formatter Hook
# Automatically formats code after file edits using Biome

SESSION_TRACKER="$HOME/Documents/startup/openyap/openyap/.claude/hooks/session-tracker.sh"

# Read the tool input from stdin
TOOL_INPUT=$(cat)

# Extract tool name and file path
TOOL_NAME=$(echo "$TOOL_INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.tool_input.file_path // ""')

# Track whether we should format
SHOULD_FORMAT=false

# Check if this is a file edit operation
if [[ "$TOOL_NAME" =~ ^(Edit|MultiEdit|Write)$ ]] && [ -n "$FILE_PATH" ]; then
    # Log the file change to session tracker
    OPERATION="edit"
    if [ "$TOOL_NAME" = "Write" ] && [ ! -f "$FILE_PATH" ]; then
        OPERATION="create"
    fi
    bash "$SESSION_TRACKER" log-file "$FILE_PATH" "$OPERATION"
    
    # Check if it's a formattable file type
    if [[ "$FILE_PATH" =~ \.(js|jsx|ts|tsx|json|css)$ ]]; then
        SHOULD_FORMAT=true
    fi
fi

# Pass through the original input first
echo "$TOOL_INPUT"

# Format after the tool executes (if needed)
if [ "$SHOULD_FORMAT" = true ]; then
    # Wait a moment for the file to be written
    sleep 0.1
    
    # Change to the project root
    cd "$HOME/Documents/startup/openyap/openyap" || exit
    
    # Run Biome format on the specific file
    echo "Running Biome formatter on $FILE_PATH..." >&2
    
    # Get relative path from project root for Biome
    RELATIVE_PATH=${FILE_PATH#"$HOME/Documents/startup/openyap/openyap/"}
    
    # Run the formatter from project root
    pnpm biome format --write "$RELATIVE_PATH" 2>&1 >&2
    
    # Log the formatting action
    TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    LOG_FILE="$HOME/Documents/startup/openyap/openyap/.claude/logs/formatting.log"
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "[$TIMESTAMP] Formatted: $FILE_PATH" >> "$LOG_FILE"
fi