import { z } from "zod";
import { connect } from "@tidbcloud/serverless";
import { ollama } from "ollama-ai-provider";
import { generateText, streamText } from "ai";
import { procedure, router } from "../trpc";

export const appRouter = router({
  hello: procedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),

  testConnection: procedure
    .input(
      z.object({
        conn: z.string(),
      }),
    )
    .mutation(async (opts) => {
      const url = atob(opts.input.conn);
      const conn = connect({ url });

      try {
        const versionResult = (await conn.execute(
          "SELECT VERSION() as version;",
        )) as { version: string }[];

        return {
          success: true,
          data: versionResult[0].version,
          error: null,
        };
      } catch (e) {
        return {
          success: false,
          data: null,
          error: (e as Error).message,
        };
      }
    }),

  testLLM: procedure
    .input(
      z.object({
        prompt: z.string(),
      }),
    )
    .mutation(async function* (opts) {
      const result = await streamText({
        model: ollama("llama3.2"),
        prompt: opts.input.prompt,
      });

      for await (const chunk of result.textStream) {
        yield chunk;
      }
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
