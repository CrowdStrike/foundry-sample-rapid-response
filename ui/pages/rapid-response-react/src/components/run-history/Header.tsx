import { MouseEvent, useEffect, useRef, useState, useReducer } from "react";
import { useNavigate } from "react-router-dom";

import { useUrlParamsTools } from "@/lib/hooks/use-url-params-tools";

import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";
import SlButtonGroup from "@shoelace-style/shoelace/dist/react/button-group/index.js";
import SlButton from "@shoelace-style/shoelace/dist/react/button/index.js";

import { UI_FLAGS } from "@/lib/constants";

interface Props {
  jobsTotal: number;
}

export const status = [
  {
    label: "In Progress",
    key: "in-progress",
    icon: <span className="w-2 h-2 rounded-full !bg-[#EFEFEF]" />,
  },
  {
    label: "Completed",
    key: "completed",
    icon: <span className="w-2 h-2 rounded-full !bg-[#06E5B7]" />,
  },
  {
    label: "Failed",
    key: "failed",
    icon: <span className="w-2 h-2 rounded-full !bg-[#FA4147]" />,
  },
] as const;

const runDateFilterCriteria = [
  { label: "Last hour", key: "last-hour" },
  { label: "Last day", key: "last-day" },
  { label: "Last week", key: "last-week" },
] as const;

type FilteringModalOpen = "jobName" | "runDate" | "runStatus" | null;
type FilteringRunDate = "last-hour" | "last-day" | "last-week" | null;
type Status = "in-progress" | "completed" | "failed";

interface State {
  jobName: string | null;
  runDate: FilteringRunDate;
  status: Status[];
}

type Action =
  | { type: "jobName"; payload: string | null }
  | { type: "runDate"; payload: FilteringRunDate }
  | { type: "status"; payload: Status[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "jobName":
      return {
        ...state,
        jobName: action.payload,
      };
    case "runDate":
      return {
        ...state,
        runDate: action.payload,
      };
    case "status":
      return {
        ...state,
        status: action.payload,
      };
    default:
      throw `Unhandled action type`;
  }
}

