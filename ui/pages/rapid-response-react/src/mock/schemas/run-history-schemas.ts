import { z } from "zod";

export const RunHistory = z.object({
  id: z.string(),
  job_id: z.string(),
  name: z.string(),
  duration: z.string(),
  output_1: z.string().optional(),
  output_2: z.string().optional(),
  hosts: z.array(z.string()),
  numHosts: z.number(),
  receivedFiles: z.number(),
  run_date: z.string(),
  endDate: z.string(),
  status: z.string(),
});

export type RunHistoryType = z.infer<typeof RunHistory>;

export const getRunHistoryFunctionBody = z.object({
  payload: z.object({
    body: z.object({
      payload: z.object({
        params: z
          .object({
            query: z
              .object({
                fieldName: z
                  .union([
                    z.literal("name"),
                    z.literal("run_date"),
                    z.literal("status"),
                    z.literal("duration"),
                    z.literal("hosts"),
                    z.literal("output_1"),
                    z.literal("output_2"),
                  ])
                  .optional(),
                direction: z
                  .union([z.literal("ASC"), z.literal("DESC")])
                  .optional(),
                limit: z
                  .union([
                    z.array(z.literal("5")),
                    z.array(z.literal("10")),
                    z.array(z.literal("15")),
                    z.array(z.literal("20")),
                  ])
                  .optional(),
                offset: z.array(z.string()).optional(),
                prev: z.array(z.string()).optional(),
                next: z.array(z.string()).optional(),
                id: z.array(z.string()).optional(),
                filter: z.array(z.string()).optional(),
                exact_name: z.array(z.string()).optional(),
              })
              .optional(),
          })
          .optional(),
      }),
    }),
  }),
});
