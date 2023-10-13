import { AnimatePresence, m as motion } from "framer-motion";
import { useContext } from "react";
import { createPortal } from "react-dom";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";

import {
  CreateJobContext,
  getCurrentStep,
} from "@/lib/contexts/CreateJobContext";
import { Loader } from "@/lib/types";

import { useNavigate } from "react-router-dom";
import BuildQuery from "@/components/create-job/BuildQuery/BuildQuery";
import ChooseHost from "@/components/create-job/ChooseHost";
import JobDetails from "@/components/create-job/DetailsJob";
import Header from "@/components/create-job/Header";
import ProgressBar from "@/components/create-job/ProgressBar";
import Schedule from "@/components/create-job/Schedule/Schedule";
import { initialVariants } from "@/lib/animations/variants";
import applyZodErrorsToFormErrors from "@/lib/apply-zod-errors-to-form-errors";
import { FalconContext } from "@/lib/contexts/FalconContext/FalconContext";
import { useUserData } from "@/lib/hooks/use-user-data";
import { getRTRFiles } from "@/lib/loaders/rtr-files";
import {
  AllSteps,
  chooseHostSchema,
  jobDetailsSchema,
  jobTypeSchema,
  scheduledSchema,
} from "@/lib/validations/form-validation";

export const loader: Loader = ({ falcon }) => {
  return async () => {
    const files = await getRTRFiles(falcon);

    return { files };
  };
};

function CreateJob() {
  const { timezone } = useContext(FalconContext);
  const { state, getStepStatus, goNext } = useContext(CreateJobContext);
  const { user } = useUserData();
  const { createJob, setLoadingState, setErrors, resetErrors } =
    useContext(FalconContext);
  const navigate = useNavigate();
  const methods = useForm<AllSteps>({
    defaultValues: {
      jobName: "",
      jobDescription: "",
      peopleToNotify: [{ label: user.username, value: user.username }],

      jobType: "install",
      cmdSwitch: "",
      file: undefined,
      fileName: "",
      filePath: "",

      hostType: "hostGroups",
      hosts: [],
      hostGroups: [],
      isOfflineQueueing: true,

      scheduleStrategy: "never",
      startDate: undefined,
      startTime: undefined,
      timezone: timezone,
    },
  });

  const onSubmit: SubmitHandler<AllSteps> = async (data) => {
    // Reset Global Falcon Error
    resetErrors();

    const parsedJobDetailsData = jobDetailsSchema.safeParse(data);
    const parsedBuildQueryData = jobTypeSchema.safeParse(data);
    const parsedHostSchemaData = chooseHostSchema.safeParse(data);
    const parsedScheduleData = scheduledSchema.safeParse(data);

    if (state.step1 === "editing") {
      if (parsedJobDetailsData.success) {
        goNext();
      } else {
        applyZodErrorsToFormErrors(parsedJobDetailsData, methods.setError);
      }
    } else if (state.step2 === "editing") {
      if (parsedBuildQueryData.success) {
        goNext();
      } else {
        applyZodErrorsToFormErrors(parsedBuildQueryData, methods.setError);
      }
    } else if (state.step3 === "editing") {
      if (parsedHostSchemaData.success) {
        goNext();
      } else {
        applyZodErrorsToFormErrors(parsedHostSchemaData, methods.setError);
      }
    } else if (state.step4 === "editing") {
      if (parsedScheduleData.success) {
        console.log("Submit the form!", parsedScheduleData.data);
        setLoadingState(true);
        const response = await createJob({
          data: {
            parsedBuildQueryData,
            parsedHostSchemaData,
            parsedJobDetailsData,
            parsedScheduleData,
          },
        });
        if (response.status_code !== 200 || response.errors.length > 0) {
          setErrors(response.errors);
          setLoadingState(false);
        } else {
          navigate("/all-jobs", {
            state: { jobName: data.jobName, action: "create" },
          });
          setLoadingState(false);
        }
      } else {
        applyZodErrorsToFormErrors(parsedScheduleData, methods.setError);
      }
    }
  };

  return (
    <div className="absolute top-16 w-full">
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="grid grid-cols-12 grid-rows-1 gap-2"
        >
          <ProgressBar />
          <div className="col-span-8 flex flex-col">
            <AnimatePresence custom={state.direction}>
              <motion.div
                key={getCurrentStep(state)}
                custom={state.direction}
                initial="enter"
                variants={initialVariants}
                animate="center"
                exit="exit"
                transition={{
                  type: "spring",
                  duration: 0.7,
                  bounce: 0.3,
                }}
                className="pt-8"
              >
                {getStepStatus("step1").isCurrentStep && <JobDetails />}
                {getStepStatus("step2").isCurrentStep && <BuildQuery />}
                {getStepStatus("step3").isCurrentStep && <ChooseHost />}
                {getStepStatus("step4").isCurrentStep && <Schedule />}
              </motion.div>
            </AnimatePresence>
          </div>
          {createPortal(<Header />, document.getElementById("portal")!)}
        </form>
      </FormProvider>
    </div>
  );
}

export default CreateJob;
