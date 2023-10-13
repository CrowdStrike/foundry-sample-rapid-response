import { useContext, useMemo } from "react";

import { FalconContext } from "@/lib/contexts/FalconContext/FalconContext";
import { useHostData } from "@/lib/hooks/use-host-data";
import {
  mapJobDetailsPropsToDisplay,
  mapPeoplePropsToDisplay,
  mapSchedulePropsToDisplay,
} from "@/lib/mappers/mapJobDetailsProps";
import { Job } from "@/lib/validations/api-validation";
import { ZonedDateTime } from "@/components/ZonedDateTime";

interface Props {
  job: Job;
}

function Details({ job }: Props) {
  const { timezone, dateFormat, locale } = useContext(FalconContext);
  const options = { timezone, dateFormat, locale };
  const { hostGroups, hosts } = useHostData();
  const jobDetailsData = useMemo(
    () => mapJobDetailsPropsToDisplay(job, hosts, hostGroups),
    [job, hosts, hostGroups],
  );
  const scheduleData = useMemo(() => mapSchedulePropsToDisplay(job), [job]);
  const people = useMemo(() => mapPeoplePropsToDisplay(job), [job]);

  return (
    <div className="relative left-[-10%] top-[85px]">
      <div className="w-[26%] flex flex-col gap-8 fixed rounded-xl py-4 px-6 bg-surfacemd bg-cslineargrey shadow-containerJobDetails detailsViewHeight">
        {jobDetailsData.length === 0 ? null : (
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-medium">Job details</h2>
            <div className="flex flex-col gap-2 text-base">
              {jobDetailsData.map((entry) => (
                <div key={entry.value} className="flex items-center">
                  <span className="text-csbodyandlabels w-1/4">
                    {entry.label}:
                  </span>
                  <span className="w-3/4 text-right">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {scheduleData.length === 0 ? null : (
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-medium">Schedule</h2>
            <div className="flex flex-col gap-2 text-base">
              {scheduleData.map((entry) => (
                <div key={entry.label} className="flex items-center">
                  <span className="text-csbodyandlabels w-1/4">
                    {entry.label}:
                  </span>
                  <span className="w-3/4 text-right">
                    {entry.name === "runDate" ? (
                      <ZonedDateTime
                        timestamp={entry.value}
                        options={options}
                      />
                    ) : (
                      entry.value
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {people.length === 0 ? null : (
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-medium">People</h2>
            <div className="flex flex-col gap-2 text-base">
              {people.map((entry) => (
                <div key={entry.label} className="flex items-center">
                  <span className="text-csbodyandlabels w-1/4">
                    {entry.label}:
                  </span>
                  <span className="w-3/4 text-right">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Details;
