import { FaasGatewayApiRequestMessage } from "@crowdstrike/foundry-js";
import {
  AuditLogType,
  getAuditLogFunctionBody,
} from "@/mock/schemas/audit-log-schemas";
import { MockFaasHandler } from "@/mock/faas/base";
import { ConstructorArgs } from "@/mock/sdk/bridge";
import { rapidResponseFunctions } from "@/lib/constants";

const DEFAULT_ITEMS_LIMIT = 10;

export type HistoryFields =
  | "name"
  | "date_modified"
  | "version"
  | "modified_by"
  | "action_taken";

function arrayLimit<T>(
  list: T[],
  limit: number,
  offsetIndex: number,
): { paginatedJobs: T[]; page: number } {
  const page = Math.ceil((offsetIndex + 1) / limit);
  if (offsetIndex === -1) return { paginatedJobs: list, page };

  // Return one more element to define if there is a next page
  return {
    paginatedJobs: list.slice(offsetIndex, offsetIndex + (limit + 1)),
    page,
  };
}

function getPaginationData(
  jobs: AuditLogType[],
  limit: number,
  offset: string,
  prev: string,
  next: string,
) {
  let offsetIndex = jobs.findIndex((element) => element.id === offset);
  if (next !== "") {
    offsetIndex = jobs.findIndex((element) => element.id === next);
  } else if (prev !== "") {
    offsetIndex = jobs.findIndex((element) => element.id === prev);
  }
  // Return `limit + 1` elements so we can define the nextCursor value
  const { paginatedJobs, page } = arrayLimit(jobs, limit, offsetIndex);
  const prevCursor = jobs[offsetIndex - limit]?.id
    ? `${jobs[offsetIndex - limit]?.id}:${page - 1}`
    : "";
  const lastElement = jobs.slice(-1);
  const nextCursor =
    paginatedJobs.length === limit + 1 ? `${lastElement[0]?.id}:${page}` : "";
  // Slice the last element so we get the right number of elements
  const currentPage = limit ? paginatedJobs.slice(0, limit) : paginatedJobs;
  return { currentPage, prevCursor, nextCursor };
}

export class GetAuditLogHandler extends MockFaasHandler {
  constructor(args: ConstructorArgs) {
    super(args);

    this.functionId = rapidResponseFunctions.getAuditLog.id;
    this.functionName = rapidResponseFunctions.getAuditLog.name;
    this.requestPath = rapidResponseFunctions.getAuditLog.path;
  }
  prepareResponse(message: FaasGatewayApiRequestMessage) {
    const { logs } = this.db;
    const parsedMessage = getAuditLogFunctionBody.parse(message);

    const query_params = parsedMessage.payload.body.payload.params?.query ?? {};

    const {
      offset: qpOffset = null,
      limit: qpLimit = [String(DEFAULT_ITEMS_LIMIT)],
      prev: qpPrev = null,
      next: qpNext = null,
    } = query_params;

    const offset = qpOffset?.[0] ?? "";
    const prev = qpPrev?.[0].split(":")?.[0] ?? "";
    const next = qpNext?.[0].split(":")?.[0] ?? "";
    const limit = parseInt(qpLimit[0]) ?? DEFAULT_ITEMS_LIMIT;

    let matchingLogs = logs;

    if (query_params && query_params.filter && query_params.filter.length > 0) {
      const [_, job_id] = query_params.filter[0].split(":");
      matchingLogs = logs.filter((job) => {
        return job_id.includes(job.job_id);
      });
    }

    // if (
    //   query_params?.fieldName !== undefined &&
    //   query_params?.direction !== undefined
    // ) {
    //   matchingLogs = sortBy(
    //     matchingLogs,
    //     query_params.fieldName ?? "name",
    //     query_params.direction ?? "ASC"
    //   );
    // }

    const { prevCursor, nextCursor, currentPage } = getPaginationData(
      matchingLogs,
      limit,
      offset,
      prev,
      next,
    );

    return {
      errors: [],
      resources: [
        {
          function_id: this.functionId,
          function_version: 1,
          payload: {
            body: {
              resources: matchingLogs,
              meta: {
                total: logs.length,
                limit,
                offset: currentPage[0]?.id || "",
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
