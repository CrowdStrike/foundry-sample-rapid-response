import { useContext } from "react";
import { Link } from "react-router-dom";

import { useUrlParamsTools } from "@/lib/hooks/use-url-params-tools";
import { SortIcon } from "@/lib/icons";

import { UI_FLAGS } from "@/lib/constants";
import { FalconContext } from "@/lib/contexts/FalconContext/FalconContext";
import { AuditLogType } from "@/lib/validations/api-validation";
import { ZonedDateTime } from "@/components/ZonedDateTime";

const fields = [
  { label: "Job name", key: "job_name" },
  { label: "Date modified", key: "modified_at" },
  { label: "Version", key: "version" },
  { label: "Modified by", key: "modified_by" },
  { label: "Action taken", key: "action" },
] as const;

interface Props {
  logs: AuditLogType[];
}

function Table({ logs }: Props) {
  const { timezone, dateFormat, locale } = useContext(FalconContext);
  const options = { timezone, dateFormat, locale };
  const { set } = useUrlParamsTools({ pageUrl: "/audit-log" });

  return (
    <table className="text-left w-full">
      <thead className="h-12 alljobs-table-head bg-cssurfacesinner sticky top-0 z-40">
        <tr className="[&>th]:px-4 [&>th]:font-normal w-full">
          {fields.map((field, index) => (
            <th
              key={field.key}
              className={`before:content-[''] ${
                index !== 0
                  ? "relative before:bg-cstitlesandattributes before:w-[1px] before:h-[16px] before:absolute before:left-0 before:top-4"
                  : ""
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{field.label}</span>
                {UI_FLAGS.enable_sorting_tables ? (
                  <Link
                    to={set({
                      direction: "ASC", // TODO: Not supported by the Back-end
                      fieldName: field.key,
                    })}
                  >
                    <SortIcon
                      height={24}
                      width={24}
                      className="fill-cstitlesandattributes"
                    />
                  </Link>
                ) : null}
              </div>
            </th>
          ))}
        </tr>
      </thead>
      {logs.length === 0 ? (
        <div className="absolute w-full flex flex-col items-center top-[50%] gap-5">
          <h2 className="text-3xl">No results found</h2>
          <p>Try changing your filter selection</p>
        </div>
      ) : (
        <tbody
          className="alljobs-table-body
              [&>tr:nth-child(even)]:bg-cstablebackgroundeven
              [&>tr:nth-child(even)>td>span>span]:bg-cstablebackgroundeven
              [&>tr:nth-child(odd)>td>span>span]:bg-groundfloor"
        >
          {logs.map((log) => (
            <tr key={log.id} className="[&>td]:px-4 [&>td]:w-[10%]">
              <td>
                <Link
                  className="text-cslineargradient hover:[.text-cslineargradientfocus]"
                  to={`/job/${log.job_id}`}
                >
                  {log.job_name}
                </Link>
              </td>
              <td>
                <ZonedDateTime timestamp={log.modified_at} options={options} />
              </td>
              <td>{log.version || "- -"}</td>
              <td>{log.modified_by || "- -"}</td>
              <td>{log.action}</td>
            </tr>
          ))}
        </tbody>
      )}
    </table>
  );
}

export default Table;
