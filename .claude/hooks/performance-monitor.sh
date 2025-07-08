#!/bin/bash

# Performance Monitor Hook
# Tracks command execution time and system resource usage

PERF_LOG="$HOME/Documents/startup/openyap/openyap/.claude/logs/performance.log"
PERF_JSON="$HOME/Documents/startup/openyap/openyap/.claude/logs/performance.json"

# Ensure log directory exists
mkdir -p "$(dirname "$PERF_LOG")"

# Read the tool input from stdin
TOOL_INPUT=$(cat)

# Extract tool info
TOOL_NAME=$(echo "$TOOL_INPUT" | jq -r '.tool_name // ""')
COMMAND=$(echo "$TOOL_INPUT" | jq -r '.tool_input.command // ""')
FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.tool_input.file_path // ""')

# Get system info before execution
TIMESTAMP_START=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
CPU_BEFORE=$(ps -o %cpu= -p $$ 2>/dev/null || echo "0")
MEMORY_BEFORE=$(ps -o %mem= -p $$ 2>/dev/null || echo "0")

# Pass through the original input
echo "$TOOL_INPUT"

# Performance tracking for different tool types
case "$TOOL_NAME" in
    "Bash")
        # Track bash command performance
        if [ -n "$COMMAND" ]; then
            # Estimate complexity based on command
            COMPLEXITY="low"
            if [[ "$COMMAND" =~ (npm|pnpm|yarn|pip|brew|git|docker) ]]; then
                COMPLEXITY="medium"
            fi
            if [[ "$COMMAND" =~ (build|compile|test|deploy|install) ]]; then
                COMPLEXITY="high"
            fi
            
            # Log command performance metadata
            JSON_ENTRY=$(jq -n \
                --arg ts "$TIMESTAMP_START" \
                --arg tool "$TOOL_NAME" \
                --arg cmd "$COMMAND" \
                --arg complexity "$COMPLEXITY" \
                --arg cpu "$CPU_BEFORE" \
                --arg mem "$MEMORY_BEFORE" \
                '{
                    timestamp: $ts,
                    tool: $tool,
                    command: $cmd,
                    complexity: $complexity,
                    cpu_before: ($cpu | tonumber),
                    memory_before: ($mem | tonumber)
                }')
        fi
        ;;
    "Edit"|"MultiEdit"|"Write")
        # Track file operation performance
        if [ -n "$FILE_PATH" ]; then
            FILE_SIZE="0"
            if [ -f "$FILE_PATH" ]; then
                FILE_SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH" 2>/dev/null || echo "0")
            fi
            
            # Estimate complexity based on file size and type
            COMPLEXITY="low"
            if [ "$FILE_SIZE" -gt 10000 ]; then
                COMPLEXITY="medium"
            fi
            if [ "$FILE_SIZE" -gt 100000 ]; then
                COMPLEXITY="high"
            fi
            
            # Increase complexity for certain file types
            if [[ "$FILE_PATH" =~ \.(tsx?|jsx?)$ ]]; then
                COMPLEXITY="medium"
            fi
            
            JSON_ENTRY=$(jq -n \
                --arg ts "$TIMESTAMP_START" \
                --arg tool "$TOOL_NAME" \
                --arg file "$FILE_PATH" \
                --arg size "$FILE_SIZE" \
                --arg complexity "$COMPLEXITY" \
                --arg cpu "$CPU_BEFORE" \
                --arg mem "$MEMORY_BEFORE" \
                '{
                    timestamp: $ts,
                    tool: $tool,
                    file: $file,
                    file_size: ($size | tonumber),
                    complexity: $complexity,
                    cpu_before: ($cpu | tonumber),
                    memory_before: ($mem | tonumber)
                }')
        fi
        ;;
    "Grep"|"Glob"|"Read")
        # Track search/read performance
        COMPLEXITY="low"
        if [ "$TOOL_NAME" = "Grep" ]; then
            COMPLEXITY="medium"  # Grep can be expensive
        fi
        
        JSON_ENTRY=$(jq -n \
            --arg ts "$TIMESTAMP_START" \
            --arg tool "$TOOL_NAME" \
            --arg complexity "$COMPLEXITY" \
            --arg cpu "$CPU_BEFORE" \
            --arg mem "$MEMORY_BEFORE" \
            '{
                timestamp: $ts,
                tool: $tool,
                complexity: $complexity,
                cpu_before: ($cpu | tonumber),
                memory_before: ($mem | tonumber)
            }')
        ;;
    *)
        # Generic tool tracking
        JSON_ENTRY=$(jq -n \
            --arg ts "$TIMESTAMP_START" \
            --arg tool "$TOOL_NAME" \
            --arg cpu "$CPU_BEFORE" \
            --arg mem "$MEMORY_BEFORE" \
            '{
                timestamp: $ts,
                tool: $tool,
                complexity: "unknown",
                cpu_before: ($cpu | tonumber),
                memory_before: ($mem | tonumber)
            }')
        ;;
esac

# Append to JSON log if we have an entry
if [ -n "$JSON_ENTRY" ]; then
    if [ -f "$PERF_JSON" ]; then
        jq ". += [$JSON_ENTRY]" "$PERF_JSON" > "$PERF_JSON.tmp" && mv "$PERF_JSON.tmp" "$PERF_JSON"
    else
        echo "[$JSON_ENTRY]" > "$PERF_JSON"
    fi
    
    # Also log to text file for easy reading
    echo "[$TIMESTAMP_START] Tool: $TOOL_NAME" >> "$PERF_LOG"
fi

# Weekly performance summary (run on first execution of each week)
WEEK_FILE="$HOME/Documents/startup/openyap/openyap/.claude/logs/last-summary-week"
CURRENT_WEEK=$(date +%Y%U)

if [ ! -f "$WEEK_FILE" ] || [ "$(cat "$WEEK_FILE" 2>/dev/null)" != "$CURRENT_WEEK" ]; then
    echo "$CURRENT_WEEK" > "$WEEK_FILE"
    
    # Generate weekly summary
    if [ -f "$PERF_JSON" ]; then
        WEEKLY_SUMMARY="$HOME/Documents/startup/openyap/openyap/.claude/logs/weekly-performance.log"
        TOTAL_OPERATIONS=$(jq 'length' "$PERF_JSON" 2>/dev/null || echo "0")
        HIGH_COMPLEXITY=$(jq '[.[] | select(.complexity == "high")] | length' "$PERF_JSON" 2>/dev/null || echo "0")
        
        echo "=== Weekly Performance Summary (Week $CURRENT_WEEK) ===" >> "$WEEKLY_SUMMARY"
        echo "Total operations: $TOTAL_OPERATIONS" >> "$WEEKLY_SUMMARY"
        echo "High complexity operations: $HIGH_COMPLEXITY" >> "$WEEKLY_SUMMARY"
        echo "" >> "$WEEKLY_SUMMARY"
    fi
fi