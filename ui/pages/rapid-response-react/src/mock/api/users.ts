import {
  RequestMessage,
  UserManagementApiRequestMessage,
} from "@crowdstrike/foundry-js";
import { usersEntities } from "@/mock/data/fixtures";
import { isUsersApiRequest } from "@/mock/sdk/predicates";

export class UsersApiMock {
  isMatch(message: RequestMessage): message is UserManagementApiRequestMessage {
    return (
      isUsersApiRequest(message) &&
      (message.method === "postEntitiesUsersGetV1" ||
        message.method === "getQueriesUsersV1")
    );
  }

  async responder(message: UserManagementApiRequestMessage) {
    let value = {};
    if (message.method === "postEntitiesUsersGetV1") {
      value = { errors: [], resources: usersEntities };
    } else if (message.method === "getQueriesUsersV1") {
      value = { errors: [], resources: usersEntities.map((user) => user.uuid) };
    }
    return Promise.resolve(value);
  }
}
