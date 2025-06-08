import { useSuspenseQuery } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "~/lib/auth/client";

export const Route = createFileRoute({
  loader: async ({ context: { queryClient } }) => {
    const session = await queryClient.ensureQueryData(sessionQueryOptions);
    if (!session) throw redirect({ to: "/" });
  },
  component: Protected,
});

function Protected() {
  const { data: session } = useSuspenseQuery(sessionQueryOptions);

  return (
    <div>
      <h1>Protected</h1>
      <p>User: {session?.user?.name}</p>
    </div>
  );
}