#!/bin/bash

# Session Tracker Utility
# Manages Claude Code session tracking with unique IDs

SESSION_FILE="$HOME/Documents/startup/openyap/openyap/.claude/logs/current-session.txt"
SESSION_LOG="$HOME/Documents/startup/openyap/openyap/.claude/logs/sessions.json"

# Ensure log directory exists
mkdir -p "$(dirname "$SESSION_FILE")"

# Function to get or create current session ID
get_current_session() {
    if [ -f "$SESSION_FILE" ]; then
        cat "$SESSION_FILE"
    else
        # Create new session ID (timestamp + random)
        NEW_SESSION="session_$(date +%Y%m%d_%H%M%S)_$$"
        echo "$NEW_SESSION" > "$SESSION_FILE"
        
        # Initialize session in log
        TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
        SESSION_ENTRY=$(jq -n \
            --arg id "$NEW_SESSION" \
            --arg ts "$TIMESTAMP" \
            '{
                sessionId: $id,
                startTime: $ts,
                commands: [],
                filesChanged: [],
                todos: [],
                prompts: [],
                summary: "",
                endTime: null
            }')
        
        if [ -f "$SESSION_LOG" ]; then
            jq ". += [$SESSION_ENTRY]" "$SESSION_LOG" > "$SESSION_LOG.tmp" && mv "$SESSION_LOG.tmp" "$SESSION_LOG"
        else
            echo "[$SESSION_ENTRY]" > "$SESSION_LOG"
        fi
        
        echo "$NEW_SESSION"
    fi
}

# Function to log a command for current session
log_command() {
    local command="$1"
    local description="$2"
    local session_id=$(get_current_session)
    local timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    
    # Update the session with the new command
    jq --arg sid "$session_id" \
       --arg cmd "$command" \
       --arg desc "$description" \
       --arg ts "$timestamp" \
       'map(if .sessionId == $sid then .commands += [{"command": $cmd, "description": $desc, "timestamp": $ts}] else . end)' \
       "$SESSION_LOG" > "$SESSION_LOG.tmp" && mv "$SESSION_LOG.tmp" "$SESSION_LOG"
}

# Function to log a file change for current session
log_file_change() {
    local file_path="$1"
    local operation="$2"  # edit, create, delete
    local session_id=$(get_current_session)
    local timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    
    # Update the session with the file change
    jq --arg sid "$session_id" \
       --arg file "$file_path" \
       --arg op "$operation" \
       --arg ts "$timestamp" \
       'map(if .sessionId == $sid then .filesChanged += [{"file": $file, "operation": $op, "timestamp": $ts}] else . end)' \
       "$SESSION_LOG" > "$SESSION_LOG.tmp" && mv "$SESSION_LOG.tmp" "$SESSION_LOG"
}

# Function to log a todo for current session
log_todo() {
    local todo_content="$1"
    local todo_status="$2"
    local session_id=$(get_current_session)
    local timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    
    # Update the session with the new todo
    jq --arg sid "$session_id" \
       --arg content "$todo_content" \
       --arg status "$todo_status" \
       --arg ts "$timestamp" \
       'map(if .sessionId == $sid then .todos += [{"content": $content, "status": $status, "timestamp": $ts}] else . end)' \
       "$SESSION_LOG" > "$SESSION_LOG.tmp" && mv "$SESSION_LOG.tmp" "$SESSION_LOG"
}

# Function to log a prompt for current session
log_prompt() {
    local prompt_text="$1"
    local session_id=$(get_current_session)
    local timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    
    # Update the session with the new prompt
    jq --arg sid "$session_id" \
       --arg prompt "$prompt_text" \
       --arg ts "$timestamp" \
       'map(if .sessionId == $sid then .prompts += [{"text": $prompt, "timestamp": $ts}] else . end)' \
       "$SESSION_LOG" > "$SESSION_LOG.tmp" && mv "$SESSION_LOG.tmp" "$SESSION_LOG"
}

# Function to update session summary
update_summary() {
    local summary_text="$1"
    local session_id=$(get_current_session)
    
    # Update the session summary
    jq --arg sid "$session_id" \
       --arg summary "$summary_text" \
       'map(if .sessionId == $sid then .summary = $summary else . end)' \
       "$SESSION_LOG" > "$SESSION_LOG.tmp" && mv "$SESSION_LOG.tmp" "$SESSION_LOG"
}

# Function to end current session
end_session() {
    local session_id=$(get_current_session)
    local timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    
    # Don't auto-generate summary - only use manually set summaries
    
    # Update the session with end time
    jq --arg sid "$session_id" \
       --arg ts "$timestamp" \
       'map(if .sessionId == $sid then .endTime = $ts else . end)' \
       "$SESSION_LOG" > "$SESSION_LOG.tmp" && mv "$SESSION_LOG.tmp" "$SESSION_LOG"
    
    # Remove current session file
    rm -f "$SESSION_FILE"
}

# Function to get current session data
get_session_data() {
    local session_id=$(get_current_session)
    jq --arg sid "$session_id" '.[] | select(.sessionId == $sid)' "$SESSION_LOG" 2>/dev/null || echo "{}"
}

# Main command handling
case "$1" in
    "get-id")
        get_current_session
        ;;
    "log-command")
        log_command "$2" "$3"
        ;;
    "log-file")
        log_file_change "$2" "$3"
        ;;
    "log-todo")
        log_todo "$2" "$3"
        ;;
    "log-prompt")
        log_prompt "$2"
        ;;
    "update-summary")
        update_summary "$2"
        ;;
    "end")
        end_session
        ;;
    "get-data")
        get_session_data
        ;;
    *)
        echo "Usage: $0 {get-id|log-command|log-file|log-todo|log-prompt|update-summary|end|get-data}"
        exit 1
        ;;
esac