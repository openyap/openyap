import { useRouter } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "~/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({
  error,
  onRetry,
}: {
  error?: Error;
  onRetry: () => void;
}) {
  const router = useRouter();

  const handleRetry = () => {
    router.invalidate();
    onRetry();
  };

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="font-semibold">Something went wrong</h3>
      </div>
      <p className="text-center text-muted-foreground text-sm">
        {error?.message || "An unexpected error occurred"}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRetry}
        className="gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}

// Specific error boundaries for common failure points

export function ChatErrorBoundary({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error("Chat component error:", error, errorInfo);
      }}
      fallback={
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div>
            <h3 className="font-semibold">Chat unavailable</h3>
            <p className="text-muted-foreground text-sm">
              Please try again to continue chatting
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.invalidate()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function FileAttachmentErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error("File attachment error:", error, errorInfo);
      }}
      fallback={
        <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>File attachment unavailable</span>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function MessageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error("Message rendering error:", error, errorInfo);
      }}
      fallback={
        <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Message could not be displayed</span>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
