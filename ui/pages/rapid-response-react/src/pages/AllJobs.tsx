import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { Drawer } from "@/components/Drawer";
import Table from "@/components/all-jobs/Table";
import { NoJobs } from "@/components/empty-state";
import { Wrapper as PaginationWrapper } from "@/components/pagination/PaginationWrapper";
import { Header } from "@/components/all-jobs/Header";

import { DEFAULT_ITEMS_LIMIT, FAAS } from "@/lib/constants";
import { useParsedLoaderData } from "@/lib/hooks/use-parsed-loader-data";
import toastEnhanced from "@/lib/toast";
import { Loader } from "@/lib/types";
import {
  AllJobsDataSchema,
  allJobsDataSchema,
} from "@/lib/validations/api-validation";

export const loader: Loader = ({ falcon }) => {
  return async (args) => {
    const searchParams = new URL(args.request.url).searchParams;
    const limit = parseInt(
      searchParams.get("limit") || String(DEFAULT_ITEMS_LIMIT),
    );
    const prev = searchParams.get("prev") ?? "";
    const next = searchParams.get("next") ?? "";
    const offset = searchParams.get("offset") ?? "";
    let page = 1;

    if (prev !== "") page = parseInt(prev.split(":")[1]);
    else if (next !== "") page = parseInt(next.split(":")[1]) + 1;

    /**
     * Getting AllJobs
     */
    const { name, version, path } = FAAS.getJobs;
    const getJobs = falcon.cloudFunction({
      name,
      version,
    });
    const result = await getJobs.get({
      path,
      params: {
        query: {
          limit: [limit.toString()],
          ...(next !== "" && offset !== "" && { next: [next] }),
          ...(prev !== "" && offset !== "" && { prev: [prev] }),
          ...(offset !== "" && { offset: [offset] }),
        },
      },
    });
    const safeResult = allJobsDataSchema.parse(result);

    safeResult.body.meta.offset = safeResult.body.resources?.[0]?.id ?? "";
    // Add a computed page number to render the pagination data
    safeResult.body.meta.page = page;

    return safeResult;
  };
};

function AllJobs() {
  const refNbToast = useRef(0);
  const location = useLocation();
  const data = useParsedLoaderData<AllJobsDataSchema>(allJobsDataSchema);

  /**
   * The following state has 2 utility,
   * - Set specifics host details on the drawer
   * - Show or hide the Drawer depending of selected hosts
   */
  const [activeHostsOnDrawer, setActiveHostsForDrawer] = useState<string[]>([]);

  /**
   * The following useEffect display a Notification
   * that warn the user that a job has been created.
   * We get the JobName thanks to the state property
   * from the location API.
   */
  useEffect(() => {
    const state = location.state as unknown;
    if (
      refNbToast.current === 0 &&
      state !== null &&
      typeof state === "object" &&
      "jobName" in state &&
      "action" in state &&
      typeof state.action === "string" &&
      typeof state.jobName === "string"
    ) {
      refNbToast.current += 1;
      toastEnhanced(
        `Job ${state.jobName} ${
          state.action === "create" ? "saved" : "edited"
        }`,
      );
      // This will prevent the toast to be displayed even if the user refresh the page.
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  if (data.body.meta.total === 0) {
    return <NoJobs />;
  }

  const handleHostsForDrawer = (hosts: string[]) => () => {
    setActiveHostsForDrawer(hosts);
  };

  return (
    <div className="h-alljobs-viewport relative">
      <Header totalJobs={data.body.meta.total} />
      <div className="top-30 left-0 w-full flex min-h-alljobs-hosts max-h-alljobs-hosts">
        <div className="w-full overflow-y-auto">
          <Table
            jobs={data.body.resources}
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
        <PaginationWrapper meta={data.body.meta} route="/all-jobs" />
      ) : null}
    </div>
  );
}

export default AllJobs;
