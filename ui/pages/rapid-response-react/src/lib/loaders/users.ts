import FalconApi, { LocalData } from "@crowdstrike/foundry-js";

import {
  getQueriesUsersV1Schema,
  postEntitiesUsersGetV1Schema,
} from "@/lib/validations/api-validation";

/**
 * Get All Users in order to give to the users the possibility to
 * notify them when a job has changed.
 * Users can notify other users by filling the notify Select in CreateJob.
 */
export async function getUsers(
  falcon: FalconApi<LocalData>,
): Promise<string[]> {
  try {
    const rawQueryResult = await falcon.api.userManagement.getQueriesUsersV1();
    const safeQueryResult = getQueriesUsersV1Schema.safeParse(rawQueryResult);

    if (!safeQueryResult.success) {
      console.error("Error in getUsers loader", safeQueryResult.error);
      return [];
    }

    const rawEntities = await falcon.api.userManagement.postEntitiesUsersGetV1({
      ids: safeQueryResult.data.resources,
    });
    const entities = postEntitiesUsersGetV1Schema.parse(rawEntities);
    return entities.resources.map((user) => user.uid);
  } catch (err) {
    console.error("Error in getUsers loader", err);
    return [];
  }
}
