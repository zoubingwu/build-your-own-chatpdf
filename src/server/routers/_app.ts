import { z } from "zod";
import { connect } from "@tidbcloud/serverless";
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
});

// export type definition of API
export type AppRouter = typeof appRouter;
