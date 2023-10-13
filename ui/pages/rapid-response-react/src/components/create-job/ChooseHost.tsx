import { useFormContext, useWatch } from "react-hook-form";

import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";
import SlOption from "@shoelace-style/shoelace/dist/react/option/index.js";
import SlSelect from "@shoelace-style/shoelace/dist/react/select/index.js";
import SlTooltip from "@shoelace-style/shoelace/dist/react/tooltip/index.js";

import { ErrorInput } from "@/components/ErrorInput";

import { useHostData } from "@/lib/hooks/use-host-data";
import { useResetFields } from "@/lib/hooks/use-reset-fields";
import { AllSteps } from "@/lib/validations/form-validation";
import ActionBar from "@/components/create-job/ActionBar";

function ChooseHost() {
  const { hostGroups, hosts } = useHostData();

  const {
    register,
    getValues,
    setValue,
    clearErrors,
    formState: { errors, defaultValues },
    control,
  } = useFormContext<AllSteps>();
  const hostType = useWatch({ name: "hostType", control });
  useResetFields({
    clearErrors,
    deps: [hostType],
    fieldsToReset: ["hostGroups", "hosts"],
  });

  const onSlSelectChange = (e: Event) => {
    if (!e.target) {
      return;
    }
    const target = e.target as HTMLSelectElement;
    const name = target.name as "hostType";
    const value = target.value as "hosts" | "hostGroups";
    (["hostType", "hosts", "hostGroups"] as const).forEach((n) => {
      clearErrors(n);
    });
    setValue(name, value);
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-medium text-csbodyandlabels">
        Choose target hosts
      </h2>
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <input
            id="hostGroups"
            {...register("hostType")}
            type="radio"
            value="hostGroups"
            checked={hostType === "hostGroups"}
            className="h-4 w-4 border-gray-300 bg-gray-100 text-blue-600 accent-csaqua"
          />
          <label className="cursor-pointer" htmlFor="hostGroups">
            Host group(s)
          </label>
        </div>
        <div className="flex gap-3">
          <input
            id="hosts"
            {...register("hostType")}
            type="radio"
            value="hosts"
            checked={hostType === "hosts"}
            className="h-4 w-4 border-gray-300 bg-gray-100 text-blue-600 accent-csaqua"
          />
          <label className="cursor-pointer" htmlFor="hosts">
            Host(s)
          </label>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="hostsSelect">
          {hostType === "hostGroups" ? "Host group(s)" : "Host(s)"}
        </label>
        <div className="flex flex-col gap-1.5">
          <SlSelect
            id="hostsSelect"
            name="hostGroups"
            placeholder={
              hostGroups.length > 0
                ? "Select host group(s)"
                : "An error has happened while loading host group(s)"
            }
            disabled={hostGroups.length === 0}
            onSlChange={onSlSelectChange}
            value={getValues("hostGroups")}
            defaultValue={(defaultValues?.hostGroups as string[]) ?? []}
            multiple
            className={`h-8 w-full ${
              errors.hostGroups?.message ? "error" : ""
            } relative w-full rounded-sm outline-none ${
              hostType === "hostGroups" ? "" : "hidden"
            }`}
          >
            {hostGroups.map((group) => {
              return (
                <SlOption className="csOption" value={group.id} key={group.id}>
                  {group.name} ({group.count} hosts)
                </SlOption>
              );
            })}
          </SlSelect>
          <SlSelect
            id="hostsSelect"
            name="hosts"
            placeholder={
              hosts.length > 0
                ? "Select host(s)"
                : "An error has happened while loading host(s)"
            }
            disabled={hosts.length === 0}
            onSlChange={onSlSelectChange}
            value={getValues("hosts")}
            defaultValue={(defaultValues?.hosts as string[]) ?? []}
            multiple
            className={`h-8 w-full ${hostType === "hosts" ? "" : "hidden"}`}
          >
            {hosts.map((host) => {
              return (
                <SlOption
                  className="csOption"
                  value={host.device_id}
                  key={host.device_id}
                >
                  {host.hostname}
                </SlOption>
              );
            })}
          </SlSelect>
        </div>
        {typeof errors.hosts?.message === "string" ? (
          <ErrorInput errorMessage={errors.hosts.message} />
        ) : null}
        {typeof errors.hostGroups?.message === "string" ? (
          <ErrorInput errorMessage={errors.hostGroups?.message} />
        ) : null}
      </div>
      <div className="flex items-center">
        <input
          id="isOfflineQueueing"
          {...register("isOfflineQueueing")}
          type="checkbox"
          className="bg-csbuttonprimary hover:bg-csbuttonprimaryhover active:bg-csbuttonprimaryfocus accent-csaqua"
        />
        <label htmlFor="isOfflineQueueing" className="ml-3">
          Offline queueing{" "}
        </label>
        <div className="ml-1 mt-2">
          <SlTooltip
            placement="top"
            content="If host is offline, job will run as soon as the host comes back online (7 day max)"
          >
            <SlIcon name="info-circle"></SlIcon>
          </SlTooltip>
        </div>
      </div>
      <ActionBar />
    </div>
  );
}

export default ChooseHost;
