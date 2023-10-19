import {
  ApiResponsePayload,
  FaasGatewayApiRequestMessage,
  RequestMessage,
} from "@crowdstrike/foundry-js";
import { isFaasGatewayApiRequest } from "@/mock/sdk/predicates";
import { generalPostMessage } from "@/mock/schemas/schemas";
import { ConstructorArgs } from "@/mock/sdk/bridge";
import { MockDbSchema } from "@/mock/data/fixtures";

type FaasResource = {
  function_id: string;
  function_version: number;
  payload: Record<"body", unknown>;
};

const SEPARATOR = ":";

export class MockFaasHandler {
  functionId = "mock-faas-function";
  functionName = "mock-faas-function-name";
  requestPath = "/mock-path";
  private counter = 0;
  private bus: Record<string, ApiResponsePayload> = {};
  db: MockDbSchema;
  appName: "rapid-response" | "scalable-rtr";

  constructor({ db, appName }: ConstructorArgs) {
    this.db = db;
    this.appName = appName;
  }

  isMatch(message: RequestMessage): message is FaasGatewayApiRequestMessage {
    return (
      isFaasGatewayApiRequest(message) &&
      (this.isPost(message) || this.isGet(message))
    );
  }

  private isPost(message: FaasGatewayApiRequestMessage): boolean {
    const result = generalPostMessage.safeParse(message);
    if (!result.success) {
      return false;
    }

    const { method } = result.data;
    const { function_id, function_name } = result.data.payload.body;
    const { path } = result.data.payload.body.payload;

    return (
      method === "postEntitiesExecutionV1" &&
      (function_id === this.functionId ||
        function_name === this.functionName) &&
      path === this.requestPath
    );
  }

  private isGet(message: FaasGatewayApiRequestMessage): boolean {
    const { id } = message.payload.params;
    if (typeof id !== "string") {
      return false;
    }

    const [functionId, functionName, path, _counter] = id.split(SEPARATOR);
    return (
      message.method === "getEntitiesExecutionV1" &&
      (functionId === this.functionId || functionName === this.functionName) &&
      path === this.requestPath
    );
  }

  prepareResponse(
    _message: FaasGatewayApiRequestMessage,
  ): ApiResponsePayload<FaasResource> {
    return { errors: [], resources: [] };
  }

  async responder(message: FaasGatewayApiRequestMessage) {
    if (this.isPost(message)) {
      const execution_id = [
        this.functionId,
        this.functionName,
        this.requestPath,
        ++this.counter,
      ].join(SEPARATOR);
      this.bus[execution_id] = this.prepareResponse(message);

      return Promise.resolve({
        resources: [
          {
            execution_id,
            function_id: this.functionId,
          },
        ],
      });
    } else if (this.isGet(message)) {
      const { id } = message.payload.params;
      if (!id || typeof id !== "string") {
        throw "No id supplied";
      }

      const result = this.bus[id];
      if (!result) {
        throw `No response for id: ${id}`;
      }

      return Promise.resolve(this.bus[id]);
    }
  }
}
