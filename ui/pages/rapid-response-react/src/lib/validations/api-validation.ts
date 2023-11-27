import { z } from "zod";

/**
 * Falcon call to get HostGroups
 */
export const postAggregatesDevicesGetV1Schema = z.object({
  errors: z.array(z.object({}).passthrough()),
  resources: z.array(
    z.object({
      name: z.string(),
      buckets: z.array(
        z.object({
          label: z.string(),
          count: z.number(),
        }),
      ),
    }),
  ),
});

export type PostAggregatesDevicesGetV1SchemaType = z.infer<
  typeof postAggregatesDevicesGetV1Schema
>;

/**
 * Falcon call to get HostGroups
 */
export const getEntitiesGroupsV1Schema = z.object({
  errors: z.array(z.object({}).passthrough()),
  resources: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
});

export type GetEntitiesGroupsV1SchemaType = z.infer<
  typeof getEntitiesGroupsV1Schema
>;

/**
 * Falcon call to get users data
 */
export const getQueriesUsersV1Schema = z.object({
  errors: z.array(z.object({}).passthrough()).optional(),
  resources: z.array(z.string()),
});

export const postEntitiesUsersGetV1Schema = z.object({
  errors: z.array(z.object({}).passthrough()).nullable().default([]),
  resources: z.array(
    z.object({
      uuid: z.string(),
      cid: z.string(),
      uid: z.string(),
      first_name: z.string(),
      last_name: z.string(),
      created_at: z.string(),
    }),
  ),
});

export const jobDetailsDataSchema = z.object({
  user: z.object({
    uuid: z.string(),
    username: z.string(),
  }),
  users: z.array(z.string()),
});

export const getQueriesDevicesV2Schema = z.object({
  resources: z.array(z.string()),
});

export const postEntitiesDevicesV2Schema = z.object({
  errors: z.array(z.object({}).passthrough()).nullable().default([]),
  resources: z.array(
    z.object({
      device_id: z.string(),
      hostname: z.string().optional().default("unknown-hostname"), // In the data we got back, we sometimes endup with hostname that are undefined
    }),
  ),
});

export type PostEntitiesDevicesV2SchemaType = z.infer<
  typeof postEntitiesDevicesV2Schema
>;

/**
 * Host Schemas
 */
const hostsEntitiesSchema = z.array(
  z.object({
    device_id: z.string(),
    hostname: z.string().optional().default("unknown-hostname"), // In the data we got back, we sometimes endup with hostname that are undefined,
  }),
);

export type HostsEntitiesSchema = z.infer<typeof hostsEntitiesSchema>;

const hostGroupsEntitiesSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
  }),
);

export type HostGroupEntitiesSchema = z.infer<typeof hostGroupsEntitiesSchema>;

const hostGroupsAggregatesSchema = z.array(
  z.object({
    name: z.string(),
    buckets: z.array(
      z.object({
        label: z.string(),
        count: z.number(),
      }),
    ),
  }),
);

export type HostGroupAggregatesSchema = z.infer<
  typeof hostGroupsAggregatesSchema
>;

export const hostsDataSchema = z.object({
  hostsEntities: hostsEntitiesSchema,
  hostGroupsEntities: hostGroupsEntitiesSchema,
  hostGroupsAggregates: hostGroupsAggregatesSchema,
});

export type HostsDataSchema = z.infer<typeof hostsDataSchema>;

/**
 * User schemas
 */
export const userSchema = z.object({
  user: z.object({
    uuid: z.string(),
    username: z.string(),
  }),
  users: z.array(z.string()),
});

export const simpleUserSchema = z.object({
  uuid: z.string(),
  username: z.string(),
});

export type UserData = z.infer<typeof userSchema>;

const actionInstallSoftwareSchema = z.object({
  type: z.literal("installSoftware"),
  command_switch: z.string(),
  file_name: z.string(),
});

const actionremoveFileSchema = z.object({
  type: z.literal("removeFile"),
  remove_file_name: z.string(),
  remove_file_path: z.string(),
});

export const JobSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  user_name: z.string(),
  version: z.number(),
  name: z.string(),
  description: z.string().optional(),
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
      start_date: z.string().optional().default(""),
    }),
    z.null(),
  ]),

  target: z.object({
    host_groups: z.union([z.null(), z.array(z.string())]),
    hosts: z.union([z.null(), z.array(z.string())]),
    offline_queueing: z.boolean(),
  }),

  run_now: z.boolean(),
  next_run: z.string().default(""),
  last_run: z.string().default(""),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().default(""),
});

