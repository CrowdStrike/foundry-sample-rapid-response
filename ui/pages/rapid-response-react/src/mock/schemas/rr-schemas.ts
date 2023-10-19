import { z } from "zod";

const actionInstallSoftwareSchema = z.object({
  type: z.literal("installSoftware"),
  install_file_path: z.string().optional(),
  command_switch: z.string().optional(),
  file_name: z.string(),
});

const actionremoveFileSchema = z.object({
  type: z.literal("removeFile"),
  remove_file_name: z.string(),
  remove_file_path: z.string(),
});

export const RRCreateJobPayload = z.object({
  user_id: z.string(),
  user_name: z.string(),

  name: z.string(),
  description: z.string(),
  notifications: z.union([z.null(), z.array(z.string())]),
  tags: z.union([z.null(), z.array(z.string())]),

  action: z.union([actionInstallSoftwareSchema, actionremoveFileSchema]),

  run_now: z.boolean(),
  schedule: z.union([
    z.object({
      start_date: z.string(),
    }),
    z.null(),
  ]),

  target: z.object({
    host_groups: z.union([z.null(), z.array(z.string())]),
    hosts: z.union([z.null(), z.array(z.string())]),
    offline_queueing: z.boolean(),
  }),
});

/**
 * Status property is missing.
 */
export const RRJob = z.object({
  user_id: z.string(),
  user_name: z.string(),
  version: z.number(),

  id: z.string(),
  name: z.string(),
  description: z.string(),
  notification_emails: z.union([z.null(), z.array(z.string())]).optional(),
  notifications: z.union([z.null(), z.array(z.string())]),
  draft: z.boolean(),
  tags: z.union([z.null(), z.array(z.string())]),
  host_count: z.number(),
  run_count: z.number(),
  total_recurrences: z.number(),

  action: z.union([actionInstallSoftwareSchema, actionremoveFileSchema]),

  schedule: z.union([
    z.object({
      start_date: z.string(),
    }),
    z.null(),
  ]),

  target: z.object({
    host_groups: z.union([z.null(), z.array(z.string())]),
    hosts: z.union([z.null(), z.array(z.string())]),
    offline_queueing: z.boolean(),
  }),

  run_now: z.boolean(),
  next_run: z.string(),
  last_run: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string(),
});

export type RRCreatePayloadType = z.infer<typeof RRCreateJobPayload>;
export type RRJobType = z.infer<typeof RRJob>;
