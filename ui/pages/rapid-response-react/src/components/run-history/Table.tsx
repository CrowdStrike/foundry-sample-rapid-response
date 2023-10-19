import { useContext } from "react";
import { Link } from "react-router-dom";

import { useUrlParamsTools } from "@/lib/hooks/use-url-params-tools";
import { SortIcon } from "@/lib/icons";

import { UI_FLAGS } from "@/lib/constants";
import { FalconContext } from "@/lib/contexts/FalconContext/FalconContext";
import { RunHistory } from "@/lib/validations/api-validation";
import { status } from "@/components/run-history/Header";
import { ZonedDateTime } from "@/components/ZonedDateTime";

const fields = [
  { label: "Run date", key: "last_run_date" },
  { label: "Job name", key: "name" },
  { label: "Run status", key: "status" },
  { label: "Duration", key: "duration" },
  { label: "Targeted hosts", key: "hosts" },
];

interface Props {
  history: RunHistory[];
  handleHostsForDrawer: (hosts: string[]) => () => void;
}

function Table({ history, handleHostsForDrawer }: Props) {
  const { timezone, locale, dateFormat } = useContext(FalconContext);
  const options = { timezone, locale, dateFormat };
  const { set } = useUrlParamsTools({ pageUrl: "/run-history" });

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
      {history.length === 0 ? (
        <div className="absolute w-full flex flex-col items-center top-[50%] gap-5">
          <h2 className="text-3xl">No results found</h2>
          <p>Try changing your filter selection</p>
        </div>
      ) : (
        <tbody
          className="alljobs-table-body
          [&>tr:nth-child(even)]:bg-cstablebackgroundeven
          [&>tr:nth-child(even)>td>span>span]:bg-cstablebackgroundeven
          [&>tr:nth-child(odd)]:bg-cstablebackgroundodd
          [&>tr:nth-child(odd)>td>span>span]:bg-groundfloor"
        >
          {history.map((job) => {
            const { icon = "", label = "- -" } =
              status.find((stat) => stat.key === job.status) ?? {};

            return (
              <tr key={job.name} className="[&>td]:px-4 [&>td]:w-[10%]">
                <td>
                  <ZonedDateTime timestamp={job.run_date} options={options} />
                </td>
                <td>
                  <Link
                    className="text-cslineargradient hover:[.text-cslineargradientfocus]"
                    to={`/job/${job.job_id}`}
                  >
                    {job.name}
                  </Link>
                </td>
                <td>
                  <span className="flex gap-1.5 items-center before:content-[' ']">
                    {icon}
                    {label}
                  </span>
                </td>
                <td>{job.duration ?? "- -"}</td>
                <td>
                  {Array.isArray(job.hosts) && job.hosts.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleHostsForDrawer(job.hosts)}
                      className="text-cslineargradient hover:[.text-cslineargradientfocus]"
                    >
                      {job.hosts.length}
                    </button>
                  ) : (
                    "- -"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      )}
    </table>
  );
}

export default Table;
