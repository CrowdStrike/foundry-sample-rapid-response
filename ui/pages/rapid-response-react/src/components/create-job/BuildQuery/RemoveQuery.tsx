import { useFormContext } from "react-hook-form";
import { ErrorInput } from "@/components/ErrorInput";

/**
 * TODO
 * @returns
 */
function RemoveQuery() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-csbodyandlabels" htmlFor="fileName">
          File name
        </label>
        <input
          id="fileName"
          {...register("fileName")}
          type="text"
          className={`${
            errors.fileName?.message
              ? "border-cscritical"
              : "border-csinputbordercolor"
          } relative h-8 w-full rounded-sm border border-solid bg-csinputcolorbg p-1 outline-none focus:border-2 focus:border-cspurple`}
        />
        {typeof errors.fileName?.message === "string" ? (
          <ErrorInput errorMessage={errors.fileName?.message} />
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-csbodyandlabels" htmlFor="registryKeyValue">
          File path
        </label>
        <input
          id="filePath"
          {...register("filePath")}
          type="text"
          className={`${
            errors.filePath?.message
              ? "border-cscritical"
              : "border-csinputbordercolor"
          } relative h-8 w-full rounded-sm border border-solid bg-csinputcolorbg p-1 outline-none focus:border-2 focus:border-cspurple`}
        />
        {typeof errors.filePath?.message === "string" ? (
          <ErrorInput errorMessage={errors.filePath?.message} />
        ) : null}
      </div>
    </div>
  );
}

export default RemoveQuery;
