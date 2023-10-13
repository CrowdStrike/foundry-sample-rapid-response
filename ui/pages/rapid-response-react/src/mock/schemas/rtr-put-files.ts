import { z } from "zod";

export const rTRPutFilesSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  comments_for_audit_log: z.string().optional(),
  file_type: z.string(),
  platform: z.array(z.string()),
  size: z.number(),
  created_by: z.string(),
  created_by_uuid: z.string(),
  created_timestamp: z.string(),
  modified_by: z.string(),
  modified_timestamp: z.string(),
  sha256: z.string(),
  permission_type: z.string(),
  run_attempt_count: z.number(),
  run_success_count: z.number(),
  share_with_workflow: z.boolean(),
  workflow_is_disruptive: z.boolean(),
});

export type RTRPutFilesType = z.infer<typeof rTRPutFilesSchema>;
