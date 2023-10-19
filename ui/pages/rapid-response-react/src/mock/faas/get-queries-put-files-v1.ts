import {
  RemoteResponseApiRequestMessage,
  RequestMessage,
} from "@crowdstrike/foundry-js";
import { isRemoteResponseApiRequest } from "@/mock/sdk/predicates";
import { MockDbSchema } from "@/mock/data/fixtures";

export class GetQueriesPutFilesV1Handler {
  db: MockDbSchema;

  constructor({ db }: { db: MockDbSchema }) {
    this.db = db;
  }

  isMatch(message: RequestMessage): message is RemoteResponseApiRequestMessage {
    return (
      isRemoteResponseApiRequest(message) &&
      message.method === "getQueriesPutFilesV1"
    );
  }

  responder(message: RemoteResponseApiRequestMessage) {
    return Promise.resolve({
      errors: undefined,
      resources: this.prepareResponse(message),
    });
  }

  // TODO: Add filtering and others potential features here
  prepareResponse(message: RemoteResponseApiRequestMessage) {
    const { filter } = message.payload.params;
    if (filter && typeof filter === "string") {
      const [_, value] = filter.split(":");
      const jobName = value.replace(/[']/g, "");
      return this.db.rtrPutFiles
        .filter((file) => file.name.includes(jobName))
        .map((file) => file.id);
    }
    return this.db.rtrPutFiles.map((file) => file.id);
  }
}
