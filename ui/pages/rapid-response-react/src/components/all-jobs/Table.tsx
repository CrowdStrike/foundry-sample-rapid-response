import { useContext } from "react";
import { Link } from "react-router-dom";

import { ActionsButton } from "@/components/all-jobs/ActionsButton";
import { SortIcon } from "@/lib/icons";

import { ZonedDateTime } from "@/components/ZonedDateTime";
import { UI_FLAGS } from "@/lib/constants";
import { FalconContext } from "@/lib/contexts/FalconContext/FalconContext";
import { useHostData } from "@/lib/hooks/use-host-data";
import { useUrlParamsTools } from "@/lib/hooks/use-url-params-tools";
import { mapHostsIdToName } from "@/lib/mappers/mapHostNames";
import { truncateText } from "@/lib/utils/truncate-text";
import { Job } from "@/lib/validations/api-validation";

const fields = [
  { label: "Job name", key: "name" },
  { label: "Description", key: "description" },
  { label: "Run date", key: "next_run_date" },
  { label: "Targeted hosts", key: "hosts" },
  { label: "Last modified", key: "last_modified" },
];

interface Props {
  jobs: Job[];
  handleHostsForDrawer: (hosts: string[]) => () => void;
}

function Table({ jobs, handleHostsForDrawer }: Props) {
  const { timezone, dateFormat, locale } = useContext(FalconContext);
  const options = { timezone, dateFormat, locale };
  const { hosts, hostGroups } = useHostData();
  const { set } = useUrlParamsTools({ pageUrl: "/all-jobs" });

  return (
    <table className="text-left w-full text-titles-and-attributes">
      <thead className="h-12 alljobs-table-head bg-cssurfacesinner sticky top-0 z-40">
        <tr className="[&>th]:px-4 [&>th]:font-normal w-full">
          {fields.map((field, index) => (
            <th
              key={field.key}
              className={`!w-[19%] before:content-[''] ${
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
          <th className="!w-[5%]">Actions</th>
        </tr>
      </thead>
      <tbody
        className="alljobs-table-body
              [&>tr:nth-child(even)]:bg-cstablebackgroundeven
              [&>tr:nth-child(even)>td>span>span]:bg-cstablebackgroundeven
              [&>tr:nth-child(odd)]:bg-cstablebackgroundodd
              [&>tr:nth-child(odd)>td>span>span]:bg-groundfloor"
      >
        {jobs.map((job, index) => (
          <tr
            key={`${job.name}-${index}`}
            className="[&>td]:px-4 [&>td]:w-[10%]"
          >
            <td>
              <Link
                to={`/job/${job.id}`}
                className="text-cslineargradient hover:[.text-cslineargradientfocus]"
              >
                {job.name}
              </Link>
            </td>
            <td>{job.description ? truncateText(job.description) : "- -"}</td>
            <td>
              <ZonedDateTime timestamp={job.next_run} options={options} />
            </td>
            <td>
              {Array.isArray(job.target.hosts) &&
              job.target.hosts.length > 0 ? (
                <button
                  type="button"
                  onClick={handleHostsForDrawer(
                    mapHostsIdToName(job, hosts, hostGroups),
                  )}
                  className="text-cslineargradient hover:[.text-cslineargradientfocus]"
                >
                  {job.target.hosts.length}
                </button>
              ) : Array.isArray(job.target.host_groups) &&
                job.target.host_groups.length > 0 ? (
                <button
                  type="button"
                  onClick={handleHostsForDrawer(
                    mapHostsIdToName(job, hosts, hostGroups),
                  )}
                  className="text-cslineargradient hover:[.text-cslineargradientfocus]"
                >
                  {job.target.host_groups.length}
                </button>
              ) : (
                "- -"
              )}
            </td>
            <td>
              <ZonedDateTime timestamp={job.updated_at} options={options} />
            </td>
            <td className="!w-[5%]">
              <ActionsButton
                jobID={job.id}
                jobName={job.name}
                jobStatus={job.draft ? "draft" : "scheduled"}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;
