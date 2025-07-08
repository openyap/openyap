#!/bin/bash

# Bash Command Logger Hook
# Logs all bash commands executed by Claude Code with session tracking

# Get the project root directory (where .git is located)
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$(pwd)")
LOG_FILE="$PROJECT_ROOT/.claude/logs/bash-commands.log"
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
SESSION_TRACKER="$PROJECT_ROOT/.claude/hooks/session-tracker.sh"

# Ensure log file exists
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

# Read the tool input from stdin
TOOL_INPUT=$(cat)

# Extract command and description using jq
COMMAND=$(echo "$TOOL_INPUT" | jq -r '.tool_input.command // "unknown"')
DESCRIPTION=$(echo "$TOOL_INPUT" | jq -r '.tool_input.description // "No description"')
TOOL_NAME=$(echo "$TOOL_INPUT" | jq -r '.tool_name // "unknown"')

# Only log if it's a Bash tool
if [ "$TOOL_NAME" = "Bash" ]; then
    # Log to session tracker
    bash "$SESSION_TRACKER" log-command "$COMMAND" "$DESCRIPTION"
    
    # Also keep the old logging for backward compatibility
    echo "[$TIMESTAMP] Command: $COMMAND" >> "$LOG_FILE"
    echo "[$TIMESTAMP] Description: $DESCRIPTION" >> "$LOG_FILE"
    echo "----------------------------------------" >> "$LOG_FILE"
    
    # Also log to a JSON file for easier parsing
    JSON_LOG_FILE="$PROJECT_ROOT/.claude/logs/bash-commands.json"
    
    # Create JSON entry
    JSON_ENTRY=$(jq -n \
        --arg ts "$TIMESTAMP" \
        --arg cmd "$COMMAND" \
        --arg desc "$DESCRIPTION" \
        '{timestamp: $ts, command: $cmd, description: $desc}')
    
    # Append to JSON log (create array if doesn't exist)
    if [ -f "$JSON_LOG_FILE" ]; then
        jq ". += [$JSON_ENTRY]" "$JSON_LOG_FILE" > "$JSON_LOG_FILE.tmp" && mv "$JSON_LOG_FILE.tmp" "$JSON_LOG_FILE"
    else
        echo "[$JSON_ENTRY]" > "$JSON_LOG_FILE"
    fi
fi

# Always pass through the original input
echo "$TOOL_INPUT"