import { Link } from "@tanstack/react-router";
import { Logo } from "~/components/logo";

export function NotFound() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <Logo size={48} className="mx-auto mb-8" />

        <h1 className="mb-4 font-mono text-6xl text-muted-foreground/60">
          404
        </h1>

        <p className="mb-8 text-muted-foreground">This page left chat.</p>

        <Link
          to="/"
          className="text-primary underline-offset-4 hover:underline"
        >
          Join back
        </Link>
      </div>
    </section>
  );
}
