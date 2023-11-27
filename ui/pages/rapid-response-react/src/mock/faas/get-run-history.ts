import { FaasGatewayApiRequestMessage } from "@crowdstrike/foundry-js";
import {
  RunHistoryType,
  getRunHistoryFunctionBody,
} from "@/mock/schemas/run-history-schemas";
import { MockFaasHandler } from "@/mock/faas/base";
import { ConstructorArgs } from "@/mock/sdk/bridge";
import { rapidResponseFunctions } from "@/lib/constants";

const DEFAULT_ITEMS_LIMIT = 10;

export type HistoryFields =
  | "name"
  | "run_date"
  | "status"
  | "duration"
  | "hosts"

function getPrevCursor(
  list: RunHistoryType[],
  limit: number,
  offset: string,
): string {
  const offsetIndex = list.findIndex((element) => element.id === offset);

  return list[offsetIndex - limit]?.job_id || "";
}

function arrayLimit(
  list: RunHistoryType[],
  limit: number,
  offset: string,
): RunHistoryType[] {
  const offsetIndex = list.findIndex((element) => element.id === offset);
  if (offsetIndex === -1) return list;

  // Return one more element to define if there is a next page
  return list.slice(offsetIndex, offsetIndex + (limit + 1));
}

function getPaginationData(
  list: RunHistoryType[],
  limit: number,
  offset: string,
) {
  // Return `limit + 1` elements so we can define the nextCursor value
  const paginatedJobs = arrayLimit(list, limit, offset);
  const prevCursor = getPrevCursor(list, limit, offset);
  const lastElement = list.slice(-1);
  const nextCursor =
    paginatedJobs.length === limit + 1 ? lastElement[0]?.id : "";
  // Slice the last element so we get the right number of elements
  const currentPage = limit ? paginatedJobs.slice(0, limit) : paginatedJobs;
  return { currentPage, prevCursor, nextCursor };
}

export class GetRunHistoryHandler extends MockFaasHandler {
  constructor(args: ConstructorArgs) {
    super(args);

    this.functionId = rapidResponseFunctions.getRunHistory.id;
    this.functionName = rapidResponseFunctions.getRunHistory.name;
    this.requestPath = rapidResponseFunctions.getRunHistory.path;
  }

  prepareResponse(message: FaasGatewayApiRequestMessage) {
    const { history } = this.db;
    const parsedMessage = getRunHistoryFunctionBody.parse(message);
    const query_params = parsedMessage.payload.body.payload.params?.query ?? {};

    const {
      offset: qpOffset = null,
      limit: qpLimit = [String(DEFAULT_ITEMS_LIMIT)],
    } = query_params;

    const offset = qpOffset?.[0] ?? "";
    const limit = parseInt(qpLimit[0]) ?? DEFAULT_ITEMS_LIMIT;
    let matchingLogs = history;

    /**
     * The Back-end let us only filter by job Name
     */
    if (query_params && query_params.filter && query_params.filter.length > 0) {
      const filterKey = query_params.filter[0].split(":")[0];
      const valueToFilter = query_params.filter[0].split(":")[1];
      matchingLogs = history.filter((job) => {
        if (
          filterKey === "job_name" &&
          (query_params.exact_name?.length ?? 0 > 0)
        ) {
          const shouldMatchExactName = query_params.exact_name?.[0] === "true";
          if (shouldMatchExactName) {
            return valueToFilter === job.name;
          } else {
            return valueToFilter.includes(job.name);
          }
        } else if (filterKey === "job_id") {
          return job.job_id === valueToFilter;
        }
      });
    }

    // if (
    //   query_params.fieldName !== undefined &&
    //   query_params.direction !== undefined
    // ) {
    //   matchingLogs = sortBy(
    //     history,
    //     query_params.fieldName ?? "name",
    //     query_params.direction ?? "ASC",
    //   );
    // }

    const { prevCursor, nextCursor, currentPage } = getPaginationData(
      matchingLogs,
      limit,
      offset,
    );

    return {
      errors: [],
      resources: [
        {
          function_id: this.functionId,
          function_version: 1,
          payload: {
            body: {
              resources: currentPage,
              meta: {
                total: matchingLogs.length,
                limit,
                count: currentPage.length,
                prev: prevCursor,
                next: nextCursor,
              },
            },
          },
        },
      ],
    };
  }
}
