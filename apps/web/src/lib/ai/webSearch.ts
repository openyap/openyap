import { tool } from "ai";
import { Effect } from "effect";
import { pipe } from "effect/Function";
import { z } from "zod";
import { UI_CONSTANTS } from "~/lib/constants";
import { exa } from "~/lib/exa";
import { logger } from "~/lib/logger";

const DEFAULT_NUM_RESULTS = 3;
const DEFAULT_LIVECRAWL = "always" as const;

type SearchResult = {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
};

export const webSearch = tool({
  description: "Search the web for up-to-date information",
  parameters: z
    .object({
      query: z
        .string()
        .min(1)
        .max(UI_CONSTANTS.TITLE_LIMITS.MAX_LENGTH)
        .describe("The search query"),
    })
    .strict(),
  execute: async ({ query }): Promise<SearchResult[]> => {
    logger.info(`Executing web search: "${query}"`);

    const searchEffect = Effect.tryPromise({
      try: () =>
        exa.searchAndContents(query, {
          livecrawl: DEFAULT_LIVECRAWL,
          numResults: DEFAULT_NUM_RESULTS,
        }),
      catch: (err) => new Error(String(err)),
    });

    const transformEffect = pipe(
      searchEffect,
      Effect.map(({ results }) =>
        results.map<SearchResult>((r) => ({
          title: r.title ?? "",
          url: r.url ?? "",
          content: (r.text ?? "").slice(
            0,
            UI_CONSTANTS.POLLING_INTERVALS.SLOW_UPDATE,
          ),
          publishedDate: r.publishedDate ?? undefined,
        })),
      ),
    );

    return Effect.runPromise(transformEffect);
  },
});
