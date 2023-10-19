import { useRef, useState } from "react";

import { ContextualMenuActions } from "@/components/all-jobs/ContextualMenuActions";

import { ActionsClosedIcon, ActionsOpenIcon } from "@/lib/icons/Actions";

interface Props {
  jobID: string;
  jobStatus: string; // TODO: For now use a string but after we would need to use a narrowed typed: "not_scheduled" "scheduled" "in_progress" "failed" "completed"
  jobName: string; // TODO: RunHistory as of 15 September 2023 only support the filtering by jobName and not by jobId, once jobId is supported, remove that property
}

export function ActionsButton({ jobID, jobStatus, jobName }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  /**
   * This state decide whether or not we should show the Ctx Menu Action and also
   * provide the data associate to the job we selected.
   */
  const [jobNameOnCtxMenu, setJobOnCtxMenu] = useState<string | null>(null);

  const selectJobOnCtxMenu = (jobNameSelected: string | null) => {
    setJobOnCtxMenu(jobNameSelected);
  };

  const handleClick =
    (jobNameSelected: string) => (event: React.MouseEvent) => {
      if (
        ref.current &&
        ref.current.contains(event.target as Node) &&
        jobNameOnCtxMenu !== null
      ) {
        selectJobOnCtxMenu(null);
      } else {
        selectJobOnCtxMenu(jobNameSelected);
      }
    };

  return (
    <div className="w-full relative flex justify-center">
      {jobNameOnCtxMenu === jobID && (
        <ContextualMenuActions
          jobID={jobID}
          jobStatus={jobStatus}
          jobName={jobName}
          resetCtxMenuActions={selectJobOnCtxMenu}
        />
      )}
      <button ref={ref} type="button" onClick={handleClick(jobID)}>
        {jobNameOnCtxMenu === jobID ? (
          <div className="flex items-center justify-center cursor-pointer h-8 w-8 bg-csbuttonsecondaryactive rounded-sm">
            <ActionsOpenIcon
              className="fill-cstitlesandattributes"
              width={18}
              height={18}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center cursor-pointer h-8 w-8 rounded-full hover:bg-csbuttonsecondaryhover active:bg-csbuttonsecondaryactive">
            <ActionsClosedIcon
              className="fill-cstitlesandattributes"
              width={16}
              height={16}
            />
          </div>
        )}
      </button>
    </div>
  );
}

export default ActionsButton;
