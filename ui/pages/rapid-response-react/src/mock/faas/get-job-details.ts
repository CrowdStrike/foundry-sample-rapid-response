import { FaasGatewayApiRequestMessage } from "@crowdstrike/foundry-js";
import { getJobDetailFunctionBody } from "@/mock/schemas/schemas";
import { MockFaasHandler } from "@/mock/faas/base";
import { ConstructorArgs } from "@/mock/sdk/bridge";
import { rapidResponseFunctions } from "@/lib/constants";

export class GetJobDetailsHandler extends MockFaasHandler {
  constructor(args: ConstructorArgs) {
    super(args);

    this.functionId = rapidResponseFunctions.getJobDetails.id;
    this.functionName = rapidResponseFunctions.getJobDetails.name;
    this.requestPath = rapidResponseFunctions.getJobDetails.path;
  }

  prepareResponse(message: FaasGatewayApiRequestMessage) {
    const { jobs } = this.db;
    const parsedMessage = getJobDetailFunctionBody.parse(message);
    const query_params = parsedMessage.payload.body.payload.params.query ?? {};

    const match = jobs.find((job) => {
      return query_params.id.includes(job.id);
    });

    return {
      errors: [],
      resources: [
        {
          function_id: this.functionId,
          function_version: 1,
          payload: { body: { resource: match } },
        },
      ],
    };
  }
}
