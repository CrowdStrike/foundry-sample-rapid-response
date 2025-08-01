import FalconApi, { LocalData } from "@crowdstrike/foundry-js";
import { ZodSafeParseResult } from "zod";

import { FAAS } from "@/lib/constants";
import { getUserData } from "@/lib/hooks/use-user-data";
import {
  CreateJobResponse,
  createJobResponseSchema,
} from "@/lib/validations/api-validation";
import {
  BuildQuerySchema,
  ChooseHostSchema,
  JobDetailsSchema,
  ScheduleSchema,
} from "@/lib/validations/form-validation";
import { asRFC3339, fromParts } from "@/lib/utils/datetime";

interface ParsedZodData {
  parsedJobDetailsData: ZodSafeParseResult<JobDetailsSchema>;
  parsedBuildQueryData: ZodSafeParseResult<BuildQuerySchema>;
  parsedHostSchemaData: ZodSafeParseResult<ChooseHostSchema>;
  parsedScheduleData: ZodSafeParseResult<ScheduleSchema>;
}

export interface CreateJobArgs {
  data: ParsedZodData;
  version?: number;
  id?: string;
  createdAt?: string;
}

function createJob(falcon: FalconApi<LocalData>) {
  return async ({
    data: {
      parsedJobDetailsData,
      parsedHostSchemaData,
      parsedBuildQueryData,
      parsedScheduleData,
    },
    id,
    version: jobVersion = 0,
    createdAt,
  }: CreateJobArgs): Promise<CreateJobResponse> => {
    try {
      if (
        parsedJobDetailsData.success &&
        parsedHostSchemaData.success &&
        parsedBuildQueryData.success &&
        parsedScheduleData.success
      ) {
        const data = {
          ...parsedJobDetailsData.data,
          ...parsedHostSchemaData.data,
          ...parsedBuildQueryData.data,
          ...parsedScheduleData.data,
        };
        const { user } = getUserData({ falcon });
        const { name, version, path } = FAAS.createJob;
        const createJob = falcon.cloudFunction({ name, version });
        const { jobName, jobDescription, ...rest } = data;

        let action = {};
        if (rest.jobType === "install") {
          action = {
            type: "installSoftware",
            command_switch: rest.cmdSwitch,
            file_name: rest.file?.name,
          };
        } else {
          action = {
            type: "removeFile",
            remove_file_name: rest.fileName,
            remove_file_path: rest.filePath,
          };
        }

        let schedule = null;
        if (
          rest.scheduleStrategy === "scheduleForLater" &&
          rest.startDate &&
          rest.startTime
        ) {
          const { timezone, startDate, startTime } = rest;

          // The date and time as entered by the user are considered
          // to be using that user's preferred timezone.
          const zoned = fromParts({
            date: startDate,
            time: startTime,
            timezone,
          });

          // We convert the start date/time from the user's timezone
          // into UTC. This is the value that we send to the API.
          const utc = zoned.withTimeZone("UTC");
          const utcStartDateTime = asRFC3339(utc);

          schedule = {
            start_date: utcStartDateTime,
          };
        }

        const body = {
          id,
          version: jobVersion,
          user_id: user.uuid,
          user_name: user.username,
          name: jobName,
          description: jobDescription ?? "",
          notifications: rest.peopleToNotify.map((option) => option.value),
          tags: null,
          action,
          run_now: false,
          schedule,
          target: {
            host_groups: rest.hostType === "hosts" ? null : rest.hostGroups,
            hosts: rest.hostType === "hosts" ? rest.hosts : null,
            offline_queueing: rest.isOfflineQueueing,
          },
        };

        if (id && createdAt) {
          (body as any).created_at = createdAt;
        }

        const result = await createJob.put({
          path,
          params: { query: { draft: [schedule === null ? "true" : "false"] } },
          body,
        });

        const safeResult = createJobResponseSchema.parse(result);

        return safeResult;
      } else {
        return {
          errors: [
            {
              field: null,
              code: 100,
              message: "One or more of the payload properties is invalid.",
            },
          ],
          status_code: 500,
        };
      }
    } catch (err: unknown) {
      return {
        errors: [
          {
            field: null,
            code: 100,
            message:
              err instanceof Error
                ? err.message
                : "An unknown error has happened. Try again.",
          },
        ],
        status_code: 500,
      };
    }
  };
}

export default createJob;
