import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";
import { useContext, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { ErrorInput } from "@/components/ErrorInput";

import SelectFile from "@/components/create-job/BuildQuery/UploadFiles/SelectFile";
import UploadedFile from "@/components/create-job/BuildQuery/UploadFiles/UploadedFile";

import { FalconContext } from "@/lib/contexts/FalconContext/FalconContext";
import { sizeOf } from "@/lib/utils/fileSize";
import { resourcesFilesToInstallSchema } from "@/lib/validations/api-validation";
import { AllSteps } from "@/lib/validations/form-validation";

/**
 * TODO
 * @returns
 */
function InstallQuery() {
  const {
    register,
    setValue,
    formState: { errors },
    setError,
    clearErrors,
    control,
  } = useFormContext<AllSteps>();
  const { falcon } = useContext(FalconContext);

  const file = useWatch({
    name: "file",
    control,
  });

  const [installType, setInstallType] = useState<"installFile" | "selectFile">(
    "installFile",
  );

  const [isFileSelectModalOpen, openFileSelectModal] = useState(false);
  const [removeLoader, setLoaderWhenRemovingFiles] = useState(false);

  const onSelectFile = async () => {
    if (errors.file !== undefined) {
      clearErrors("file");
    }

    if (installType === "installFile") {
      const res = await falcon.ui.uploadFile("remote-response", {
        name: "",
      });
      if (res !== undefined) {
        const parsedFileResources = resourcesFilesToInstallSchema.safeParse(
          res.resources,
        );
        if (
          parsedFileResources.success &&
          parsedFileResources.data.length > 0
        ) {
          setValue("file", parsedFileResources.data[0]);
        } else if (Array.isArray(res.errors) && res.errors.length > 0) {
          const error = res.errors[0];
          setError("file", {
            message:
              error.code === 409
                ? "File with given name already exists."
                : "An unknown error has happened.",
          });
        }
      }
    } else {
      openFileSelectModal(true);
    }
  };

  const onDeleteFile = (id: string) => async () => {
    if (installType === "installFile") {
      setLoaderWhenRemovingFiles(true);
      await falcon.api.remoteResponse.deleteEntitiesPutFilesV1({ ids: [id] });
      setLoaderWhenRemovingFiles(false);
      setValue("file", undefined);
    } else {
      setValue("file", undefined);
    }
  };

  const onChangeInstallType =
    (installType: "installFile" | "selectFile") => () => {
      if (errors.file !== undefined) {
        clearErrors("file");
      }

      setInstallType(installType);
    };

  return (
    <>
      <SelectFile
        isOpen={isFileSelectModalOpen}
        setOpen={openFileSelectModal}
      />
      <div className="flex flex-col gap-3">
        <span className="text-csbodyandlabels">File type</span>
        <div className="flex gap-3">
          <input
            id="installFile"
            checked={installType === "installFile"}
            onChange={onChangeInstallType("installFile")}
            type="radio"
            value="newFile"
            className="h-4 w-4 border-gray-300 bg-gray-100 text-blue-600 accent-csaqua"
          />
          <label className="cursor-pointer" htmlFor="installFile">
            Upload new file
          </label>
        </div>
        <div className="flex gap-3">
          <input
            id="selectFile"
            checked={installType === "selectFile"}
            onChange={onChangeInstallType("selectFile")}
            type="radio"
            value="selectFile"
            className="h-4 w-4 border-gray-300 bg-gray-100 text-blue-600 accent-csaqua"
          />
          <label className="cursor-pointer" htmlFor="selectFile">
            Select from RTR put files
          </label>
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-csbodyandlabels" htmlFor="filesToInstall">
            File to install
          </label>
          <button
            type="button"
            className="flex w-max items-center gap-1.5 rounded-sm bg-variantDark px-3 py-1 text-base shadow-bgHeaderCreateJob"
            onClick={onSelectFile}
          >
            Select file <SlIcon name="plus" style={{ fontSize: "20px" }} />
          </button>
          {typeof errors.file?.message === "string" ? (
            <ErrorInput errorMessage={errors.file.message} />
          ) : null}
          {file ? (
            <div className="flex flex-col gap-1.5">
              <UploadedFile
                key={file.name}
                fileName={file.name}
                fileSize={sizeOf(file.size)}
                onDelete={onDeleteFile(file.id)}
                isLoading={removeLoader}
              />
            </div>
          ) : null}
        </div>
        <div className="flex gap-5">
          <div className="flex w-full flex-col gap-1.5">
            <label className="text-csbodyandlabels" htmlFor="cmdSwitch">
              Command switch
            </label>
            <input
              id="cmdSwitch"
              {...register("cmdSwitch")}
              type="text"
              className={`border border-solid ${
                errors.cmdSwitch?.message
                  ? "border-cscritical"
                  : "border-csinputbordercolor"
              } relative h-8 w-full rounded-sm bg-cstransparencyoverlaydarker p-1 outline-none focus:border-2 focus:border-cspurple`}
            />
            {typeof errors.cmdSwitch?.message === "string" ? (
              <ErrorInput errorMessage={errors.cmdSwitch.message} />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

export default InstallQuery;
