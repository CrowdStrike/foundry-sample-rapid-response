import { Suspense, lazy } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { MultiValue } from "react-select";

import { ErrorInput } from "@/components/ErrorInput";
import ActionBar from "@/components/create-job/ActionBar";
import { LoaderSmall } from "@/components/LoaderSmall";

import { useUserData } from "@/lib/hooks/use-user-data";
import { AllSteps } from "@/lib/validations/form-validation";

const CreatableSelect = lazy(() =>
  import("react-select/creatable").then(({ default: CreatableSelect }) => ({
    default: CreatableSelect<OptionSelect, true>,
  })),
);

interface Props {
  isEditMode?: boolean;
}

type OptionSelect = { label: string; value: string };

function JobDetails({ isEditMode = false }: Props) {
  const { users } = useUserData();
  const {
    setValue,
    register,
    formState: { errors },
    control,
  } = useFormContext<AllSteps>();
  const peopleToNotify = useWatch({ name: "peopleToNotify", control });

  const onNotifyPeopleChange = (newValue: MultiValue<OptionSelect>) => {
    if (!newValue) {
      return;
    }
    setValue("peopleToNotify", newValue as OptionSelect[]);
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-medium text-csbodyandlabels">
        Add details about this job
      </h2>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-base text-csbodyandlabels">Job name</span>
          <label className="text-xs text-csbodyandlabels" htmlFor="jobName">
            Give a unique name to your job
          </label>
          <input
            id="jobName"
            {...register("jobName")}
            type="text"
            disabled={isEditMode}
            aria-disabled={isEditMode ? "true" : "false"}
            className={`${
              isEditMode ? "cursor-not-allowed" : "cursor-default"
            } border bg-csinputcolorbg focus:border-2 ${
              errors.jobName?.message
                ? "border-cscritical"
                : "border-csinputbordercolor"
            } relative h-8 w-full rounded-sm p-1 outline-none focus:border-cspurple`}
          />
          {typeof errors.jobName?.message === "string" ? (
            <ErrorInput errorMessage={errors.jobName.message} />
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            className="text-base text-csbodyandlabels"
            htmlFor="jobDescription"
          >
            Job description (optional)
          </label>
          <textarea
            id="jobDescription"
            {...register("jobDescription")}
            className="relative w-full max-h-[30vh] rounded-sm border border-solid border-csinputbordercolor bg-csinputcolorbg	p-1 outline-none focus:border-2 focus:border-cspurple"
            rows={3}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            className="text-base text-csbodyandlabels"
            htmlFor="peopleToNotify"
          >
            Notify these people (optional)
          </label>
          <Suspense fallback={<LoaderSmall />}>
            <CreatableSelect
              isClearable
              isMulti
              name="peopleToNotify"
              value={peopleToNotify}
              className="w-full"
              formatCreateLabel={(newOption) => `Add ${newOption}`}
              options={users.map((user) => ({
                label: user,
                value: user,
              }))}
              onChange={onNotifyPeopleChange}
              classNamePrefix="select"
            />
          </Suspense>
        </div>
      </div>
      <ActionBar />
    </div>
  );
}

export default JobDetails;
