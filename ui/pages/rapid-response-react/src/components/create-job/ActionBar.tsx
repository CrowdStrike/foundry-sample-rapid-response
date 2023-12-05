import { useContext, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import SlButtonGroup from "@shoelace-style/shoelace/dist/react/button-group/index.js";
import SlButton from "@shoelace-style/shoelace/dist/react/button/index.js";
import SlDialog from "@shoelace-style/shoelace/dist/react/dialog/index.js";

import { LoaderSmall } from "@/components/LoaderSmall";

import { CreateJobContext } from "@/lib/contexts/CreateJobContext";
import { FalconContext } from "@/lib/contexts/FalconContext/FalconContext";

function ActionBar() {
  const {
    formState: { dirtyFields },
    getValues,
    clearErrors,
  } = useFormContext();
  const { getStepStatus, currentStep, goBack } = useContext(CreateJobContext);
  const { isLoading, resetErrors } = useContext(FalconContext);

  const navigate = useNavigate();
  const [isOpen, setOpen] = useState(false);

  const handleCancel = () => {
    resetErrors();
    if (!Object.values<boolean>(dirtyFields).some((field) => field)) {
      confirm();
    } else {
      setOpen(true);
    }
  };

  const confirm = () => {
    resetErrors();
    navigate("/all-jobs");
  };

  const close = () => {
    resetErrors();
    setOpen(false);
  };

  const onGoBack = () => {
    resetErrors();
    clearErrors();
    goBack();
  };

  return (
    <>
      <SlDialog
        label="Discard job changes"
        open={isOpen}
        onSlAfterHide={close}
        className="slDialogCustom"
      >
        You’ll lose all changes made to {getValues("jobName") || "[Job]"}
        <SlButtonGroup label="Alignment" className="mt-4 w-full">
          <SlButton
            className="hover:shadow-elevation hover:bg-csbuttonsecondaryhover active:bg-csbuttonsecondaryactive"
            onClick={close}
          >
            Back
          </SlButton>
          <SlButton onClick={confirm} className="discardJob">
            Discard job
          </SlButton>
        </SlButtonGroup>
      </SlDialog>
      <div className="flex items-center justify-between gap-5 py-4">
        <div className="flex w-full justify-between">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-sm bg-csbuttoncolorbackgroundsecondary hover:shadow-elevation hover:bg-csbuttonsecondaryhover active:bg-csbuttonsecondaryactive px-6 py-1 text-base font-medium text-csforegroundtext"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            {currentStep !== "step1" && (
              <button
                type="button"
                name="schedule"
                onClick={onGoBack}
                className="rounded-sm bg-csbuttoncolorbackgroundsecondary hover:shadow-elevation hover:bg-csbuttonsecondaryhover active:bg-csbuttonsecondaryactive px-6 py-1 text-base font-medium text-csforegroundtext"
              >
                Back
              </button>
            )}
            <button
              disabled={isLoading}
              aria-disabled={isLoading ? "true" : "false"}
              type="submit"
              className="rounded-sm bg-csbuttonprimary hover:bg-csbuttonprimaryhover active:bg-csbuttonprimaryfocus px-6 py-1 text-base font-medium text-csprimaryforegroundnextbtn"
            >
              {isLoading ? (
                <LoaderSmall />
              ) : getStepStatus(currentStep).isLastStep ? (
                "Save"
              ) : (
                "Next"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ActionBar;
