import { z } from "zod";

import { RRCreateJobPayload, RRJob } from "@/mock/schemas/rr-schemas";

const jobPayloadCreation = RRCreateJobPayload;
const job = RRJob;

export type JobPayload = z.infer<typeof jobPayloadCreation>;
export type Job = z.infer<typeof job>;

export const generalPostMessage = z.object({
  method: z.string(),
  payload: z.object({
    body: z.object({
      function_id: z.string().optional(),
      function_name: z.string().optional(),
      payload: z.object({
        path: z.string(),
      }),
    }),
  }),
});

export const createRRJobFunctionBody = z.object({
  function_id: z.string().optional(),
  function_name: z.string().optional(),
  function_version: z.number(),
  payload: z.object({
    params: z
      .object({
        query: z
          .object({
            draft: z.array(z.union([z.literal("true"), z.literal("false")])),
          })
          .optional(),
      })
      .optional(),
    body: RRCreateJobPayload,
  }),
});

export const getJobsFunctionBody = z.object({
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
                    z.literal("description"),
                    z.literal("last_run_date"),
                    z.literal("next_run_date"),
                    z.literal("hosts"),
                    z.literal("last_modified"),
                    z.literal("draft"),
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
              })
              .optional(),
          })
          .optional(),
      }),
    }),
  }),
});

export const getJobDetailFunctionBody = z.object({
  payload: z.object({
    body: z.object({
      payload: z.object({
        params: z.object({
          query: z.object({
            id: z.array(z.string()),
          }),
        }),
      }),
    }),
  }),
});
