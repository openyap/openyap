#!/bin/bash

# Todo Tracker Hook
# Captures TodoWrite tool usage and logs todos to session tracker

SESSION_TRACKER="$HOME/Documents/startup/openyap/openyap/.claude/hooks/session-tracker.sh"

# Read the tool input from stdin
TOOL_INPUT=$(cat)

# Extract tool name and todos
TOOL_NAME=$(echo "$TOOL_INPUT" | jq -r '.tool_name // ""')

# Only process TodoWrite tools
if [ "$TOOL_NAME" = "TodoWrite" ]; then
    # Extract todos array from the tool input
    TODOS=$(echo "$TOOL_INPUT" | jq -r '.tool_input.todos // []')
    
    # Log each todo to the session tracker
    if [ "$TODOS" != "[]" ]; then
        echo "$TODOS" | jq -r '.[] | @base64' | while read -r todo_base64; do
            TODO_JSON=$(echo "$todo_base64" | base64 -d)
            TODO_CONTENT=$(echo "$TODO_JSON" | jq -r '.content')
            TODO_STATUS=$(echo "$TODO_JSON" | jq -r '.status')
            
            # Log to session tracker
            bash "$SESSION_TRACKER" log-todo "$TODO_CONTENT" "$TODO_STATUS"
        done
    fi
fi

# Pass through the original input
echo "$TOOL_INPUT"