import { tool } from "ai";
import { Effect } from "effect";
import { pipe } from "effect/Function";
import { evaluate, parse } from "mathjs";
import { z } from "zod";
import { UI_CONSTANTS } from "~/lib/constants";
import { logger } from "~/lib/logger";

type MathResult = {
  expression: string;
  result: string;
  isValid: boolean;
  error?: string;
};

export const mathEvaluation = tool({
  description:
    "Evaluate mathematical expressions (NOT equations). Only use for expressions that can be computed to a single numeric result.",
  parameters: z
    .object({
      expression: z
        .string()
        .min(1)
        .max(UI_CONSTANTS.TITLE_LIMITS.MAX_LENGTH)
        .describe(
          "A mathematical expression to evaluate. Examples: '2 + 2', 'sqrt(16)', 'sin(pi/2)', 'log(100)', '5*6-3'. Do NOT use for equations with '=' or unknowns like 'x'."
        ),
    })
    .strict(),
  execute: async ({ expression }): Promise<MathResult> => {
    logger.info(`Evaluating math expression: "${expression}"`);

    const evaluateEffect = Effect.tryPromise({
      try: async () => {
        const _parsed = parse(expression);

        const result = evaluate(expression);

        return {
          expression,
          result: String(result),
          isValid: true,
        };
      },
      catch: (err) => {
        const errorMessage = err instanceof Error ? err.message : String(err);

        let helpfulError = errorMessage;
        if (errorMessage.includes("assignment operator =")) {
          helpfulError =
            "Cannot evaluate equations with '='. Use mathEvaluation only for expressions that compute to a number (e.g., '3*7-1' instead of '3x+7=22').";
        } else if (errorMessage.includes("Undefined symbol")) {
          helpfulError = `${errorMessage}. Variables like 'x' cannot be evaluated. Use mathEvaluation only for numeric expressions.`;
        }

        return {
          expression,
          result: "",
          isValid: false,
          error: helpfulError,
        };
      },
    });

    const transformEffect = pipe(
      evaluateEffect,
      Effect.map((result: MathResult) => {
        if (result.result.length > UI_CONSTANTS.POLLING_INTERVALS.SLOW_UPDATE) {
          result.result = `${result.result.slice(0, UI_CONSTANTS.POLLING_INTERVALS.SLOW_UPDATE)}...`;
        }
        return result;
      })
    );

    return Effect.runPromise(transformEffect);
  },
});
