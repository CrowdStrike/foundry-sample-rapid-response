import { z } from "zod";

import { fileToInstallSchema } from "@/lib/validations/api-validation";

/**
 * Build Query Step schemas
 */
const jobTypeInstallSchema = z
  .object({
    jobType: z.literal("install"),
    file: fileToInstallSchema.optional(),
    fileName: z.string().optional(),
    filePath: z.string().optional(),
    cmdSwitch: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.jobType === "install") {
        return data.file !== undefined;
      }
      return true;
    },
    { message: "You should provide a file.", path: ["file"] },
  );

const jobTypeRemoveSchema = z.object({
  jobType: z.literal("remove"),
  file: fileToInstallSchema.optional(),
  filePath: z.string().min(1, { message: "Enter a valid file path" }),
  fileName: z.string().min(1, { message: "Enter a valid file name" }),
  cmdSwitch: z.string().optional(),
});

export const jobTypeSchema = z.union([
  jobTypeInstallSchema,
  jobTypeRemoveSchema,
]);

/**
 * Choose targets hosts Step schemas
 */
const individualHostsSchema = z.object({
  hostType: z.literal("hosts"),
  hostGroups: z.array(z.string()),
  hosts: z
    .array(z.string())
    .nonempty({ message: "Select one or more host(s)" }),
  isOfflineQueueing: z.boolean(),
});

const hostGroupsSchema = z.object({
  hostType: z.literal("hostGroups"),
  hosts: z.array(z.string()),
  hostGroups: z
    .array(z.string())
    .nonempty({ message: "Select one or more host group(s)" }),
  isOfflineQueueing: z.boolean(),
});

export const chooseHostSchema = z.union([
  individualHostsSchema,
  hostGroupsSchema,
]);

/**
 * Job Details Step schemas
 */
export const jobDetailsSchema = z.object({
  // TODO: jobName must also be UNIQUE. That requires talking to an API!
  id: z.string().optional(),
  jobName: z.string().min(1, "Enter a job name"),
  jobDescription: z.string().optional(),
  peopleToNotify: z.array(z.object({ value: z.string(), label: z.string() })),
});

/**
 * Date Schema -> YYYY-MM-DD
 */
const dateSchema = (errorMessage: string) => {
  return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, errorMessage);
};

/**
 * Time Schema -> HH:MM
 */
const timeSchema = (errorMessage: string) => {
  return z.string().regex(/^\d{2}:\d{2}$/, errorMessage);
};

/**
 * Schedule Step schema
 */
export const noScheduleSchema = z.object({
  scheduleStrategy: z.literal("never"),
  startDate: z.string().optional(),
  startTime: z.string().optional(),
  timezone: z.string().optional(),
});

export const scheduleSchema = z.object({
  scheduleStrategy: z.literal("scheduleForLater"),
  startDate: dateSchema("Select a start date"),
  startTime: timeSchema("Select a start time"),
  timezone: z.string().optional().default("UTC"),
});

export const scheduledSchema = z.union([scheduleSchema, noScheduleSchema]);

/**
 * Types for Schemas step
 */
export type BuildQuerySchema = z.infer<typeof jobTypeSchema>;
export type ChooseHostSchema = z.infer<typeof chooseHostSchema>;
export type JobDetailsSchema = z.infer<typeof jobDetailsSchema>;
export type ScheduleSchema = z.infer<typeof scheduledSchema>;
export type AllSteps = BuildQuerySchema &
  ChooseHostSchema &
  JobDetailsSchema &
  ScheduleSchema;
