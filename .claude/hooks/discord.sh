#!/bin/bash

# Configuration
CLAUDE_ICON_URL="https://cdn.brandfetch.io/idW5s392j1/w/338/h/338/theme/dark/icon.png?c=1dxbfHSJFAPEGdCLU4o5B"

DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/1391971047087276124/oyZXHSCrFwPOopbxLp8jWB_XsZtHXfLNKCtWxuV5f4Cz3n4Uv8ZW8xCg4C6wEoyVVZG8"

# Load Discord webhook URL from environment or config file, fallback to hardcoded
if [ -n "$DISCORD_WEBHOOK_URL" ]; then
    # Use environment variable if set
    WEBHOOK_URL="$DISCORD_WEBHOOK_URL"
elif [ -f "$HOME/.claude-discord-webhook" ]; then
    # Use config file if exists
    WEBHOOK_URL=$(cat "$HOME/.claude-discord-webhook")
else
    # Fallback to hardcoded webhook
    WEBHOOK_URL="$DISCORD_WEBHOOK_URL"
fi

# Get git info
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
REPO_NAME=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")

# Get GitHub repo info from remote URL
REPO_OWNER=""
REPO_SLUG=""
REMOTE_URL=$(git config --get remote.origin.url 2>/dev/null || "")
if [[ "$REMOTE_URL" =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
    REPO_OWNER="${BASH_REMATCH[1]}"
    REPO_SLUG="${BASH_REMATCH[2]}"
fi

# Get repository avatar (owner's avatar)
REPO_AVATAR="https://github.com/${REPO_OWNER}.png"
if [ -z "$REPO_OWNER" ]; then
    # Fallback to default
    REPO_AVATAR="https://avatars.githubusercontent.com/u/0?v=4"
fi

# Get commit author info
AUTHOR_NAME=$(git config user.name 2>/dev/null || echo "Unknown Developer")
AUTHOR_EMAIL=$(git config user.email 2>/dev/null || echo "")

# Try to get GitHub username using gh CLI
GITHUB_USERNAME=$(gh api user --jq .login 2>/dev/null || "")

# If gh CLI fails, try git config as fallback
if [ -z "$GITHUB_USERNAME" ]; then
    GITHUB_USERNAME=$(git config github.user 2>/dev/null || "")
fi

# If still not set, try to extract from email (common pattern: username@users.noreply.github.com)
if [ -z "$GITHUB_USERNAME" ] && [[ "$AUTHOR_EMAIL" =~ ^([^@]+)@users\.noreply\.github\.com$ ]]; then
    GITHUB_USERNAME="${BASH_REMATCH[1]}"
    # Remove any numeric prefix (e.g., "12345+username" -> "username")
    GITHUB_USERNAME="${GITHUB_USERNAME#*+}"
fi

# Build GitHub avatar URL
GITHUB_AVATAR="https://github.com/${GITHUB_USERNAME}.png"
if [ -z "$GITHUB_USERNAME" ]; then
    # Fallback to default avatar
    GITHUB_AVATAR="https://avatars.githubusercontent.com/u/0?v=4"
fi

# Get current time
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
READABLE_TIME=$(date +"%I:%M %p")

# Get file change statistics
MODIFIED_COUNT=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
STAGED_COUNT=$(git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')
UNTRACKED_COUNT=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')

# Get session data - get the last completed session since this runs in Stop hook
SESSION_LOG="$HOME/Documents/startup/openyap/openyap/.claude/logs/sessions.json"
SESSION_DATA="{}"
if [ -f "$SESSION_LOG" ]; then
    # Get the most recent session that has an endTime (completed session)
    SESSION_DATA=$(jq '[.[] | select(.endTime != null and .endTime != "")] | last' "$SESSION_LOG" 2>/dev/null || echo "{}")
fi

# Extract commands, todos, and session info from session data
COMMAND_COUNT=0
RECENT_COMMANDS=""
SESSION_SUMMARY=""
SESSION_TODOS=""
TODO_COUNT=0

if [ "$SESSION_DATA" != "{}" ]; then
    COMMAND_COUNT=$(echo "$SESSION_DATA" | jq '.commands | length' 2>/dev/null || echo "0")
    if [ "$COMMAND_COUNT" -gt 0 ]; then
        # Get last 5 commands with proper line breaks (reduced from 10)
        RECENT_COMMANDS=$(echo "$SESSION_DATA" | jq -r '.commands | .[(-5):] | map("• " + .command) | join("\n")' 2>/dev/null || echo "")
    fi
    
    # Get session summary
    SESSION_SUMMARY=$(echo "$SESSION_DATA" | jq -r '.summary // ""' 2>/dev/null || echo "")
    
    # Get todos
    TODO_COUNT=$(echo "$SESSION_DATA" | jq '.todos | length' 2>/dev/null || echo "0")
    if [ "$TODO_COUNT" -gt 0 ]; then
        # Get last 5 todos with status
        SESSION_TODOS=$(echo "$SESSION_DATA" | jq -r '.todos | .[(-5):] | map("• " + .content + " (" + .status + ")") | join("\n")' 2>/dev/null || echo "")
    fi
fi

# Get files changed in this session
MODIFIED_FILES=""
FILES_COUNT=0
if [ "$SESSION_DATA" != "{}" ]; then
    FILES_COUNT=$(echo "$SESSION_DATA" | jq '.filesChanged | length' 2>/dev/null || echo "0")
    if [ "$FILES_COUNT" -gt 0 ]; then
        # Get unique files (in case same file was edited multiple times) with proper line breaks
        # Convert absolute paths to relative paths from repo root
        REPO_ROOT="$HOME/Documents/startup/openyap/openyap"
        MODIFIED_FILES=$(echo "$SESSION_DATA" | jq -r --arg repo_root "$REPO_ROOT" '.filesChanged | map(.file) | unique | map(if startswith($repo_root + "/") then .[$repo_root | length + 1:] else . end) | map("• `" + . + "`") | join("\n")' 2>/dev/null || echo "")
    fi
fi

# Override MODIFIED_COUNT with session data
MODIFIED_COUNT="$FILES_COUNT"

# Determine activity type and emoji based on what happened
ACTIVITY="Development"
ACTIVITY_EMOJI="💻"
if [ "$COMMAND_COUNT" -gt 10 ]; then
    ACTIVITY="Intensive Coding"
    ACTIVITY_EMOJI="🔥"
elif [ "$MODIFIED_COUNT" -eq 0 ]; then
    ACTIVITY="Analysis"
    ACTIVITY_EMOJI="🔍"
elif [ "$MODIFIED_COUNT" -gt 10 ]; then
    ACTIVITY="Major Update"
    ACTIVITY_EMOJI="🚀"
elif [ "$MODIFIED_COUNT" -gt 5 ]; then
    ACTIVITY="Feature Work"
    ACTIVITY_EMOJI="✨"
fi

# Create metrics display
if [ "$MODIFIED_COUNT" -gt 0 ]; then
    FILES_DISPLAY="**${MODIFIED_COUNT}** files changed"
else
    FILES_DISPLAY="No files changed"
fi

if [ "$COMMAND_COUNT" -gt 0 ]; then
    COMMANDS_DISPLAY="**${COMMAND_COUNT}** commands"
else
    COMMANDS_DISPLAY="No commands"
fi

if [ "$TODO_COUNT" -gt 0 ]; then
    TODOS_DISPLAY="**${TODO_COUNT}** todos"
else
    TODOS_DISPLAY="No todos"
fi

# Color based on activity (green for success, blue for analysis, orange for major changes)
COLOR=3447003  # Default blue
if [ "$MODIFIED_COUNT" -eq 0 ]; then
    COLOR=3447003  # Blue for analysis
elif [ "$MODIFIED_COUNT" -gt 10 ]; then
    COLOR=16744192  # Orange for major changes
else
    COLOR=5763719  # Green for normal changes
fi

# Create a more detailed description
DESCRIPTION=""
if [ "$MODIFIED_COUNT" -gt 0 ]; then
    DESCRIPTION="${ACTIVITY_EMOJI} **${ACTIVITY}** session completed at ${READABLE_TIME}"
else
    DESCRIPTION="${ACTIVITY_EMOJI} **${ACTIVITY}** session completed at ${READABLE_TIME}"
fi

# Build the embed JSON
# Create base fields
FIELDS_JSON='[
      {
        "name": "📈 Session Metrics",
        "value": "'"$FILES_DISPLAY"' • '"$COMMANDS_DISPLAY"' • '"$TODOS_DISPLAY"'",
        "inline": false
      }'

# Add session summary if manually set (not empty, null, or just metrics)
if [ -n "$SESSION_SUMMARY" ] && [ "$SESSION_SUMMARY" != "null" ] && [[ ! "$SESSION_SUMMARY" =~ ^Session\ completed: ]]; then
    # Escape quotes and newlines for JSON
    ESCAPED_SUMMARY=$(echo "$SESSION_SUMMARY" | sed 's/"/\\"/g' | sed 's/$/\\n/' | tr -d '\n')
    FIELDS_JSON="$FIELDS_JSON"',
      {
        "name": "📝 Session Summary",
        "value": "'"$ESCAPED_SUMMARY"'",
        "inline": false
      }'
fi

# Add files field if there are modified files
if [ -n "$MODIFIED_FILES" ]; then
    # Escape quotes and newlines for JSON
    ESCAPED_FILES=$(echo "$MODIFIED_FILES" | sed 's/"/\\"/g' | sed 's/$/\\n/' | tr -d '\n')
    FIELDS_JSON="$FIELDS_JSON"',
      {
        "name": "📁 Modified Files",
        "value": "'"$ESCAPED_FILES"'",
        "inline": false
      }'
fi

# Add todos field if there are todos
if [ -n "$SESSION_TODOS" ]; then
    # Escape quotes and newlines for JSON
    ESCAPED_TODOS=$(echo "$SESSION_TODOS" | sed 's/"/\\"/g' | sed 's/$/\\n/' | tr -d '\n')
    FIELDS_JSON="$FIELDS_JSON"',
      {
        "name": "✅ Todos",
        "value": "'"$ESCAPED_TODOS"'",
        "inline": false
      }'
fi

# Add commands field if there are recent commands
if [ -n "$RECENT_COMMANDS" ]; then
    # Escape quotes and newlines for JSON
    ESCAPED_COMMANDS=$(echo "$RECENT_COMMANDS" | sed 's/"/\\"/g' | sed 's/$/\\n/' | tr -d '\n')
    FIELDS_JSON="$FIELDS_JSON"',
      {
        "name": "💻 Recent Commands",
        "value": "'"$ESCAPED_COMMANDS"'",
        "inline": false
      }'
fi

# Add repository info
FIELDS_JSON="$FIELDS_JSON"',
      {
        "name": "Repository",
        "value": "`'"$REPO_NAME"'`",
        "inline": true
      },
      {
        "name": "Branch",
        "value": "`'"$BRANCH"'`",
        "inline": true
      },
      {
        "name": "Commit",
        "value": "`'"$COMMIT"'`",
        "inline": true
      }
    ]'

# Send to Discord with error handling
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -X POST -d '{
  "embeds": [{
    "author": {
      "name": "Claude Code for OpenYap",
      "icon_url": "'"$CLAUDE_ICON_URL"'"
    },
    "title": "Development Update",
    "description": "'"$DESCRIPTION"'",
    "color": '"$COLOR"',
    "fields": '"$FIELDS_JSON"',
    "footer": {
      "text": "'"$AUTHOR_NAME"'",
      "icon_url": "'"$GITHUB_AVATAR"'"
    },
    "timestamp": "'"$TIMESTAMP"'"
  }],
  "username": "'"$REPO_SLUG"'",
  "avatar_url": "'"$REPO_AVATAR"'"
}' "$WEBHOOK_URL" 2>&1)

# Extract HTTP status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

# Log the result
TIMESTAMP_LOG=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
DISCORD_LOG="$HOME/Documents/startup/openyap/openyap/.claude/logs/discord.log"
mkdir -p "$(dirname "$DISCORD_LOG")"

if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "[$TIMESTAMP_LOG] SUCCESS: Discord notification sent" >> "$DISCORD_LOG"
else
    echo "[$TIMESTAMP_LOG] ERROR: Discord notification failed (HTTP $HTTP_CODE)" >> "$DISCORD_LOG"
    echo "[$TIMESTAMP_LOG] Response: $RESPONSE_BODY" >> "$DISCORD_LOG"
    echo "Discord notification failed (HTTP $HTTP_CODE)" >&2
fi