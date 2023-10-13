import { useState } from "react";
import { useFormContext } from "react-hook-form";

import SlButton from "@shoelace-style/shoelace/dist/react/button/index.js";
import SlButtonGroup from "@shoelace-style/shoelace/dist/react/button-group/index.js";
import SlDialog from "@shoelace-style/shoelace/dist/react/dialog/index.js";

import RTRPutFiles from "@/components/create-job/BuildQuery/UploadFiles/RTRPutFiles";

import { AllSteps } from "@/lib/validations/form-validation";
import { FileToInstall } from "@/lib/validations/api-validation";

interface Props {
  isOpen: boolean;
  setOpen: (shouldOpen: boolean) => void;
}

function SelectFile({ isOpen, setOpen }: Props) {
  const { setValue } = useFormContext<AllSteps>();

  const [tmpSelectedFiles, setTmpSelectedFiles] =
    useState<FileToInstall | null>(null);

  const onSelectFile = (file: FileToInstall) => {
    setTmpSelectedFiles(file);
  };

  const close = () => {
    setOpen(false);
  };

  const addFile = () => {
    if (tmpSelectedFiles === null) {
      console.log("Impossible to add file since no file has been provided.");
      return;
    }

    setValue("file", tmpSelectedFiles);
    setOpen(false);
  };

  return (
    <SlDialog
      label="Select file"
      open={isOpen}
      onSlAfterHide={close}
      style={{ "--width": "50vw" } as never}
      className="slDialogCustom"
    >
      <RTRPutFiles onSelectFile={onSelectFile} />

      <SlButtonGroup slot="footer" label="Alignment" className="mt-4 w-full">
        <SlButton type="button" onClick={close}>
          Cancel
        </SlButton>
        <SlButton type="button" onClick={addFile} className="discardJob">
          Add file
        </SlButton>
      </SlButtonGroup>
    </SlDialog>
  );
}

export default SelectFile;
