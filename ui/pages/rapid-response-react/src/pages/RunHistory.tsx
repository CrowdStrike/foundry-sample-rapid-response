import { useState } from "react";

import { Drawer } from "@/components/Drawer";
import { NoRuns } from "@/components/empty-state";
import { Wrapper as PaginationWrapper } from "@/components/pagination/PaginationWrapper";
import Header from "@/components/run-history/Header";
import Table from "@/components/run-history/Table";

import { DEFAULT_ITEMS_LIMIT, FAAS } from "@/lib/constants";
import { useParsedLoaderData } from "@/lib/hooks/use-parsed-loader-data";
import { Loader } from "@/lib/types";
import {
  RunHistoryDataSchema,
  runHistoryDataSchema,
} from "@/lib/validations/api-validation";
import { useFilterParams } from "@/lib/hooks/use-filter-params";

export const loader: Loader = ({ falcon }) => {
  return async (args) => {
    const searchParams = new URL(args.request.url).searchParams;
    const jobName = searchParams.get("jobName") ?? undefined;
    const shouldMatchExactJobName =
      searchParams.get("shouldMatchExactJobName") ?? "true";
    const limit = parseInt(
      searchParams.get("limit") || String(DEFAULT_ITEMS_LIMIT),
    );
    const prev = searchParams.get("prev") ?? "";
    const next = searchParams.get("next") ?? "";
    const offset = searchParams.get("offset") ?? "";
    let page = 1;

    if (prev !== "") page = parseInt(prev.split(":")[1]);
    else if (next !== "") page = parseInt(next.split(":")[1]) + 1;

    const { name, version, path } = FAAS.getRunHistory;
    const getRunHistory = falcon.cloudFunction({ name, version });
    const result = await getRunHistory.get({
      path,
      params: {
        query: {
          limit: [limit.toString()],
          ...(next !== "" && offset !== "" && { next: [next] }),
          ...(prev !== "" && offset !== "" && { prev: [prev] }),
          ...(offset !== "" && { offset: [offset] }),
          ...(jobName && {
            exact_name: [shouldMatchExactJobName],
            filter: [`job_name:${jobName}`],
          }),
        },
      },
    });
    const safeResult = runHistoryDataSchema.parse(result);

    safeResult.body.meta.offset = safeResult.body.resources?.[0]?.id ?? "";
    // Add a computed page number to render the pagination information
    safeResult.body.meta.page = page;

    return safeResult;
  };
};

function RunHistory() {
  const { hasActiveFilters } = useFilterParams();
  const data = useParsedLoaderData<RunHistoryDataSchema>(runHistoryDataSchema);

  /**
   * The following state has 2 utility,
   * - Set specifics host details on the drawer
   * - Show or hide the Drawer depending of selected hosts
   */
  const [activeHostsOnDrawer, setActiveHostsForDrawer] = useState<string[]>([]);

  if (data.body.meta.total === 0 && !hasActiveFilters) {
    return <NoRuns />;
  }

  const handleHostsForDrawer = (hosts: string[]) => () => {
    setActiveHostsForDrawer(hosts);
  };

  return (
    <div className="h-alljobs-viewport relative">
      <Header jobsTotal={data.body.meta.total} />
      <div className="top-30 left-0 w-full flex min-h-alljobs-hosts max-h-alljobs-hosts">
        <div className="w-full overflow-y-auto">
          <Table
            history={data.body.resources}
            handleHostsForDrawer={handleHostsForDrawer}
          />
        </div>
        {data.body.resources.length > 0 ? (
          <Drawer
            activeHosts={activeHostsOnDrawer}
            handleHostsForDrawer={handleHostsForDrawer}
          />
        ) : null}
      </div>
      {data.body.resources.length > 0 ? (
        <PaginationWrapper meta={data.body.meta} route="/run-history" />
      ) : null}
    </div>
  );
}

export default RunHistory;
