import { AnimatePresence, m as motion } from "framer-motion";
import { useContext } from "react";
import { useFormContext } from "react-hook-form";

import { CreateJobContext } from "@/lib/contexts/CreateJobContext";
import { AllSteps } from "@/lib/validations/form-validation";

function Header() {
  const { getValues } = useFormContext<AllSteps>();
  const { currentStep } = useContext(CreateJobContext);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, top: "-4rem", right: "-4rem" }}
        animate={{ opacity: 1, top: "0", right: "0" }}
        exit={{ opacity: 0, top: "-4rem", right: "-4rem" }}
        transition={{
          type: "spring",
          duration: 1,
          bounce: 0.3,
        }}
        className="absolute h-16 w-full px-6 py-3 shadow-bgHeaderCreateJob bg-groundfloor"
      >
        <h1 className="text-2xl">
          Create Job
          {currentStep !== "step1" ? `: ${getValues("jobName")}` : null}
        </h1>
      </motion.div>
    </AnimatePresence>
  );
}

export default Header;
