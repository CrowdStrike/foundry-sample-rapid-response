import FalconApi, { LocalData } from "@crowdstrike/foundry-js";

import {
  PostEntitiesDevicesV2SchemaType,
  getQueriesDevicesV2Schema,
  postEntitiesDevicesV2Schema,
} from "@/lib/validations/api-validation";

interface Result {
  entities: PostEntitiesDevicesV2SchemaType;
}

export async function getHosts(falcon: FalconApi<LocalData>): Promise<Result> {
  try {
    const rawQueryResult = await falcon.api.devices.getQueriesDevicesV2();
    const safeQueryResult = getQueriesDevicesV2Schema.safeParse(rawQueryResult);

    if (!safeQueryResult.success) {
      console.error("Error in getHosts loader", safeQueryResult.error);
      return {
        entities: {
          resources: [],
          errors: [],
        },
      };
    }

    const rawEntities = await falcon.api.devices.postEntitiesDevicesV2({
      ids: safeQueryResult.data.resources,
    });
    const safeEntities = postEntitiesDevicesV2Schema.safeParse(rawEntities);

    if (!safeEntities.success) {
      console.error("Error in getHosts loader", safeEntities.error);
      return {
        entities: {
          resources: [],
          errors: [],
        },
      };
    }

    return {
      entities: safeEntities.data,
    };
  } catch (err) {
    console.error("Error in getHosts loader", err);
    return {
      entities: {
        resources: [],
        errors: [],
      },
    };
  }
}
