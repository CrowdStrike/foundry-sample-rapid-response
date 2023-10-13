import { z } from "zod";

const AuditLog = z.object({
  job_name: z.string(),
  modified_at: z.string(),
  version: z.number(),
  modified_by: z.string(),
  action: z.string(),
  id: z.string(),
  job_id: z.string(),
});

export type AuditLogType = z.infer<typeof AuditLog>;

export const getAuditLogFunctionBody = z.object({
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
                    z.literal("date_modified"),
                    z.literal("version"),
                    z.literal("modified_by"),
                    z.literal("action_taken"),
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
                page: z.number().optional(),
                id: z.array(z.string()).optional(),
                filter: z.array(z.string()).optional(),
              })
              .optional(),
          })
          .optional(),
      }),
    }),
  }),
});
