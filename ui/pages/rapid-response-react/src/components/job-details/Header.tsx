import { Link } from "react-router-dom";

import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";

import { Job } from "@/lib/validations/api-validation";
import { useHostData } from "@/lib/hooks/use-host-data";

interface Props {
  job: Job;
}

function Header({ job }: Props) {
  const { hosts, hostGroups } = useHostData();

  return (
    <>
      <Link
        to="/all-jobs"
        className="flex items-center gap-2 text-csteal text-base"
      >
        <SlIcon name="arrow-left" style={{ color: "#4CD7F5" }} />
        <span className="text-cslineargradient hover:[.text-cslineargradientfocus] !leading-5">
          Back to all jobs
        </span>
      </Link>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl">
          {job.name}{" "}
          <span className="gradientTextPurple">#{job.id.slice(0, 8)}</span>
        </h1>
        {job.draft ? (
          <Link to={`/job/${job.id}/edit`}>
            <button
              type="button"
              className="rounded-sm bg-csbuttonprimary hover:bg-csbuttonprimaryhover active:bg-csbuttonprimaryfocus px-6 py-1 text-base font-medium text-csprimaryforegroundnextbtn min-w-[106px]"
            >
              Edit job
            </button>
          </Link>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl">Description</h2>
        {job.description ? (
          <p className="text-base text-csbodyandlabels">{job.description}</p>
        ) : null}
        {hostGroups || hosts ? (
          <p className="text-base text-csbodyandlabels">
            {Array.isArray(hostGroups) && hostGroups.length > 0
              ? `Targeted host group(s): ${hostGroups
                  .map((group) => group.name)
                  .join(", ")}`
              : Array.isArray(hosts) && hosts.length > 0
              ? `Targeted host(s): ${hosts
                  .map((host) => host.hostname)
                  .join(", ")}`
              : null}
          </p>
        ) : null}
      </div>
    </>
  );
}

export default Header;
