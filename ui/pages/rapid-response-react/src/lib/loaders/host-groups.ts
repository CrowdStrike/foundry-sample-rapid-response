import FalconApi, { LocalData } from "@crowdstrike/foundry-js";

import {
  GetEntitiesGroupsV1SchemaType,
  PostAggregatesDevicesGetV1SchemaType,
  getEntitiesGroupsV1Schema,
  postAggregatesDevicesGetV1Schema,
} from "@/lib/validations/api-validation";

interface Result {
  aggregates: PostAggregatesDevicesGetV1SchemaType;
  entities: GetEntitiesGroupsV1SchemaType;
}

export async function getHostGroups(
  falcon: FalconApi<LocalData>,
): Promise<Result> {
  try {
    const rawAggregates = await falcon.api.devices.postAggregatesDevicesGetV1([
      {
        field: "groups",
        min_doc_count: 1,
        name: "groups",
        size: 5000,
        type: "terms",
      },
    ]);
    const safeAggregates =
      postAggregatesDevicesGetV1Schema.safeParse(rawAggregates);

    if (!safeAggregates.success) {
      console.error("Error in getHostGroups loader", safeAggregates.error);
      return {
        aggregates: {
          resources: [],
          errors: [],
        },
        entities: {
          resources: [],
          errors: [],
        },
      };
    }

    if (safeAggregates.data.resources.length === 0) {
      console.error(
        "Error in getHostGroups loader",
        safeAggregates.data.resources,
      );
      return {
        aggregates: {
          resources: [],
          errors: [],
        },
        entities: {
          resources: [],
          errors: [],
        },
      };
    }

    const [first] = safeAggregates.data.resources;
    const ids = first.buckets
      .map((b) => b.label)
      .filter((b) => b !== "3a5ebb8f55dd42b8b9d19bdefff5fa86");

    // Note: in our CID, the host group with id '3a5ebb...'
    // appears in the aggregate request,
    // but the entities query sees this as a 404.
    const entitiesRaw = await falcon.api.devices.getEntitiesGroupsV1({
      ids,
    });
    const safeEntities = getEntitiesGroupsV1Schema.safeParse(entitiesRaw);

    if (!safeEntities.success) {
      console.error(
        "Error in getHostGroups loader",
        safeAggregates.data.errors,
      );
      return {
        aggregates: safeAggregates.data,
        entities: {
          resources: [],
          errors: [],
        },
      };
    }

    return {
      aggregates: safeAggregates.data,
      entities: safeEntities.data,
    };
  } catch (err) {
    console.error("Error in getHostGroups loader", err);
    return {
      aggregates: {
        resources: [],
        errors: [],
      },
      entities: {
        resources: [],
        errors: [],
      },
    };
  }
}
