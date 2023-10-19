import {
  DevicesApiRequestMessage,
  RequestMessage,
} from "@crowdstrike/foundry-js";
import {
  hostsEntities,
  hostGroupsAggregates,
  hostGroupsEntities,
} from "@/mock/data/fixtures";
import { isDevicesApiRequest } from "@/mock/sdk/predicates";

export class DevicesApiMock {
  isMatch(message: RequestMessage): message is DevicesApiRequestMessage {
    return (
      isDevicesApiRequest(message) &&
      (message.method === "postAggregatesDevicesGetV1" ||
        message.method === "getEntitiesGroupsV1" ||
        message.method === "postEntitiesDevicesV2" ||
        message.method === "getQueriesDevicesV2")
    );
  }

  async responder(message: DevicesApiRequestMessage) {
    let value = {};
    if (message.method === "postAggregatesDevicesGetV1") {
      value = { errors: [], resources: hostGroupsAggregates };
    } else if (message.method === "getEntitiesGroupsV1") {
      value = { errors: [], resources: hostGroupsEntities };
    } else if (message.method === "getQueriesDevicesV2") {
      const ids = hostsEntities.map((h) => h.device_id);
      value = { errors: [], resources: ids };
    } else if (message.method === "postEntitiesDevicesV2") {
      value = { errors: [], resources: hostsEntities };
    }
    return Promise.resolve(value);
  }
}
