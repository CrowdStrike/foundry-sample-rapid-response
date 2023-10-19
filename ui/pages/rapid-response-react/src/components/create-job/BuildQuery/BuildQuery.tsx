import { useFormContext, useWatch } from "react-hook-form";

import ActionBar from "@/components/create-job/ActionBar";
import InstallQuery from "@/components/create-job/BuildQuery/InstallQuery";
import RemoveQuery from "@/components/create-job/BuildQuery/RemoveQuery";

import { AllSteps } from "@/lib/validations/form-validation";
import { useEffect } from "react";

function BuildQuery() {
  const { register, control, clearErrors } = useFormContext<AllSteps>();
  const jobType = useWatch({ name: "jobType", control });

  useEffect(() => {
    clearErrors("file");
  }, [clearErrors, jobType]);

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-medium text-csbodyandlabels">
        Choose job type
      </h2>
      <div className="flex flex-col gap-3">
        <span className="text-csbodyandlabels">Job type</span>
        <div className="flex gap-3">
          <input
            id="install"
            {...register("jobType")}
            type="radio"
            value="install"
            className="h-4 w-4 border-gray-300 bg-gray-100 text-blue-600 accent-csaqua"
          />
          <label className="cursor-pointer" htmlFor="install">
            Install software
          </label>
        </div>
        <div className="flex gap-3">
          <input
            id="remove"
            {...register("jobType")}
            type="radio"
            value="remove"
            className="h-4 w-4 border-gray-300 bg-gray-100 text-blue-600 accent-csaqua"
          />
          <label className="cursor-pointer" htmlFor="remove">
            Remove file
          </label>
        </div>
      </div>
      {jobType === "install" && <InstallQuery />}
      {jobType === "remove" && <RemoveQuery />}
      <ActionBar />
    </div>
  );
}

export default BuildQuery;
