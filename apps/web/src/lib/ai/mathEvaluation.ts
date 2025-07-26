import { tool } from "ai";
import { Effect } from "effect";
import { evaluate } from "mathjs";
import { z } from "zod";
import { UI_CONSTANTS } from "~/lib/constants";
import { logger } from "~/lib/logger";

type MathResult = {
  expression: string;
  result: string;
  isValid: boolean;
  error?: string;
};

const MAX_RESULT_LENGTH = 1000;

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
          "A mathematical expression to evaluate. Examples: '2 + 2', 'sqrt(16)', 'sin(pi/2)', 'log(100)', '5*6-3'. Do NOT use for equations with '=' or unknowns like 'x'.",
        ),
    })
    .strict(),
  execute: async ({ expression }): Promise<MathResult> => {
    logger.info(`Evaluating math expression: "${expression}"`);

    return Effect.runSync(
      Effect.try({
        try: () => {
          const result = evaluate(expression);
          let resultStr = String(result);

          if (resultStr.length > MAX_RESULT_LENGTH) {
            resultStr = `${resultStr.slice(0, MAX_RESULT_LENGTH)}...`;
          }

          logger.info(`Math evaluation result: "${expression}" = ${resultStr}`);

          return {
            expression,
            result: resultStr,
            isValid: true,
          };
        },
        catch: (err) => {
          const errorMessage = err instanceof Error ? err.message : String(err);

          let helpfulError = errorMessage;
          if (errorMessage.includes("assignment operator =")) {
            helpfulError =
              "Cannot evaluate equations with '='. Use mathEvaluation only for expressions that compute to a number (e.g., '3*7-1' instead of '3x+7=22').";
            logger.warn(
              `Math evaluation failed - equation detected: "${expression}"`,
            );
          } else if (errorMessage.includes("Undefined symbol")) {
            helpfulError = `${errorMessage}. Variables like 'x' cannot be evaluated. Use mathEvaluation only for numeric expressions.`;
            logger.warn(
              `Math evaluation failed - undefined symbol: "${expression}"`,
            );
          } else {
            logger.error(
              `Math evaluation failed: "${expression}" - ${errorMessage}`,
            );
          }

          return {
            expression,
            result: "",
            isValid: false,
            error: helpfulError,
          };
        },
      }),
    );
  },
});
