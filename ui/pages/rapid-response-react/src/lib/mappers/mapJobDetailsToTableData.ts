import * as TableDetails from "@/components/table-details/Table";

import { status } from "@/components/run-history/Header";
import { AuditLogType, RunHistory } from "@/lib/validations/api-validation";
import { DateFormatString } from "@/lib/utils/datetime";

type MapOptions = {
  timezone: string;
  locale: string;
  dateFormat: DateFormatString;
};

export function mapJobHistoryDetailsToTableData(
  history: RunHistory[],
  options: MapOptions,
): TableDetails.TableData {
  return {
    headColumns: ["Run status", "Run date", "Duration", "Targeted hosts"],
    bodyColumns: history.map<
      Array<
        | TableDetails.BodyColumnStatus
        | TableDetails.BodyColumnRaw
        | TableDetails.BodyColumnZonedDateTime
      >
    >((hist) => {
      return [
        {
          label:
            status.find((stat) => stat.key === hist["status"])?.label || "--",
          type: "status",
          icon: status.find((stat) => stat.key === hist["status"])?.icon,
        },
        {
          options,
          label: hist["run_date"],
          timestamp: hist["run_date"],
          type: "zoned-date-time",
        },
        {
          label: hist["duration"] || "--",
          type: "raw",
        },
        {
          label: String(hist["hosts"].length) || "--",
          type: "raw",
        },
      ];
    }),
  };
}

export function mapAuditLogDetailsToTableData(
  auditLog: AuditLogType[],
  options: MapOptions,
): TableDetails.TableData {
  return {
    headColumns: ["Date modified", "Version", "Modified by", "Action taken"],
    bodyColumns: auditLog.map<
      Array<
        | TableDetails.BodyColumnStatus
        | TableDetails.BodyColumnRaw
        | TableDetails.BodyColumnZonedDateTime
      >
    >((hist) => {
      return [
        {
          label: hist["modified_at"],
          type: "zoned-date-time",
          timestamp: hist["modified_at"],
          options,
        },
        {
          label: String(hist["version"]) || "--",
          type: "raw",
        },
        {
          label: hist["modified_by"] || "--",
          type: "raw",
        },
        {
          label: hist["action"] || "--",
          type: "raw",
        },
      ];
    }),
  };
}