function Header({ jobsTotal }: Props) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { set, get, remove } = useUrlParamsTools({ pageUrl: "/run-history" });

  /** Handle the opening of small modal for filtering */
  const [filteringModalOpen, setFilteringModalOpen] =
    useState<FilteringModalOpen>(null);

  /** Handle the temporary state until user apply filtering */
  const [jobNameFiltering, setJobNameFiltering] = useState("");
  const [runDateFilter, setSelectRunDateFilter] =
    useState<FilteringRunDate>(null);
  const [selectedStatus, setSelectStatus] = useState<Status[]>([]);

  /** Handle the applied filtering state */
  const [state, dispatch] = useReducer(reducer, {
    jobName: get("jobName") || null,
    runDate: null,
    status: [],
  });

  const handleClickOutside = (event: globalThis.MouseEvent) => {
    if (
      ref.current &&
      !ref.current.contains(event.target as Node) &&
      !ref.current.parentNode?.contains(event.target as Node)
    ) {
      setFilteringModalOpen(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const onToggleFilteringModal = (modalToOpen: FilteringModalOpen) => () => {
    if (filteringModalOpen !== null) {
      setFilteringModalOpen(null);
    } else {
      setFilteringModalOpen(modalToOpen);
    }
  };

  const onChangeJobNameFiltering = (
    evt: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setJobNameFiltering(evt.currentTarget.value);
  };

  const onChooseRunDateFilter = (filter: FilteringRunDate) => () => {
    setSelectRunDateFilter(filter);
  };

  const onSelectStatus =
    (statusKey: "in-progress" | "completed" | "failed") =>
    (evt: MouseEvent) => {
      evt.stopPropagation();
      if (selectedStatus.includes(statusKey)) {
        const setStatus = selectedStatus.filter(
          (status) => status !== statusKey,
        );
        setSelectStatus(setStatus);
      } else {
        setSelectStatus([...selectedStatus, statusKey]);
      }
    };

  const onApply = (key: keyof State) => () => {
    if (key === "jobName") {
      dispatch({ type: key, payload: jobNameFiltering });
      navigate(
        set({ jobName: jobNameFiltering, shouldMatchExactJobName: "false" }),
      );
    } else if (key === "runDate") {
      dispatch({ type: key, payload: runDateFilter });
    } else {
      dispatch({ type: key, payload: selectedStatus });
    }
    setFilteringModalOpen(null);
  };

  const onClear =
    (key: keyof State) =>
    (evt: MouseEvent<typeof SlButton | HTMLSpanElement>) => {
      evt.stopPropagation();
      if (key === "jobName") {
        setJobNameFiltering("");
        dispatch({ type: key, payload: null });
        navigate(remove(["jobName", "shouldMatchExactJobName"]));
      } else if (key === "runDate") {
        setSelectRunDateFilter(null);
        dispatch({ type: key, payload: null });
      } else {
        setSelectStatus([]);
        dispatch({ type: key, payload: [] });
      }
    };

  return (
    <div className="py-6 px-8 bg-mezzanine">
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h1 className="flex gap-1 text-xl font-medium">
            Run history (last 7 days)
            <span className="text-csbodyandlabels">{jobsTotal} items</span>
          </h1>
          <div className="flex gap-2">
            <div className="py-1 relative text-base flex items-center gap-1.5 rounded bg-variantDark">
              <button
                type="button"
                onClick={onToggleFilteringModal("jobName")}
                className="py-1	px-3 text-base flex items-center gap-1.5 rounded bg-variantDark relative"
              >
                Job name
                {state.jobName !== null ? (
                  <>
                    :
                    <span className="flex items-center gap-2 font-bold">
                      {state.jobName}
                      <span
                        onClick={onClear("jobName")}
                        className="flex items-center"
                      >
                        <SlIcon name="x-lg" />
                      </span>
                    </span>
                  </>
                ) : (
                  <SlIcon
                    name={
                      filteringModalOpen === "jobName" ? "chevron-up" : "search"
                    }
                  />
                )}
              </button>
              {filteringModalOpen === "jobName" ? (
                <div
                  ref={ref}
                  className="absolute bg-surface2xl top-[50px] z-[41] py-2 px-3 flex flex-col gap-2 rounded w-max"
                >
                  <input
                    onChange={onChangeJobNameFiltering}
                    value={jobNameFiltering}
                    type="text"
                    placeholder="Type to filter"
                    className="border border-solid h-8 w-full rounded-sm bg-cstransparencyoverlaydarker p-1 outline-none border-csinputbordercolor focus:border-2 focus:border-cspurple"
                  />
                  <SlButtonGroup label="Alignment">
                    <SlButton
                      className="clearFilter"
                      onClick={onClear("jobName")}
                    >
                      Clear
                    </SlButton>
                    <SlButton
                      className="discardJob"
                      onClick={onApply("jobName")}
                    >
                      Apply
                    </SlButton>
                  </SlButtonGroup>
                </div>
              ) : null}
            </div>
            {UI_FLAGS.enable_run_history_filtering ? (
              <>
                <div className="py-1 relative text-base flex items-center gap-1.5 rounded bg-variantDark">
                  <button
                    className="py-1	px-3 text-base rounded bg-variantDark relative flex items-center gap-1.5"
                    onClick={onToggleFilteringModal("runDate")}
                  >
                    Run date
                    {state.runDate !== null ? (
                      <>
                        :
                        <span className="flex items-center gap-2 font-bold">
                          {state.runDate}
                          <span
                            onClick={onClear("runDate")}
                            className="flex items-center"
                          >
                            <SlIcon name="x-lg" />
                          </span>
                        </span>
                      </>
                    ) : (
                      <SlIcon
                        name={
                          filteringModalOpen === "runDate"
                            ? "chevron-up"
                            : "chevron-down"
                        }
                      />
                    )}
                  </button>
                  {filteringModalOpen === "runDate" ? (
                    <div
                      ref={ref}
                      className="absolute bg-surface2xl top-[50px] z-[41] py-2 flex flex-col gap-2 rounded w-[250px]"
                    >
                      {runDateFilterCriteria.map((filter) => (
                        <span
                          key={filter.key}
                          onClick={onChooseRunDateFilter(filter.key)}
                          className="items-center flex gap-4 py-2 px-3 cursor-pointer hover:bg-dropfilebgcolor"
                        >
                          <input
                            type="radio"
                            checked={runDateFilter === filter.key}
                            readOnly
                          />
                          {filter.label}
                        </span>
                      ))}
                      <div className="py-2 px-3 w-full">
                        <SlButtonGroup
                          label="Alignment"
                          style={{ width: "100%" }}
                        >
                          <SlButton
                            className="clearFilter"
                            onClick={onClear("runDate")}
                          >
                            Clear
                          </SlButton>
                          <SlButton
                            className="discardJob"
                            onClick={onApply("runDate")}
                          >
                            Apply
                          </SlButton>
                        </SlButtonGroup>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="py-1 relative text-base flex items-center gap-1.5 rounded bg-variantDark">
                  <button
                    type="button"
                    onClick={onToggleFilteringModal("runStatus")}
                    className="py-1	px-3 text-base flex items-center gap-1.5 rounded bg-variantDark relative"
                  >
                    Run status
                    {state.status.length > 0 ? (
                      <>
                        :
                        <span className="flex items-center gap-2 font-bold">
                          {state.status.length} selected
                          <span
                            onClick={onClear("status")}
                            className="flex items-center"
                          >
                            <SlIcon name="x-lg" />
                          </span>
                        </span>
                      </>
                    ) : (
                      <SlIcon
                        name={
                          filteringModalOpen === "runStatus"
                            ? "chevron-up"
                            : "chevron-down"
                        }
                      />
                    )}
                  </button>
                  {filteringModalOpen === "runStatus" ? (
                    <div
                      ref={ref}
                      className="absolute bg-surface2xl top-[50px] z-[41] py-2 flex flex-col gap-2 rounded w-[250px]"
                    >
                      {status.map((filter) => (
                        <span
                          key={filter.key}
                          onClick={onSelectStatus(filter.key)}
                          className="items-center flex gap-2 py-2 px-3 hover:bg-dropfilebgcolor"
                        >
                          {selectedStatus.includes(filter.key) ? (
                            <input type="checkbox" checked={true} readOnly />
                          ) : (
                            <input type="checkbox" checked={false} readOnly />
                          )}
                          {filter.icon} {filter.label}
                        </span>
                      ))}
                      <div className="py-2 px-3 w-full">
                        <SlButtonGroup
                          label="Alignment"
                          style={{ width: "100%" }}
                        >
                          <SlButton
                            className="clearFilter"
                            onClick={onClear("status")}
                          >
                            Clear
                          </SlButton>
                          <SlButton
                            className="discardJob"
                            onClick={onApply("status")}
                          >
                            Apply
                          </SlButton>
                        </SlButtonGroup>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
