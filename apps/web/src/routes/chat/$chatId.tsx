import { convexQuery } from "@convex-dev/react-query";
import { notFound } from "@tanstack/react-router";
import type { Id } from "convex/_generated/dataModel";
import { ChatView } from "~/components/chat/chat-view";
import { NotFound } from "~/components/not-found";
import { api } from "~/lib/db/server";
import { isConvexId } from "~/lib/db/utils";

export const Route = createFileRoute({
  loader: async ({ params, context }) => {
    if (!isConvexId(params.chatId)) {
      return notFound();
    }

    const chatExists = await context.queryClient.fetchQuery(
      convexQuery(api.functions.chat.checkChatExists, {
        chatId: params.chatId as Id<"chat">,
      }),
    );

    if (!chatExists) {
      return notFound();
    }

    return { chatExists };
  },
  component: ChatView,
  notFoundComponent: () => <NotFound />,
});
