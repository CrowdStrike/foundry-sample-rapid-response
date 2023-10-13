import { Link } from "react-router-dom";

import { EmptyStateSVG } from "@/lib/icons";

export function NoJobs() {
  return (
    <div className="h-screen-without-header flex justify-center items-center">
      <div className="flex flex-col items-center gap-10 text-base">
        <EmptyStateSVG />
        <div className="flex flex-col gap-5 items-center">
          <h2 className="text-2xl">No jobs yet</h2>
          <p className="text-csbodyandlabels">
            When jobs are created, you&apos;ll see them here
          </p>
          <Link
            to="/create-job"
            className="cursor-pointer rounded-sm border border-solid border-csinputcolorborder bg-csbuttonprimary hover:bg-csbuttonprimaryhover active:bg-csbuttonprimaryfocus px-12 py-2 text-center font-medium text-xs text-csbuttoncolortext shadow-csbutton"
          >
            Create job
          </Link>
        </div>
      </div>
    </div>
  );
}
