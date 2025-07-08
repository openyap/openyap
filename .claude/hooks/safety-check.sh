#!/bin/bash

# Safety Check Hook
# Prevents execution of dangerous commands

# Read the tool input from stdin
TOOL_INPUT=$(cat)

# Extract command and tool name
COMMAND=$(echo "$TOOL_INPUT" | jq -r '.tool_input.command // ""')
TOOL_NAME=$(echo "$TOOL_INPUT" | jq -r '.tool_name // ""')

# Only check Bash commands
if [ "$TOOL_NAME" = "Bash" ]; then
    # Define dangerous patterns
    DANGEROUS_PATTERNS=(
        "rm -rf /"
        "rm -rf /*"
        "rm -rf ~"
        "rm -rf /home"
        "rm -rf /Users"
        "rm -rf /Applications"
        "rm -rf /System"
        "rm -rf /Library"
        "dd if=/dev/zero"
        "dd if=/dev/random"
        "dd of=/dev/"
        "mkfs."
        "format "
        "> /dev/"
        "chmod -R 777 /"
        "chmod 777 /"
        "chown -R root"
        "fork bomb"
        ":(){ :|:& };:"
        "curl.*|.*sh"
        "wget.*|.*sh"
        "echo.*>.*passwd"
        "echo.*>.*shadow"
        "/etc/passwd"
        "/etc/shadow"
        "pkill -9"
        "killall -9"
        "shutdown"
        "reboot"
        "halt"
        "poweroff"
    )
    
    # Check for dangerous patterns
    for pattern in "${DANGEROUS_PATTERNS[@]}"; do
        if [[ "$COMMAND" =~ $pattern ]]; then
            echo "BLOCKED: Dangerous command detected: $pattern" >&2
            echo "Command: $COMMAND" >&2
            exit 1
        fi
    done
    
    # Check for suspicious file operations in sensitive directories
    if [[ "$COMMAND" =~ (rm|mv|cp).*(/etc/|/var/|/usr/bin/|/usr/sbin/) ]]; then
        echo "WARNING: Operation on system directory detected!" >&2
        TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
        LOG_FILE="$HOME/Documents/startup/openyap/openyap/.claude/logs/safety-warnings.log"
        mkdir -p "$(dirname "$LOG_FILE")"
        echo "[$TIMESTAMP] System directory operation: $COMMAND" >> "$LOG_FILE"
    fi
    
    # Check for operations on protected branches
    if [[ "$COMMAND" =~ git\ (push|merge|rebase|reset|checkout).*\ (main|master) ]]; then
        echo "WARNING: Git operation on protected branch detected. Proceed with caution!" >&2
        # Log the warning
        TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
        LOG_FILE="$HOME/Documents/startup/openyap/openyap/.claude/logs/safety-warnings.log"
        mkdir -p "$(dirname "$LOG_FILE")"
        echo "[$TIMESTAMP] Git operation on protected branch: $COMMAND" >> "$LOG_FILE"
    fi
    
    # Check for sudo commands
    if [[ "$COMMAND" =~ ^sudo\ |\ sudo\  ]]; then
        echo "WARNING: Sudo command detected. This requires elevated privileges!" >&2
        TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
        LOG_FILE="$HOME/Documents/startup/openyap/openyap/.claude/logs/safety-warnings.log"
        echo "[$TIMESTAMP] Sudo command: $COMMAND" >> "$LOG_FILE"
    fi
    
    # Check for system-wide installations
    if [[ "$COMMAND" =~ npm\ install\ -g|pip\ install\ --global|brew\ install ]]; then
        echo "INFO: System-wide installation detected" >&2
        TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
        LOG_FILE="$HOME/Documents/startup/openyap/openyap/.claude/logs/safety-warnings.log"
        echo "[$TIMESTAMP] System installation: $COMMAND" >> "$LOG_FILE"
    fi
    
    # Check for network operations that might be risky
    if [[ "$COMMAND" =~ curl.*-o.*\||wget.*-O.*\||nc\ -l ]]; then
        echo "WARNING: Potentially risky network operation detected!" >&2
        TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
        LOG_FILE="$HOME/Documents/startup/openyap/openyap/.claude/logs/safety-warnings.log"
        echo "[$TIMESTAMP] Network operation: $COMMAND" >> "$LOG_FILE"
    fi
    
    # Validate command exists before execution
    COMMAND_NAME=$(echo "$COMMAND" | awk '{print $1}')
    if [ -n "$COMMAND_NAME" ] && ! command -v "$COMMAND_NAME" >/dev/null 2>&1; then
        echo "WARNING: Command '$COMMAND_NAME' not found in PATH" >&2
    fi
fi

# Pass through the original input
echo "$TOOL_INPUT"