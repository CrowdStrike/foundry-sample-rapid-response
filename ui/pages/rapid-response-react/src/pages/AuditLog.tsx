import { Wrapper as PaginationWrapper } from "@/components/pagination/PaginationWrapper";
import { Header } from "@/components/audit-log/Header";
import Table from "@/components/audit-log/Table";
import { NoAuditLogs } from "@/components/empty-state";

import { FAAS } from "@/lib/constants";
import { useParsedLoaderData } from "@/lib/hooks/use-parsed-loader-data";
import { Loader } from "@/lib/types";
import {
  AuditLogDataSchema,
  auditLogDataSchema,
} from "@/lib/validations/api-validation";

export const loader: Loader = ({ falcon }) => {
  return async (args) => {
    const searchParams = new URL(args.request.url).searchParams;
    const jobId = searchParams.get("jobId") ?? undefined;

    const prev = searchParams.get("prev") ?? "";
    const next = searchParams.get("next") ?? "";
    const offset = searchParams.get("offset") ?? "";
    let page = 1;

    if (prev !== "") page = parseInt(prev.split(":")[1]);
    else if (next !== "") page = parseInt(next.split(":")[1]) + 1;

    const { name, version, path } = FAAS.getAuditLog;
    const getAuditLog = falcon.cloudFunction({ name, version });
    const rawResult = await getAuditLog.get({
      path,
      params: {
        query: {
          ...(jobId && { filter: [`job_id:${jobId}`] }),
          ...(next !== "" && offset !== "" && { next: [next] }),
          ...(prev !== "" && offset !== "" && { prev: [prev] }),
          ...(offset !== "" && { offset: [offset] }),
        },
      },
    });
    const result = auditLogDataSchema.parse(rawResult);

    result.body.meta.offset = result.body.resources?.[0]?.id ?? "";
    // Add a computed page number to render the pagination data
    result.body.meta.page = page;

    return result;
  };
};

function AuditLog() {
  const data = useParsedLoaderData<AuditLogDataSchema>(auditLogDataSchema);

  if (data.body.meta.total === 0) {
    return <NoAuditLogs />;
  }

  return (
    <div className="h-screen-without-header relative">
      <Header totalItems={data.body.meta.total} />
      <div className="top-30 left-0 w-full flex min-h-alljobs-hosts max-h-alljobs-hosts">
        <div className="w-full overflow-y-auto">
          <Table logs={data.body.resources} />
        </div>
      </div>
      {data.body.resources.length > 0 ? (
        <PaginationWrapper meta={data.body.meta} route="/audit-log" />
      ) : null}
    </div>
  );
}

export default AuditLog;