export type Job = z.infer<typeof JobSchema>;

export const MetaSchema = z.object({
  total: z.number().default(0),
  limit: z.number().default(0),
  count: z.number().default(0),
  next: z.string().default(""),
  prev: z.string().default(""),
  offset: z.string().default(""),
  page: z.number().default(1),
});

export const allJobsDataSchema = z.object({
  body: z.object({
    resources: z
      .array(JobSchema)
      .nullable()
      .transform((val) => val ?? []),
    meta: MetaSchema,
  }),
});

export const RunHistorySchema = z.object({
  id: z.string(),
  job_id: z.string(),
  execution_id: z.string(),
  name: z.string(),
  duration: z.string(),
  hosts: z.array(z.string()),
  numHosts: z.number(),
  receivedFiles: z.number(),
  run_date: z.string(),
  endDate: z.string(),
  status: z.string(),
});

export type RunHistory = z.infer<typeof RunHistorySchema>;

export const runHistoryDataSchema = z.object({
  body: z.object({
    resources: z
      .array(RunHistorySchema)
      .nullable()
      .transform((val) => val ?? []),
    meta: MetaSchema,
  }),
});

export const AuditLogSchema = z.object({
  action: z.string(),
  id: z.string(),
  job_id: z.string(),
  job_name: z.string(),
  modified_at: z.string(),
  modified_by: z.string(),
  version: z.number(),
});

export type AuditLogType = z.infer<typeof AuditLogSchema>;

export const auditLogDataSchema = z.object({
  body: z.object({
    resources: z
      .array(AuditLogSchema)
      .nullable()
      .transform((val) => val ?? []),
    meta: MetaSchema,
  }),
});

export const jobDataSchema = z.object({
  body: z.object({
    resource: JobSchema,
  }),
});

export const historyJobsAuditLogSchema = z.object({
  job: jobDataSchema,
  history: runHistoryDataSchema,
  auditLogs: auditLogDataSchema,
});

export type HistoryJobsAuditLogSchema = z.infer<
  typeof historyJobsAuditLogSchema
>;

/**
 * Data we got back from uploadFile Modal from foundry-js SDK
 */
export const fileToInstallSchema = z.object({
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
export const resourcesFilesToInstallSchema = z.array(fileToInstallSchema);
export const putFilesGetSchema = z.object({
  errors: z
    .array(
      z.object({
        code: z.number().optional(),
        id: z.string().optional(),
        message: z.string(),
      }),
    )
    .optional(),
  resources: resourcesFilesToInstallSchema,
});

export const filesSchema = z.object({
  files: resourcesFilesToInstallSchema,
});

export type FilesSchema = z.infer<typeof filesSchema>;
export type FileToInstall = z.infer<typeof fileToInstallSchema>;

/**
 * Response we get back when interacting with the createJob
 * FaaS function
 */
export const createJobErrorResponseSchema = z.object({
  field: z.string().nullable().default(null),
  code: z.number(),
  message: z.string(),
});

export type CreateJobError = z.infer<typeof createJobErrorResponseSchema>;

/**
 * Many properties are present here but we just need errors handling ones.
 */
export const createJobResponseSchema = z.object({
  errors: z.array(createJobErrorResponseSchema),
  status_code: z.number(),
});

export type CreateJobResponse = z.infer<typeof createJobResponseSchema>;

export const editJobSchema = z.object({
  job: jobDataSchema,
  uploadedFiles: putFilesGetSchema,
  files: putFilesGetSchema,
});

export type EditJobSchema = z.infer<typeof editJobSchema>;
export type AllJobsDataSchema = z.infer<typeof allJobsDataSchema>;
export type JobDetailsDataSchema = z.infer<typeof jobDetailsDataSchema>;
export type AuditLogDataSchema = z.infer<typeof auditLogDataSchema>;
export type RunHistoryDataSchema = z.infer<typeof runHistoryDataSchema>;

export type AllSchemas =
  | FilesSchema
  | AllJobsDataSchema
  | EditJobSchema
  | JobDetailsDataSchema
  | AuditLogDataSchema
  | RunHistoryDataSchema
  | HistoryJobsAuditLogSchema;
