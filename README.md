# OpenYap

The best chat app. That is actually open.

## Getting Started

1. Install dependencies

```bash
  pnpm install
```

2. Create a `apps/web/.env` file based on [`apps/web/.env.example`](./apps/web/.env.example).

3. Run the development server:

```bash
  pnpm dev
```

The development server should now be running at [http://localhost:3000](http://localhost:3000).

## Development Tools

### Claude Code Hooks

This project includes comprehensive Claude Code hooks for enhanced development workflow automation. The hooks are configured in `.claude/settings.json` and provide:

- **Command Logging**: All bash commands are logged to `.claude/logs/`
- **Safety Checks**: Dangerous commands are blocked, warnings for protected branch operations
- **Auto-formatting**: Code is automatically formatted with Biome after edits
- **Lint Checks**: Automatic linting after file modifications
- **Discord Notifications**: Real-time updates on development progress
- **Session Summaries**: Comprehensive reports of changes made during each session

To customize hooks, edit the scripts in `.claude/hooks/` or modify `.claude/settings.json`.
