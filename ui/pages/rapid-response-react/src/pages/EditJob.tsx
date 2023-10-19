import { AnimatePresence, m as motion } from "framer-motion";
import { useContext } from "react";
import { createPortal } from "react-dom";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import BuildQuery from "@/components/create-job/BuildQuery/BuildQuery";
import ChooseHost from "@/components/create-job/ChooseHost";
import JobDetails from "@/components/create-job/DetailsJob";
import Header from "@/components/create-job/Header";
import ProgressBar from "@/components/create-job/ProgressBar";
import Schedule from "@/components/create-job/Schedule/Schedule";

import { initialVariants } from "@/lib/animations/variants";
import applyZodErrorsToFormErrors from "@/lib/apply-zod-errors-to-form-errors";
import { FAAS } from "@/lib/constants";
import {
  CreateJobContext,
  getCurrentStep,
} from "@/lib/contexts/CreateJobContext";
import { FalconContext } from "@/lib/contexts/FalconContext/FalconContext";
import { useParsedLoaderData } from "@/lib/hooks/use-parsed-loader-data";
import { getIndividualRTRFiles, getRTRFiles } from "@/lib/loaders/rtr-files";
import { Loader } from "@/lib/types";
import {
  EditJobSchema,
  editJobSchema,
  jobDataSchema,
} from "@/lib/validations/api-validation";
import {
  AllSteps,
  chooseHostSchema,
  jobDetailsSchema,
  jobTypeSchema,
  scheduledSchema,
} from "@/lib/validations/form-validation";
import { getLocalDateAndTime } from "@/lib/utils/datetime";

export const loader: Loader = ({ falcon }) => {
  return async (args) => {
    const jobId = args.params.id;
    if (!jobId) {
      throw new Error("EditJob requires an id");
    }

    const { name, version, path } = FAAS.getJobDetails;
    const getJobDetails = falcon.cloudFunction({ name, version });

    const [job, files] = await Promise.all([
      getJobDetails.get({
        params: { query: { id: [jobId] } },
        path,
      }),
      getRTRFiles(falcon),
    ]);

    const safeJob = jobDataSchema.parse(job);
    const { action } = safeJob.body.resource;

    const uploadedFiles = await getIndividualRTRFiles({
      falcon,
      fileName:
        action.type === "installSoftware" ? action.file_name : undefined,
    });

    return {
      job,
      uploadedFiles,
      files,
    };
  };
};

function EditJob() {
  const data = useParsedLoaderData<EditJobSchema>(editJobSchema);
  const { state, getStepStatus, goNext } = useContext(CreateJobContext);
  const { timezone, createJob, setLoadingState } = useContext(FalconContext);
  const navigate = useNavigate();
  const {
    resource: { action, target, schedule, ...job },
  } = data.job.body;

  const scheduleStrategy = schedule === null ? "never" : "scheduleForLater";

  const { date, time } =
    scheduleStrategy === "never"
      ? { date: undefined, time: undefined }
      : getLocalDateAndTime({
          timestamp: schedule?.start_date as string,
          timezone,
        });

  const methods = useForm<AllSteps>({
    defaultValues: {
      jobName: job.name,
      jobDescription: job.description,
      peopleToNotify:
        job.notifications?.map((option) => ({
          label: option,
          value: option,
        })) ?? [],

      jobType: action.type === "installSoftware" ? "install" : "remove",
      cmdSwitch: action.type === "installSoftware" ? action.command_switch : "",
      file:
        data.uploadedFiles.resources.length > 0
          ? data.uploadedFiles.resources[0]
          : undefined,
      filePath:
        action.type === "installSoftware" ? "" : action.remove_file_path,
      fileName: action.type === "removeFile" ? action.remove_file_name : "",

      hostType: Array.isArray(target.host_groups) ? "hostGroups" : "hosts",
      hosts: target.hosts ?? [],
      hostGroups: target.host_groups ?? [],
      isOfflineQueueing: target.offline_queueing,

      scheduleStrategy,
      startDate: date,
      startTime: time,
      timezone,
    },
  });

  const onSubmit: SubmitHandler<AllSteps> = async (formData) => {
    const parsedJobDetailsData = jobDetailsSchema.safeParse(formData);
    const parsedBuildQueryData = jobTypeSchema.safeParse(formData);
    const parsedHostSchemaData = chooseHostSchema.safeParse(formData);
    const parsedScheduleData = scheduledSchema.safeParse(formData);

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
        try {
          setLoadingState(true);
          // Edit instead of creating
          await createJob({
            data: {
              parsedBuildQueryData,
              parsedHostSchemaData,
              parsedJobDetailsData,
              parsedScheduleData,
            },
            id: data.job.body.resource.id,
          });
          navigate("/all-jobs", {
            state: { jobName: formData.jobName, action: "edit" },
          });
          setLoadingState(false);
        } catch (err) {
          setLoadingState(false);
          throw "Cannot submit form with invalid data.";
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
                {getStepStatus("step1").isCurrentStep && (
                  <JobDetails isEditMode />
                )}
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

export default EditJob;
