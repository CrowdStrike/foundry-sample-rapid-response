import {
  RemoteResponseApiRequestMessage,
  RequestMessage,
} from "@crowdstrike/foundry-js";
import { isRemoteResponseApiRequest } from "@/mock/sdk/predicates";
import { MockDbSchema } from "@/mock/data/fixtures";

export class GetEntitiesPutFilesV2Handler {
  db: MockDbSchema;

  constructor({ db }: { db: MockDbSchema }) {
    this.db = db;
  }

  isMatch(message: RequestMessage): message is RemoteResponseApiRequestMessage {
    return (
      isRemoteResponseApiRequest(message) &&
      message.method === "getEntitiesPutFilesV2"
    );
  }

  responder(message: RemoteResponseApiRequestMessage) {
    return Promise.resolve({
      errors: undefined,
      resources: this.prepareResponse(message),
    });
  }

  prepareResponse(message: RemoteResponseApiRequestMessage) {
    const { ids } = message.payload.params;

    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }

    return this.db.rtrPutFiles.filter((file) =>
      (ids as string[]).includes(file.id),
    );
  }
}
