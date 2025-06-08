import { env } from "~/env";

export const Route = createFileRoute({
  component: Index,
});

function Index() {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}
