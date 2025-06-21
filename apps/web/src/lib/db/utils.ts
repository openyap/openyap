import type { Id, TableNames } from "convex/_generated/dataModel";
import type { SystemTableNames } from "convex/server";

export function isConvexId<T extends TableNames | SystemTableNames>(
  id: string | undefined,
): id is Id<T> {
  return typeof id === "string" && /^[a-z0-9]{32}$/.test(id);
}
