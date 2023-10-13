import { FaasGatewayApiRequestMessage } from "@crowdstrike/foundry-js";
import { RRJobType } from "@/mock/schemas/rr-schemas";
import { createRRJobFunctionBody } from "@/mock/schemas/schemas";
import { MockFaasHandler } from "@/mock/faas/base";
import { ConstructorArgs } from "@/mock/sdk/bridge";
import { rapidResponseFunctions } from "@/lib/constants";

export class CreateJobHandler extends MockFaasHandler {
  constructor(args: ConstructorArgs) {
    super(args);

    this.functionId = rapidResponseFunctions.createJob.id;
    this.functionName = rapidResponseFunctions.createJob.name;
    this.requestPath = rapidResponseFunctions.createJob.path;
  }

  prepareResponse(message: FaasGatewayApiRequestMessage) {
    if (!("body" in message.payload)) {
      throw `CreateJobHandler received bad message: ${message.toString()}`;
    }

    const schema = createRRJobFunctionBody;

    const result = schema.safeParse(message.payload.body);

    if (!result.success) {
      return {
        resources: [
          {
            function_id: this.functionId,
            function_name: this.functionName,
            function_version: 1,
            payload: {
              body: null,
              errors: result.error.issues.map((i) => {
                return { message: i.message };
              }),
              status_code: 400,
            },
          },
        ],
      };
    } else {
      const existingJobIndex = this.db.jobs.findIndex(
        (job) => job.name === result.data.payload.body.name,
      );
      if (
        existingJobIndex > -1 &&
        this.db.jobs[existingJobIndex].draft === false
      ) {
        return {
          resources: [
            {
              function_id: this.functionId,
              function_name: this.functionName,
              function_version: 1,
              payload: {
                body: null,
                errors: [
                  {
                    field: "jobName",
                    message: `Job name "${result.data.payload.body.name}" already exists"`,
                    code: 102,
                  },
                ],
                status_code: 400,
              },
            },
          ],
        };
      }
      const [draft] = result.data.payload.params?.query?.draft ?? ["false"];
      const { ...rest } = result.data.payload.body;
      // Get ID if jobName already exists and draft status is true
      const id =
        existingJobIndex > -1
          ? this.db.jobs[existingJobIndex].id
          : (Math.random() + 1).toString(36).substring(7);
      const version = 0;
      const newJob: RRJobType = {
        id,
        version,
        draft: draft === "true",
        total_recurrences: 0,
        run_count: 0,
        host_count: 0,
        next_run: "2023-12-01T12:00",
        last_run: "",
        created_at: "2023-12-01T12:00",
        updated_at: "2023-12-01T12:00",
        deleted_at: "",
        notification_emails: rest.notifications,
        // The `...rest` params come from the USER
        ...rest,
      };
      if (existingJobIndex === -1) this.db.jobs.unshift(newJob);
      else if (
        existingJobIndex > -1 &&
        this.db.jobs[existingJobIndex].draft === true
      )
        this.db.jobs[existingJobIndex] = newJob;
      return {
        errors: [],
        resources: [
          {
            function_id: this.functionId,
            function_name: this.functionName,
            function_version: 1,
            payload: {
              body: { resource: "a_random_uid" },
              errors: [],
              status_code: 200,
            },
          },
        ],
      };
    }
  }
}
