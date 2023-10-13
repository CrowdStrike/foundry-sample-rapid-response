import { useContext } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { ErrorInput } from "@/components/ErrorInput";

import ActionBar from "@/components/create-job/ActionBar";
import ScheduleForLater from "@/components/create-job/Schedule/ScheduleForLater";

import { FalconContext } from "@/lib/contexts/FalconContext/FalconContext";
import { AllSteps } from "@/lib/validations/form-validation";

function Schedule() {
  const { errors } = useContext(FalconContext);

  const { setValue, control } = useFormContext<AllSteps>();
  const isScheduledForLater = useWatch({
    name: "scheduleStrategy",
    control,
  });

  const onChangeSchedule = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setValue(
      "scheduleStrategy",
      evt.currentTarget.checked ? "scheduleForLater" : "never",
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-medium">Schedule</h2>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div>
            <input
              id="scheduleForLater"
              onChange={onChangeSchedule}
              checked={isScheduledForLater === "scheduleForLater"}
              type="checkbox"
              className="accent-csaqua"
            />
            <label htmlFor="scheduleForLater" className="ml-3 cursor-pointer">
              Schedule
            </label>
          </div>
        </div>
        {isScheduledForLater === "scheduleForLater" && <ScheduleForLater />}
      </div>
      {errors.map((error) => (
        <ErrorInput key={error.message} errorMessage={error.message} />
      ))}
      <ActionBar />
    </div>
  );
}

export default Schedule;
