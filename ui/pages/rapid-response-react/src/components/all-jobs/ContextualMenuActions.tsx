import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

interface Props {
  resetCtxMenuActions: (job: null) => void;
  jobID: string;
  jobStatus: string; // TODO: For now use a string but after we would need to use a narrowed typed: "not_scheduled" "scheduled" "in_progress" "failed" "completed"
  jobName: string; // TODO: RunHistory as of 15 September 2023 only support the filtering by jobName and not by jobId, once jobId is supported, remove that property
}

export function ContextualMenuActions({
  jobID,
  jobStatus,
  jobName,
  resetCtxMenuActions,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node) &&
        !ref.current.parentNode?.contains(event.target as Node)
      ) {
        resetCtxMenuActions(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [resetCtxMenuActions]);

  return (
    <div
      ref={ref}
      className="absolute top-0 left-0 translate-x-[-95%] border border-solid
      bg-cssurface2xl shadow-csbutton border-cssurfacesinner flex flex-col w-36 cursor-pointer rounded-sm"
    >
      {/* TODO: Handle that case to run the job now */}
      {/* {jobStatus === "not_scheduled" && (
        <Link to="" className="px-3 py-2 hover:bg-cstablecolorselected">
          Run now
        </Link>
      )} */}
      <Link
        className="px-3 py-2 hover:bg-csmenucolorselected"
        to={`/job/${jobID}`}
      >
        View job details
      </Link>
      <Link
        to={`/run-history?jobName=${jobName}`}
        className="px-3 py-2 hover:bg-csmenucolorselected"
      >
        View run history
      </Link>
      <Link
        to={`/audit-log?jobId=${jobID}`}
        className="px-3 py-2 hover:bg-csmenucolorselected"
      >
        View audit log
      </Link>
      {jobStatus === "draft" ? (
        <Link
          to={`/job/${jobID}/edit`}
          className="px-3 py-2 hover:bg-csmenucolorselected"
        >
          Edit job
        </Link>
      ) : null}
    </div>
  );
}
