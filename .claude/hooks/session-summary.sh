#!/bin/bash

# Session Summary Hook
# Generates a summary of all changes made during the session

SUMMARY_FILE="$HOME/Documents/startup/openyap/openyap/.claude/logs/session-summary.log"
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
SESSION_TRACKER="$HOME/Documents/startup/openyap/openyap/.claude/hooks/session-tracker.sh"

# Ensure log directory exists
mkdir -p "$(dirname "$SUMMARY_FILE")"

# Read tool input (for Stop hooks)
TOOL_INPUT=$(cat)

# End the current session and get session data
bash "$SESSION_TRACKER" end
SESSION_DATA=$(bash "$SESSION_TRACKER" get-data)

# Change to project directory
cd "$HOME/Documents/startup/openyap/openyap" || exit

# Start summary
echo "========================================" >> "$SUMMARY_FILE"
echo "Session Summary - $TIMESTAMP" >> "$SUMMARY_FILE"
echo "========================================" >> "$SUMMARY_FILE"

# Git status summary
echo -e "\n📊 Git Status:" >> "$SUMMARY_FILE"
git status --short >> "$SUMMARY_FILE" 2>&1

# Count modified files
MODIFIED_COUNT=$(git status --short | wc -l | tr -d ' ')
echo -e "\nTotal files changed: $MODIFIED_COUNT" >> "$SUMMARY_FILE"

# List modified files by type
echo -e "\n📁 Files by type:" >> "$SUMMARY_FILE"
git status --short | awk '{print $2}' | while read -r file; do
    echo "  - $file" >> "$SUMMARY_FILE"
done

# Check for new untracked files
UNTRACKED=$(git ls-files --others --exclude-standard)
if [ -n "$UNTRACKED" ]; then
    echo -e "\n🆕 New untracked files:" >> "$SUMMARY_FILE"
    echo "$UNTRACKED" | while read -r file; do
        echo "  - $file" >> "$SUMMARY_FILE"
    done
fi

# Summary of bash commands executed (if log exists)
COMMAND_COUNT="0"
BASH_LOG="$HOME/Documents/startup/openyap/openyap/.claude/logs/bash-commands.log"
if [ -f "$BASH_LOG" ]; then
    # Count today's commands
    TODAY=$(date -u +"%Y-%m-%d")
    COMMAND_COUNT=$(grep -c "^\[$TODAY" "$BASH_LOG" 2>/dev/null || echo "0")
    echo -e "\n💻 Bash commands executed today: $COMMAND_COUNT" >> "$SUMMARY_FILE"
fi

# Check for lint issues
LINT_FAILS="0"
LINT_LOG="$HOME/Documents/startup/openyap/openyap/.claude/logs/lint-results.log"
if [ -f "$LINT_LOG" ]; then
    TODAY=$(date -u +"%Y-%m-%d")
    LINT_FAILS=$(grep "^\[$TODAY.*FAIL:" "$LINT_LOG" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$LINT_FAILS" -gt 0 ]; then
        echo -e "\n⚠️  Files with lint issues: $LINT_FAILS" >> "$SUMMARY_FILE"
    fi
fi

# Safety warnings
WARNING_COUNT="0"
SAFETY_LOG="$HOME/Documents/startup/openyap/openyap/.claude/logs/safety-warnings.log"
if [ -f "$SAFETY_LOG" ]; then
    TODAY=$(date -u +"%Y-%m-%d")
    WARNING_COUNT=$(grep -c "^\[$TODAY" "$SAFETY_LOG" 2>/dev/null || echo "0")
    if [ "$WARNING_COUNT" -gt 0 ]; then
        echo -e "\n⚠️  Safety warnings triggered: $WARNING_COUNT" >> "$SUMMARY_FILE"
    fi
fi

# Create a JSON summary for programmatic access
JSON_SUMMARY="$HOME/Documents/startup/openyap/openyap/.claude/logs/session-summary.json"
JSON_ENTRY=$(jq -n \
    --arg ts "$TIMESTAMP" \
    --arg modified "$MODIFIED_COUNT" \
    --arg commands "$COMMAND_COUNT" \
    --arg lintFails "$LINT_FAILS" \
    --arg warnings "$WARNING_COUNT" \
    '{
        timestamp: $ts,
        filesModified: ($modified | tonumber),
        commandsExecuted: ($commands | tonumber),
        lintFailures: ($lintFails | tonumber),
        safetyWarnings: ($warnings | tonumber)
    }')

if [ -f "$JSON_SUMMARY" ]; then
    jq ". += [$JSON_ENTRY]" "$JSON_SUMMARY" > "$JSON_SUMMARY.tmp" && mv "$JSON_SUMMARY.tmp" "$JSON_SUMMARY"
else
    echo "[$JSON_ENTRY]" > "$JSON_SUMMARY"
fi

echo -e "\n========================================\n" >> "$SUMMARY_FILE"

# Also output summary to stderr for visibility
echo "📊 Session complete! Modified $MODIFIED_COUNT files, executed $COMMAND_COUNT commands." >&2

# Pass through the original input
echo "$TOOL_INPUT"