import { Effect, Logger as EffectLogger, LogLevel, pipe } from "effect";

function getModuleFromStack(): string {
  const stack = new Error().stack;
  if (!stack) return "unknown";

  const lines = stack.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("/src/") && !line.includes("lib/logger")) {
      const match = line.match(/\/src\/(.+?)\.tsx?/);
      if (match) {
        return match[1];
      }
    }
  }
  return "unknown";
}

const isBrowser = typeof window !== "undefined";

type LogFormatter = (timestamp: string, message: string) => string;

const getBrowserStyle = (level: LogLevel.LogLevel): string => {
  switch (level) {
    case LogLevel.Fatal:
      return "background: #dc2626; color: white; font-weight: bold; padding: 2px 4px; border-radius: 3px";
    case LogLevel.Error:
      return "color: #dc2626; font-weight: bold";
    case LogLevel.Warning:
      return "color: #d97706; font-weight: bold";
    case LogLevel.Info:
      return "color: #2563eb; font-weight: 500";
    case LogLevel.Debug:
      return "color: #6b7280; font-weight: normal";
    default:
      return "";
  }
};

const getNodeColor = (level: LogLevel.LogLevel): string => {
  switch (level) {
    case LogLevel.Fatal:
      return "\x1b[41m\x1b[37m\x1b[1m";
    case LogLevel.Error:
      return "\x1b[91m\x1b[1m";
    case LogLevel.Warning:
      return "\x1b[93m\x1b[1m";
    case LogLevel.Info:
      return "\x1b[94m";
    case LogLevel.Debug:
      return "\x1b[37m";
    default:
      return "";
  }
};

const getConsoleMethodName = (level: LogLevel.LogLevel): keyof Console => {
  switch (level) {
    case LogLevel.Fatal:
      return "error";
    case LogLevel.Error:
      return "error";
    case LogLevel.Warning:
      return "warn";
    case LogLevel.Info:
      return "info";
    case LogLevel.Debug:
      return "debug";
    default:
      return "log";
  }
};

const createBrowserFormatter =
  (_level: LogLevel.LogLevel): LogFormatter =>
  (timestamp: string, message: string) =>
    `%c${timestamp} ${message}`;

const createNodeFormatter =
  (level: LogLevel.LogLevel): LogFormatter =>
  (timestamp: string, message: string) => {
    const color = getNodeColor(level);
    const reset = "\x1b[0m";
    return `${color}${timestamp} ${message}${reset}`;
  };

const createFormatter = (level: LogLevel.LogLevel): LogFormatter =>
  isBrowser ? createBrowserFormatter(level) : createNodeFormatter(level);

const logToConsole = (
  level: LogLevel.LogLevel,
  formattedMessage: string,
  style?: string,
): void => {
  const methodName = getConsoleMethodName(level);

  switch (methodName) {
    case "error":
      style
        ? console.error(formattedMessage, style)
        : console.error(formattedMessage);
      break;
    case "warn":
      style
        ? console.warn(formattedMessage, style)
        : console.warn(formattedMessage);
      break;
    case "info":
      style
        ? console.info(formattedMessage, style)
        : console.info(formattedMessage);
      break;
    case "debug":
      style
        ? console.debug(formattedMessage, style)
        : console.debug(formattedMessage);
      break;
    default:
      style
        ? console.log(formattedMessage, style)
        : console.log(formattedMessage);
  }
};

const effectLogger = EffectLogger.make(({ logLevel, message }) => {
  const timestamp = new Date().toLocaleTimeString();
  const formatter = createFormatter(logLevel);
  const formattedMessage = formatter(timestamp, String(message));

  if (isBrowser) {
    const style = getBrowserStyle(logLevel);
    logToConsole(logLevel, formattedMessage, style);
  } else {
    logToConsole(logLevel, formattedMessage);
  }
});

const loggerLayer = EffectLogger.replace(
  EffectLogger.defaultLogger,
  effectLogger,
);

function runLog(effect: Effect.Effect<void, never, never>): void {
  Effect.runSync(pipe(effect, Effect.provide(loggerLayer)));
}

export const logger = {
  debug: (message: string): void => {
    const module = getModuleFromStack();
    runLog(Effect.logDebug(`[${module}] (DEBUG) ${message}`));
  },

  info: (message: string): void => {
    const module = getModuleFromStack();
    runLog(Effect.logInfo(`[${module}] (INFO) ${message}`));
  },

  warn: (message: string): void => {
    const module = getModuleFromStack();
    runLog(Effect.logWarning(`[${module}] (WARN) ${message}`));
  },

  error: (message: string): void => {
    const module = getModuleFromStack();
    runLog(Effect.logError(`[${module}] (ERROR) ${message}`));
  },

  fatal: (message: string): void => {
    const module = getModuleFromStack();
    runLog(Effect.logFatal(`[${module}] (FATAL) ${message}`));
  },
};
