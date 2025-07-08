#!/bin/bash

# Lint Check Hook
# Runs linting after file modifications

# Read the tool input from stdin
TOOL_INPUT=$(cat)

# Extract tool name and file path
TOOL_NAME=$(echo "$TOOL_INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.tool_input.file_path // ""')

# Track whether we should lint
SHOULD_LINT=false

# Check if this is a file edit operation
if [[ "$TOOL_NAME" =~ ^(Edit|MultiEdit|Write)$ ]] && [ -n "$FILE_PATH" ]; then
    # Check if it's a lintable file type
    if [[ "$FILE_PATH" =~ \.(js|jsx|ts|tsx|json)$ ]]; then
        SHOULD_LINT=true
    fi
fi

# Pass through the original input first
echo "$TOOL_INPUT"

# Run lint check after the tool executes (if needed)
if [ "$SHOULD_LINT" = true ]; then
    # Wait a moment for the file to be written
    sleep 0.2
    
    # Get the project root directory (where .git is located)
    PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$(pwd)")
    
    # Change to the project root
    cd "$PROJECT_ROOT" || exit
    
    # Run Biome lint check on the specific file
    echo "Running Biome lint check on $FILE_PATH..." >&2
    
    # Get relative path from project root for Biome
    RELATIVE_PATH=${FILE_PATH#"$PROJECT_ROOT/"}
    
    # Capture lint output
    LINT_OUTPUT=$(pnpm biome check "$RELATIVE_PATH" 2>&1)
    LINT_EXIT_CODE=$?
    
    # Log the result
    TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    LOG_FILE="$PROJECT_ROOT/.claude/logs/lint-results.log"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    if [ $LINT_EXIT_CODE -eq 0 ]; then
        echo "[$TIMESTAMP] PASS: $FILE_PATH" >> "$LOG_FILE"
        echo "✅ Lint check passed for $FILE_PATH" >&2
    else
        echo "[$TIMESTAMP] FAIL: $FILE_PATH" >> "$LOG_FILE"
        echo "[$TIMESTAMP] Output: $LINT_OUTPUT" >> "$LOG_FILE"
        echo "⚠️  Lint issues found in $FILE_PATH:" >&2
        echo "$LINT_OUTPUT" >&2
        
        # Also log to JSON for easier parsing
        JSON_LOG_FILE="$PROJECT_ROOT/.claude/logs/lint-issues.json"
        JSON_ENTRY=$(jq -n \
            --arg ts "$TIMESTAMP" \
            --arg file "$FILE_PATH" \
            --arg output "$LINT_OUTPUT" \
            '{timestamp: $ts, file: $file, issues: $output}')
        
        if [ -f "$JSON_LOG_FILE" ]; then
            jq ". += [$JSON_ENTRY]" "$JSON_LOG_FILE" > "$JSON_LOG_FILE.tmp" && mv "$JSON_LOG_FILE.tmp" "$JSON_LOG_FILE"
        else
            echo "[$JSON_ENTRY]" > "$JSON_LOG_FILE"
        fi
    fi
fi