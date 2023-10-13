import { AnimatePresence, m as motion } from "framer-motion";
import { useContext } from "react";

import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";

import { CreateJobContext, Steps } from "@/lib/contexts/CreateJobContext";

const progressBarStepper = [
  { label: "Enter details", stepName: "step1" },
  { label: "Build query", stepName: "step2" },
  { label: "Choose target hosts", stepName: "step3" },
  { label: "Set schedule", stepName: "step4" },
] as const;

function ProgressBar() {
  const { state, getStepStatus } = useContext(CreateJobContext);

  const activeStepClasses = (step: Steps) => {
    switch (state[step]) {
      case "initial":
        return "bg-cstextdisabled";
      case "editing":
        return "text-groundfloor bg-csbuttonprimary hover:bg-csbuttonprimaryhover active:bg-csbuttonprimaryfocus";
      case "complete":
        return "bg-csbuttonprimary hover:bg-csbuttonprimaryhover active:bg-csbuttonprimaryfocus";
      default:
        return "";
    }
  };

  const activeTextClasses = (step: Steps) => {
    if (state[step] === "initial") {
      return "text-cstextdisabled";
    } else {
      return "text-csforegroundtext";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key={"detailsJobs"}
        initial={{ position: "relative", opacity: 0, top: "50rem" }}
        animate={{ top: "0", opacity: 1 }}
        exit={{ top: "-40rem", opacity: 0 }}
        transition={{
          type: "spring",
          duration: 0.7,
          bounce: 0.3,
        }}
        className="col-span-2 ml-6 flex flex-col items-start py-8 text-left"
      >
        <div className="flex flex-col gap-5 text-base">
          {progressBarStepper.map((step, index) => (
            <div key={step.stepName} className="flex items-center gap-2">
              <div
                className={`rounded-full p-px ${activeStepClasses(
                  step.stepName,
                )}`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    state[step.stepName] === "editing"
                      ? "bg-csbuttonprimary hover:bg-csbuttonprimaryhover active:bg-csbuttonprimaryfocus"
                      : "bg-groundfloor"
                  }`}
                >
                  {!getStepStatus(step.stepName).isCompleted ? (
                    index + 1
                  ) : (
                    <SlIcon name="check-lg" style={{ color: "#4CD7F5" }} />
                  )}
                </span>
              </div>
              <span className={`${activeTextClasses(step.stepName)}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ProgressBar;
