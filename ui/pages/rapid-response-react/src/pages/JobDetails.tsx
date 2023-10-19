import { useContext, useMemo } from "react";

import { Table } from "@/components/table-details/Table";
import Details from "@/components/job-details/Details";
import Header from "@/components/job-details/Header";

import { FAAS } from "@/lib/constants";
import { useParsedLoaderData } from "@/lib/hooks/use-parsed-loader-data";
import {
  mapAuditLogDetailsToTableData,
  mapJobHistoryDetailsToTableData,
} from "@/lib/mappers/mapJobDetailsToTableData";
import { Loader } from "@/lib/types";
import {
  HistoryJobsAuditLogSchema,
  historyJobsAuditLogSchema,
} from "@/lib/validations/api-validation";
import { FalconContext } from "@/lib/contexts/FalconContext/FalconContext";

export const loader: Loader = ({ falcon }) => {
  return async (args) => {
    const jobId = args.params.id;
    if (!jobId) {
      throw new Error("JobDetails requires an id");
    }

    /** Get Job details thansk to ID in the URL Query Params*/
    const { name, version, path } = FAAS.getJobDetails;
    const getJobDetails = falcon.cloudFunction({ name, version });

    /** Get Audit Logs Details */
    const {
      name: nameAuditLog,
      version: versionAuditLog,
      path: auditLogPath,
    } = FAAS.getAuditLog;

    const getAuditLog = falcon.cloudFunction({
      name: nameAuditLog,
      version: versionAuditLog,
    });

    /** Get RunHistory Details */
    const {
      name: nameRunHistory,
      version: versionRunHistory,
      path: runHistoryPath,
    } = FAAS.getRunHistory;
    const getRunHistory = falcon.cloudFunction({
      name: nameRunHistory,
      version: versionRunHistory,
    });

    const [job, auditLogs, history] = await Promise.all([
      getJobDetails.get({
        params: { query: { id: [jobId] } },
        path,
      }),
      getAuditLog.get({
        path: auditLogPath,
        params: { query: { filter: [`job_id:${jobId}`] } },
      }),
      getRunHistory.get({
        path: runHistoryPath,
        params: { query: { filter: [`job_id:${jobId}`] } },
      }),
    ]);

    return { job, auditLogs, history };
  };
};

function JobDetails() {
  const { timezone, locale, dateFormat } = useContext(FalconContext);
  const data = useParsedLoaderData<HistoryJobsAuditLogSchema>(
    historyJobsAuditLogSchema,
  );
  const historyTableData = useMemo(
    () =>
      mapJobHistoryDetailsToTableData(data.history.body.resources, {
        timezone,
        locale,
        dateFormat,
      }),
    [data.history.body.resources, timezone, locale, dateFormat],
  );
  const auditLogTableData = useMemo(
    () =>
      mapAuditLogDetailsToTableData(data.auditLogs.body.resources, {
        timezone,
        locale,
        dateFormat,
      }),
    [data.auditLogs.body.resources, timezone, locale, dateFormat],
  );

  return (
    <div className="flex relative w-full min-h-full">
      <div className="w-9/12 px-24 py-6 flex flex-col gap-10 bg-groundfloor">
        <Header job={data.job.body.resource} />
        <Table
          title="Most recent runs (last 7 days)"
          viewAllHref={`/run-history?jobName=${data.job.body.resource.name}`}
          tableData={historyTableData}
        />
        <Table
          title="Most recent audit log entries"
          viewAllHref={`/audit-log?jobId=${data.job.body.resource.id}`}
          tableData={auditLogTableData}
        />
      </div>
      <div className="w-3/12 bg-csbackdrop">
        <Details job={data.job.body.resource} />
      </div>
    </div>
  );
}

export default JobDetails;
